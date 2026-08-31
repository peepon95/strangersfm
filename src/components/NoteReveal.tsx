import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Note } from "@/data/notes";
import { duckMusic } from "@/components/BackgroundMusic";

/** How long a note without a video stays on screen before the next one. */
const READ_MS = 9000;
const TYPE_INTERVAL_MS = 42;

export function NoteReveal({
  note,
  autoplay,
  onNext,
  onBack,
  presentation = "file",
}: {
  note: Note;
  autoplay: boolean;
  onNext: () => void;
  onBack: () => void;
  presentation?: "file" | "letter";
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reduceMotion = useReducedMotion();
  const intro = `a message from stranger no. ${note.id}`;
  const [typedIntro, setTypedIntro] = useState(intro);
  const typeDuration = reduceMotion ? 0 : intro.length * TYPE_INTERVAL_MS;

  useEffect(() => {
    duckMusic(true);
    return () => duckMusic(false);
  }, [note.id]);

  useEffect(() => {
    if (reduceMotion) {
      setTypedIntro(intro);
      return;
    }

    let character = 0;
    setTypedIntro("");
    const timer = window.setInterval(() => {
      character += 1;
      setTypedIntro(intro.slice(0, character));
      if (character >= intro.length) window.clearInterval(timer);
    }, TYPE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [intro, reduceMotion]);

  useEffect(() => {
    if (!autoplay) return;
    let readTimer: number | undefined;
    const startTimer = window.setTimeout(() => {
      const el = audioRef.current;
      if (el) {
        el.currentTime = note.clipStart ?? 0;
        el.play().catch(() => undefined);
        return;
      }
      readTimer = window.setTimeout(onNext, READ_MS);
    }, typeDuration + 180);

    return () => {
      window.clearTimeout(startTimer);
      if (readTimer !== undefined) window.clearTimeout(readTimer);
    };
  }, [note.id, note.clipStart, autoplay, onNext, typeDuration]);

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
      initial={reduceMotion ? false : { opacity: 0, y: 50, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 110, damping: 18 }}
      className={`flex w-full max-w-2xl flex-col items-center ${
        presentation === "letter" ? "gap-3 sm:gap-4" : "gap-6 sm:gap-8"
      }`}
    >
      <p
        aria-label={intro}
        className="min-h-6 self-start font-type text-xs uppercase tracking-[0.14em] text-ink/65 sm:text-sm"
      >
        <span aria-hidden>{typedIntro}</span>
        <span
          aria-hidden
          className="typewriter-cursor ml-0.5 inline-block h-[1em] w-[2px] bg-ink/70"
        />
      </p>

      <motion.figure
        className="relative"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: typeDuration / 1000 + 0.12, duration: 0.55 }}
      >
        <img
          src={note.image}
          alt={note.transcript}
          loading="lazy"
          className={`w-full max-w-xl object-contain drop-shadow-[0_18px_28px_var(--paper-shadow)] ${
            presentation === "letter" ? "max-h-[30dvh]" : "max-h-[46dvh]"
          }`}
        />
        <figcaption className="sr-only">{note.transcript}</figcaption>
      </motion.figure>

      {note.translation ? (
        <p className="-mt-4 max-w-md text-center text-sm italic text-muted-foreground">
          {note.translation}
        </p>
      ) : null}

      {note.audioUrl ? (
        <motion.div
          className={`w-full max-w-sm border-y border-dashed border-ink/25 px-1 ${
            presentation === "letter" ? "py-3" : "py-4"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: typeDuration / 1000 + 0.35 }}
        >
          <p className="mb-2 font-type text-[10px] uppercase tracking-[0.13em] text-ink/55">
            voice recording / play
          </p>
          <audio
            ref={audioRef}
            src={note.audioUrl}
            controls
            preload="metadata"
            onLoadedMetadata={onLoaded}
            onTimeUpdate={onTimeUpdate}
            onEnded={autoplay ? onNext : undefined}
            className="w-full"
          />
        </motion.div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onNext}
          className="archive-button px-6 py-3 font-type text-[10px] uppercase tracking-[0.14em] sm:text-xs"
        >
          another note
        </button>
        <button
          type="button"
          onClick={onBack}
          className="border border-ink/35 bg-transparent px-6 py-3 font-type text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink/5 sm:text-xs"
        >
          close {presentation}
        </button>
      </div>
    </motion.div>
  );
}
