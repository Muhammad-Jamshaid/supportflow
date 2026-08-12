# SupportFlow — Architecture Overview

## System Architecture

```mermaid
flowchart TD
    subgraph Public["Public (no login required)"]
        A[Customer Browser] -->|"POST /support/[slug]"| B[submitTicketAction]
        A -->|"GET /track/[trackingToken]"| T[Tracking Page]
        A -->|"POST submitPublicReplyAction"| T
    end

    subgraph Creation["Ticket Creation Flow"]
        B -->|"1. find-or-create CUSTOMER user"| DB[(PostgreSQL\nSupabase)]
        B -->|"2. check ticket limit"| DB
        B -->|"3. create Ticket + ActivityLog"| DB
        B -->|"4. notify all ADMIN/AGENT users"| DB
        B -->|"5. fire-and-forget"| AI[Groq AI Triage\nllama-3.3-70b-versatile]
        AI -->|"updates aiSummary, aiCategory,\naiSuggestedReply, priority"| DB
    end

    subgraph Tenancy["Multi-Tenancy Boundary (companyId)"]
        DB -->|"all queries scoped to companyId\nvia ticketWhere() helper"| RBAC{RBAC Check}
        RBAC -->|ADMIN / AGENT| AgentView[Agent Inbox\n/tickets]
        RBAC -->|CUSTOMER| CustomerView[Customer Ticket\n/tickets/id]
    end

    subgraph Reply["Reply Flow"]
        AgentView -->|"createReplyAction"| DB
        CustomerView -->|"createReplyAction"| DB
        T -->|"submitPublicReplyAction\n(trackingToken only)"| DB
        DB -->|"Notification created"| Bell[In-app Notification Bell\npolled on page load]
    end

    subgraph Billing["Stripe Billing Flow"]
        Admin[Admin Browser] -->|"POST /api/stripe/checkout"| Checkout[Stripe Checkout\nSubscription]
        Checkout -->|redirect on success| Admin
        Checkout -->|"webhook: checkout.session.completed"| Webhook[POST /api/webhooks/stripe\nsignature-verified]
        Webhook -->|"update company.plan\ncompany.stripeSubscriptionId\ncompany.stripeCurrentPeriodEnd"| DB
        Admin -->|"POST /api/stripe/portal"| Portal[Stripe Billing Portal\ncancel / downgrade]
        Portal -->|"webhook: subscription.updated\nor subscription.deleted"| Webhook
    end

    subgraph PlatformAdmin["Platform Owner Layer"]
        PO[Platform Owner\nisPlatformOwner=true] -->|"/admin/*"| CrossTenant[Cross-tenant overview\nall companies + analytics]
        PO -->|"updatePlanConfigAction"| DB
        PO -->|"promote / demote owners"| DB
    end
```

---

## Multi-Tenancy

Every significant data model (`Ticket`, `Reply`, `Attachment`, `ActivityLog`, `InviteToken`, `Notification`) carries a `companyId` foreign key. The `ticketWhere()` helper in `lib/ticket-rbac.ts` builds the correct Prisma `where` clause based on the caller's role:

- **ADMIN / AGENT** — `{ companyId: session.user.companyId }` (all company tickets)
- **CUSTOMER** — `{ companyId: session.user.companyId, customerId: session.user.id }` (own tickets only)

This is applied on every ticket read in server actions and page data fetches. There is no cross-tenant data access except through the platform owner admin panel.

---

## Authentication Model

Two authentication paths feed into the same `User` model:

```mermaid
flowchart LR
    EP[Email + Password\nPOST /api/auth/signup] --> U[User record\nin DB]
    GO[Google OAuth\n/api/auth/callback/google] --> U
    INV[Invite link\n/invite/token] -->|POST /api/invites/accept| U
    U -->|NextAuth JWT| Session[Session token\nin cookie]
```

- Users belong to exactly one company.
- Role (`ADMIN`, `AGENT`, `CUSTOMER`) is stored on the `User` record, not the session provider.
- `isPlatformOwner` is a separate boolean, not a role — it grants access to `/admin/*` regardless of company.
- Middleware protects `/dashboard`, `/tickets`, `/admin`, `/analytics`, `/settings` — unauthenticated requests redirect to `/login`.

---

## AI Triage

Triage runs after every ticket creation (both agent-created and public submissions). It is **non-blocking** — the ticket is returned to the client immediately, and triage runs in the background.

```mermaid
sequenceDiagram
    participant Client
    participant Action as submitTicketAction
    participant DB as PostgreSQL
    participant Groq

    Client->>Action: submit form
    Action->>DB: create Ticket
    DB-->>Action: ticket created
    Action-->>Client: { ticketId, trackingToken }
    Note over Action,Groq: background / waitUntil()
    Action->>Groq: generateText(subject + description)
    Groq-->>Action: JSON { summary, category, priority, suggestedReply }
    Action->>DB: update Ticket (ai* fields)
```

If Groq times out (8s hard limit), is unreachable, or returns malformed JSON, the error is caught and logged — the ticket exists normally with `aiSummary`, `aiCategory`, and `aiSuggestedReply` left null.

---

## Notification System

Notifications are stored in the `notifications` table and linked to a `userId`. They are created server-side on:

- New public ticket submission → all ADMIN/AGENT users in the company
- Agent/admin reply → the ticket's customer
- Customer reply (authenticated or via tracking link) → the assigned agent, or all ADMIN/AGENT users if unassigned

**There is no real-time delivery.** The notification bell component fetches via `getNotificationsAction()` when the page loads and when the dropdown is opened. Unread count is derived from the fetched data client-side.

---

## Billing Enforcement

Plan limits are checked at the point of action, not at login:

- **Ticket limit** — checked in `checkTicketLimit()` (`lib/billing.ts`) before `createAgentTicketAction` and `submitTicketAction`. Counts tickets created since the start of the current calendar month.
- **Seat limit** — checked in `POST /api/invites` before generating an invite token. Counts active agents + admins + pending (unexpired, unused) invites.

Limits are enforced by hardcoded constants per plan tier in `lib/billing.ts`. The active plan is stored on the `Company` record and updated by Stripe webhooks.
