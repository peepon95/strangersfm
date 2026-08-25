import { createFileRoute } from "@tanstack/react-router";

/** The Drive folder that holds one subfolder per stranger. */
const DRIVE_ROOT_FOLDER_ID = "1wYoQH8ojQImRNnYd9Bm9aoN4yEi_avgR";
const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
/** Ten years, so the links on the site never quietly die. */
const LINK_LIFETIME = 60 * 60 * 24 * 365 * 10;
/** Anything bigger than this is skipped rather than pulled into memory. */
const MAX_BYTES = 45 * 1024 * 1024;

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
};

function driveHeaders() {
  return {
    Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
    "X-Connection-Api-Key": `${process.env["GOOGLE_DRIVE_API_KEY"]}`,
  };
}

async function driveList(query: string): Promise<DriveFile[]> {
  const url =
    `${GATEWAY}/files?q=${encodeURIComponent(query)}` +
    `&fields=${encodeURIComponent("files(id,name,mimeType,size,thumbnailLink)")}` +
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

/** Copy a big file across without ever holding all of it in memory. */
async function streamToStorage(
  admin: { storage: { from: (b: string) => any } },
  fileId: string,
  path: string,
  contentType: string,
) {
  const src = await fetch(`${GATEWAY}/files/${fileId}?alt=media`, { headers: driveHeaders() });
  if (!src.ok || !src.body) {
    throw new Error(`Drive download failed [${src.status}]`);
  }
  const up = await admin.storage
    .from("note-media")
    .upload(path, src.body, { contentType, upsert: true, duplex: "half" });
  if (up.error) throw up.error;
}

/** Drive renders a JPEG preview of every HEIC, ask it for the biggest one. */
async function driveJpeg(file: DriveFile): Promise<ArrayBuffer | null> {
  let link = file.thumbnailLink;
  if (!link) {
    const res = await fetch(`${GATEWAY}/files/${file.id}?fields=thumbnailLink`, {
      headers: driveHeaders(),
    });
    if (!res.ok) return null;
    link = ((await res.json()) as { thumbnailLink?: string }).thumbnailLink;
  }
  if (!link) return null;
  const big = link.replace(/=s\d+(-[a-z]+)?$/i, "=s2048");
  const img = await fetch(big);
  if (!img.ok) return null;
  return img.arrayBuffer();
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
    const isHeic = /hei[cf]/i.test(image.mimeType) || /\.hei[cf]$/i.test(image.name);
    if (Number(image.size ?? 0) > MAX_BYTES && !isHeic) {
      skipped.push(`${folder.name}: photo is too large`);
      continue;
    }

    /** Browsers cannot show HEIC, so use the JPEG Drive already renders for it. */
    let imageBytes: ArrayBuffer;
    let imageType = image.mimeType;
    let imageExt = extensionFor(image.name, "jpg");
    if (isHeic) {
      const jpeg = await driveJpeg(image);
      if (!jpeg) {
        skipped.push(
          `${folder.name}: the photo is HEIC and Drive has no preview for it yet, export it as JPEG`,
        );
        continue;
      }
      imageBytes = jpeg;
      imageType = "image/jpeg";
      imageExt = "jpg";
    } else {
      imageBytes = await driveDownload(image.id);
    }

    const imagePath = `drive/${folder.id}/photo.${imageExt}`;
    const imageUpload = await supabaseAdmin.storage
      .from("note-media")
      .upload(imagePath, imageBytes, { contentType: imageType, upsert: true });
    if (imageUpload.error) throw imageUpload.error;
    const imageSigned = await supabaseAdmin.storage
      .from("note-media")
      .createSignedUrl(imagePath, LINK_LIFETIME);
    if (imageSigned.error || !imageSigned.data) {
      throw imageSigned.error ?? new Error("Could not link the photo");
    }

    let mediaUrl: string | null = null;
    let transcript = "";

    /** iPhone .MOV is an MP4 box underneath, so relabel it and everything can play it. */
    const isMov = media ? /quicktime/i.test(media.mimeType) || /\.mov$/i.test(media.name) : false;

    if (media && /x-msvideo/i.test(media.mimeType)) {
      skipped.push(
        `${folder.name}: the recording is an .AVI, save it as MP4 or M4A and it will come in`,
      );
    } else if (media) {
      const mediaType = isMov ? "video/mp4" : media.mimeType;
      const mediaName = isMov ? media.name.replace(/\.mov$/i, ".mp4") : media.name;
      const mediaPath = `drive/${folder.id}/voice.${extensionFor(mediaName, "mp4")}`;
      const big = Number(media.size ?? 0) > MAX_BYTES;

      /** Long recordings are poured straight through so nothing has to be trimmed first. */
      let mediaBytes: ArrayBuffer | null = null;
      if (big) {
        await streamToStorage(supabaseAdmin, media.id, mediaPath, mediaType);
        skipped.push(
          `${folder.name}: the recording is long, so the words were not typed out for you`,
        );
      } else {
        mediaBytes = await driveDownload(media.id);
        const mediaUpload = await supabaseAdmin.storage
          .from("note-media")
          .upload(mediaPath, mediaBytes, { contentType: mediaType, upsert: true });
        if (mediaUpload.error) throw mediaUpload.error;
      }

      const mediaSigned = await supabaseAdmin.storage
        .from("note-media")
        .createSignedUrl(mediaPath, LINK_LIFETIME);
      if (mediaSigned.error || !mediaSigned.data) {
        throw mediaSigned.error ?? new Error("Could not link the voice");
      }
      mediaUrl = mediaSigned.data.signedUrl;
      if (mediaBytes) {
        try {
          transcript = await transcribe(mediaBytes, mediaName, mediaType);
        } catch (err) {
          console.error("Transcription error", err);
        }
      }
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
