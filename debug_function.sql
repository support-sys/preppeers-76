-- Query to check the current function definition
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'get_all_users_admin' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
