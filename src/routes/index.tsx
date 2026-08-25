import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Jar } from "@/components/Jar";
import { PaperPlanes } from "@/components/PaperPlanes";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { NoteReveal } from "@/components/NoteReveal";
import { NotePile } from "@/components/NotePile";
import { notes as builtInNotes, TOTAL_GOAL } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "100 Strangers · A jar of handwritten notes" },
      {
        name: "description",
        content:
          "One hundred strangers, one notebook. Pull a note from the jar and read a handwritten message to the world, in their own hand, in their own voice.",
      },
      { property: "og:title", content: "100 Strangers · A jar of handwritten notes" },
      {
        property: "og:description",
        content:
          "Pull a note from the jar and read a handwritten message to the world, in a stranger's own hand and voice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => listPublishedNotes(),
  errorComponent: () => (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-muted-foreground">The jar is resting, please refresh in a moment.</p>
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
  const notes = [...builtInNotes, ...uploaded];
  const [current, setCurrent] = useState<number | null>(null);
  const bag = useRef<number[]>([]);

  const draw = useCallback(() => {
    if (bag.current.length === 0) {
      bag.current = notes
        .map((_, i) => i)
        .sort(() => Math.random() - 0.5)
        .filter((i) => i !== current);
      if (bag.current.length === 0) bag.current = notes.map((_, i) => i);
    }
    setCurrent(bag.current.pop() ?? 0);
  }, [current, notes]);

  const note = current === null ? null : notes[current];


  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <PaperPlanes count={notes.length} />
      <BackgroundMusic />
      <div className="relative z-10 flex w-full flex-col items-center">
      <AnimatePresence mode="wait">
        {note ? (
          <NoteReveal key={note.id} note={note} autoplay onNext={draw} onBack={() => setCurrent(null)} />

        ) : (
          <motion.div
            key="jar"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <Jar onPull={draw} idle />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.7 }}
              className="mt-10 flex flex-col items-center text-center"
            >
              <h1 className="text-balance text-4xl leading-tight sm:text-5xl">
                One hundred strangers,
                <br />
                one notebook.
              </h1>
              <p className="mt-4 max-w-md text-pretty text-base text-muted-foreground">
                I am asking a hundred strangers to write one message to the world in my notebook,
                and to say it out loud. Tap the jar once and the notes play themselves, one stranger after another.
              </p>
              <p className="mt-8 font-display text-2xl text-foreground">
                <span className="text-accent-foreground">{notes.length}</span>
                <span className="text-muted-foreground"> of {TOTAL_GOAL} collected</span>
              </p>
              <div className="mt-3 h-1 w-56 overflow-hidden rounded-full bg-border">
                <motion.div
                  className="h-full rounded-full bg-ink"
                  initial={{ width: 0 }}
                  animate={{ width: `${(notes.length / TOTAL_GOAL) * 100}%` }}
                  transition={{ delay: 1.2, duration: 1 }}
                />
              </div>
              <nav className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
                <Link
                  to="/about"
                  className="underline decoration-border underline-offset-4 transition-colors hover:text-accent-foreground"
                >
                  Why I am doing this
                </Link>
                <Link
                  to="/notes"
                  className="underline decoration-border underline-offset-4 transition-colors hover:text-accent-foreground"
                >
                  See every note so far
                </Link>
                <Link
                  to="/submit"
                  className="underline decoration-border underline-offset-4 transition-colors hover:text-accent-foreground"
                >
                  Add your own note
                </Link>
              </nav>

              <NotePile notes={notes} onSelect={(i) => setCurrent(i)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </main>

  );
}
