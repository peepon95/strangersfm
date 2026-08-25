import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PaperPlanes } from "@/components/PaperPlanes";

const TALLY_FORM_ID = "jaAQvE";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Add your note · Strangers Jar" },
      {
        name: "description",
        content:
          "Write one message to the world, snap your handwriting, say it out loud, and send it in. Your note joins the jar of 100 strangers.",
      },
      { property: "og:title", content: "Add your note · Strangers Jar" },
      {
        property: "og:description",
        content:
          "Three easy steps: write it, film it, send it. Your handwriting and your voice join the jar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Submit,
});

const steps = [
  {
    title: "step one.",
    body: "Write it by hand. One message, a piece of advice, or the thing you needed to hear on your worst day. Any paper, any language, any handwriting. Messy is good, messy is human. Then take a photo of it.",
  },
  {
    title: "step two.",
    body: "Say it out loud. Turn on your phone camera and read your note to whoever needs it. A few seconds is plenty. I will pull just the audio so your voice sits under your handwriting on the site.",
  },
  {
    title: "step three.",
    body: "Send it in below. Upload the photo and the short video, then tell me where in the world you are writing from. Add your Instagram handle if you want me to tag you when it goes up, or just your name if you want to be credited. Stay anonymous? No worries, both are totally optional.",
  },
];

function Submit() {
  return (
    <main className="relative min-h-screen px-6 py-20">
      <PaperPlanes />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-xl"
      >
        <h1 className="text-5xl leading-none">bring it in.</h1>
        <p className="mt-3 font-display text-xl text-muted-foreground">three easy steps</p>

        <div className="mt-8 space-y-7 border-t border-border pt-8">
          {steps.map((step) => (
            <section key={step.title}>
              <h2 className="text-lg font-medium">{step.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
          No names on the site. Every note stays anonymous unless you ask me otherwise.
        </p>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-background">
          <iframe
            title="Add your note to the jar"
            src={`https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&transparentBackground=1`}
            className="h-[1100px] w-full"
            loading="lazy"
          />
        </div>

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
      </motion.div>
    </main>
  );
}
