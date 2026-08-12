# SupportFlow

A multi-tenant customer support platform built with Next.js. Teams sign up, get a public ticket submission link, and manage tickets from a shared inbox. Customers can submit tickets without creating an account and track responses via a unique link.

**Live demo:** https://supportflow-ruddy.vercel.app/

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL via Supabase (Prisma ORM) |
| Auth | NextAuth.js — Google OAuth + email/password |
| AI | Groq (`llama-3.3-70b-versatile`) for ticket triage |
| Billing | Stripe (test mode) — Checkout + Billing Portal + webhooks |
| Hosting | Vercel |

---

## Key Features

- **Multi-tenant with RBAC** — Each company is a separate tenant. Users have one of three roles: `ADMIN`, `AGENT`, or `CUSTOMER`. All data is scoped to `companyId` at the query level.
- **Public ticket submission** — Customers submit tickets at `/support/[slug]` with no account required. On first submission, a `CUSTOMER` user record is created for their email.
- **Tracking link** — Each ticket gets a unique `trackingToken`. Customers can view their ticket thread and post replies at `/track/[trackingToken]` without logging in.
- **AI triage** — After a ticket is created, a background Groq call generates a one-sentence summary, category, priority suggestion, and draft reply. Runs asynchronously; failure is silent and doesn't block ticket creation.
- **In-app notifications** — Agents are notified when new tickets arrive or customers reply. Customers are notified when agents reply. Notifications are fetched on page load (polling-based, not real-time).
- **Analytics dashboard** — Ticket volume and status breakdown for the current workspace, visible to ADMIN and AGENT roles.
- **Stripe billing** — Free/Pro/Team plans with per-plan limits enforced via hardcoded constants in `lib/billing.ts` (Free: 2 seats / 100 tickets/month, Pro: 10 seats / unlimited, Team: unlimited). Plan upgrades go through Stripe Checkout; cancellations/downgrades via the Billing Portal. Webhooks update the active plan in the DB.
- **Platform-owner admin panel** — A separate `/admin` section (flag: `isPlatformOwner` on the `User` model) for cross-tenant oversight: company list, billing overview, platform team management. This flag is not settable through the UI; it requires direct DB access or the promote action used by an existing platform owner.
- **Team invites** — Admins invite agents via email link (`/invite/[token]`). Tokens expire after 72 hours, are single-use, and respect the plan's seat limit.

---

## Running Locally

### 1. Clone and install

```bash
git clone https://github.com/Muhammad-Jamshaid/supportflow.git
cd supportflow
npm install
```

### 2. Environment variables

Create a `.env` file at the project root with the following variables (see `.env.example` for descriptions):

```
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GROQ_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_TEAM_PRICE_ID=
```

- `DATABASE_URL` / `DIRECT_URL` — Supabase connection strings (pooled and direct respectively).
- `NEXTAUTH_SECRET` — Any random string, used to sign session tokens.
- `NEXTAUTH_URL` — `http://localhost:3000` for local development.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — From a Google Cloud OAuth app with `http://localhost:3000/api/auth/callback/google` as a redirect URI.
- `GROQ_API_KEY` — From [console.groq.com](https://console.groq.com). AI triage is skipped gracefully if this is missing or invalid.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / price IDs — From the Stripe dashboard (test mode). Billing features are not functional without these.

### 3. Generate Prisma client and run

```bash
npx prisma generate
npm run dev
```

The app runs at `http://localhost:3000`.

> **Note:** For Stripe webhooks locally, use the [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## Known Limitations

- **Notifications are not real-time.** The notification bell fetches from the DB when the page loads or the dropdown is opened. There is no WebSocket or polling interval.
- **AI triage is best-effort.** If Groq is unavailable, times out (8s limit), or returns malformed JSON, the ticket is saved normally with no AI fields populated.
- **Email delivery is not implemented.** Invite links are returned as a URL in the UI for the admin to copy and share manually — no email is sent.
- **Stripe is in test mode.** Real charges are not processed.
- **`isPlatformOwner` has no self-service UI** for the initial setup. The first platform owner must be set via a direct DB update or a one-off script.
