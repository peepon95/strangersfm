# 100 Strangers — a jar of handwritten notes

A single-page site where a jar of folded notes drops onto the screen. Tap the jar and it pulls one stranger's note: a snapshot of their handwriting, floating like a paper sticker, with their voice/video playing underneath. Tap again for another.

## The experience

**1. Landing (the drop)**
Empty warm-paper screen. The jar falls in from the top, bounces, settles, notes rustling inside. Title and one line of context fade in under it. A prominent counter: "7 of 100 strangers".

**2. Pull a note**
Tap the jar. A folded paper flies out and unfolds into the centre of the screen: the handwriting photo, cut out from its background so it reads as a real scrap of paper on the page — slight rotation, soft drop shadow, a bit of tape or a pin.

**3. Hear them**
Below the note, the video of the person saying the words. Muted-by-default poster frame with a soft "hear them say it" prompt so nothing autoplays loudly. Optional typed transcript underneath for accessibility and search engines.

**4. Next**
"Pull another" returns the note to the jar and draws a new one. No note repeats until the jar is empty, then it reshuffles. A quiet link to "see all notes" opens a wall/collage view of every handwriting scrap collected so far.

## How notes get in (Google Drive automation)

You keep working the way you already do — record, photograph, drop the files in a Drive folder.

- One Drive folder, e.g. `100 Strangers`, with a subfolder per person: `007-maria/`
- Inside each: the handwriting photo, the video, and a small `note.txt` with the transcript and first name/city (all optional except the photo)
- The site checks that folder for new subfolders, copies the media into the project's own storage (so the site never depends on Drive being reachable), and publishes the note
- Sync runs automatically on a schedule and can also be triggered by a "Sync now" button on a private admin page, which also lets you hide a note, fix a transcript, or reorder

Notes stay unpublished until you flip them live, so nothing appears half-finished.

## Design direction

Warm paper, not a white app. Deep ink-blue text on off-white, a single warm accent, generous silence. The jar is a hand-drawn glass vessel, not a 3D render. Motion is physical: the jar has weight, notes have paper flutter, nothing slides or fades generically. No purple gradients, no card grids.

## Build order

1. **Design system + jar drop** — tokens, the jar illustration, the drop animation and counter. Works with your 3 notes hardcoded so you can feel it immediately.
2. **Note pull + video** — unfold animation, sticker treatment, player, shuffle, transcript.
3. **Backend (Lovable Cloud)** — notes table, media storage, admin login, admin page.
4. **Drive sync** — connect your Google Drive, folder scan, media copy, scheduled auto-pull, "Sync now".
5. **All-notes wall + polish** — collage view, sharing preview, SEO, mobile pass.

## Technical notes

- Lovable Cloud for the database, media storage bucket, and your admin login; public visitors read published notes only.
- Google Drive connector (your own account) for the folder scan; media is copied into Cloud storage on first sync, so the public site never hits Drive.
- Sync is a server-side job with a scheduled trigger plus a manual endpoint; it is idempotent, keyed on Drive file IDs, so re-running never duplicates a note.
- Handwriting cut-out: photos are auto-trimmed and given a paper mask so any phone snapshot on a lined page still reads as a sticker. If a photo comes out badly, the admin page lets you re-crop.
- Videos are transcoded to web-friendly MP4 with a poster frame; large raw files are handled at sync time, not on the visitor's device.

## Open questions I'll need answered as we go

- A name for the project (the site's title and the URL)
- One or two sentences of context for the landing screen — why you're doing this
- Whether people's first names appear, or the notes stay anonymous
