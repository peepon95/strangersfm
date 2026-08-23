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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    duckMusic(true);
    return () => duckMusic(false);
  }, [note.id]);

  useEffect(() => {
    if (!autoplay) return;
    const el = videoRef.current;
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => {
        el.muted = true;
        el.play().catch(() => undefined);
      });
      return;
    }
    const t = setTimeout(onNext, READ_MS);
    return () => clearTimeout(t);
  }, [note.id, autoplay, onNext]);

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

      {note.videoUrl ? (
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-[0_14px_30px_var(--paper-shadow)]">
          <video
            ref={videoRef}
            src={note.videoUrl}
            poster={note.posterUrl}
            controls
            playsInline
            preload="metadata"
            onEnded={autoplay ? onNext : undefined}
            className="aspect-[9/16] w-full bg-ink/90 object-cover"
          />
          <p className="px-4 py-3 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {autoplay ? "Playing, the next note follows on its own" : "Hear them say it"}
          </p>
        </div>
      ) : null}

      <p className="max-w-md text-center text-sm text-muted-foreground">
        {note.name ? `${note.name}` : "Anonymous"}
        {note.place ? ` · ${note.place}` : ""} · stranger no. {note.id}
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
