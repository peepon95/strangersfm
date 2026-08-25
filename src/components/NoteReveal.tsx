import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Note } from "@/data/notes";
import { duckMusic } from "@/components/BackgroundMusic";

/** How long a note without a video stays on screen before the next one. */
const READ_MS = 9000;

export function NoteReveal({
  note,
  autoplay,
  onNext,
  onBack,
}: {
  note: Note;
  autoplay: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    duckMusic(true);
    return () => duckMusic(false);
  }, [note.id]);

  useEffect(() => {
    if (!autoplay) return;
    const el = audioRef.current;
    if (el) {
      el.currentTime = note.clipStart ?? 0;
      el.play().catch(() => undefined);
      return;
    }
    const t = setTimeout(onNext, READ_MS);
    return () => clearTimeout(t);
  }, [note.id, note.clipStart, autoplay, onNext]);

  /** Honour the trim: stop at the end of the chosen stretch. */
  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el || note.clipEnd === undefined) return;
    if (el.currentTime >= note.clipEnd) {
      el.pause();
      if (autoplay) onNext();
    }
  }

  function onLoaded() {
    const el = audioRef.current;
    if (el && note.clipStart !== undefined && el.currentTime < note.clipStart) {
      el.currentTime = note.clipStart;
    }
  }



  return (
    <motion.div
      key={note.id}
      initial={{ opacity: 0, y: 60, rotate: -8, scale: 0.82 }}
      animate={{ opacity: 1, y: 0, rotate: -1.4, scale: 1 }}
      exit={{ opacity: 0, y: -40, rotate: 6, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 90, damping: 14 }}
      className="flex w-full max-w-2xl flex-col items-center gap-8"
    >
      <figure className="relative">
        <img
          src={note.image}
          alt={note.transcript}
          loading="lazy"
          className="w-full max-w-xl drop-shadow-[0_18px_28px_var(--paper-shadow)]"
        />
        <figcaption className="sr-only">{note.transcript}</figcaption>
      </figure>

      {note.translation ? (
        <p className="-mt-4 max-w-md text-center text-sm italic text-muted-foreground">
          {note.translation}
        </p>
      ) : null}

      {note.audioUrl ? (
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card px-4 py-4 shadow-[0_14px_30px_var(--paper-shadow)]">
          <audio
            ref={audioRef}
            src={note.audioUrl}
            controls
            preload="metadata"
            onEnded={autoplay ? onNext : undefined}
            className="w-full"
          />
          <p className="pt-3 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {autoplay ? "Their voice, the next note follows on its own" : "Hear them say it"}
          </p>
        </div>
      ) : null}


      <p className="max-w-md text-center text-sm text-muted-foreground">
        a stranger, no. {note.id}
      </p>


      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-ink px-7 py-3 text-sm font-medium tracking-wide text-paper transition-transform hover:-translate-y-0.5"
        >
          Skip to the next note
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-border px-7 py-3 text-sm tracking-wide text-foreground transition-colors hover:bg-accent"
        >
          Back to the jar
        </button>
      </div>
    </motion.div>
  );
}
