import { Link, createFileRoute } from "@tanstack/react-router";
import { ArchivePageShell } from "@/components/ArchivePageShell";
import { notes as builtInNotes, TOTAL_GOAL } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Every note so far · stranger fm" },
      {
        name: "description",
        content:
          "The full archive of handwritten notes collected so far: advice, hope and one message to the world, written by strangers.",
      },
      { property: "og:title", content: "Every note so far · stranger fm" },
      {
        property: "og:description",
        content: "The full archive of handwritten notes collected from strangers so far.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => listPublishedNotes(),
  errorComponent: () => (
    <main className="archive-stage flex min-h-screen items-center justify-center px-6 font-type text-ink/55">
      The archive is resting. Please refresh in a moment.
    </main>
  ),
  notFoundComponent: () => (
    <main className="archive-stage flex min-h-screen items-center justify-center px-6 font-type text-ink/55">
      Nothing has been filed here.
    </main>
  ),
  component: NotesWall,
});

function NotesWall() {
  const notes = [...builtInNotes, ...Route.useLoaderData()];

  return (
    <ArchivePageShell tabLabel="see every note" tabColor="#e4e1d8" wide>
      <header className="font-type text-ink">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/45">master index</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-type text-3xl tracking-[-0.05em] sm:text-5xl">every note so far</h1>
            <p className="mt-3 text-xs uppercase tracking-[0.12em] text-ink/50 sm:text-sm">
              {String(notes.length).padStart(2, "0")} of {TOTAL_GOAL} strangers filed
            </p>
            <p className="mt-2 font-type text-[10px] leading-relaxed text-ink/45 sm:text-xs">
              Choose a handwriting to hear the voice behind it in the archive.
            </p>
          </div>
          <Link
            to="/"
            className="archive-button px-5 py-3 text-[10px] uppercase tracking-[0.13em] sm:text-xs"
          >
            listen to the archive
          </Link>
        </div>
      </header>

      <div className="archive-rule my-8" />

      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
        {notes.map((note, index) => (
          <Link
            key={note.id}
            to="/walkman"
            aria-label={`Open the voice archive for stranger number ${note.id}${
              note.audioUrl ? " and listen to their voice" : ""
            }`}
            className="archive-note-link group block break-inside-avoid focus:outline-none"
            style={{ rotate: `${(index % 3) - 1}deg` }}
          >
            <figure className="archive-note-file p-4 sm:p-5">
              <figcaption className="mb-4 flex items-center justify-between gap-3 border-b border-dashed border-ink/20 pb-2 font-type text-[9px] uppercase tracking-[0.12em] text-ink/45">
                <span>stranger no. {note.id}</span>
                <span>{note.audioUrl ? "open + listen" : "listen in archive"} ↗</span>
              </figcaption>
              <img
                src={note.image}
                alt={note.transcript}
                loading="lazy"
                className="w-full object-contain drop-shadow-[0_8px_12px_var(--paper-shadow)]"
              />
            </figure>
          </Link>
        ))}
      </div>
    </ArchivePageShell>
  );
}
