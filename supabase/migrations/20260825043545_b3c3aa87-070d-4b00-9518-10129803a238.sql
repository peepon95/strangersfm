CREATE POLICY "Signed in admins can read note media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'note-media');