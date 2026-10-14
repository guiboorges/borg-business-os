# Setup — BORG Business OS

Steps only you can do (accounts and keys). Once you've completed them, fill in `.env.local` and tell Claude to carry on.

## 1. Supabase (database + auth) — free

1. Go to [supabase.com](https://supabase.com) → **Start your project** → create an account (you can use GitHub)
2. **New project**:
   - Name: `borg-business-os`
   - Database password: generate a strong one and keep it safe
   - Region: the one closest to you (e.g. **West EU (Ireland)** for Europe)
   - Plan: Free
3. Once the project is created, go to **Settings → API** and copy into `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secret, never share it)
4. **Create your user**: dashboard → **Authentication → Users → Add user** → your email + a password of your choice → tick "Auto Confirm User"
5. **Disable public sign-ups**: **Authentication → Sign In / Up → turn off "Allow new users to sign up"**

## 2. Anthropic (the agents' API) — pay as you go

1. Go to [console.anthropic.com](https://console.anthropic.com) → create an account
2. **Billing** → add a card and load **US$ 5** of credit (enough for weeks of use)
3. **Recommended**: in Billing, set a **monthly spend limit** (e.g. US$ 20) so there are never any surprises
4. **API Keys → Create Key** → name it `borg-business-os` → copy the key (it's only shown once) → `ANTHROPIC_API_KEY` in `.env.local`

## 3. Apply the migrations (create the tables)

In the Supabase dashboard → **SQL Editor** → paste and run, **in order**, the contents of each file in `supabase/migrations/` (0001 → 0006). Alternatively, paste `supabase/all-migrations.sql`, which contains all six in order.

(CLI alternative: `npx supabase link --project-ref <ref>` and `npx supabase db push`.)

Full-text search over the memory uses Postgres's `english` configuration. If your vault notes are in another language, change `'english'` in `0003_agent_memory.sql` before applying it (and in the `.textSearch` calls in `src/`) — see the README.

## 4. Load the memory and the leads

```bash
cd borg-business-os

npm run seed:knowledge   # copies the knowledge bases (G4 + frameworks) into the vault
npm run sync             # uploads the Obsidian vault notes to Supabase
npm run import:leads     # dry run of the prospecting spreadsheet import
npm run import:leads -- --commit   # imports for real
```

The lead import reads `prospects.xlsx` (sheet "Prospects") and `outreach.xlsx` (sheet "Outreach") from `LEADS_DIR`; the expected columns are documented at the top of `scripts/import-excel.ts`.

## 5. Test it

```bash
npm run dev
```

Open http://localhost:3000:
1. Log in with the user from step 1.4
2. **Memory** → you should see the vault notes, with search
3. **Pipeline** → leads imported from the spreadsheets
4. **Agents → Operations** → ask "what is our ICP?" — it should search the memory and cite real notes
5. **Agents → Goals** → create a goal at /goals (e.g. MRR €1,500 by 2026-12-31) and ask "how are we doing against the goal?"

## 6. Deploy to Vercel (when you want the app reachable from anywhere)

1. Create a **private** GitHub repo and push (`git remote add origin … && git push -u origin main`)
2. [vercel.com](https://vercel.com) → Import the repo → Framework: Next.js
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` (⚠️ do **not** add `VAULT_PATH` — the sync only runs on your own machine)
4. Deploy. The local `npm run sync` keeps working against the same Supabase.

## Day-to-day routine

- Edit notes in Obsidian → `npm run sync` whenever you want to update the agents' memory
- Notes written by the agents appear in the vault under `09 - Agents/` after the sync
- ⚠️ Free Supabase projects pause after ~7 days without use; with daily use it doesn't happen (the dashboard lets you resume it)
