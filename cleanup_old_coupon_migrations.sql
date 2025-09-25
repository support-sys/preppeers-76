-- Cleanup script for old coupon migration files
-- Run this AFTER successfully applying the final migration
-- This script removes the old migration files that are now consolidated

-- Note: This is a reference file - you'll need to manually delete the old files
-- The following files can be safely deleted after applying 20250103000005_final_coupon_system.sql:

-- Files to delete:
-- - supabase/migrations/20250103000003_create_coupons_table.sql
-- - supabase/migrations/20250103000004_add_admin_role.sql
-- - fix_validate_coupon_function.sql

-- The final migration (20250103000005_final_coupon_system.sql) contains everything from these files
-- plus additional improvements and proper type casting.
