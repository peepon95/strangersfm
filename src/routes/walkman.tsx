import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { duckMusic } from "@/components/BackgroundMusic";
import { notes as builtInNotes, TOTAL_GOAL } from "@/data/notes";
import type { Note } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";
import "./voice-recorder.css";

const heldForReview = new Set(["011", "013", "017"]);
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
  component: WalkmanRoute,
});

function WalkmanRoute() {
  return <VoiceArchive uploaded={Route.useLoaderData()} />;
}

export function VoiceArchive({ uploaded }: { uploaded: Note[] }) {
  const notes = useMemo(() => [...builtInNotes, ...uploaded], [uploaded]);
  /** The note that always opens the tape. */
  const OPENING_NOTE = "006";
  const orderedNotes = useMemo(() => {
    const playable = notes.filter((note) => note.audioUrl && !heldForReview.has(note.id));
    const opener = playable.filter((note) => note.id === OPENING_NOTE);
    return [...opener, ...playable.filter((note) => note.id !== OPENING_NOTE)];
  }, [notes]);
  /** Shuffled after mount so the running order changes on every visit. */
  const [playableNotes, setPlayableNotes] = useState<Note[]>(orderedNotes);

  useEffect(() => {
    const rest = orderedNotes.slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j]!, rest[i]!];
    }
    setPlayableNotes([...orderedNotes.slice(0, 1), ...rest]);
  }, [orderedNotes]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isInserted, setIsInserted] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const insertionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundContext = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.82);

  useEffect(
    () => () => {
      if (insertionTimer.current) clearTimeout(insertionTimer.current);
      void soundContext.current?.close();
    },
    [],
  );

  const mechanicalSound = useCallback(
    (inserting: boolean) => {
      try {
        const context = soundContext.current ?? new AudioContext();
        soundContext.current = context;
        void context.resume();
        // Short filtered noise bursts: cassette slide, latch, then the play key.
        const bursts: Array<[number, number, number]> = inserting
          ? [
              [0, 0.24, 0.035],
              [0.58, 0.065, 0.12],
              [0.82, 0.035, 0.09],
            ]
          : [[0, 0.06, 0.1]];

        for (const [delay, duration, level] of bursts) {
          const buffer = context.createBuffer(
            1,
            Math.ceil(context.sampleRate * duration),
            context.sampleRate,
          );
          const samples = buffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++)
            samples[i] = (Math.random() * 2 - 1) * Math.exp((-5 * i) / samples.length);
          const source = context.createBufferSource();
          source.buffer = buffer;
          const filter = context.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = duration > 0.1 ? 900 : 2400;
          const gain = context.createGain();
          gain.gain.value = level * volume;
          source.connect(filter).connect(gain).connect(context.destination);
          source.onended = () => {
            source.disconnect();
            filter.disconnect();
            gain.disconnect();
          };
          source.start(context.currentTime + delay);
        }
      } catch {
        /* Audio feedback is optional when Web Audio is unavailable. */
      }
    },
    [volume],
  );

  const activeNote = playableNotes[trackIndex] ?? null;
  const activeAudioUrl = activeNote?.audioUrl;
  const trackNumber = trackIndex + 1;

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

  useEffect(() => {
    duckMusic(isPlaying && isInserted);
    return () => duckMusic(false);
  }, [isInserted, isPlaying]);

  const insertAndPlay = useCallback(() => {
    if (!activeNote || isInserting) return;
    if (isInserted) {
      setIsPlaying(true);
      return;
    }
    mechanicalSound(true);
    setIsInserting(true);
    insertionTimer.current = setTimeout(() => {
      setIsInserted(true);
      setIsInserting(false);
      setIsPlaying(true);
      insertionTimer.current = null;
    }, 1100);
  }, [activeNote, isInserting, isInserted, mechanicalSound]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const ejectTape = useCallback(() => {
    if (insertionTimer.current) clearTimeout(insertionTimer.current);
    insertionTimer.current = null;
    setIsInserting(false);
    mechanicalSound(false);
    setIsPlaying(false);
    setIsInserted(false);
  }, [mechanicalSound]);

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

    insertAndPlay();
  }, [isShuffling, playableNotes.length, insertAndPlay]);

  const previous = useCallback(() => {
    if (playableNotes.length === 0) return;
    setTrackIndex((index) => (index - 1 + playableNotes.length) % playableNotes.length);
    insertAndPlay();
  }, [playableNotes.length, insertAndPlay]);

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
    insertAndPlay();
  };

  return (
    <main className="walkman-page archive-stage min-h-screen px-4 pb-12 pt-28 sm:px-8">
      <audio
        ref={audioRef}
        preload="metadata"
        onPlaying={() => setIsRolling(true)}
        onPause={() => setIsRolling(false)}
        onWaiting={() => setIsRolling(false)}
        onEmptied={() => setIsRolling(false)}
        onError={() => {
          setIsRolling(false);
          setIsPlaying(false);
        }}
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
                100 strangers. one handwritten message each.
              </h1>
              <p className="mt-3 max-w-lg font-type text-xs leading-relaxed text-ink/55 sm:text-sm">
                Preserved in their own voice. Insert the tape and listen, one stranger after
                another.
              </p>
            </div>
            <p className="font-type text-[10px] uppercase tracking-[0.16em] text-ink/45">
              {notes.length} / {TOTAL_GOAL} notes
              <span className="block mt-2 normal-case tracking-normal">
                {playableNotes.length} voices on tape
              </span>
            </p>
          </div>
        </header>

        <div className="walkman-layout mt-10 sm:mt-14">
          <section
            className={`walkman-deck silver-recorder ${isRolling ? "is-rolling" : ""}`}
            aria-label="Stranger FM cassette player"
          >
            <div className="recorder-speaker" aria-hidden="true" />
            <span className="recorder-brand" aria-hidden="true">
              stranger.fm
            </span>
            <span className="recorder-model" aria-hidden="true">
              MICROCASSETTE RECORDER
            </span>
            <div className="walkman-deck-topline">
              <span>MC · 100</span>
              <span className={isRolling ? "walkman-status-light is-on" : "walkman-status-light"}>
                {isRolling ? "PLAY" : "READY"}
              </span>
            </div>

            <div
              className={`walkman-cassette-slot ${isInserted ? "is-inserted" : ""} ${isInserting ? "is-inserting" : ""}`}
            >
              <button
                className="recorder-loose-tape"
                type="button"
                disabled={isInserting || isInserted}
                onClick={insertAndPlay}
                aria-label="Insert tape and play"
                aria-hidden={isInserted}
              >
                <span className="loose-tape-screws" aria-hidden />
                <span className="loose-tape-edge" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
                <span className="loose-tape-reels" aria-hidden="true">
                  <i />
                  <i />
                </span>
                <span className="loose-tape-label">
                  <span>STRANGER.FM · NORMAL POSITION</span>
                  <b>
                    VOICE {activeNote?.id ?? "000"} · TRACK {String(trackNumber).padStart(2, "0")}
                  </b>
                </span>
                <span className="loose-tape-caption">
                  {isInserting ? "loading…" : "press to insert"}
                </span>
              </button>
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
                    className={`walkman-reel walkman-reel--left ${isRolling ? "is-spinning" : ""}`}
                  />
                  <span
                    className={`walkman-reel walkman-reel--right ${isRolling ? "is-spinning" : ""}`}
                  />
                  <span className="walkman-tape-line" />
                  <span className="recorder-tape-type">MC 60</span>
                </span>
                <span className="walkman-cassette-label">
                  <span>stranger.fm</span>
                  <strong>
                    {activeNote ? `a little kindness · no. ${activeNote.id}` : "no tape"}
                  </strong>
                  <span>voice archive / track {String(trackNumber).padStart(2, "0")}</span>
                </span>
              </button>
              <span className="walkman-insert-prompt" aria-hidden>
                {isInserting
                  ? "inserting tape…"
                  : isInserted
                    ? "press play to listen"
                    : "press the tape to insert + play"}
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
              <span>{isShuffling ? "tuning into strangers" : "continuous play · all tracks"}</span>
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
                      <span
                        className={`directory-cassette ${index % 2 === 0 ? "is-clear" : "is-dark"}`}
                        aria-hidden="true"
                      >
                        <span className="directory-cassette-reels">
                          <i />
                          <i />
                        </span>
                        <b>SFM {note.id}</b>
                      </span>
                      <span className="walkman-track-copy">
                        <strong>{note.translation ?? note.transcript}</strong>
                        <span>
                          track {String(index + 1).padStart(2, "0")}
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
