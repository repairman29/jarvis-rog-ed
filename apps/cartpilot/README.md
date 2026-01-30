# Olive (CartPilot)

Your kitchen companion — taking the chore out of the grocery store. Add items to your Kroger cart from a simple list; Budget vs Splurge mode; memory for your usuals.

## Supabase (Olive backend)

Olive uses **one Supabase project** for auth and memory:

- **Project:** [rbfzlqmkwhbvrrfdcain](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain)
- **SQL Editor:** [Open SQL](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/sql)

### 1. Run migrations in that project

In the SQL Editor for **rbfzlqmkwhbvrrfdcain**, run (in order):

1. **Memory tables:** paste and run contents of `supabase/memory.sql`
2. **User settings (Budget/Splurge):** paste and run contents of `supabase/settings.sql`

### 2. Env vars

Copy `.env.example` to `.env.local` and fill in keys from:

- [Project API settings](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/settings/api):  
  **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`  
  **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
  **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret; server only)

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your keys
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) (or the port shown).

## Scripts

- `npm run dev` – dev server
- `npm run build` / `npm run start` – production
- `npm run test:e2e` – Playwright e2e tests
- `npm run test:e2e:ui` – Playwright UI

## Deploy (Vercel)

Set the same env vars in Vercel. Olive is served at [shopolive.xyz](https://shopolive.xyz).

## Docs

- [Troubleshooting](docs/TROUBLESHOOTING.md) – console noise, 401, PWA icons
