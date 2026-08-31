import { Link, createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { NoteReveal } from "@/components/NoteReveal";
import { notes as builtInNotes, TOTAL_GOAL } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";

const folders = [
  { label: "why I am doing this", to: "/about", tabLeft: "5%", color: "#d7dde0" },
  { label: "write a note", to: "/submit", tabLeft: "58%", color: "#b9cbd3" },
  { label: "see every note", to: "/notes", tabLeft: "13%", color: "#e4e1d8" },
  { label: "pull a note", to: null, tabLeft: "58%", color: "#c4d5dd" },
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
  const [current, setCurrent] = useState<number | null>(null);
  const bag = useRef<number[]>([]);

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
          voices filed
        </div>
      </header>

      <section
        aria-label="Stranger FM sections"
        className="folder-stack relative z-10 mx-auto mt-14 w-full max-w-6xl sm:mt-16"
      >
        {folders.map((folder, index) => {
          const tabClass =
            "folder-tab flex items-center justify-center px-4 font-type text-[10px] uppercase tracking-[0.1em] text-ink transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:px-7 sm:text-xs";

          return (
            <motion.div
              key={folder.label}
              className="folder-layer absolute inset-x-0 bottom-0"
              style={{
                top: `calc(${index} * clamp(72px, 9.5vw, 102px))`,
                zIndex: index + 1,
                backgroundColor: folder.color,
              }}
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 * index, duration: 0.5, ease: "easeOut" }}
            >
              {folder.to ? (
                <Link
                  to={folder.to}
                  className={tabClass}
                  style={{ left: folder.tabLeft, backgroundColor: folder.color }}
                >
                  {folder.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={draw}
                  className={tabClass}
                  style={{ left: folder.tabLeft, backgroundColor: folder.color }}
                >
                  {folder.label}
                </button>
              )}

              {index === folders.length - 1 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 pb-10 pt-12 text-center sm:px-12">
                  <p className="font-type text-[10px] uppercase tracking-[0.2em] text-ink/45 sm:text-xs">
                    file selected
                  </p>
                  <h2 className="mt-4 max-w-2xl font-type text-2xl leading-snug tracking-[-0.04em] text-ink sm:text-4xl lg:text-5xl">
                    a message from someone you have never met
                  </h2>
                  <p className="mt-5 max-w-lg font-type text-xs leading-relaxed text-ink/55 sm:text-sm">
                    pull one at random. read their handwriting. listen to the words exactly as they
                    said them.
                  </p>
                  <button
                    type="button"
                    onClick={draw}
                    className="archive-button mt-8 px-7 py-3 font-type text-xs uppercase tracking-[0.16em] sm:px-9 sm:py-4"
                  >
                    open this file
                  </button>
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </section>

      <AnimatePresence>
        {note ? (
          <motion.div
            key={note.id}
            className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#aebdc4]/88 px-4 py-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="typewriter-sheet relative w-full max-w-2xl px-5 py-8 sm:px-10 sm:py-12">
              <NoteReveal note={note} autoplay onNext={draw} onBack={() => setCurrent(null)} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
