-- Contract-only: apply after the new private-admin frontend/functions are deployed and smoke tested.

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Anyone can insert videos" ON public.alih_videos;
DROP POLICY IF EXISTS "Anyone can update videos" ON public.alih_videos;
DROP POLICY IF EXISTS "Anyone can delete videos" ON public.alih_videos;
DROP POLICY IF EXISTS "Anyone can read videos" ON public.alih_videos;

CREATE POLICY "Public can read published videos"
  ON public.alih_videos FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can read all videos"
  ON public.alih_videos FOR SELECT TO authenticated
  USING ((SELECT public.is_current_user_admin()));

CREATE POLICY "Admins can insert videos"
  ON public.alih_videos FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_current_user_admin()));

CREATE POLICY "Admins can update videos"
  ON public.alih_videos FOR UPDATE TO authenticated
  USING ((SELECT public.is_current_user_admin()))
  WITH CHECK ((SELECT public.is_current_user_admin()));

CREATE POLICY "Admins can delete videos"
  ON public.alih_videos FOR DELETE TO authenticated
  USING ((SELECT public.is_current_user_admin()));
