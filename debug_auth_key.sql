-- Check what authorization key is being used
SELECT current_setting('app.supabase_anon_key', true) as anon_key;
