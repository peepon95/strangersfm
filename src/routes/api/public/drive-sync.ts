import { createFileRoute } from "@tanstack/react-router";

/** The Drive folder that holds one subfolder per stranger. */
const DRIVE_ROOT_FOLDER_ID = "1wYoQH8ojQImRNnYd9Bm9aoN4yEi_avgR";
const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
/** Ten years, so the links on the site never quietly die. */
const LINK_LIFETIME = 60 * 60 * 24 * 365 * 10;
/** Anything bigger than this is skipped rather than pulled into memory. */
const MAX_BYTES = 45 * 1024 * 1024;

type DriveFile = { id: string; name: string; mimeType: string; size?: string };

function driveHeaders() {
  return {
    Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
    "X-Connection-Api-Key": `${process.env["GOOGLE_DRIVE_API_KEY"]}`,
  };
}

async function driveList(query: string): Promise<DriveFile[]> {
  const url =
    `${GATEWAY}/files?q=${encodeURIComponent(query)}` +
    `&fields=${encodeURIComponent("files(id,name,mimeType,size)")}` +
    `&pageSize=200&orderBy=name`;
  const res = await fetch(url, { headers: driveHeaders() });
  if (!res.ok) {
    throw new Error(`Drive list failed [${res.status}]: ${await res.text()}`);
  }
  const body = (await res.json()) as { files?: DriveFile[] };
  return body.files ?? [];
}

async function driveDownload(fileId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${GATEWAY}/files/${fileId}?alt=media`, {
    headers: driveHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Drive download failed [${res.status}]: ${await res.text()}`);
  }
  return res.arrayBuffer();
}

/** Formats the transcription model can actually open. */
const TRANSCRIBABLE = ["mp3", "mp4", "m4a", "wav", "webm", "mpga", "mpeg"];

/** Send the voice through Lovable AI so the typed version fills itself in. */
async function transcribe(bytes: ArrayBuffer, filename: string, mimeType: string) {
  if (!TRANSCRIBABLE.includes(extensionFor(filename, ""))) return "";
  const form = new FormData();
  form.append("model", "openai/gpt-4o-mini-transcribe");
  form.append("file", new Blob([bytes], { type: mimeType }), filename);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}` },
    body: form,
  });
  if (!res.ok) {
    console.error(`Transcription failed [${res.status}]: ${await res.text()}`);
    return "";
  }
  const body = (await res.json()) as { text?: string };
  return body.text ?? "";
}


function extensionFor(name: string, fallback: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : fallback;
}

async function runSync() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const folders = await driveList(
    `'${DRIVE_ROOT_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  );

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("stranger_notes")
    .select("drive_folder_id, number");
  if (existingError) throw existingError;

  const seen = new Set(
    (existing ?? []).map((r) => r.drive_folder_id).filter((v): v is string => !!v),
  );
  /** The site ships with three notes built in, so synced numbers start after them. */
  let nextNumber = Math.max(3, ...(existing ?? []).map((r) => r.number ?? 0)) + 1;

  const added: string[] = [];
  const skipped: string[] = [];

  for (const folder of folders) {
    if (seen.has(folder.id)) continue;

    const files = await driveList(`'${folder.id}' in parents and trashed = false`);
    const image = files.find((f) => f.mimeType.startsWith("image/"));
    const media = files.find(
      (f) => f.mimeType.startsWith("audio/") || f.mimeType.startsWith("video/"),
    );

    if (!image) {
      skipped.push(`${folder.name}: no handwriting photo yet`);
      continue;
    }
    if (Number(image.size ?? 0) > MAX_BYTES) {
      skipped.push(`${folder.name}: photo is too large`);
      continue;
    }

    const imageBytes = await driveDownload(image.id);
    const imagePath = `drive/${folder.id}/photo.${extensionFor(image.name, "jpg")}`;
    const imageUpload = await supabaseAdmin.storage
      .from("note-media")
      .upload(imagePath, imageBytes, { contentType: image.mimeType, upsert: true });
    if (imageUpload.error) throw imageUpload.error;
    const imageSigned = await supabaseAdmin.storage
      .from("note-media")
      .createSignedUrl(imagePath, LINK_LIFETIME);
    if (imageSigned.error || !imageSigned.data) {
      throw imageSigned.error ?? new Error("Could not link the photo");
    }

    let mediaUrl: string | null = null;
    let transcript = "";

    if (media && Number(media.size ?? 0) <= MAX_BYTES) {
      const mediaBytes = await driveDownload(media.id);
      const mediaPath = `drive/${folder.id}/voice.${extensionFor(media.name, "mp4")}`;
      const mediaUpload = await supabaseAdmin.storage
        .from("note-media")
        .upload(mediaPath, mediaBytes, { contentType: media.mimeType, upsert: true });
      if (mediaUpload.error) throw mediaUpload.error;
      const mediaSigned = await supabaseAdmin.storage
        .from("note-media")
        .createSignedUrl(mediaPath, LINK_LIFETIME);
      if (mediaSigned.error || !mediaSigned.data) {
        throw mediaSigned.error ?? new Error("Could not link the voice");
      }
      mediaUrl = mediaSigned.data.signedUrl;
      try {
        transcript = await transcribe(mediaBytes, media.name, media.mimeType);
      } catch (err) {
        console.error("Transcription error", err);
      }
    } else if (media) {
      skipped.push(`${folder.name}: voice recording is too large, photo added on its own`);
    }

    const { error: insertError } = await supabaseAdmin.from("stranger_notes").insert({
      number: nextNumber,
      image_url: imageSigned.data.signedUrl,
      audio_url: mediaUrl,
      transcript,
      published: false,
      drive_folder_id: folder.id,
      drive_image_file_id: image.id,
      drive_media_file_id: media?.id ?? null,
      sort_order: nextNumber,
    });
    if (insertError) throw insertError;

    added.push(`${folder.name} as no. ${String(nextNumber).padStart(3, "0")}`);
    nextNumber += 1;
  }

  return { added, skipped, folders: folders.length };
}

export const Route = createFileRoute("/api/public/drive-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("apikey");
        if (!key || key !== process.env["SUPABASE_PUBLISHABLE_KEY"]) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          return Response.json(await runSync());
        } catch (err) {
          console.error("Drive sync failed", err);
          return Response.json(
            { error: err instanceof Error ? err.message : "Sync failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
