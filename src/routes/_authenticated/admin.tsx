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
  clip_start: number | null;
  clip_end: number | null;
  drive_folder_id: string | null;
};

/** "1:33", "1.33" and "93" all mean one minute thirty three. */
function parseTime(value: string): number | null {
  const clean = value.trim();
  if (!clean) return null;
  const parts = clean.split(/[:.]/).map((p) => Number(p));
  if (parts.some((p) => Number.isNaN(p))) return null;
  return parts.reduce((total, p) => total * 60 + p, 0);
}

function formatTime(seconds: number | null): string {
  if (seconds === null) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}


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

  const [syncing, setSyncing] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("stranger_notes")
      .select(
        "id, number, image_url, audio_url, transcript, translation, published, clip_start, clip_end, drive_folder_id",
      )
      .order("number", { ascending: true });
    setRows((data ?? []) as Row[]);
  }

  async function syncDrive() {
    setSyncing(true);
    setStatus("Looking in your Drive folder, this can take a while for video.");
    try {
      const res = await fetch("/api/public/drive-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string,
        },
        body: "{}",
      });
      const body = (await res.json()) as {
        added?: string[];
        skipped?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? `Sync failed [${res.status}]`);
      const parts: string[] = [];
      parts.push(body.added?.length ? `Added ${body.added.join(", ")}.` : "Nothing new.");
      if (body.skipped?.length) parts.push(`Skipped: ${body.skipped.join("; ")}.`);
      parts.push("New notes arrive hidden, press Show when you are happy with them.");
      setStatus(parts.join(" "));
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function patch(row: Row, changes: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...changes } : r)));
    await supabase.from("stranger_notes").update(changes).eq("id", row.id);
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

      <section className="mt-14 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-2xl">From your Google Drive</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Make a subfolder per person in your <em>100 Strangers</em> folder, drop the photo and
          the video inside, and it lands here. This also runs by itself every 15 minutes.
        </p>
        <button
          type="button"
          onClick={syncDrive}
          disabled={syncing}
          className="mt-4 rounded-full border border-border px-6 py-2.5 text-sm transition-colors hover:bg-accent disabled:opacity-60"
        >
          {syncing ? "Syncing" : "Sync now"}
        </button>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">All notes</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing here yet, the first three strangers are built into the site.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-5">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={row.image_url}
                    alt={row.transcript || `Note ${row.number}`}
                    className="h-16 w-24 shrink-0 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      no. {String(row.number).padStart(3, "0")}
                      {row.published ? "" : " · hidden"}
                      {row.drive_folder_id ? " · from Drive" : ""}
                    </p>
                    <textarea
                      defaultValue={row.transcript ?? ""}
                      rows={2}
                      placeholder="what the note says"
                      onBlur={(e) => patch(row, { transcript: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ink"
                    />
                    <textarea
                      defaultValue={row.translation ?? ""}
                      rows={1}
                      placeholder="english reading (optional)"
                      onBlur={(e) => patch(row, { translation: e.target.value || null })}
                      className="mt-2 w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ink"
                    />
                    {row.audio_url ? (
                      <>
                        <audio src={row.audio_url} controls preload="metadata" className="mt-3 w-full" />
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          play only from
                          <input
                            defaultValue={formatTime(row.clip_start)}
                            placeholder="0:00"
                            onBlur={(e) => patch(row, { clip_start: parseTime(e.target.value) })}
                            className="w-20 rounded-lg border border-border bg-paper px-2 py-1 text-center outline-none focus:ring-2 focus:ring-ink"
                          />
                          to
                          <input
                            defaultValue={formatTime(row.clip_end)}
                            placeholder="end"
                            onBlur={(e) => patch(row, { clip_end: parseTime(e.target.value) })}
                            className="w-20 rounded-lg border border-border bg-paper px-2 py-1 text-center outline-none focus:ring-2 focus:ring-ink"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex gap-4">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

    </main>
  );
}
