# JMSC Media Works CRM: phased plan

The CRM supports JMSC Media Works' client relationships and creative-production workflow, with regional context for Davao City, Tagum City, and Nabunturan. The architecture is a Next.js App Router application with Supabase Auth, Postgres, Row Level Security (RLS), and private Supabase Storage. Schema changes are applied manually in the Supabase SQL Editor.

## Phase 0 — Secure foundation

- Next.js App Router, responsive studio dashboard, shared forms and status components.
- Supabase SSR authentication and session refresh.
- Inactive-by-default signups, first-admin bootstrap, team approvals, role-aware quotation access.
- Postgres schema, indexes, RLS policies, updated timestamps, audit trail, and private proof bucket.
- Environment template and manual SQL setup guide.

## Phase 1 — Relationships and opportunities

- Regional client directory, records, notes, and history.
- Lead capture, source, requested service, owner, follow-up date, and pipeline stage.
- Convert won leads into clients without creating duplicate client records.

## Phase 2 — Services and delivery

- Service catalog for digital creative work and physical production layouts.
- Client-linked orders/projects with scope, priority, owner, due date, and delivery status.
- Follow-up tasks linked to an order or lead.
- Quotations in PHP, validity, assumptions, and CSV export.

## Phase 3 — Proofing and print operations

- Private, versioned proof uploads with signed temporary links.
- Review status, revision notes, and approval history.
- Print partner directory and production handoffs with specifications, quantity, dates, tracking, and quality notes.
- Partner schedule and quality risk log to keep external production estimates distinct from JMSC promises.

## Phase 4 — B2B and reporting

- B2B outsourcing pipeline with organization, work type, backlog volume, owner, status, and next action.
- Dashboard indicators, activity trail, and CSV exports for operational follow-up.

## Phase 5 — Planned extensions

- Transactional client email via Resend, with delivery logs and consent-aware notifications.
- External webhooks and integrations.
- Client-facing portal for proof approval and order status, with client-specific authorization.
- Automated PDF quotation documents and expanded performance reporting.

## Application structure

```text
app/
  (auth)/                 Login and signup pages
  (dashboard)/            Protected CRM pages
    clients/              Client directory, details, and entry
    leads/                Lead pipeline and follow-up
    catalog/              Service catalog
    orders/               Project pipeline and details
    tasks/                Task list and completion
    quotations/            Quotes and exports
    proofs/                Proof index and version/review rooms
    partners/              Print partners, handoffs, and risks
    b2b/                   Outsourcing opportunities
    settings/              Team access management
  actions.ts               Validated Server Actions for writes
  api/exports/             CSV export endpoint
components/                Shared shell, forms, notices, and statuses
lib/supabase/              Browser and server client setup
supabase/migrations/       SQL schema, functions, RLS, and storage policies
types/                     Hand-maintained database types
```

## Access and data safeguards

- Supabase RLS is the data-access boundary; hiding UI is not treated as authorization.
- New team accounts are inactive until approved by an administrator.
- Active members can use core CRM records; quotation access is limited to admin, client-relations, and finance roles.
- Permanent record deletion is not exposed to regular users; archive or change status instead.
- Proof files are stored in a private bucket with temporary signed URLs.
- The app does not use or require a Supabase service-role key.
