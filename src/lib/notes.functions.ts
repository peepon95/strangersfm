import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Note } from "@/data/notes";

const extractedHandwriting: Record<number, string> = {
  4: "/handwriting/note-004.png",
  5: "/handwriting/note-005.png",
  6: "/handwriting/note-006.png",
  7: "/handwriting/note-007.png",
  8: "/handwriting/note-008.png",
  9: "/handwriting/note-009.png",
  10: "/handwriting/note-010.png",
  11: "/handwriting/note-011.png",
  12: "/handwriting/note-012.png",
  13: "/handwriting/note-013.png",
  14: "/handwriting/note-014.png",
  15: "/handwriting/note-015.png",
  16: "/handwriting/note-016.png",
  17: "/handwriting/note-017.png",
  18: "/handwriting/note-018.png",
  19: "/handwriting/note-019.png",
  20: "/handwriting/note-020.png",
  21: "/handwriting/note-021.png",
  22: "/handwriting/note-022.png",
  23: "/handwriting/note-023.png",
};

const cleanedAudio: Record<number, string> = {
  4: "/audio/note-004.m4a",
  5: "/audio/note-005.m4a",
  6: "/audio/note-006.m4a",
  7: "/audio/note-007.m4a",
  8: "/audio/note-008.m4a",
  9: "/audio/note-009.m4a",
  10: "/audio/note-010.m4a",
  11: "/audio/note-011.m4a",
  12: "/audio/note-012.m4a",
  13: "/audio/note-013.m4a",
  14: "/audio/note-014.m4a",
  15: "/audio/note-015.m4a",
  16: "/audio/note-016.m4a",
  17: "/audio/note-017.m4a",
  19: "/audio/note-019.m4a",
  22: "/audio/note-022.m4a",
  23: "/audio/note-023.m4a",
};


/** Notes uploaded through the admin page, readable by everyone. */
export const listPublishedNotes = createServerFn({ method: "GET" }).handler(
  async (): Promise<Note[]> => {
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase
      .from("stranger_notes")
      .select("number, image_url, audio_url, transcript, translation, clip_start, clip_end")
      .eq("published", true)
      .order("number", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => {
      const audioUrl = cleanedAudio[row.number] ?? row.audio_url;
      return {
        id: String(row.number).padStart(3, "0"),
        image: extractedHandwriting[row.number] ?? row.image_url,
        transcript: row.transcript ?? "",
        ...(row.translation ? { translation: row.translation } : {}),
        ...(audioUrl ? { audioUrl } : {}),
        ...(!cleanedAudio[row.number] && row.clip_start !== null
          ? { clipStart: Number(row.clip_start) }
          : {}),
        ...(!cleanedAudio[row.number] && row.clip_end !== null
          ? { clipEnd: Number(row.clip_end) }
          : {}),
      };
    });
  },
);
