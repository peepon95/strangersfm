import { Link, createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { NoteReveal } from "@/components/NoteReveal";
import { notes as builtInNotes, TOTAL_GOAL } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";

const envelopeImage = "/images/open-envelope.png";

const letters = [
  {
    label: "why this exists",
    note: "the story behind the notebook",
    to: "/about",
    className: "mail-card--about",
  },
  {
    label: "every note",
    note: "browse the handwritten letters",
    to: "/notes",
    className: "mail-card--notes",
  },
  {
    label: "write a note",
    note: "leave a message for a stranger",
    to: "/submit",
    className: "mail-card--write",
  },
  {
    label: "pull a note",
    note: "a message chosen for today",
    to: null,
    className: "mail-card--pull",
  },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "stranger fm · an archive of handwritten notes" },
      {
        name: "description",
        content:
          "100 strangers, one notebook. Open a letter and read a handwritten message to the world, in their own hand, in their own voice.",
      },
      { property: "og:title", content: "stranger fm · an archive of handwritten notes" },
      {
        property: "og:description",
        content:
          "Open a letter and read a handwritten message to the world, in a stranger's own hand and voice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => listPublishedNotes(),
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-muted-foreground">The notes are resting, please refresh in a moment.</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-muted-foreground">Nothing here.</p>
    </main>
  ),
  component: Index,
});

function Index() {
  const uploaded = Route.useLoaderData();
  const notes = useMemo(() => [...builtInNotes, ...uploaded], [uploaded]);
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const bag = useRef<number[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setMenuOpen(true), reduceMotion ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  const draw = useCallback(() => {
    setCurrent((previous) => {
      if (bag.current.length === 0) {
        bag.current = notes
          .map((_, index) => index)
          .sort(() => Math.random() - 0.5)
          .filter((index) => index !== previous);
        if (bag.current.length === 0) bag.current = notes.map((_, index) => index);
      }
      return bag.current.pop() ?? 0;
    });
  }, [notes]);

  const note = current === null ? null : notes[current];

  return (
    <main className="archive-stage relative min-h-screen overflow-hidden px-4 pb-0 pt-7 sm:px-8 sm:pt-10">
      <BackgroundMusic />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-start justify-between gap-6">
        <div>
          <p className="font-type text-[10px] uppercase tracking-[0.28em] text-ink/55 sm:text-xs">
            an archive of voices
          </p>
          <h1 className="mt-2 font-type text-2xl tracking-[-0.05em] text-ink sm:text-4xl">
            stranger.fm
          </h1>
          <p className="mt-3 max-w-md font-type text-[11px] leading-relaxed text-ink/55 sm:text-sm">
            100 strangers. one handwritten message each. preserved in their own voice.
          </p>
        </div>

        <div className="border-t border-ink/30 pt-2 text-right font-type text-[10px] uppercase leading-relaxed tracking-[0.15em] text-ink/55 sm:text-xs">
          <span className="block text-base text-ink sm:text-xl">
            {String(notes.length).padStart(2, "0")} / {TOTAL_GOAL}
          </span>
          letters found
        </div>
      </header>

      <div aria-hidden className="floating-letter-field">
        {notes.slice(0, 6).map((floatingNote, index) => (
          <motion.div
            key={`floating-${floatingNote.id}`}
            className={`floating-letter floating-letter--${index + 1}`}
            initial={{ opacity: 0, y: 22 }}
            animate={
              reduceMotion
                ? { opacity: 0.42, y: 0 }
                : { opacity: [0.24, 0.47, 0.24], y: [0, -12, 0], rotate: [0, 1.5, 0] }
            }
            transition={{
              opacity: { delay: 0.7 + index * 0.08, duration: 7 + index, repeat: Infinity },
              y: { delay: index * 0.2, duration: 7 + index, repeat: Infinity, ease: "easeInOut" },
              rotate: {
                delay: index * 0.2,
                duration: 7 + index,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <img src={floatingNote.image} alt="" />
          </motion.div>
        ))}
      </div>

      <section aria-label="Choose a letter" className="mail-stack relative z-10 mx-auto max-w-5xl">
        <p className="mail-stack-instruction font-type text-[10px] uppercase tracking-[0.18em] text-ink/50 sm:text-xs">
          {menuOpen ? "choose a letter" : "a letter is arriving"}
        </p>

        <div id="letter-menu" className={`mail-card-fan ${menuOpen ? "is-open" : "is-closed"}`}>
          <motion.div
            aria-hidden
            className={`mail-envelope mail-envelope--flap ${
              menuOpen ? "mail-envelope--flap-open" : "mail-envelope--flap-closed"
            }`}
            initial={reduceMotion ? false : { opacity: 0, y: 35, rotate: -1, rotateX: 180 }}
            animate={{
              opacity: 1,
              y: 0,
              rotate: -1,
              rotateX: menuOpen ? 0 : 180,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    opacity: { delay: 0.2, duration: 0.35 },
                    y: { delay: 0.2, type: "spring", stiffness: 95, damping: 16 },
                    rotate: { delay: 0.2, type: "spring", stiffness: 95, damping: 16 },
                    rotateX: { duration: 0.78, ease: [0.22, 0.72, 0.16, 1] },
                  }
            }
          >
            <img src={envelopeImage} alt="" width={1200} height={800} />
          </motion.div>

          {menuOpen
            ? letters.map((letter, index) => {
                const cardClass = `mail-card ${letter.className} group focus-within:z-30`;
                const contents = (
                  <>
                    <span className="mail-card-number font-type">0{index + 1}</span>
                    <span className="mail-card-copy">
                      <span className="font-display text-[clamp(1.15rem,2.35vw,1.75rem)] leading-[0.95] text-ink">
                        {letter.label}
                      </span>
                      <span className="mt-3 block font-type text-[9px] uppercase leading-relaxed tracking-[0.1em] text-ink/55 sm:text-[10px]">
                        {letter.note}
                      </span>
                    </span>
                    <span aria-hidden className="mail-card-mark font-display">
                      ↗
                    </span>
                  </>
                );

                return (
                  <div
                    key={letter.label}
                    className={cardClass}
                    style={{ animationDelay: reduceMotion ? "0ms" : `${240 + index * 105}ms` }}
                  >
                    {letter.to ? (
                      <Link to={letter.to} className="mail-card-action">
                        {contents}
                      </Link>
                    ) : (
                      <button type="button" onClick={draw} className="mail-card-action text-left">
                        {contents}
                      </button>
                    )}
                  </div>
                );
              })
            : null}

          <motion.div
            aria-hidden
            className="mail-envelope mail-envelope--front"
            initial={reduceMotion ? false : { opacity: 0, y: 70, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -1 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 95, damping: 16 }}
          >
            <img src={envelopeImage} alt="" width={1200} height={800} />
          </motion.div>
        </div>

        <p className="mail-stack-caption mx-auto max-w-md text-center font-type text-[10px] leading-relaxed text-ink/55 sm:text-xs">
          {menuOpen
            ? "Choose where you would like to go."
            : "Opening a small archive of handwritten voices."}
        </p>
      </section>

      <AnimatePresence>
        {note ? (
          <motion.div
            key={note.id}
            role="dialog"
            aria-modal="true"
            aria-label={`A letter from stranger number ${note.id}`}
            className="letter-reveal-overlay fixed inset-0 z-40 overflow-y-auto px-4 py-5 backdrop-blur-sm sm:px-8 sm:py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              onClick={() => setCurrent(null)}
              className="letter-close fixed left-4 top-4 z-[70] font-type text-[10px] uppercase tracking-[0.12em] sm:left-8 sm:top-7 sm:text-xs"
            >
              ← back to the letters
            </button>

            <div className="letter-reveal-stage mx-auto flex min-h-full w-full max-w-4xl items-center justify-center pt-12 sm:pt-6">
              <NoteReveal
                note={note}
                autoplay
                onNext={draw}
                onBack={() => setCurrent(null)}
                presentation="letter"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
