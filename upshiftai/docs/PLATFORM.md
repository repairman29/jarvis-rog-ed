# The platform: build it and charge

We build the hosted platform and charge because we can. The CLI stays free; the platform is where we deliver Pro/Team value and collect revenue.

---

## What we build

1. **Hosted dashboard** — Central place for dependency reports. Users log in, see projects/reports, history, and “something old” summaries. Reports get there when the CLI sends them (e.g. `upshiftai-deps report . --upload`) or when they’re triggered from the platform (e.g. “Run report” for a connected repo).
2. **API** — Authenticated API so the CLI and CI can push reports and pull status. API key or OAuth; usage can be metered later for billing.
3. **Approval queue (Pro/Team)** — When apply needs human approval, the request shows up in the dashboard; user approves or denies. Webhook or polling from the CLI. This is the HITL layer we already designed, now with a UI.
4. **Billing** — Stripe (or similar): Pro $19/mo, Team from $99/mo. Checkout, customer portal, webhooks to grant/revoke access. We charge because we deliver the above.

---

## Why we charge

- **Pro** — Dashboard + approval queue + priority support. You’re paying for the hosted experience and the approval UI, not for the CLI.
- **Team** — Same + org policies, SSO, SLA, optional on-prem. We charge for the platform and support.

Free tier stays: CLI + npm, local use, community support. No platform account required.

---

## MVP scope (ship and charge)

| Component | MVP | Later |
|-----------|-----|--------|
| **Auth** | Email or GitHub login; session + API key per user | SSO, orgs, Team |
| **Dashboard** | List “Reports” (report runs); detail view = report markdown/JSON | Projects, repos, run-from-platform |
| **API** | POST /api/reports (body = report JSON; API key in header). GET /api/reports (list). | Scoped keys, usage, webhooks |
| **Approval queue** | List “Pending approvals”; approve/deny; CLI polls or we push webhook | Real-time, Slack/email |
| **Billing** | Stripe Checkout for Pro ($19/mo); webhook sets subscription; dashboard gated by subscription | Team, seats, usage-based |

**Data** — MVP: one store (e.g. Supabase Postgres or Vercel Postgres). Tables: users (or use NextAuth + Stripe customer id), reports (id, user_id, payload, created_at), approvals (id, user_id, action, payload, status, created_at), subscriptions (user_id, stripe_subscription_id, status).

**CLI** — New flag: `upshiftai-deps report . --upload` (or `--platform`). Reads UPSHIFTAI_API_KEY or config; POSTs report JSON to platform API. Optional: `upshiftai-deps apply ...` asks platform for approval when config says webhook (platform is the approval webhook).

---

## Architecture (MVP)

```
[CLI] --upload --> POST /api/reports (API key)
[CLI] apply (needs approval) --> POST platform approval URL --> [Platform] --> approve/deny --> webhook or poll
[Browser] --> Login (NextAuth) --> Dashboard --> GET /api/reports, GET /api/approvals
[Browser] Subscribe --> Stripe Checkout --> Webhook --> set user.subscription = active
[Dashboard] gated: if !subscription show "Upgrade to Pro"
```

- **Stack** — Next.js (App Router), NextAuth (GitHub + credentials), Stripe, one DB (Supabase or Vercel Postgres).
- **Hosting** — Vercel (or similar). Env: NEXTAUTH_SECRET, NEXTAUTH_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DATABASE_URL.

---

## Billing (Stripe)

- **Products** — Pro ($19/mo recurring), Team ($99/mo or custom).
- **Checkout** — “Upgrade to Pro” in dashboard → create Stripe Checkout session → redirect to Stripe → success URL back to dashboard. On success, webhook `customer.subscription.created/updated/deleted` → upsert subscription in DB; gate dashboard by subscription.
- **Customer portal** — Link to Stripe billing portal for manage/cancel. Optional: “Manage subscription” in dashboard.

We charge because we can: the platform is the product; the CLI is the client.

---

## Implementation order

1. **Platform app scaffold** — Next.js, auth, dashboard (reports list + detail), API routes (reports, me).
2. **Stripe** — Pro product + price, Checkout route, webhook, subscription column + gate.
3. **Reports API** — POST /api/reports (store report, associate user by API key or session). CLI --upload.
4. **Approval queue** — DB table + API (list pending, approve/deny). Dashboard UI. Optional: CLI approval webhook points to platform.
5. **Team** — Orgs, seats, Stripe Team price; later.

This doc is the spec. Build the platform and charge.
