# Google Drive auto-sync for new notes

Not set up yet. What exists today is the manual uploader: you sign in at `/auth`, pick a photo and an audio or video file on `/admin`, and it goes live. Nothing watches your Drive folder.

This plan adds the automation you actually asked for: drop a folder in Drive, the note appears on the site by itself, with the voice pulled out of the video.

## How it will work for you

1. In your `100 Strangers` Drive folder you make one subfolder per person, e.g. `004-market-uncle/`.
2. Inside it you drop the handwriting photo and the video (or a voice memo). Nothing else needed.
3. The site checks that folder on a schedule (every 15 minutes) and also whenever you press "Sync now" on the admin page.
4. Each new subfolder becomes a note: the photo and the voice are copied into the site's own storage, so the page never depends on Drive being reachable or shared.
5. The spoken words get transcribed automatically, so the typed version under the note fills itself in. You can correct it on the admin page.
6. New notes arrive as drafts. The admin page shows them with a "Publish" switch, so nothing half-finished shows up in the jar. Say the word and I will flip that to publish-on-arrival instead.

## About the voice

- If you drop a video, the site plays only its audio, no picture, exactly like the three notes already on the site.
- Automatic trimming to a specific moment is not possible: only you know that the good bit is at 1:33. The admin page will get a start and end time field per note, so you can type `1:33` and `1:42` and the player will play just that stretch.
- Studio-grade noise cleanup like I ran on the first three is not something the site can do to itself; that is me with audio tools. Uploaded voices get a lighter in-browser cleanup (a voice-band filter and volume levelling) so they sit at a similar loudness. If one comes out rough, ask me and I will hand-clean it.

## Connecting Drive

You will get a one-click connect card in chat to link your Google account. It reads only that one folder. If you would rather keep Drive private, the manual uploader stays and this stays off.

## Build order

1. Link the Google Drive connector and confirm the site can list your folder.
2. Sync job: scan subfolders, copy new media into site storage, create draft notes, keyed on the Drive file id so re-running never duplicates anything.
3. Auto-transcribe the voice and fill in the typed version.
4. Admin page additions: "Sync now", publish switch, transcript editing, start/end trim fields, drag to reorder.
5. Schedule the sync every 15 minutes.

## Technical notes

- Google Drive App connector (your workspace account), called through the Lovable connector gateway from a server function; the folder id is stored in project config.
- `stranger_notes` gains `drive_folder_id`, `drive_image_file_id`, `drive_media_file_id` (unique, for idempotency), `clip_start`, `clip_end`, `sort_order`, and keeps `published` defaulting to false for synced rows.
- Media is streamed from Drive into the existing private `note-media` bucket and stored as long-lived signed URLs, same as the manual uploader.
- Transcription runs through Lovable AI speech-to-text on the copied file; failures leave the transcript blank rather than blocking the note.
- Scheduling via a database cron job hitting a public sync endpoint; the same endpoint backs the "Sync now" button, and the job is safe to run repeatedly.
- Trimming is play-time only: the player seeks to `clip_start` and stops at `clip_end`, so the original file is never destroyed and you can adjust the numbers later.
