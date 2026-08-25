CREATE TABLE public.stranger_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  audio_url TEXT,
  transcript TEXT NOT NULL DEFAULT '',
  translation TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stranger_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stranger_notes TO authenticated;
GRANT ALL ON public.stranger_notes TO service_role;

ALTER TABLE public.stranger_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published notes"
  ON public.stranger_notes FOR SELECT TO anon, authenticated
  USING (published = true);

CREATE POLICY "Signed in admins can read all notes"
  ON public.stranger_notes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Signed in admins can insert notes"
  ON public.stranger_notes FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Signed in admins can update notes"
  ON public.stranger_notes FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Signed in admins can delete notes"
  ON public.stranger_notes FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Signed in admins can upload note media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'note-media');

CREATE POLICY "Signed in admins can update note media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'note-media');

CREATE POLICY "Signed in admins can delete note media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'note-media');