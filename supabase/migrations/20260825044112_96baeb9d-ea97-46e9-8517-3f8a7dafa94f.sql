ALTER TABLE public.stranger_notes
  ADD COLUMN IF NOT EXISTS drive_folder_id text,
  ADD COLUMN IF NOT EXISTS drive_image_file_id text,
  ADD COLUMN IF NOT EXISTS drive_media_file_id text,
  ADD COLUMN IF NOT EXISTS clip_start numeric,
  ADD COLUMN IF NOT EXISTS clip_end numeric,
  ADD COLUMN IF NOT EXISTS sort_order integer;

CREATE UNIQUE INDEX IF NOT EXISTS stranger_notes_drive_folder_id_key
  ON public.stranger_notes (drive_folder_id)
  WHERE drive_folder_id IS NOT NULL;