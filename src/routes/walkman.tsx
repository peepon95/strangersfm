import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notes as builtInNotes } from "@/data/notes";
import type { Note } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";

const heldForReview = new Set(["011", "013", "017", "023"]);

export const Route = createFileRoute("/walkman")({
  head: () => ({
    meta: [
      { title: "The voice archive · stranger fm" },
      {
        name: "description",
        content: "Insert the tape and listen to every voice in the Stranger FM archive.",
      },
      { property: "og:title", content: "The voice archive · stranger fm" },
      {
        property: "og:description",
        content: "A looping cassette player for the voices behind the handwritten notes.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  loader: () => listPublishedNotes(),
  errorComponent: () => (
    <main className="archive-stage flex min-h-screen items-center justify-center px-6 text-center font-type text-ink/60">
      The voice archive is resting. Please try again in a moment.
    </main>
  ),
  component: Walkman,
});

function Walkman() {
  const uploaded = Route.useLoaderData();
  const notes = useMemo(() => [...builtInNotes, ...uploaded], [uploaded]);
  const playableNotes = useMemo(
    () => notes.filter((note) => note.audioUrl && !heldForReview.has(note.id)),
    [notes],
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isInserted, setIsInserted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const activeNote = playableNotes[trackIndex] ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeNote?.audioUrl) return;

    audio.src = activeNote.audioUrl;
    audio.load();
    setProgress(0);

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    }
  }, [activeNote, isPlaying]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !activeNote) return;

    setIsInserted(true);
    setIsPlaying(true);
    void audio.play().catch(() => setIsPlaying(false));
  }, [activeNote]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const next = useCallback(() => {
    if (playableNotes.length === 0) return;
    setTrackIndex((index) => (index + 1) % playableNotes.length);
    setIsPlaying(true);
    setIsInserted(true);
  }, [playableNotes.length]);

  const previous = useCallback(() => {
    if (playableNotes.length === 0) return;
    setTrackIndex((index) => (index - 1 + playableNotes.length) % playableNotes.length);
    setIsPlaying(true);
    setIsInserted(true);
  }, [playableNotes.length]);

  const togglePlayback = () => {
    if (isPlaying) pause();
    else play();
  };

  const updateProgress = () => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  return (
    <main className="walkman-page archive-stage min-h-screen px-4 pb-12 pt-28 sm:px-8">
      <audio ref={audioRef} preload="metadata" onTimeUpdate={updateProgress} onEnded={next} />

      <div className="mx-auto w-full max-w-5xl">
        <header className="walkman-heading">
          <p className="font-type text-[10px] uppercase tracking-[0.28em] text-ink/55 sm:text-xs">
            the voice archive
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="font-type text-4xl tracking-[-0.06em] text-ink sm:text-6xl">
                press play, stay awhile
              </h1>
              <p className="mt-3 max-w-lg font-type text-xs leading-relaxed text-ink/55 sm:text-sm">
                One tape. Every voice. The archive keeps going until you stop it.
              </p>
            </div>
            <p className="font-type text-[10px] uppercase tracking-[0.16em] text-ink/45">
              {playableNotes.length} voices on tape
            </p>
          </div>
        </header>

        <div className="walkman-layout mt-10 sm:mt-14">
          <section className="walkman-deck" aria-label="Stranger FM cassette player">
            <div className="walkman-deck-topline">
              <span>stranger.fm</span>
              <span>{isPlaying ? "playing" : isInserted ? "paused" : "ready"}</span>
            </div>

            <div className={`walkman-cassette-bay ${isInserted ? "is-inserted" : ""}`}>
              <div className="walkman-tape-window" aria-hidden>
                <span
                  className={`walkman-reel walkman-reel--left ${isPlaying ? "is-spinning" : ""}`}
                />
                <span
                  className={`walkman-reel walkman-reel--right ${isPlaying ? "is-spinning" : ""}`}
                />
                <span className="walkman-tape-line" />
              </div>
              <div className="walkman-cassette-label">
                <span>side A</span>
                <strong>{activeNote ? `stranger ${activeNote.id}` : "no tape"}</strong>
                <span>voice notes / 2026</span>
              </div>
            </div>

            <div className="walkman-deck-controls">
              <button type="button" onClick={previous} aria-label="Previous voice">
                <SkipBack aria-hidden />
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                className="walkman-play-button"
                aria-label={isPlaying ? "Pause the voice archive" : "Play the voice archive"}
              >
                {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
              </button>
              <button type="button" onClick={next} aria-label="Next voice">
                <SkipForward aria-hidden />
              </button>
            </div>

            <div className="walkman-progress" aria-label="Current voice progress">
              <span style={{ width: `${progress}%` }} />
            </div>

            <div className="walkman-deck-footer">
              <span className="inline-flex items-center gap-2">
                <Volume2 aria-hidden size={14} />
                {isInserted ? "the tape is rolling" : "insert the tape to begin"}
              </span>
              <button type="button" onClick={play} className="walkman-insert-button">
                {isInserted ? "play tape" : "insert + play"} ↗
              </button>
            </div>
          </section>

          <aside className="walkman-track-list" aria-label="Voice archive track list">
            <div className="flex items-center justify-between border-b border-ink/15 pb-3">
              <p className="font-type text-[10px] uppercase tracking-[0.18em] text-ink/50">
                now on the tape
              </p>
              <span className="font-type text-[10px] text-ink/40">
                {String(trackIndex + 1).padStart(2, "0")} /{" "}
                {String(playableNotes.length).padStart(2, "0")}
              </span>
            </div>

            <ol className="mt-2">
              {playableNotes.map((note: Note, index) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackIndex(index);
                      setIsInserted(true);
                      setIsPlaying(true);
                    }}
                    className={`walkman-track ${index === trackIndex ? "is-active" : ""}`}
                  >
                    <span className="font-type text-[10px] text-ink/40">{note.id}</span>
                    <span className="walkman-track-copy">
                      <strong>{note.translation ?? note.transcript}</strong>
                      <span>
                        {index === trackIndex && isPlaying ? "playing now" : "voice note"}
                      </span>
                    </span>
                    <span aria-hidden>{index === trackIndex && isPlaying ? "•••" : "↗"}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </main>
  );
}
