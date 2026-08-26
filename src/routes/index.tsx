import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Envelope } from "@/components/Envelope";
import { FallingNotes } from "@/components/FallingNotes";
import { PaperPlanes } from "@/components/PaperPlanes";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { NoteReveal } from "@/components/NoteReveal";
import { notes as builtInNotes, TOTAL_GOAL } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "stranger fm · a jar of handwritten notes" },
      {
        name: "description",
        content:
          "100 strangers, one notebook. Open a letter and read a handwritten message to the world, in their own hand, in their own voice.",
      },
      { property: "og:title", content: "stranger fm · a jar of handwritten notes" },
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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#14180f] px-3 py-6 sm:px-8 sm:py-10">
      <BackgroundMusic />

      <motion.div
        className="relative w-full max-w-[720px]"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="relative">
          <img
            src={journalPage.url}
            alt="A scrapbook page from the stranger fm notebook: handwritten notes, an air mail envelope, photographs, a bus ticket and a map of Kuala Lumpur."
            width={1086}
            height={1448}
            className="block w-full select-none"
          />

          <PaperPlanes count={notes.length} />
          <FallingNotes count={notes.length} />

          {/* the air mail envelope on the page is the way in */}
          <button
            type="button"
            onClick={draw}
            aria-label="Open a letter from a stranger"
            className="absolute left-[53%] top-[26%] z-20 h-[24%] w-[35%] rounded-md ring-ink/0 transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          />

          <JournalTabs active="/" />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 pb-4">
          <button
            type="button"
            onClick={draw}
            className="rounded-full bg-paper px-8 py-3 text-sm font-medium tracking-wide text-ink transition-transform hover:-translate-y-0.5"
          >
            Open notes
          </button>
          <p className="font-display text-xl text-paper/90">
            {notes.length}
            <span className="text-paper/55"> of {TOTAL_GOAL} collected</span>
          </p>
          <div className="h-1 w-56 overflow-hidden rounded-full bg-paper/20">
            <motion.div
              className="h-full rounded-full bg-paper"
              initial={{ width: 0 }}
              animate={{ width: `${(notes.length / TOTAL_GOAL) * 100}%` }}
              transition={{ delay: 0.9, duration: 1 }}
            />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {note && (
          <motion.div
            key={note.id}
            className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#14180f]/92 px-5 py-10 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-2xl rounded-lg bg-background p-5 sm:p-8">
              <NoteReveal note={note} autoplay onNext={draw} onBack={() => setCurrent(null)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

