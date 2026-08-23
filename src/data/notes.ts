import noteRoslan from "@/assets/note-roslan.png.asset.json";
import noteLady from "@/assets/note-lady.png.asset.json";
import noteKappi from "@/assets/note-kappi.png.asset.json";
import audioRoslan from "@/assets/audio-roslan.mp3.asset.json";
import audioLady from "@/assets/audio-lady.mp3.asset.json";
import audioKappi from "@/assets/audio-kappi.mp3.asset.json";

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
};

export const TOTAL_GOAL = 100;

export const notes: Note[] = [
  {
    id: "001",
    image: noteRoslan.url,
    transcript: "Cari kekuatan diri, dan usahakan kekuatan itu hingga berjaya.",
    translation: "Find your own strength, and work at that strength until you succeed.",
    audioUrl: audioRoslan.url,
  },
  {
    id: "002",
    image: noteLady.url,
    transcript: "Tetap berlaku jujur dan semangat untuk majukan diri anda.",
    translation: "Stay honest, and keep the fire to better yourself.",
    audioUrl: audioLady.url,
  },
  {
    id: "003",
    image: noteKappi.url,
    transcript: "Don't worry, drink coffee.",
    audioUrl: audioKappi.url,
  },
];
