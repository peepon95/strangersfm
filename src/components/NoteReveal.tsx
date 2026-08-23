import { motion } from "motion/react";
import type { Note } from "@/data/notes";

export function NoteReveal({
  note,
  onNext,
  onBack,
}: {
  note: Note;
  onNext: () => void;
  onBack: () => void;
}) {
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

      {note.videoUrl ? (
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-[0_14px_30px_var(--paper-shadow)]">
          <video
            src={note.videoUrl}
            poster={note.posterUrl}
            controls
            playsInline
            preload="none"
            className="aspect-[9/16] w-full bg-ink/90 object-cover"
          />
          <p className="px-4 py-3 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Hear them say it
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
          Pull another
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
