-- Remove the unsafe "Public read" policy that exposes all user personal information
-- This maintains security while keeping the proper user-specific access policy

DROP POLICY IF EXISTS "Public read" ON public.profiles;