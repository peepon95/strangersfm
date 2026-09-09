import { Link, createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { NoteReveal } from "@/components/NoteReveal";
import { notes as builtInNotes, TOTAL_GOAL } from "@/data/notes";
import type { Note } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";
import { VoiceArchive } from "@/routes/walkman";

const envelopeImage = "/images/open-envelope.png";

const letters = [
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
  validateSearch: (search: Record<string, unknown>): { note?: string; from?: "notes" } => {
    const parsed: { note?: string; from?: "notes" } = {};
    const note = search["note"];
    if (typeof note === "string" && /^\d{3}$/.test(note)) parsed.note = note;
    if (search["from"] === "notes") parsed.from = "notes";
    return parsed;
  },
  head: () => ({
    meta: [
      { title: "stranger fm · the voice archive" },
      {
        name: "description",
        content:
          "100 strangers. One handwritten message each. Preserved in their own voice. Press play and listen to the archive.",
      },
      { property: "og:title", content: "stranger fm · the voice archive" },
      {
        property: "og:description",
        content: "100 strangers. One handwritten message each. Preserved in their own voice.",
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
  const search = Route.useSearch();

  if (!search.note) return <VoiceArchive uploaded={uploaded} />;

  return <LetterIndex uploaded={uploaded} />;
}

function LetterIndex({ uploaded }: { uploaded: Note[] }) {
  const notes = useMemo(() => [...builtInNotes, ...uploaded], [uploaded]);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [current, setCurrent] = useState<number | null>(() => {
    if (!search.note) return null;
    const selectedIndex = notes.findIndex((note) => note.id === search.note);
    return selectedIndex >= 0 ? selectedIndex : null;
  });
  const bag = useRef<number[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setMenuOpen(true), reduceMotion ? 0 : 650);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  useEffect(() => {
    if (!search.note) return;
    const selectedIndex = notes.findIndex((note) => note.id === search.note);
    setCurrent(selectedIndex >= 0 ? selectedIndex : null);
  }, [notes, search.note]);

  const draw = useCallback(() => {
    if (search.note) {
      void navigate({ to: "/", search: {}, replace: true });
    }
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
  }, [navigate, notes, search.note]);

  const closeNote = useCallback(() => {
    if (search.from === "notes") {
      void navigate({ to: "/notes" });
      return;
    }
    setCurrent(null);
    if (search.note) {
      void navigate({ to: "/", search: {}, replace: true });
    }
  }, [navigate, search.from, search.note]);

  const note = current === null ? null : notes[current];

  return (
    <main className="archive-stage relative min-h-screen overflow-hidden px-4 pb-0 pt-7 sm:px-8 sm:pt-10">
      <BackgroundMusic />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-start justify-between gap-6">
        <div>
          <p className="font-type text-[10px] tracking-[0.12em] text-ink/55 sm:text-xs">
            Welcome to the nicest places on the internet.
          </p>
          <h1 className="mt-2 font-type text-2xl tracking-[-0.05em] text-ink sm:text-4xl">
            stranger.fm
          </h1>
          <p className="mt-3 max-w-md font-type text-[11px] leading-relaxed text-ink/55 sm:text-sm">
            100 strangers. one handwritten message each. preserved in their own voice.
          </p>
          <Link
            to="/hotline"
            className="mt-3 inline-block border-b border-ink/30 pb-0.5 font-type text-[9px] uppercase tracking-[0.12em] text-ink/55 transition-colors hover:border-ink hover:text-ink sm:text-[10px]"
          >
            try the listening line →
          </Link>
        </div>

        <div className="border-t border-ink/30 pt-2 text-right font-type text-[10px] uppercase leading-relaxed tracking-[0.15em] text-ink/55 sm:text-xs">
          <span className="block whitespace-nowrap text-base text-ink sm:text-xl">
            {String(notes.length).padStart(2, "0")} / {TOTAL_GOAL} letters
          </span>
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

      <Link to="/about" className="mail-about-link">
        why this exists
      </Link>

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
              onClick={closeNote}
              className="letter-close fixed left-4 top-4 z-[70] font-type text-[10px] uppercase tracking-[0.12em] sm:left-8 sm:top-7 sm:text-xs"
            >
              ← back to the letters
            </button>

            <div className="letter-reveal-stage mx-auto flex min-h-full w-full max-w-4xl items-center justify-center pt-12 sm:pt-6">
              <NoteReveal
                note={note}
                autoplay
                onNext={draw}
                onBack={closeNote}
                presentation="letter"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
