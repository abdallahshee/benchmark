
BEGIN;

-- Delete dependent application data first
DELETE FROM public.reports;
DELETE FROM public.profiles;
DELETE FROM public.sites;
DELETE FROM public.machineries;
DELETE FROM public.workers;
DELETE FROM public.site_workers;
DELETE FROM public.report_workers;

-- Delete Supabase authentication users last
DELETE FROM auth.users;

COMMIT;
