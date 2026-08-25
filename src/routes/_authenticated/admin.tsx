import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notes as builtInNotes } from "@/data/notes";

/** Ten years, long enough that the links never quietly die on the site. */
const LINK_LIFETIME = 60 * 60 * 24 * 365 * 10;

type Row = {
  id: string;
  number: number;
  image_url: string;
  audio_url: string | null;
  transcript: string;
  translation: string | null;
  published: boolean;
};

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Add a note · 100 Strangers" },
      { name: "description", content: "Private page for adding new handwritten notes." },
      { property: "og:title", content: "Add a note · 100 Strangers" },
      { property: "og:description", content: "Private page for adding new handwritten notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

async function uploadToStorage(file: File) {
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const up = await supabase.storage.from("note-media").upload(path, file);
  if (up.error) throw up.error;
  const signed = await supabase.storage
    .from("note-media")
    .createSignedUrl(path, LINK_LIFETIME);
  if (signed.error || !signed.data) throw signed.error ?? new Error("Could not link the file");
  return signed.data.signedUrl;
}

function Admin() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [media, setMedia] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("stranger_notes")
      .select("id, number, image_url, audio_url, transcript, translation, published")
      .order("number", { ascending: true });
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    void load();
  }, []);

  const nextNumber =
    Math.max(builtInNotes.length, ...rows.map((r) => r.number), 0) + 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) return;
    setBusy(true);
    setStatus("Uploading, this can take a moment for video.");
    try {
      const imageUrl = await uploadToStorage(image);
      const mediaUrl = media ? await uploadToStorage(media) : null;
      const { error } = await supabase.from("stranger_notes").insert({
        number: nextNumber,
        image_url: imageUrl,
        audio_url: mediaUrl,
        transcript,
        translation: translation || null,
        published: true,
      });
      if (error) throw error;
      setImage(null);
      setMedia(null);
      setTranscript("");
      setTranslation("");
      setStatus(`Added as stranger no. ${String(nextNumber).padStart(3, "0")}.`);
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(row: Row) {
    await supabase
      .from("stranger_notes")
      .update({ published: !row.published })
      .eq("id", row.id);
    await load();
  }

  async function remove(row: Row) {
    await supabase.from("stranger_notes").delete().eq("id", row.id);
    await load();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-4xl">Add a note</h1>
        <div className="flex gap-4 text-sm">
          <Link to="/" className="underline decoration-border underline-offset-4">
            Back to the jar
          </Link>
          <button
            type="button"
            className="underline decoration-border underline-offset-4 text-muted-foreground"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <form onSubmit={submit} className="mt-10 flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm">
          Handwriting photo
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-full file:border file:border-border file:bg-card file:px-4 file:py-2 file:text-sm"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          Their voice, audio or video (optional)
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setMedia(e.target.files?.[0] ?? null)}
            className="text-sm text-muted-foreground file:mr-3 file:rounded-full file:border file:border-border file:bg-card file:px-4 file:py-2 file:text-sm"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          What the note says
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={2}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          English reading (optional)
          <textarea
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            rows={2}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ink"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="self-start rounded-full bg-ink px-7 py-3 text-sm font-medium text-paper disabled:opacity-60"
        >
          {busy ? "Uploading" : `Add as no. ${String(nextNumber).padStart(3, "0")}`}
        </button>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </form>

      <section className="mt-14">
        <h2 className="text-2xl">Uploaded notes</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing uploaded yet, the first three strangers are built into the site.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-3"
              >
                <img
                  src={row.image_url}
                  alt={row.transcript || `Note ${row.number}`}
                  className="h-14 w-20 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{row.transcript || "no transcript"}</p>
                  <p className="text-xs text-muted-foreground">
                    no. {String(row.number).padStart(3, "0")}
                    {row.published ? "" : " · hidden"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePublished(row)}
                  className="text-xs underline decoration-border underline-offset-4"
                >
                  {row.published ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(row)}
                  className="text-xs underline decoration-border underline-offset-4 text-muted-foreground"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
