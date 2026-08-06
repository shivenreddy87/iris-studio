CREATE POLICY "Owners manage own campaign attachments"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'campaign-attachments' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'campaign-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins read campaign attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'campaign-attachments' AND private.has_role(auth.uid(), 'admin'::public.app_role));