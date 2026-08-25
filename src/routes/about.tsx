import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PaperPlanes } from "@/components/PaperPlanes";
import { notes, TOTAL_GOAL } from "@/data/notes";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · 100 Strangers, one notebook" },
      {
        name: "description",
        content:
          "Hi, I am Ee Von. I am asking 100 strangers to write down one message to the world, so that on a heavy day you can read a note from someone who is rooting for you.",
      },
      { property: "og:title", content: "About · 100 Strangers, one notebook" },
      {
        property: "og:description",
        content:
          "Why I am collecting one handwritten message from 100 strangers, and what I hope you find here.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <main className="relative min-h-screen px-6 py-20">
      <PaperPlanes />
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-xl"
      >
        <h1 className="text-5xl leading-none">hi.</h1>
        <p className="mt-6 text-lg leading-relaxed">
          hi I am Ee Von and 2026 has been a rough year with a lot of unexpected changes. But I guess
          that is life? So I started strangers jar where I ask strangers to write down any advice or
          message onto my notebook and on a mission to get 100 strangers. So if you are feeling down,
          sad or demotivated, I hope these notes from strangers make your day, and remind you that
          we are all rooting for you.
        </p>
        <p className="mt-5 text-lg leading-relaxed">
          This too shall pass and go out there and make magic.
        </p>
        <p className="mt-5 text-lg leading-relaxed">Always, Ee Von</p>

        <hr className="my-10 border-border" />

        <p className="leading-relaxed text-muted-foreground">
          {notes.length} of {TOTAL_GOAL} collected so far. The jar keeps filling.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-full bg-ink px-7 py-3 text-sm font-medium tracking-wide text-paper transition-transform hover:-translate-y-0.5"
          >
            Pull a note
          </Link>
          <Link
            to="/notes"
            className="rounded-full border border-border px-7 py-3 text-sm tracking-wide transition-colors hover:bg-accent"
          >
            See every note
          </Link>
        </div>
      </motion.article>
    </main>
  );
}
