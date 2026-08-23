import note1 from "@/assets/note-1.png";
import note2 from "@/assets/note-2.png";
import note3 from "@/assets/note-3.png";

export type Note = {
  id: string;
  /** Snapshot of the handwriting, background removed. */
  image: string;
  /** Typed version of the handwriting, for accessibility + search. */
  transcript: string;
  /** First name (or blank to stay anonymous). */
  name?: string;
  place?: string;
  /** Video of them saying the words. */
  videoUrl?: string;
  posterUrl?: string;
};

export const TOTAL_GOAL = 100;

export const notes: Note[] = [
  {
    id: "001",
    image: note1,
    transcript: "Be gentle with yourself, you're doing better than you think",
    name: "Placeholder",
  },
  {
    id: "002",
    image: note2,
    transcript: "Call your mother today. Not tomorrow.",
    name: "Placeholder",
  },
  {
    id: "003",
    image: note3,
    transcript: "The world is not as scary as the news says. Go outside.",
    name: "Placeholder",
  },
];
