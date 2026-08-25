import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Note } from "@/data/notes";

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
      const extractedHandwriting: Record<number, string> = {
        4: "/handwriting/note-004.png",
        5: "/handwriting/note-005.png",
        6: "/handwriting/note-006.png",
        7: "/handwriting/note-007.png",
        8: "/handwriting/note-008.png",
      };


      return {
        id: String(row.number).padStart(3, "0"),
        image: extractedHandwriting[row.number] ?? row.image_url,
        transcript: row.transcript ?? "",
        ...(row.translation ? { translation: row.translation } : {}),
        ...(row.audio_url ? { audioUrl: row.audio_url } : {}),
        ...(row.clip_start !== null ? { clipStart: Number(row.clip_start) } : {}),
        ...(row.clip_end !== null ? { clipEnd: Number(row.clip_end) } : {}),
      };
    });

  },
);
