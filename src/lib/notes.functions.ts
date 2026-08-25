import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Note } from "@/data/notes";
import note004 from "@/assets/note-004-handwriting.jpg.asset.json";
import note005 from "@/assets/note-005-handwriting.jpg.asset.json";
import note007 from "@/assets/note-007-handwriting.jpg.asset.json";
import note009 from "@/assets/note-009-handwriting.jpg.asset.json";

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
        4: note004.url,
        5: note005.url,
        7: note007.url,
        9: note009.url,
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
