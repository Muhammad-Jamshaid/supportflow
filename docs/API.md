# SupportFlow — API & Server Actions Reference

This document covers the main HTTP API routes and Next.js Server Actions in SupportFlow. All server actions use the `"use server"` directive and are called directly from client components via React form actions or async function calls.

---

## Authentication

### `POST /api/auth/signup`
Creates a new company and its first ADMIN user.

**Access:** Public (no session required)

**Body (JSON):**
| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✓ | Lowercased before storage |
| `password` | string | ✓ | Min 8 characters |
| `companyName` | string | ✓ | Used to generate a URL-safe slug |
| `name` | string | — | Display name for the user |

**Responses:**
- `201` — `{ message, user: { id, email, companyId }, supportLink }` — account created
- `400` — validation error (missing fields, password too short)
- `409` — email already registered
- `500` — internal error

**Notes:** The company slug (e.g., `techcognify-solutions`) becomes the public ticket submission URL at `/support/[slug]`. Duplicate slugs get a numeric suffix (`-2`, `-3`, etc.).

---

### `GET|POST /api/auth/[...nextauth]`
Handled entirely by NextAuth.js. Supports:
- **Email/password** via the `Credentials` provider (bcrypt password comparison)
- **Google OAuth** via the `Google` provider

On first Google sign-in, if no user exists for that email, NextAuth creates a `CUSTOMER` account by default. Google OAuth users signing into an existing email/password account are merged into the same user record.

**Login page:** `/login`

---

### `POST /api/invites` — Send invite
**Access:** Authenticated, `ADMIN` role only

**Body (JSON):** `{ "email": "agent@example.com" }`

Generates a single-use, 72-hour invite token and returns `{ inviteUrl }` for the admin to share. Enforces the plan's seat limit (active agents + pending invites vs. `maxSeats`). Invalidates any previous unused invite for the same email + company.

**Responses:** `201 { inviteUrl }` | `401` | `403` (not admin or seat limit hit) | `409` (user already exists)

---

### `POST /api/invites/accept` — Accept invite
**Access:** Public (invite token is the credential)

**Body (JSON):**
| Field | Type | Required |
|---|---|---|
| `token` | string | ✓ |
| `password` | string | ✓ (min 8 chars) |
| `name` | string | — |

Creates an `AGENT` user for the invited email, marks the token as used. Returns `401/404/409/410` for invalid, used, or expired tokens.

---

## Ticket Actions (Server Actions)

All ticket actions are in `app/actions/tickets.ts`. They require an active session and enforce multi-tenancy via `companyId` on every DB query.

### `createAgentTicketAction(formData)`
Creates a ticket on behalf of a customer. Auto-assigns the creating agent.

**Access:** `ADMIN` or `AGENT` (CUSTOMER is blocked)

**FormData fields:** `subject`, `customerId`, `priority` (`LOW|NORMAL|HIGH|URGENT`), `message`

**Returns:** `{ ok, ticketId }` or `{ error }`

**Side effects:** Creates an initial reply with the message content, writes an `ActivityLog` entry, checks monthly ticket limit before creation.

---

### `createReplyAction(formData)`
Adds a reply to an existing ticket.

**Access:** Any authenticated user, subject to RBAC:
- `CUSTOMER` — can only reply to their own tickets (`customerId === session.user.id`)
- `AGENT` / `ADMIN` — can reply to any ticket within their company

**FormData fields:** `ticketId`, `message`

**Returns:** `{ ok }` or `{ error }`

**Side effects:** Writes `ActivityLog`, creates in-app `Notification` — customer reply notifies the assigned agent (if any); agent/admin reply notifies the customer.

---

### `changeStatusAction(formData)`
Changes a ticket's status (`OPEN`, `RESOLVED`, `CLOSED`).

**Access:** `ADMIN` or `AGENT` only (CUSTOMER is explicitly blocked)

**FormData fields:** `ticketId`, `newStatus`

**Returns:** `{ ok }` or `{ error }`

**Side effects:** Writes `ActivityLog`.

---

### `archiveTicketAction(formData)`
Soft-deletes a ticket by setting `archived = true`. Archived tickets are hidden from normal list views but remain in the DB. Orthogonal to ticket status.

**Access:** `ADMIN` or `AGENT` only

**FormData fields:** `ticketId`

**Returns:** `{ ok }` or `{ error }`

---

## Public Ticket Actions (Server Actions)

In `app/actions/public.ts`. No session required.

### `submitTicketAction(formData)`
Submits a support ticket from the public form at `/support/[slug]`.

**Access:** Public — no login required

**FormData fields:** `companyId`, `subject`, `description`, `email`, `name` (optional)

**Returns:** `{ ticketId, trackingToken }` or `{ error }`

**Behaviour:**
- Finds or creates a `CUSTOMER` user for the given email + company combination.
- Checks the monthly ticket limit before creating.
- After creation, notifies all `ADMIN` and `AGENT` users in the company.
- Triggers AI triage asynchronously via Groq (fire-and-forget; ticket is returned immediately regardless of triage outcome).

---

### `submitPublicReplyAction(formData)`
Posts a reply to a ticket via the public tracking page, authenticated only by the `trackingToken`.

**Access:** Public — tracking token is the only credential

**FormData fields:** `trackingToken`, `message`

**Returns:** `{ success }` or `{ error }`

**Side effects:** Reply is recorded under the ticket's `customerId`. Notifies the assigned agent, or all agents/admins if unassigned. Writes `ActivityLog`.

---

## Public Tracking Page

### `GET /track/[trackingToken]`
Server-rendered page. Looks up the ticket by `trackingToken` and renders the full reply thread.

**Access:** Public — no login required

Returns a 404-style page if the token is invalid. Does **not** expose agent emails or internal company data — only `company.name`, ticket fields, and reply contents with user roles shown.

---

## Settings Actions (Server Actions)

In `app/actions/settings.ts`. Require an active session.

### `updateProfileName(formData)`
Updates the current user's display name.

**Access:** Any authenticated user

**FormData fields:** `name`

**Returns:** `{ ok }` or `{ ok: false, error }`

---

### `updateWorkspaceName(formData)`
Updates the company's display name (not the slug).

**Access:** `ADMIN` only

**FormData fields:** `companyName`

**Returns:** `{ ok }` or `{ ok: false, error }`

---

## Team Actions (Server Actions)

### `revokeInviteAction(formData)` — `app/actions/team.ts`
Deletes a pending invite token.

**Access:** `ADMIN` only

**FormData fields:** `id` (invite token record ID)

---

## Notification Actions (Server Actions)

In `app/actions/notifications.ts`. Require an active session.

### `getNotificationsAction()`
Returns the 20 most recent notifications for the current user, ordered newest-first.

### `markNotificationsAsReadAction()`
Marks all unread notifications for the current user as read.

### `markNotificationAsReadAction(notificationId)`
Marks a single notification as read.

**Note:** There is no push/streaming mechanism. Notifications are fetched on demand when the notification bell is opened.

---

## Stripe Routes

### `POST /api/stripe/checkout`
Initiates a Stripe Checkout session for plan upgrade.

**Access:** Authenticated, `ADMIN` role only

**Body (JSON):** `{ "priceId": "price_..." }`

Creates or retrieves the Stripe Customer for the company, then creates a Checkout session in `subscription` mode. Returns `{ url }` — the client redirects to this URL.

**Responses:** `200 { url }` | `400` (missing priceId) | `401` | `404` (company not found) | `500`

---

### `POST /api/stripe/portal`
Opens the Stripe Billing Portal for subscription management (cancel, downgrade, update payment method).

**Access:** Authenticated, `ADMIN` role only. Company must already have a `stripeCustomerId`.

**Returns:** `{ url }` — client redirects to Stripe's hosted portal.

---

### `POST /api/webhooks/stripe`
Receives and processes Stripe webhook events. Verifies the signature using `STRIPE_WEBHOOK_SECRET`.

**Access:** Public endpoint — Stripe only (signature-verified)

**Handled events:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Retrieves subscription, maps price ID to plan enum (`FREE`/`PRO`/`TEAM`), updates `company` with subscription details and period end |
| `customer.subscription.updated` | Updates plan, price, and period end on the matching company |
| `customer.subscription.deleted` | Resets company to `FREE`, clears subscription fields |

**Responses:** `200` on success | `400` on signature failure | `500` on processing error

---

## Admin Routes (Platform Owner Only)

These pages and actions are accessible only to users with `isPlatformOwner: true`. This flag is separate from the `ADMIN` role — it grants cross-tenant access.

### Pages
| Route | Description |
|---|---|
| `/admin` | Overview dashboard — all companies, counts |
| `/admin/companies` | Full company list with plan and user counts |
| `/admin/billing` | Per-plan config editor (`PlanConfig` upsert) |
| `/admin/analytics` | Platform-wide ticket analytics |
| `/admin/team` | Platform owner management (promote / demote) |

### `updatePlanConfigAction(formData)` — `app/actions/admin.ts`
Upserts a `PlanConfig` record for a given plan tier.

**Access:** `isPlatformOwner` only

**FormData fields:** `plan` (`FREE|PRO|TEAM`), `maxSeats` (blank = unlimited), `maxTickets` (blank = unlimited)

---

### `promotePlatformOwnerAction(formData)`
Grants `isPlatformOwner: true` to a user by email.

**Access:** `isPlatformOwner` only

**FormData fields:** `email`

---

### `demotePlatformOwnerAction(formData)`
Removes `isPlatformOwner` from a user by ID. Self-demotion is blocked to prevent lockout.

**Access:** `isPlatformOwner` only

**FormData fields:** `id`
