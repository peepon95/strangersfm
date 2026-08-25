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

Trim, denoise and normalize with ffmpeg, then upload to the `note-media`
bucket and set `audio_url`:

```
ffmpeg -y -ss <start> -to <end> -i in.mp4 \
  -af "highpass=f=90,lowpass=f=7500,afftdn=nf=-28:nt=w,\
adeclick,acompressor=threshold=-20dB:ratio=3:attack=8:release=180,\
dynaudnorm=f=200:g=5,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ac 1 -ar 44100 out.m4a
```

Keep clips small so the page never downloads the raw recording.

## 5. Publish and verify

Flip `published` to true, then check `/` (jar + pile + plane count) and
`/notes` (wall). Confirm every new note shows ink-only handwriting and plays
its cleaned clip.
