-- Lock down profiles and donations.
--
-- Before: anyone (even logged out) could read every profile column, including
-- phone numbers and dates of birth, and every donation (patient names, hospitals).
-- Any logged-in user could insert donations in someone else's name, and there were
-- no UPDATE/DELETE policies, so cancel / mark donated / decline always failed.
--
-- After:
--   * Logged-out visitors can browse donors (name, blood group, area, photo,
--     availability, organization) but NOT contact, date of birth or bio.
--   * Logged-in members see full profiles (needed to contact a donor).
--   * Donations are visible only to the donor and the requester.
--   * Requests can only be sent as yourself, to a donor who is available, and
--     only one open request per donor; donations can only be logged for yourself.
--   * Donors can mark a pending request donated/declined (status only);
--     requesters can cancel it.
--   * Public donation counts come from a function that returns only a number.

begin;

-- ---------------------------------------------------------------- profiles
-- Rows stay readable by everyone (existing SELECT policy); hide sensitive
-- columns from logged-out visitors with column-level privileges.
revoke select on public.profiles from anon;
grant select (id, full_name, blood_group, area_name, avatar_url, is_available, organization, updated_at)
  on public.profiles to anon;
-- Logged-out visitors never write profiles.
revoke insert, update, delete on public.profiles from anon;

-- ---------------------------------------------------------------- donations
revoke all on public.donations from anon;

drop policy if exists "Enable read access for all users" on public.donations;
drop policy if exists "Enable insert for authenticated users only" on public.donations;

create policy "Donor and requester can read their donations"
  on public.donations for select to authenticated
  using ((select auth.uid()) in (donor_id, requester_id));

create policy "Send requests as yourself, log your own donations"
  on public.donations for insert to authenticated
  with check (
    -- a request: from me, to someone else, pending, to an available donor,
    -- and not while I already have an open request with them
    (
      requester_id = (select auth.uid())
      and donor_id <> (select auth.uid())
      and status = 'pending'
      and exists (select 1 from public.profiles p where p.id = donations.donor_id and p.is_available)
      and not exists (
        select 1 from public.donations d
        where d.requester_id = (select auth.uid()) and d.donor_id = donations.donor_id and d.status = 'pending'
      )
    )
    or
    -- a self-logged donation in my history
    (donor_id = (select auth.uid()) and requester_id is null and status = 'completed')
  );

-- Updates may only touch the status column, so answering a request can't
-- rewrite who asked, the patient, the hospital or the date.
revoke update on public.donations from authenticated;
grant update (status) on public.donations to authenticated;

create policy "Donor can answer a pending request"
  on public.donations for update to authenticated
  using (donor_id = (select auth.uid()) and status = 'pending')
  with check (donor_id = (select auth.uid()) and status in ('completed', 'declined'));

create policy "Requester can cancel a pending request"
  on public.donations for delete to authenticated
  using (requester_id = (select auth.uid()) and status = 'pending');

-- ---------------------------------------------------------------- public count
-- How many donations a donor has completed, without exposing the rows.
create or replace function public.completed_donation_count(p_donor uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.donations
  where donor_id = p_donor and status = 'completed';
$$;

revoke all on function public.completed_donation_count(uuid) from public;
grant execute on function public.completed_donation_count(uuid) to anon, authenticated;

commit;
