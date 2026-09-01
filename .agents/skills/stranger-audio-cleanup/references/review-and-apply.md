# Review and apply

## Listening review

Open `.audio-cleanup/report.html` and compare the original and cleaned versions of every note. Confirm that:

- the first and final words are complete;
- every word in the written quote remains audible;
- setup speech, filler, and closing remarks outside the quote are gone;
- natural pauses still sound human rather than abruptly spliced;
- denoising did not introduce metallic, watery, or pumping artifacts;
- perceived loudness is reasonably consistent between notes.

Anything marked `review` has an uncertain transcript match. Adjust the written transcript if it is inaccurate, trim manually with the existing admin controls, or rerun after choosing the correct boundaries. Do not apply an uncertain match merely to finish the batch.

## Apply approved recordings

After the user explicitly approves the listening report, run the same selection with:

```bash
python3 .agents/skills/stranger-audio-cleanup/scripts/clean_stranger_audio.py \
  --project-root . \
  --numbers 21 22 23 \
  --apply \
  --email ADMIN_EMAIL
```

The script prompts for the Supabase password, uploads each approved cleaned file under a new versioned name, and changes the database URL. It clears `clip_start` and `clip_end` because the new file is already trimmed.

The original storage object is never overwritten or deleted. `.audio-cleanup/manifest.json` retains the old URL and records the replacement URL so a previous recording can be restored.

If a note is marked low confidence, the apply operation refuses it. `--allow-low-confidence` is an emergency override and requires the user's explicit approval after they have listened to the exact affected notes.
