export type Note = {
  id: string;
  /** Snapshot of the handwriting, background removed. */
  image: string;
  /** Typed version of the handwriting, for accessibility + search. */
  transcript: string;
  /** English reading, when the note is written in another language. */
  translation?: string;
  /** First name (or blank to stay anonymous). */
  name?: string;
  place?: string;
  /** Their voice saying the words. */
  audioUrl?: string;
  /** Play only this stretch of the recording, in seconds. */
  clipStart?: number;
  clipEnd?: number;
};

export const TOTAL_GOAL = 100;

export const notes: Note[] = [
  {
    id: "001",
    image: "/handwriting/note-001.png",
    transcript: "Cari kekuatan diri, dan usahakan kekuatan itu hingga berjaya.",
    translation: "Find your own strength, and work at that strength until you succeed.",
    audioUrl: "/audio/note-001.m4a",
  },
  {
    id: "002",
    image: "/handwriting/note-002.png",
    transcript: "Tetap berlaku jujur dan semangat untuk majukan diri anda.",
    translation: "Stay honest, and keep the fire to better yourself.",
    audioUrl: "/audio/note-002.m4a",
  },
  {
    id: "003",
    image: "/handwriting/note-003.png",
    transcript: "Don't worry, drink coffee.",
    audioUrl: "/audio/note-003.m4a",
  },
];
