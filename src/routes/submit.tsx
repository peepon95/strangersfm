import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArchivePageShell } from "@/components/ArchivePageShell";

const TALLY_FORM_ID = "jaAQvE";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Add your note · stranger fm" },
      {
        name: "description",
        content:
          "Write one message to the world, snap your handwriting, say it out loud, and send it in. Your note joins the archive of 100 strangers.",
      },
      { property: "og:title", content: "Add your note · stranger fm" },
      {
        property: "og:description",
        content:
          "Three easy steps: write it, film it, send it. Your handwriting and your voice join the archive.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Submit,
});

const steps = [
  {
    number: "01",
    title: "write it by hand",
    body: "One message, a piece of advice, or the thing you needed to hear on your worst day. Any paper, language or handwriting is welcome. Then take a clear photo.",
  },
  {
    number: "02",
    title: "say it out loud",
    body: "Turn on your phone camera and read your note to whoever needs it. A few seconds is plenty. I will keep only the voice beneath your handwriting.",
  },
  {
    number: "03",
    title: "send it in",
    body: "Upload the photo and short recording below. Your name, location and Instagram handle are optional. Staying anonymous is completely fine.",
  },
] as const;

function Submit() {
  return (
    <ArchivePageShell tabLabel="write a note" tabColor="#b9cbd3">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="font-type text-ink"
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">new submission</p>
        <h1 className="mt-5 font-type text-3xl tracking-[-0.05em] sm:text-5xl">bring it in</h1>
        <p className="mt-3 text-xs uppercase tracking-[0.12em] text-ink/50">
          three steps before filing
        </p>

        <div className="archive-rule my-8" />

        <div className="space-y-7">
          {steps.map((step) => (
            <section key={step.number} className="grid gap-3 sm:grid-cols-[52px_1fr]">
              <span className="text-xs text-ink/35">{step.number}</span>
              <div>
                <h2 className="font-type text-sm font-bold uppercase tracking-[0.08em]">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-ink/65">{step.body}</p>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 border-y border-dashed border-ink/20 py-5 text-xs leading-6 text-ink/55">
          Unless you ask to be credited, your note stays anonymous. Every submission is reviewed
          before it appears in the public archive.
        </p>

        <div className="mt-10 overflow-hidden border border-ink/15 bg-[#f7f3ea]">
          <iframe
            title="Add your note to the archive"
            src={`https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&transparentBackground=1`}
            className="h-[1100px] w-full"
            loading="lazy"
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="archive-button px-6 py-3 text-[10px] uppercase tracking-[0.14em] sm:text-xs"
          >
            pull a note
          </Link>
          <Link
            to="/notes"
            className="border border-ink/30 px-6 py-3 text-[10px] uppercase tracking-[0.14em] transition-colors hover:bg-ink/5 sm:text-xs"
          >
            see every note
          </Link>
        </div>
      </motion.div>
    </ArchivePageShell>
  );
}
