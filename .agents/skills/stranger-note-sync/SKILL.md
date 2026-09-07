---
name: stranger-note-sync
description: Ingest new stranger notes for the Strangers Jar project from Google Drive - run the drive sync, extract transparent handwriting cutouts from notebook photos, trim and denoise the voice clips, and publish the notes.
---

# Stranger note sync

Workflow for adding new strangers to the Strangers Jar site after Ee Von drops
photos + recordings into Google Drive.

## Ground rules

- Notes stay anonymous. Label them `stranger no. 00X`, never a person's name.
- No em dashes anywhere in site copy.
- Handwriting must be a transparent ink cutout on the page background, never a
  photo crop with paper texture, desk edges, or a white card behind it.
- Audio is a short cleaned clip of the spoken words, no video playback.

## 1. Run the sync

Drive root folder (one subfolder per stranger) is hardcoded in
`src/routes/api/public/drive-sync.ts` as `DRIVE_ROOT_FOLDER_ID`.

Trigger it from `/admin` ("Sync now") or curl the public route:

```
curl -s -X POST "$PREVIEW_URL/api/public/drive-sync" | jq
```

It returns `{ added, skipped, folders }`. New rows land in `stranger_notes`
with `published: false`. Known skips: HEIC without a Drive preview, `.AVI`
recordings, oversized photos, and long recordings (transcript left blank).

## 2. Fill in the note

For each new row set `transcript`, and `translation` when the note is not in
English. Transcribe the handwriting by reading the photo directly; do not
guess. Set `clip_start` / `clip_end` (seconds) for the spoken part.

`parseTime` in `src/routes/_authenticated/admin.tsx` treats `1.33` as
minutes.seconds, not a decimal. Confirm timings against the real audio length
before saving; ask the user rather than assuming when a timestamp exceeds the
recording duration.

## 3. Extract the handwriting

Run `scripts/clean_handwriting.py` (see `references/handwriting.md` for the
tuning knobs) on the downloaded photo. Output a transparent PNG into
`public/handwriting/note-0XX.png`, then map the note number in the
`extractedHandwriting` record inside `src/lib/notes.functions.ts`.

Always eyeball the result (open the PNG, or screenshot `/notes` with
Playwright) before declaring it done.

## 4. Clean the audio

Use `$stranger-audio-cleanup` to align each recording to its written quote,
remove setup/sign-off speech, denoise it, and create the listening report. After
the report is approved, publish the selected clips into the versioned site
assets:

```
python3 .agents/skills/stranger-audio-cleanup/scripts/clean_stranger_audio.py \
  --project-root . --numbers <numbers> --force

python3 .agents/skills/stranger-audio-cleanup/scripts/clean_stranger_audio.py \
  --project-root . --numbers <approved-numbers> --force --publish-local
```

The result must be an audio-only `.m4a` under `public/audio`, not the original
video container or the full recording. Do not invent audio for a note whose
Drive folder contains only a photo; leave its voice pending.

## 5. Publish and verify

Run the deterministic asset preflight before building. List intentionally
silent notes with `--audio-optional`:

```
uv run --with pillow python \
  .agents/skills/stranger-note-sync/scripts/validate_note_assets.py \
  --project-root . --numbers <numbers> --audio-optional <silent-numbers>
```

This must reject opaque/full-photo handwriting, missing extracted PNGs,
recordings that still contain video, and unusually long audio. Build and deploy
the site, then run the same command with `--site-url` against production. A Git
push alone does not prove that Cloudflare has the new static assets.

Only then flip drafts to `published: true` or confirm already-published rows.
Check `/` (pull a note) and `/notes` (wall). Confirm every new note shows
ink-only handwriting and plays only its cleaned quote. If the local asset is
correct but production shows the original photo, check the handwriting URL
directly: a 404 means production is stale and the row is falling back to its
Supabase photo.

## 6. Tidy the Drive folder

Once the notes are live, move every folder you just processed into the
`added into lovable` folder inside the Drive root, so only unprocessed
strangers are left at the top level:

```
python3 scripts/archive_drive_folders.py <folderId> <folderId> --dry-run
python3 scripts/archive_drive_folders.py <folderId> <folderId>
```

Pass the exact folder ids you just published (they are stored as
`drive_folder_id` on each row). `--all` moves every folder sitting in the root,
which is only safe when nothing new is waiting there.

It creates `added into lovable` if it is missing, or reuses one that already
exists (name match ignores case and stray spaces). The sync route skips that
folder, so archived strangers are never re-imported and the root only ever
shows strangers that still need work.
