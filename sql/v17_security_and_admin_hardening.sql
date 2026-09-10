-- ARCHIVED DRAFT: do not apply. It trusts user-editable profiles.is_admin.
-- Use 202609100005 through 202609100007 instead.
-- V17: Close public write/privacy gaps before enabling 2026-27 automation.
-- No administrator is granted by this migration. Set profiles.is_admin only
-- for a verified account in a separate reviewed production step.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_barrier = true)
AS
SELECT id, nickname, avatar_url
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can insert videos" ON public.alih_videos;
DROP POLICY IF EXISTS "Anyone can update videos" ON public.alih_videos;
DROP POLICY IF EXISTS "Anyone can delete videos" ON public.alih_videos;

CREATE POLICY "Admins can insert videos"
  ON public.alih_videos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin
    )
  );

CREATE POLICY "Admins can update videos"
  ON public.alih_videos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin
    )
  );

CREATE POLICY "Admins can delete videos"
  ON public.alih_videos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin
    )
  );

DROP POLICY IF EXISTS "Allow Public Uploads hylejo_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Uploads hylejo_1" ON storage.objects;

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'player-images';

ALTER FUNCTION public.generate_player_card(INTEGER) SET search_path = public;
ALTER FUNCTION public.generate_player_slug() SET search_path = public;
ALTER FUNCTION public.get_next_card_serial(INTEGER) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.generate_player_card(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_player_card(INTEGER) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
