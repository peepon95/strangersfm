import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Note } from "@/data/notes";
import { duckMusic } from "@/components/BackgroundMusic";

/** How long a note without a video stays on screen before the next one. */
const READ_MS = 10_000;
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
  const [isPlaying, setIsPlaying] = useState(false);
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
      setIsPlaying(false);
      if (autoplay) onNext();
    }
  }

  function onLoaded() {
    const el = audioRef.current;
    if (el && note.clipStart !== undefined && el.currentTime < note.clipStart) {
      el.currentTime = note.clipStart;
    }
  }

  function toggleAudio() {
    const el = audioRef.current;
    if (!el) return;

    if (el.paused) {
      if (note.clipEnd !== undefined && el.currentTime >= note.clipEnd) {
        el.currentTime = note.clipStart ?? 0;
      }
      el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  }

  function onAudioEnded() {
    setIsPlaying(false);
    if (autoplay) onNext();
  }

  const audio = note.audioUrl ? (
    <audio
      ref={audioRef}
      src={note.audioUrl}
      controls={presentation !== "letter"}
      preload="metadata"
      onLoadedMetadata={onLoaded}
      onTimeUpdate={onTimeUpdate}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
      onEnded={onAudioEnded}
      className={presentation === "letter" ? "sr-only" : "w-full"}
    />
  ) : null;

  if (presentation === "letter") {
    return (
      <motion.div
        key={note.id}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="envelope-note-reveal flex w-full flex-col items-center"
      >
        <div className="envelope-note-scene relative w-full">
          <motion.img
            src="/images/open-envelope.png"
            alt=""
            aria-hidden
            width={1200}
            height={800}
            className="envelope-note-envelope envelope-note-envelope--back pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto h-auto"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, rotate: -0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
          />

          <motion.article
            className="envelope-note-paper typewriter-sheet absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center"
            initial={reduceMotion ? false : { y: 190, opacity: 0, rotate: -1.5 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 74, damping: 18 }}
          >
            <p
              aria-label={intro}
              className="envelope-note-intro min-h-5 self-start font-type uppercase text-ink/55"
            >
              <span aria-hidden>{typedIntro}</span>
              <span
                aria-hidden
                className="typewriter-cursor ml-0.5 inline-block h-[1em] w-px bg-ink/60"
              />
            </p>

            <motion.figure
              className="envelope-note-figure flex min-h-0 flex-1 items-center justify-center"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: typeDuration / 1000 + 0.08, duration: 0.5 }}
            >
              <img
                src={note.image}
                alt={note.transcript}
                loading="lazy"
                className="envelope-note-handwriting h-full w-full object-contain"
              />
              <figcaption className="sr-only">{note.transcript}</figcaption>
            </motion.figure>

            {note.translation ? (
              <p className="envelope-note-translation text-center italic text-muted-foreground">
                {note.translation}
              </p>
            ) : null}
          </motion.article>

          <motion.img
            src="/images/open-envelope.png"
            alt=""
            aria-hidden
            width={1200}
            height={800}
            className="envelope-note-envelope envelope-note-envelope--front pointer-events-none absolute inset-x-0 bottom-0 z-30 mx-auto h-auto"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, rotate: -0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
          />

          <motion.p
            aria-hidden
            className="envelope-note-address absolute z-40 font-type"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.55, duration: 0.35 }}
          >
            to: whoever needs this today
          </motion.p>
        </div>

        <motion.div
          className="envelope-note-controls flex flex-col items-center"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.48, duration: 0.35 }}
        >
          {note.audioUrl ? (
            <div className="flex flex-col items-center">
              {audio}
              <button
                type="button"
                onClick={toggleAudio}
                aria-label={
                  isPlaying ? "Pause this stranger's voice" : "Play this stranger's voice"
                }
                className="envelope-voice-button flex items-center gap-3 font-type uppercase"
              >
                <span aria-hidden className="envelope-voice-icon">
                  {isPlaying ? "Ⅱ" : "▶"}
                </span>
                {isPlaying ? "pause their voice" : "listen to their voice"}
              </button>
            </div>
          ) : null}

          <div className="envelope-note-actions flex items-center justify-center">
            <button type="button" onClick={onNext} className="font-type uppercase">
              another note
            </button>
            <span aria-hidden>·</span>
            <button type="button" onClick={onBack} className="font-type uppercase">
              back to the letters
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={note.id}
      initial={reduceMotion ? false : { opacity: 0, y: 50, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 110, damping: 18 }}
      className="flex w-full max-w-2xl flex-col items-center gap-6 sm:gap-8"
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
          className="w-full max-w-xl object-contain drop-shadow-[0_18px_28px_var(--paper-shadow)] max-h-[46dvh]"
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
          className="w-full max-w-sm border-y border-dashed border-ink/25 px-1 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: typeDuration / 1000 + 0.35 }}
        >
          <p className="mb-2 font-type text-[10px] uppercase tracking-[0.13em] text-ink/55">
            voice recording / play
          </p>
          {audio}
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
