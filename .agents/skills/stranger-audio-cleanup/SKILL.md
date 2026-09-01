---
name: stranger-audio-cleanup
description: Clean and trim Stranger FM voice recordings after notes are added through Lovable or Supabase. Use when new quote audio needs background-noise reduction, loudness balancing, silence removal, filler-word trimming, or removal of remarks outside the written quote.
---

# Stranger Audio Cleanup

Use the bundled script from the Stranger FM project root. It treats the saved written transcript as the authoritative quote, uses local speech recognition to locate that quote in the recording, and creates cleaned copies without overwriting the originals.

## Prepare a listening report

Run:

```bash
python3 .agents/skills/stranger-audio-cleanup/scripts/clean_stranger_audio.py --project-root .
```

This finds newly published notes, uses their synced local recording when available (otherwise downloading it), reduces steady background noise, evens out loudness, trims speech before and after the quote, and writes `.audio-cleanup/report.html`. Open that report and listen to every original/cleaned pair before applying anything live.

Useful selections:

```bash
# Specific note numbers
python3 .agents/skills/stranger-audio-cleanup/scripts/clean_stranger_audio.py --project-root . --numbers 21 22 23

# Recheck every published note
python3 .agents/skills/stranger-audio-cleanup/scripts/clean_stranger_audio.py --project-root . --all

# Test a local recording
python3 .agents/skills/stranger-audio-cleanup/scripts/clean_stranger_audio.py --project-root . --file recording.m4a --transcript "The exact written quote"
```

Read [references/review-and-apply.md](references/review-and-apply.md) before applying reviewed files to Supabase.

## Editing rules

- Preserve the speaker's natural voice and pacing. Use conservative denoising; clarity matters more than making the recording sound artificially silent.
- Treat the note transcript as authoritative. Remove `um`, `ah`, `okay`, `thank you`, and similar speech only when it is outside the written quote or is clearly an inserted filler.
- Keep complete first and final consonants. The script includes small boundary padding, but listen for clipped words during review.
- Never replace a live recording during the normal report run.
- Never pass `--allow-low-confidence` without telling the user which notes were uncertain and receiving explicit approval.
- Keep `.audio-cleanup/manifest.json`; it records the original URL and the proposed or applied replacement for recovery.

## Model and rerun options

The default local model is `mlx-community/whisper-large-v3-turbo`, chosen for multilingual and mixed Malay/English speech. Its first run downloads the model, then later runs reuse it. Override with `--model`; use a tiny model only for a quick plumbing test.

Use `--force` to regenerate existing reviewed files. Use `--apply --email user@example.com` only after the user has listened to and approved the report. Applying prompts securely for the Supabase password, uploads a new versioned audio file, updates the note, and leaves the original file untouched.
