drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";

drop policy "Admin can read audit logs" on "public"."audit_log";

drop policy "profiles_insert_own" on "public"."profiles";

drop policy "profiles_update_own" on "public"."profiles";

drop policy "users_can_view_own_profile" on "public"."profiles";

drop function if exists "public"."admin_update_user_status"(target_user_id uuid, new_role user_role);

drop function if exists "public"."get_all_users_admin"();

drop function if exists "public"."get_safe_profile_data"();

alter table "public"."profiles" alter column "role" drop default;

alter type "public"."user_role" rename to "user_role__old_version_to_be_dropped";

create type "public"."user_role" as enum ('interviewee', 'interviewer');

alter table "public"."profiles" alter column role type "public"."user_role" using role::text::"public"."user_role";

alter table "public"."profiles" alter column "role" set default 'interviewee'::user_role;

drop type "public"."user_role__old_version_to_be_dropped";

alter table "public"."profiles" drop column "mobile_number";

alter table "public"."profiles" drop column "phone";

alter table "public"."profiles" alter column "created_at" drop not null;

alter table "public"."profiles" alter column "role" drop not null;

alter table "public"."profiles" alter column "updated_at" drop not null;

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_expired_temporary_blocks()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if the table and column exist before trying to delete
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'interviewer_time_blocks' 
        AND column_name = 'temporary'
    ) THEN
        DELETE FROM interviewer_time_blocks
        WHERE temporary = true
        AND created_at < NOW() - INTERVAL '15 minutes';
        
        RAISE NOTICE 'Cleaned up expired temporary reservations';
    ELSE
        RAISE NOTICE 'interviewer_time_blocks table or temporary column does not exist - skipping cleanup';
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Log the attempt
    RAISE NOTICE 'Creating profile for user: %', NEW.email;
    
    -- Insert profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        'interviewee'::user_role
    );
    
    RAISE NOTICE 'Profile created successfully for user: %', NEW.email;
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail signup
        RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$
;


  create policy "Enable insert for authenticated users"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable insert for public during signup"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check (true);



  create policy "Enable read access for authenticated users"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable update for authenticated users"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



