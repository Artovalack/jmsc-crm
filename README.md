# JMSC Media Works CRM

A private, responsive CRM for JMSC Media Works. It tracks client relationships, creative projects, quotations, proof revisions, print-partner handoffs, production risks, and B2B opportunities.

## Requirements

- Node.js 20.9 or newer
- A Supabase project
- npm

## Run locally

```bash
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` from **Supabase Dashboard → Project Settings → API**. `NEXT_PUBLIC_SITE_URL` should be `http://localhost:3000` for local work.

Apply the schema in Supabase:

1. Open **SQL Editor → New query** in the Supabase Dashboard.
2. Copy the full contents of [`supabase/migrations/202611160001_initial_schema.sql`](./supabase/migrations/202611160001_initial_schema.sql) into the editor and run it once.

Configure **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`
- Add the equivalent deployed URL, including `/auth/callback`, before using email confirmation in production.

Then start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and confirm the email if confirmation is enabled in Supabase.

## Activate the first administrator

New signups are deliberately inactive. After creating and confirming your account, find its UUID in **Authentication → Users**. In the SQL Editor, replace the example UUID and run:

```sql
update public.profiles
set role = 'admin', is_active = true
where id = '00000000-0000-0000-0000-000000000000';
```

Sign in again. Admins can approve accounts and assign roles in **Team settings**. Keep at least one active admin account. Never expose a Supabase service-role or secret key in this application; the app uses only the public publishable key, authenticated sessions, and row-level security.

After activating the first admin, optionally run [`supabase/seed.sql`](./supabase/seed.sql) in the SQL Editor to add the starter service catalog.

## App capabilities

- Authentication, pending-member approval, and role-aware access to quotations
- Client and lead records, regional tracking, follow-up, and lead conversion
- Searchable service catalog, project/order pipeline, project tasks, and status history
- Quotations with PHP amounts and CSV exports for clients, leads, projects, and quotations
- Private proof uploads, expiring signed links, review feedback, and version history
- Print partner directory, production handoffs, and schedule/quality risk log
- B2B outsourcing opportunities and next-action tracking
- Team dashboard, recent activity trail, and team access settings

Proof storage is private. Uploads are restricted to JPEG, PNG, WebP, or PDF and 20 MB. The proof room is an internal tool, not a client portal.

## Useful commands

```bash
npm run dev       # Local development
npm run lint      # ESLint
npm run typecheck # TypeScript
npm run build     # Production build
npm start         # Run a production build
```

## Current boundaries

- Schema changes are applied manually through the Supabase SQL Editor as requested; keep a copy of the SQL and apply future migrations in order.
- Email notifications, external-service webhooks, client login/portal, and automated PDF quotation generation are not implemented. `RESEND_*` values are intentionally not included in the environment example until email delivery is wired up.
- Live database, email-confirmation, and RLS behavior must be verified against your own Supabase project after setup.
