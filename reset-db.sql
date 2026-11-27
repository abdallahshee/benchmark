
BEGIN;

-- Remove all application tables, including dependent objects.
DROP SCHEMA public CASCADE;

-- Recreate the public schema.
CREATE SCHEMA public;

-- Restore standard Supabase permissions.
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON SCHEMA public TO postgres, service_role;

-- Restore default privileges for future objects.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL ON TABLES TO postgres, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

COMMIT;
