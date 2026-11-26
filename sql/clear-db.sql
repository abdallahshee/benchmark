
BEGIN;

-- Delete dependent application data first
DELETE FROM public.reports;
DELETE FROM public.profiles;
DELETE FROM public.sites;
DELETE FROM public.machineries;

-- Delete Supabase authentication users last
DELETE FROM auth.users;

COMMIT;
