# Olive MVP Status

**Verdict: Yes — Olive is built out and ready for MVP** (friends & family beta at shopolive.xyz), assuming env and migrations are done.

---

## ✅ In place

| Area | What’s done |
|------|-------------|
| **Landing** | Olive branding, hero, Join the Beta / Continue with Kroger / View Kroger Cart, How it Works, FAQ, Kroger family, steps |
| **Auth** | Email sign up & sign in (Supabase project rbfzlqmkwhbvrrfdcain), redirect URLs doc’d |
| **Kroger** | Connect Kroger (OAuth via Railway), add-to-cart, status check; tokens stored per user |
| **Dashboard** | Olive message, Budget vs Splurge, Connect Kroger card, list input, Current Haul, Add to Kroger Cart, item results, Quick add (usuals + defaults), Sign out |
| **Memory** | olive_events, olive_preferences, olive_user_settings; usuals API; settings API; add-to-cart writes events + prefs; splurge = preferred UPC, budget = best price |
| **Continue with Kroger** | Login?then=connect → dashboard?connectKroger=1; landing CTA |
| **PWA** | manifest, placeholder icons, theme color |
| **Docs** | README (Supabase project, migrations, env), TROUBLESHOOTING, e2e README, .env.example |
| **Tests** | Playwright e2e (home, login, dashboard redirect; optional auth tests) |
| **Deploy** | Vercel, shopolive.xyz, env vars documented |

---

## Before first real users (you do once)

1. **Supabase (rbfzlqmkwhbvrrfdcain)**  
   - Run `supabase/memory.sql` and `supabase/settings.sql` in SQL Editor.  
   - Auth → Providers → Email enabled.  
   - Auth → URL Configuration: Site URL + Redirect URLs include shopolive.xyz and localhost.

2. **Env**  
   - Local: `apps/cartpilot/.env.local` with Supabase + Kroger vars (see .env.example).  
   - Vercel: same vars set for the Olive app.

3. **Kroger**  
   - Developer Portal: redirect URI = Railway callback (e.g. `https://kroger-oauth-production.up.railway.app/callback`).  
   - Railway service running and env (Supabase, Kroger client, API secret) set.

4. **Domain**  
   - shopolive.xyz points at Vercel (already configured).

---

## Optional polish (not required for MVP)

- **Post–Connect Kroger**: After OAuth success, redirect or link to shopolive.xyz/dashboard (today: user returns manually).
- **Email confirmation**: If Supabase “Confirm email” is on, mention “check your email” on signup.
- **Real PWA icons**: Replace placeholder PNGs with 192×192 and 512×512 Olive icons.
- **Terms / Privacy**: Add links if you want them for invite-only beta.

---

## Quick smoke test

1. Open shopolive.xyz (or localhost:3001).  
2. Join the Beta → sign up → sign in.  
3. Connect Kroger (complete OAuth).  
4. Choose Budget or Splurge, add items, Add to Kroger Cart.  
5. Open Kroger cart link; confirm items.  
6. Add again later; confirm usuals show in Quick add.

If that flow works, MVP is good to go.
