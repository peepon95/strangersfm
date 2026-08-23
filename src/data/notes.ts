import noteRoslan from "@/assets/note-roslan.png.asset.json";
import noteLady from "@/assets/note-lady.png.asset.json";
import noteKappi from "@/assets/note-kappi.png.asset.json";
import videoRoslan from "@/assets/video-roslan.mp4.asset.json";
import videoLady from "@/assets/video-lady.mp4.asset.json";
import videoKappi from "@/assets/video-kappi.mp4.asset.json";
import posterRoslan from "@/assets/poster-roslan.jpg.asset.json";
import posterLady from "@/assets/poster-lady.jpg.asset.json";
import posterKappi from "@/assets/poster-kappi.jpg.asset.json";

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
  /** Video of them saying the words. */
  videoUrl?: string;
  posterUrl?: string;
};

export const TOTAL_GOAL = 100;

export const notes: Note[] = [
  {
    id: "001",
    image: noteRoslan.url,
    transcript: "Cari kekuatan diri, dan usahakan kekuatan itu hingga berjaya.",
    translation: "Find your own strength, and work at that strength until you succeed.",
    name: "Uncle Roslan",
    videoUrl: videoRoslan.url,
    posterUrl: posterRoslan.url,
  },
  {
    id: "002",
    image: noteLady.url,
    transcript: "Tetap berlaku jujur dan semangat untuk majukan diri anda.",
    translation: "Stay honest, and keep the fire to better yourself.",
    name: "The Lady Picker",
    videoUrl: videoLady.url,
    posterUrl: posterLady.url,
  },
  {
    id: "003",
    image: noteKappi.url,
    transcript: "Don't worry, drink coffee.",
    name: "Kappidays",
    videoUrl: videoKappi.url,
    posterUrl: posterKappi.url,
  },
];
