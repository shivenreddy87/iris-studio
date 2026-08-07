
DROP POLICY IF EXISTS "avatar read" ON storage.objects;
DROP POLICY IF EXISTS "media-kit read" ON storage.objects;

CREATE POLICY "media-kit owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media-kit' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins read avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins read media-kit" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media-kit' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Brands view connected accounts" ON public.connected_accounts;
