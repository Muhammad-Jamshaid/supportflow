# SupportFlow

SupportFlow is a modern, multi-tenant B2B customer support platform. It allows businesses (tenants) to create their own branded support portals, manage agents, and handle customer tickets efficiently. The platform includes an AI-driven triage system that automatically categorizes incoming tickets, suggests replies, and prioritizes urgent requests.

## Features Overview

- **Multi-Tenancy**: Built from the ground up for B2B SaaS. Every company gets its own workspace and dedicated support portal (`/support/[slug]`).
- **Role-Based Access Control (RBAC)**: Support for `ADMIN`, `AGENT`, and `CUSTOMER` roles within a company, plus a global `Platform Owner` superuser role.
- **AI Triage**: Incoming tickets are processed in the background (using Groq + Llama 3) to generate a summary, assign a category, and draft a suggested reply for agents.
- **Stripe Billing Integration**: Automated subscription management for Pro and Team plans, handling seat limits and ticket volume limits via Stripe Webhooks.
- **Customizable Plan Limits**: Platform owners can configure maximum seats and tickets per plan dynamically.
- **Dark Mode**: Built-in support for a sleek dark mode toggle.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (hosted on [Supabase](https://supabase.com/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google OAuth provider)
- **Payments**: [Stripe](https://stripe.com/)
- **AI/LLM**: [Groq API](https://groq.com/) (Llama 3 model)
- **Styling**: Vanilla CSS with CSS Variables for theming

## Architecture Overview

1. **Multi-Tenancy Model**: Every core model in the database (`Ticket`, `User`, `Reply`, `ActivityLog`) contains a `companyId` foreign key. Prisma queries are strictly scoped to the user's `companyId` (extracted from their session) to ensure tenant isolation.
2. **RBAC Pattern**: Access control is enforced at both the UI and Server Action levels. 
   - `Platform Owners` have access to `/admin` to manage the entire platform.
   - `ADMIN` users can manage billing and team invites for their company.
   - `AGENT` users can view and resolve any ticket in their company.
   - `CUSTOMER` users can only view and reply to tickets they created.
3. **AI Triage Flow**: When a customer submits a ticket, a background process (using `waitUntil` in Next.js) asynchronously calls the Groq API. It processes the ticket description and updates the ticket in the database with a summary, category, and suggested reply without blocking the customer's UI response.

## Setup & Local Development

### 1. Clone & Install
```bash
git clone https://github.com/your-username/supportflow.git
cd supportflow
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your details:
```bash
cp .env.example .env.local
```

**Required Variables:**
- `DATABASE_URL`: Connection string to your Postgres database (e.g. Supabase pooled).
- `DIRECT_URL`: Direct connection string for Prisma migrations.
- `NEXTAUTH_SECRET`: Generate a 32-character random string (e.g., `openssl rand -base64 32`).
- `NEXTAUTH_URL`: `http://localhost:3000` for local development.
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console.
- `GROQ_API_KEY`: API key from Groq for AI triage.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID`: Stripe keys from your developer dashboard.

### 3. Database Migration
```bash
npx prisma migrate dev
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Stripe CLI (Local Webhook Testing)
To test webhooks locally, run the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## API / Endpoints Reference

### API Routes
- `POST /api/webhooks/stripe`: Receives events from Stripe (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) to update company plans.
- `GET /api/invites/accept`: Redirect endpoint when a user clicks an invite link in their email.
- `GET /api/auth/[...nextauth]`: NextAuth endpoint for Google login.

### Key Server Actions
Most mutations use Next.js Server Actions:
- **Tickets**: `createTicketAction`, `replyAction`, `updateTicketStatusAction`, `assignTicketAction`, `reTriageTicketAction`, `deleteTicketAction`.
- **Company / Admin**: `updatePlanConfigAction`, `promotePlatformOwnerAction`, `demotePlatformOwnerAction`, `removeTeamMemberAction`.
- **Checkout**: `createCheckoutSessionAction`, `createCustomerPortalSessionAction`.
