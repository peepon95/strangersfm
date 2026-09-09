import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArchivePageShell } from "@/components/ArchivePageShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · stranger fm" },
      {
        name: "description",
        content:
          "Hi, I am Ee Von. I am asking 100 strangers to write down one message to the world, so that on a heavy day you can read a note from someone who is rooting for you.",
      },
      { property: "og:title", content: "About · stranger fm" },
      {
        property: "og:description",
        content:
          "Why I am collecting 100 handwritten messages from 100 strangers, and what I hope you find here.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <ArchivePageShell tabLabel="why I am doing this" tabColor="#d7dde0">
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-2xl font-type text-ink"
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">personal file / 2026</p>
        <h1 className="mt-5 font-type text-3xl leading-tight tracking-[-0.05em] sm:text-5xl">
          why this archive exists
        </h1>

        <div className="archive-rule my-8" />

        <div className="space-y-6 text-sm leading-7 text-ink/70 sm:text-base sm:leading-8">
          <p>
            Having one of those days? Yeah, I have been there too. Sometimes, a little pick-me-up
            from a stranger is hard to come by. So I started stranger.fm: I ask strangers to write
            one piece of advice or one message in my notebook, then say it in their own voice.
          </p>
          <p>
            If you are feeling down, sad, or unmotivated, I hope these words make your day a little
            lighter and remind you that people you have never met are rooting for you.
          </p>
          <p>This too shall pass. Go out there and make some magic.</p>
          <p className="pt-2">
            Always,
            <br />
            Ee Von
          </p>
        </div>

        <div className="archive-rule my-8" />

        <p className="text-[10px] uppercase leading-relaxed tracking-[0.14em] text-ink/45">
          music credit: "Wash." written and performed by Bon Iver, from Bon Iver, Bon Iver (2011). I
          do not own this song and no rights are claimed. It plays here only because it inspired
          this space.
        </p>

        <div className="archive-rule my-8" />

        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="archive-button px-6 py-3 text-[10px] uppercase tracking-[0.14em] sm:text-xs"
          >
            listen to the archive
          </Link>
          <Link
            to="/notes"
            className="border border-ink/30 bg-transparent px-6 py-3 text-[10px] uppercase tracking-[0.14em] transition-colors hover:bg-ink/5 sm:text-xs"
          >
            see every note
          </Link>
          <Link
            to="/submit"
            className="border border-ink/30 bg-transparent px-6 py-3 text-[10px] uppercase tracking-[0.14em] transition-colors hover:bg-ink/5 sm:text-xs"
          >
            write a note
          </Link>
        </div>
      </motion.article>
    </ArchivePageShell>
  );
}
