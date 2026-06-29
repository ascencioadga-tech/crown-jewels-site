# Backend setup — turning on the shared database

The dashboard runs in two modes:

- **Local** (today): all data lives in each person's browser. No setup. The
  demo works fully — it just isn't shared between people.
- **Cloud**: data lives in one shared Supabase database. Every order, inventory
  entry, and quote flows into the same place in real time — and this is the
  prerequisite for the live "Open in Excel" link.

The code is already written for both. Switching to Cloud is two keys.

---

## One-time setup (≈10 minutes)

1. **Create the project.** Go to <https://supabase.com> → sign in → **New
   project**. Pick a name (e.g. `crown-jewels`), a strong database password,
   and the region closest to Nogales/Fresno (US West). Free tier is plenty.

2. **Create the tables.** In the project, open **SQL Editor** → **New query** →
   paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) →
   **Run**. You should see "Success." This creates the orders, inventory, and
   settings tables, the order/invoice numbering, and turns on realtime.

3. **Copy the two keys.** Project **Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Add them to the app.** Copy `.env.local.example` to `.env.local` and paste
   the two values. (For the Netlify deploy, add the same two variables under
   **Site settings → Environment variables** instead.)

5. **Rebuild.** `npm run build` (or redeploy). The app is now on the shared
   database. Hard-refresh — you're in Cloud mode.

That's it. No code changes — the same hooks that read localStorage now read and
write Supabase, and update live across everyone's screens.

---

## ⚠️ Before real data goes in: lock down security

`schema.sql` ships with **demo** access rules — anyone with the public key can
read/write. That's fine for a private demo, **not** for live customer/AR data.

When we wire **logins** (Supabase Auth), the next step is to:

1. In `schema.sql`, drop the three `demo_all_*` policies.
2. Uncomment the **PRODUCTION** policy block (authenticated-only; orders/AR
   scoped by role).
3. Re-run that section in the SQL Editor.

This is tracked as the next phase after the data layer — don't put real
receivables in until it's done.

---

## What's next on the roadmap (after this foundation)

1. **Logins** — Supabase Auth so each salesperson + the accounting head sign in;
   flip RLS to the production policies above.
2. **Microsoft Excel Online sync** — register an app in Azure (Microsoft Graph),
   point it at a workbook in the company OneDrive/SharePoint, and push every
   Joya entry into it automatically.
3. **"Open in Excel"** — the button (currently a "Soon" placeholder) deep-links
   to that always-current workbook.
