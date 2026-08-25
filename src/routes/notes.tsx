import { createFileRoute, Link } from "@tanstack/react-router";
import { notes as builtInNotes, TOTAL_GOAL } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";


export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Every note so far · 100 Strangers" },
      {
        name: "description",
        content:
          "The full wall of handwritten notes collected so far: advice, hope and one message to the world, written by strangers.",
      },
      { property: "og:title", content: "Every note so far · 100 Strangers" },
      {
        property: "og:description",
        content: "The full wall of handwritten notes collected from strangers so far.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => listPublishedNotes(),
  errorComponent: () => (
    <main className="mx-auto max-w-5xl px-6 py-16 text-center text-muted-foreground">
      The wall is resting, please refresh in a moment.
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-5xl px-6 py-16 text-center text-muted-foreground">
      Nothing here.
    </main>
  ),
  component: NotesWall,
});

function NotesWall() {
  const notes = [...builtInNotes, ...Route.useLoaderData()];
  return (

    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="text-center">
        <h1 className="text-4xl">Every note so far</h1>
        <p className="mt-3 text-muted-foreground">
          {notes.length} of {TOTAL_GOAL} strangers
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm underline decoration-border underline-offset-4"
        >
          Back to the jar
        </Link>
      </header>

      <div className="mt-14 columns-1 gap-8 sm:columns-2 lg:columns-3 [&>*]:mb-8">
        {notes.map((note, i) => (
          <figure
            key={note.id}
            className="break-inside-avoid"
            style={{ rotate: `${(i % 3) - 1}deg` }}
          >
            <img
              src={note.image}
              alt={note.transcript}
              loading="lazy"
              className="w-full drop-shadow-[0_14px_22px_var(--paper-shadow)]"
            />
            <figcaption className="mt-3 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
              no. {note.id}
            </figcaption>

          </figure>
        ))}
      </div>
    </main>
  );
}
