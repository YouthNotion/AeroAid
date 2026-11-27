# AeroAid: feature inventory from v1

This is what the original Next.js app (`../aeroaid`) did, written down as a spec for the rewrite. The backend is entirely Supabase. The browser talks to it directly with the anon key, and the Next.js API routes were thin wrappers that the UI had mostly stopped using.

## Domain

AeroAid is a blood donor network for Bangladesh's aviation community (students and airline staff), mainly in Dhaka. Users are donors, and any logged-in user can also request a donor.

- **Profile:** name, date of birth, blood group, area (one of about 70 Dhaka areas), contact phone, organization, bio, avatar, and an `is_available` toggle.
- **Donation:** one table serves two purposes, depending on `status`:
  - `pending`: a **request** from `requester_id` to `donor_id`.
  - `completed`: a **history entry** that the donor logged themselves.

The data model is in [supabase/schema.sql](../supabase/schema.sql) and [supabase/database.types.ts](../supabase/database.types.ts). The dropdown data is in [src/data/dropdown.ts](../src/data/dropdown.ts).

## Features

| #   | Feature                                                                                                                                                                                            | v1 route          | Supabase calls                                                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Sign up** with email, password, full name, DOB and blood group. Email confirmation is required.                                                                                                  | `/signup`         | `auth.signUp({ email, password, options: { emailRedirectTo: <origin>/auth/callback, data: { full_name, date_of_birth, blood_group } } })`. The profile row is presumably created by a DB trigger (see schema.sql).         |
| 2   | **Log in** with email and password. Shows a friendly message for "email not confirmed". Redirects to `/profile`.                                                                                   | `/login`          | `auth.signInWithPassword`                                                                                                                                                                                                  |
| 3   | **Reset password** by email                                                                                                                                                                        | `/reset-password` | `auth.resetPasswordForEmail(email, { redirectTo: <origin>/auth/callback })`                                                                                                                                                |
| 4   | **Auth callback**: exchanges the code from the email link and redirects to `/search`                                                                                                               | `/auth/callback`  | `auth.exchangeCodeForSession(code)`                                                                                                                                                                                        |
| 5   | **Sign out**                                                                                                                                                                                       | menu              | `auth.signOut()`                                                                                                                                                                                                           |
| 6   | **Route protection**: `/profile`, `/history`, `/invitations`, `/requests`, `/account` and `/dashboard` redirect to `/login` when there's no session                                                | middleware        | `auth.getSession()`                                                                                                                                                                                                        |
| 7   | **Edit own profile**: all fields, the availability toggle and an avatar upload. The image is compressed to 0.5 MB or less in the browser.                                                          | `/profile`        | `from('profiles').select('*').eq('id', uid).single()`, `update(profile).eq('id', uid)` (empty contact is saved as `null`), `storage.from('avatars').upload('<uid>/avatar.<ext>', file, { upsert: true })`                  |
| 8   | **View a public profile**                                                                                                                                                                          | `/profile/[id]`   | `from('profiles').select('*').eq('id', id).single()`                                                                                                                                                                       |
| 9   | **Search donors** by blood group (required) and area (optional). Filters live in the URL as `?bloodGroup=&area=`. The search excludes yourself and donors you already have a pending request with. | `/search`, navbar | `from('donations').select('donor_id').eq('requester_id', uid).eq('status','pending')`, then `from('profiles').select('*').eq('blood_group', bg)[.eq('area_name', area)].neq('id', uid).not('id','in',(…))`                 |
| 10  | **Send a donation request** to a donor from their search card                                                                                                                                      | `/search`         | `from('donations').insert({ donor_id, requester_id: uid, reference: <my name or email> })`. The status column default is unknown, but the reads expect `pending`.                                                          |
| 11  | **Sent requests**: my pending requests with the donor's contact details                                                                                                                            | `/requests`       | ``from('donations').select(`id, patient_name, hospital, location, reference, date, donor:profiles!donor_id (id, full_name, contact, blood_group, area_name, avatar_url)`).eq('requester_id', uid).eq('status','pending')`` |
| 12  | **Invitations**: pending requests sent to me, plus my 5 most recent completed donation dates                                                                                                       | `/invitations`    | `from('donations').select(...).eq('donor_id', uid).eq('status','pending')`, and `.eq('status','completed').order('date', desc).limit(5)`                                                                                   |
| 13  | **Donation history**: list my completed donations and log a new one (patient, hospital, location, reference, date)                                                                                 | `/history`        | `from('donations').select(...).eq('donor_id', uid).eq('status','completed')`, `insert({ ...form, donor_id: uid, status: 'completed' })`                                                                                    |
| 14  | Landing page                                                                                                                                                                                       | `/`               | —                                                                                                                                                                                                                          |

## Not finished in v1 (decide for the rewrite)

- **Request lifecycle**: requests are created as pending, but there's no way to accept, decline, cancel or complete them. Invitations are read-only.
- **Account settings** (`/account`): the form only `console.log`s. Changing name, email or password isn't implemented.
- **Dashboard** (`/dashboard`): a leftover from the starter template.
- **Rate limiting**: `lib/utils/rate-limit.ts` (Upstash Redis) and an in-memory variant exist but aren't used anywhere, and no Upstash credentials were ever set.
- **"Real-time availability"** is mentioned in the old README but was never built. There's no Realtime subscription.

## v1 bugs (don't port them)

- Several query cache keys leave out the user id (`["invitations"]`, `["history"]`, `["recent-donations"]`), so cached data can carry over between accounts in one session.
- Search shows "Sent request…" before the insert has finished, and shows it even when the insert fails.
- `RequestCard` falls back to `/avatar-placeholder.png`, but the file is `.jpg`.
- The middleware checked auth with `getSession()`, which isn't safe for server-side checks (use `getUser()` / `getClaims()`). Its "logged-in users skip auth pages" check looked at `/auth` instead of `/login` and `/signup`.
- `src/lib/supabase/types.ts` was a stale, hand-written schema (with `username` and `email` on profiles) that didn't match the DB. Only `database.types.ts` is real.
- The `/api/profile` PUT handler wrote to `auth.user_metadata`, not to the `profiles` table.

## Security to-do

All data access goes from the browser to PostgREST with the anon key, so **RLS policies are the only thing protecting the data**. In particular:

- Any user can read other users' `contact` field.
- Nothing visible in the code stops a user from inserting a donation with someone else's `requester_id`, or updating someone else's profile.

Run `supabase db pull` to get the real policies before you rely on them.
