import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { notes as builtInNotes } from "@/data/notes";
import type { Note } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";

const heldForReview = new Set(["011", "013", "017", "023"]);
const meterBars = Array.from({ length: 12 }, (_, index) => index);

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

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
  const [isShuffling, setIsShuffling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.82);

  const activeNote = playableNotes[trackIndex] ?? null;
  const activeAudioUrl = activeNote?.audioUrl;
  const sideBreak = Math.ceil(playableNotes.length / 2);
  const tapeSide = trackIndex < sideBreak ? "A" : "B";
  const sideTrack = trackIndex < sideBreak ? trackIndex + 1 : trackIndex - sideBreak + 1;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeAudioUrl) return;

    audio.src = activeAudioUrl;
    audio.load();
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, [activeAudioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && isInserted) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [activeAudioUrl, isInserted, isPlaying]);

  const insertAndPlay = useCallback(() => {
    if (!activeNote) return;
    setIsInserted(true);
    setIsPlaying(true);
  }, [activeNote]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const ejectTape = useCallback(() => {
    setIsPlaying(false);
    setIsInserted(false);
  }, []);

  const next = useCallback(() => {
    if (playableNotes.length === 0) return;

    if (isShuffling && playableNotes.length > 1) {
      setTrackIndex((currentIndex) => {
        const offset = 1 + Math.floor(Math.random() * (playableNotes.length - 1));
        return (currentIndex + offset) % playableNotes.length;
      });
    } else {
      setTrackIndex((index) => (index + 1) % playableNotes.length);
    }

    setIsPlaying(true);
    setIsInserted(true);
  }, [isShuffling, playableNotes.length]);

  const previous = useCallback(() => {
    if (playableNotes.length === 0) return;
    setTrackIndex((index) => (index - 1 + playableNotes.length) % playableNotes.length);
    setIsPlaying(true);
    setIsInserted(true);
  }, [playableNotes.length]);

  const togglePlayback = () => {
    if (!isInserted) {
      insertAndPlay();
      return;
    }
    if (isPlaying) pause();
    else setIsPlaying(true);
  };

  const updateProgress = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = (value / 100) * audio.duration;
    setProgress(value);
  };

  const selectTrack = (index: number) => {
    setTrackIndex(index);
    setIsInserted(true);
    setIsPlaying(true);
  };

  return (
    <main className="walkman-page archive-stage min-h-screen px-4 pb-12 pt-28 sm:px-8">
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={updateProgress}
        onLoadedMetadata={updateProgress}
        onEnded={next}
      />

      <div className="mx-auto w-full max-w-6xl">
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
                Insert the tape and let every published voice play, one stranger after another.
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
              <span>stranger.fm voice deck · model 100</span>
              <span className={isPlaying ? "walkman-status-light is-on" : "walkman-status-light"}>
                {isPlaying ? "on air" : isInserted ? "tape loaded" : "standby"}
              </span>
            </div>

            <div className={`walkman-cassette-slot ${isInserted ? "is-inserted" : ""}`}>
              <div className="walkman-slot-mouth" aria-hidden />
              <button
                type="button"
                className="walkman-cassette"
                onClick={isInserted ? togglePlayback : insertAndPlay}
                aria-label={isInserted ? "Play or pause cassette" : "Insert cassette and play"}
              >
                <span className="walkman-cassette-screws" aria-hidden />
                <span className="walkman-tape-window" aria-hidden>
                  <span
                    className={`walkman-reel walkman-reel--left ${isPlaying ? "is-spinning" : ""}`}
                  />
                  <span
                    className={`walkman-reel walkman-reel--right ${isPlaying ? "is-spinning" : ""}`}
                  />
                  <span className="walkman-tape-line" />
                </span>
                <span className="walkman-cassette-label">
                  <span>stranger.fm · side {tapeSide}</span>
                  <strong>{activeNote ? `stranger no. ${activeNote.id}` : "no tape"}</strong>
                  <span>voice archive / track {String(sideTrack).padStart(2, "0")}</span>
                </span>
              </button>
              <span className="walkman-insert-prompt" aria-hidden>
                {isInserted ? "tape engaged" : "press cassette to insert"}
              </span>
            </div>

            <div className="walkman-instrument-panel">
              <div className="walkman-counter" aria-label="Tape counter">
                <span>counter</span>
                <strong>{formatTime(currentTime)}</strong>
                <span>{formatTime(duration)}</span>
              </div>

              <div
                className={`walkman-vu ${isPlaying ? "is-active" : ""}`}
                aria-label="Voice level"
              >
                <span className="walkman-vu-label">voice level</span>
                <div className="walkman-vu-bars" aria-hidden>
                  {meterBars.map((bar) => (
                    <span key={bar} style={{ "--meter-bar": bar } as CSSProperties} />
                  ))}
                </div>
                <span className="walkman-vu-scale">−20 &nbsp; −10 &nbsp; 0 &nbsp; +3</span>
              </div>
            </div>

            <div className="walkman-mechanical-controls">
              <button
                type="button"
                onClick={ejectTape}
                className="walkman-key"
                aria-label="Eject tape"
              >
                <span className="walkman-eject-symbol" aria-hidden>
                  ⏏
                </span>
                <span>eject</span>
              </button>
              <button
                type="button"
                onClick={previous}
                className="walkman-key"
                aria-label="Previous voice"
              >
                <SkipBack aria-hidden />
                <span>rew</span>
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                className={`walkman-key walkman-play-key ${isPlaying ? "is-pressed" : ""}`}
                aria-label={isPlaying ? "Pause the voice archive" : "Play the voice archive"}
              >
                {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
                <span>{isPlaying ? "pause" : "play"}</span>
              </button>
              <button type="button" onClick={next} className="walkman-key" aria-label="Next voice">
                <SkipForward aria-hidden />
                <span>fwd</span>
              </button>
              <button
                type="button"
                onClick={() => setIsShuffling((value) => !value)}
                className={`walkman-key ${isShuffling ? "is-selected" : ""}`}
                aria-label={isShuffling ? "Turn shuffle off" : "Tune into a random stranger"}
                aria-pressed={isShuffling}
              >
                <Shuffle aria-hidden />
                <span>tune</span>
              </button>
            </div>

            <label className="walkman-progress" aria-label="Seek through current voice">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={(event) => seek(Number(event.target.value))}
                style={{ "--tape-progress": `${progress}%` } as CSSProperties}
              />
            </label>

            <div className="walkman-deck-footer">
              <label className="walkman-volume">
                <Volume2 aria-hidden size={14} />
                <span className="sr-only">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  style={{ "--tape-progress": `${volume * 100}%` } as CSSProperties}
                />
              </label>
              <span>{isShuffling ? "tuning into strangers" : "continuous play · side A / B"}</span>
            </div>
          </section>

          <aside className="walkman-archive-panel" aria-label="Voice archive track list">
            <div className="walkman-now-playing">
              <p className="font-type text-[9px] uppercase tracking-[0.18em] text-ink/45">
                {isPlaying ? "now playing" : isInserted ? "tape paused" : "waiting to be heard"}
              </p>
              {activeNote ? (
                <>
                  <div className="walkman-note-preview">
                    <img
                      src={activeNote.image}
                      alt={`Handwritten note from stranger ${activeNote.id}`}
                    />
                  </div>
                  <blockquote>“{activeNote.translation ?? activeNote.transcript}”</blockquote>
                  <p>stranger no. {activeNote.id}</p>
                </>
              ) : null}
            </div>

            <div className="walkman-track-list">
              <div className="flex items-center justify-between border-b border-ink/15 pb-3">
                <p className="font-type text-[10px] uppercase tracking-[0.18em] text-ink/50">
                  tape directory
                </p>
                <span className="font-type text-[10px] text-ink/40">
                  {String(trackIndex + 1).padStart(2, "0")} /
                  {String(playableNotes.length).padStart(2, "0")}
                </span>
              </div>

              <ol className="mt-2">
                {playableNotes.map((note: Note, index) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => selectTrack(index)}
                      className={`walkman-track ${index === trackIndex ? "is-active" : ""}`}
                    >
                      <span className="font-type text-[10px] text-ink/40">{note.id}</span>
                      <span className="walkman-track-copy">
                        <strong>{note.translation ?? note.transcript}</strong>
                        <span>
                          side {index < sideBreak ? "A" : "B"} · track{" "}
                          {String(index < sideBreak ? index + 1 : index - sideBreak + 1).padStart(
                            2,
                            "0",
                          )}
                        </span>
                      </span>
                      <span aria-hidden>{index === trackIndex && isPlaying ? "•••" : "↗"}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
