# Swim Log — Next.js + Supabase (Starter)

This is a complete starter for your Swim Log app with:
- Supabase Auth (email link)
- RLS-ready tables: `training_log`, `resting_hr_log`, `body_metrics_log`, `profiles`
- Swimmer view: add training, RHR, body metrics; see recent entries and weekly totals
- Coach view: select any swimmer and view their data
- Tailwind styling

## 1) Prerequisites
- Supabase project created
- Run the SQL you were given to create tables + RLS policies
- In Supabase → Authentication → URL Configuration:
  - **Site URL** = your Vercel URL (e.g. https://swimlog-full.vercel.app)
  - **Redirect URLs** = include the same URL
- Auth settings: Allow new users to sign up, Confirm email (acts like magic link)

## 2) Configure env vars
Create a `.env.local` (not committed):
```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 3) Run locally
```
npm install
npm run dev
```
Open http://localhost:3000

## 4) Deploy to Vercel
- Import repo → set the two env vars in Vercel settings
- Deploy

## 5) Test flow
1. Open the site, enter your email, click "Send sign-in link".
2. Click the email link; it redirects back and signs you in.
3. Add a training entry, RHR, body metric; see them in tables.
4. Toggle Coach view (if your profile `role` = coach) and select a swimmer to view.

## Notes
- All inserts use `auth.uid()` via the client session, satisfying RLS.
- As a coach, you can read all rows; swimmers only read their own.
- Extend components in `components/` and pages in `app/` as you like.
