import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Grid3X3,
  Image as ImageIcon,
  Pause,
  Phone,
  PhoneCall,
  PhoneOff,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notes as builtInNotes } from "@/data/notes";
import type { Note } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";

type LineState = "incoming" | "menu" | "connecting" | "ready" | "playing" | "paused";
type CategoryId = "1" | "2" | "0";

const categories: Array<{
  id: CategoryId;
  shortTitle: string;
  title: string;
  noteIds: string[];
}> = [
  {
    id: "1",
    shortTitle: "begin",
    title: "a push to begin",
    noteIds: ["001", "006", "009", "016", "022"],
  },
  {
    id: "2",
    shortTitle: "comfort",
    title: "comfort for a heavy day",
    noteIds: ["003", "004", "006", "019"],
  },
  {
    id: "0",
    shortTitle: "surprise",
    title: "let the line choose",
    noteIds: [],
  },
];

const keypadKeys = [
  { key: "1", letters: "" },
  { key: "2", letters: "ABC" },
  { key: "3", letters: "DEF" },
  { key: "4", letters: "GHI" },
  { key: "5", letters: "JKL" },
  { key: "6", letters: "MNO" },
  { key: "7", letters: "PQRS" },
  { key: "8", letters: "TUV" },
  { key: "9", letters: "WXYZ" },
  { key: "*", letters: "" },
  { key: "0", letters: "+" },
  { key: "#", letters: "" },
];

const heldForReview = new Set(["011", "013", "017", "023"]);

export const Route = createFileRoute("/hotline")({
  head: () => ({
    meta: [
      { title: "The listening line · stranger fm" },
      {
        name: "description",
        content: "Answer the Stranger FM listening line and hear a message from a stranger.",
      },
      { property: "og:title", content: "The listening line · stranger fm" },
      {
        property: "og:description",
        content: "Choose what you need today, then stay on the line for another voice.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  loader: () => listPublishedNotes(),
  errorComponent: () => (
    <main className="archive-stage flex min-h-screen items-center justify-center px-6 text-center font-type text-ink/60">
      The listening line is resting. Please try again in a moment.
    </main>
  ),
  component: Hotline,
});

function Hotline() {
  const uploaded = Route.useLoaderData();
  const notes = useMemo(() => [...builtInNotes, ...uploaded], [uploaded]);
  const reduceMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const menuAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousNote = useRef<string | null>(null);
  const [lineState, setLineState] = useState<LineState>("incoming");
  const [selected, setSelected] = useState<Note | null>(null);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [menuPromptPlaying, setMenuPromptPlaying] = useState(false);

  const playableNotes = useMemo(
    () => notes.filter((note) => note.audioUrl && !heldForReview.has(note.id)),
    [notes],
  );

  const playSelected = useCallback((note: Note) => {
    const audio = audioRef.current;
    if (!audio || !note.audioUrl) return;

    audio.src = note.audioUrl;
    audio.load();
    setProgress(0);
    setElapsed(0);
    setShowNote(false);
    setLineState("connecting");

    const begin = () => {
      audio.currentTime = note.clipStart ?? 0;
      void audio.play().then(
        () => setLineState("playing"),
        () => setLineState("ready"),
      );
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) begin();
    else audio.addEventListener("loadedmetadata", begin, { once: true });
  }, []);

  const chooseCategory = useCallback(
    (categoryId: CategoryId) => {
      menuAudioRef.current?.pause();
      setMenuPromptPlaying(false);

      const definition = categories.find((item) => item.id === categoryId);
      let pool =
        categoryId === "0"
          ? playableNotes
          : playableNotes.filter((note) => definition?.noteIds.includes(note.id));

      const withoutRepeat = pool.filter((note) => note.id !== previousNote.current);
      if (withoutRepeat.length > 0) pool = withoutRepeat;
      if (pool.length === 0) return;

      const note = pool[Math.floor(Math.random() * pool.length)];
      previousNote.current = note.id;
      setCategory(categoryId);
      setSelected(note);
      playSelected(note);
    },
    [playSelected, playableNotes],
  );

  useEffect(() => {
    if (lineState !== "menu") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (categories.some((item) => item.id === event.key)) {
        chooseCategory(event.key as CategoryId);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chooseCategory, lineState]);

  function playMenuPrompt() {
    const prompt = menuAudioRef.current;
    if (!prompt) return;

    prompt.currentTime = 0;
    prompt.muted = false;
    prompt.volume = 1;
    void prompt.play().catch(() => setMenuPromptPlaying(false));
  }

  function answerCall() {
    setLineState("menu");
    playMenuPrompt();
  }

  function resumeAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play().then(
      () => setLineState("playing"),
      () => setLineState("ready"),
    );
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) resumeAudio();
    else {
      audio.pause();
      setLineState("paused");
    }
  }

  function replay() {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    audio.currentTime = selected.clipStart ?? 0;
    setProgress(0);
    setElapsed(0);
    resumeAudio();
  }

  function playNext() {
    chooseCategory(category ?? "0");
  }

  function returnToMenu() {
    audioRef.current?.pause();
    setShowNote(false);
    setLineState("menu");
    playMenuPrompt();
  }

  function hangUp() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (menuAudioRef.current) {
      menuAudioRef.current.pause();
      menuAudioRef.current.currentTime = 0;
    }
    setMenuPromptPlaying(false);
    setSelected(null);
    setCategory(null);
    setProgress(0);
    setElapsed(0);
    setShowNote(false);
    setLineState("incoming");
  }

  function updateProgress() {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) return;

    const start = selected?.clipStart ?? 0;
    const end = selected?.clipEnd ?? audio.duration;
    const span = Math.max(end - start, 0.1);
    const played = Math.max(0, audio.currentTime - start);
    setElapsed(played);
    setProgress(Math.min(100, Math.max(0, (played / span) * 100)));

    if (selected?.clipEnd !== undefined && audio.currentTime >= selected.clipEnd) {
      audio.pause();
      playNext();
    }
  }

  const activeCategory = categories.find((item) => item.id === category);
  const isMessageView = ["connecting", "ready", "playing", "paused"].includes(lineState);
  const callTime = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(
    Math.floor(elapsed % 60),
  ).padStart(2, "0")}`;

  return (
    <main className="hotline-page archive-stage min-h-screen px-3 pb-8 pt-24 sm:px-8 sm:pb-12 sm:pt-28">
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={updateProgress}
        onEnded={playNext}
        onError={() => setLineState("ready")}
      />
      <audio
        ref={menuAudioRef}
        src="/audio/hotline-menu.m4a"
        preload="auto"
        onPlay={() => setMenuPromptPlaying(true)}
        onPause={() => setMenuPromptPlaying(false)}
        onEnded={() => setMenuPromptPlaying(false)}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <div className="iphone-call-shell">
          <div className="iphone-call-grain" aria-hidden />
          {selected && isMessageView ? (
            <div
              className="iphone-call-wallpaper"
              style={{ backgroundImage: `url(${selected.image})` }}
              aria-hidden
            />
          ) : null}
          <div className="iphone-call-shade" aria-hidden />

          <div className="iphone-status-bar" aria-hidden>
            <span>stranger.fm</span>
            <span className="iphone-dynamic-island" />
            <span>web call</span>
          </div>

          <AnimatePresence mode="wait">
            {lineState === "incoming" ? (
              <motion.section
                key="incoming"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                className="iphone-call-screen iphone-incoming-screen"
                aria-label="Incoming call from Stranger FM"
              >
                <div className="iphone-caller-copy">
                  <p className="iphone-call-kicker font-type">incoming voice</p>
                  <h1 className="iphone-caller-name">stranger.fm</h1>
                  <p className="iphone-call-subtitle">answer to hear the message menu</p>
                </div>

                <motion.div
                  aria-hidden
                  className="iphone-incoming-mark"
                  animate={reduceMotion ? undefined : { scale: [1, 1.06, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PhoneCall strokeWidth={1.25} />
                </motion.div>

                <div className="iphone-incoming-actions">
                  <Link to="/" className="iphone-action-stack">
                    <span className="iphone-round-action iphone-round-action--decline">
                      <PhoneOff aria-hidden />
                    </span>
                    <span>not now</span>
                  </Link>
                  <button type="button" onClick={answerCall} className="iphone-action-stack">
                    <span className="iphone-round-action iphone-round-action--answer">
                      <Phone aria-hidden />
                    </span>
                    <span>answer</span>
                  </button>
                </div>
              </motion.section>
            ) : lineState === "menu" ? (
              <motion.section
                key="menu"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="iphone-call-screen iphone-keypad-screen"
                aria-label="Choose a message category"
              >
                <div className="iphone-caller-copy iphone-caller-copy--compact">
                  <p className="iphone-call-kicker font-type">connected</p>
                  <h1 className="iphone-caller-name iphone-caller-name--small">
                    choose what you need
                  </h1>
                  <p className="iphone-call-subtitle">tap 1, 2, or 0</p>
                </div>

                <button
                  type="button"
                  className={`iphone-voicemail-prompt ${menuPromptPlaying ? "is-playing" : ""}`}
                  onClick={playMenuPrompt}
                  aria-label={
                    menuPromptPlaying
                      ? "Replay voicemail instructions"
                      : "Play voicemail instructions"
                  }
                >
                  <Volume2 aria-hidden />
                  <span>
                    {menuPromptPlaying
                      ? "voicemail instructions playing…"
                      : "play voicemail instructions"}
                  </span>
                </button>

                <div className="iphone-number-pad" aria-label="Voicemail keypad">
                  {keypadKeys.map((keypadKey) => {
                    const choice = categories.find((item) => item.id === keypadKey.key);

                    return (
                      <button
                        key={keypadKey.key}
                        type="button"
                        onClick={() => choice && chooseCategory(choice.id)}
                        className={`iphone-number-key ${choice ? "is-choice" : ""}`}
                        aria-label={
                          choice ? `Press ${choice.id} for ${choice.title}` : keypadKey.key
                        }
                        disabled={!choice}
                      >
                        <span className="iphone-number-circle">
                          <span className="iphone-number-digit">{keypadKey.key}</span>
                          {keypadKey.letters ? (
                            <span className="iphone-number-letters">{keypadKey.letters}</span>
                          ) : null}
                        </span>
                        <span className="iphone-number-category">{choice?.shortTitle ?? ""}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={hangUp}
                  className="iphone-hangup-button"
                  aria-label="Hang up"
                >
                  <PhoneOff aria-hidden />
                </button>
              </motion.section>
            ) : isMessageView && selected ? (
              <motion.section
                key={`voice-${selected.id}`}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="iphone-call-screen iphone-active-screen"
                aria-label={`Playing a message from stranger number ${selected.id}`}
              >
                <div className="iphone-caller-copy iphone-caller-copy--active">
                  <p className="iphone-call-kicker font-type">
                    {activeCategory?.title ?? "the listening line"}
                  </p>
                  <h1 className="iphone-caller-name iphone-caller-name--active">
                    stranger {selected.id}
                  </h1>
                  <p className="iphone-call-timer" aria-label={`${callTime} elapsed`}>
                    {lineState === "connecting"
                      ? "connecting…"
                      : lineState === "ready"
                        ? "tap play to listen"
                        : callTime}
                  </p>
                </div>

                <div className="iphone-call-progress" aria-hidden>
                  <span style={{ width: `${progress}%` }} />
                </div>

                <div className="iphone-call-controls">
                  <button type="button" onClick={togglePlayback} className="iphone-control">
                    <span className="iphone-control-circle">
                      {lineState === "playing" ? <Pause aria-hidden /> : <Play aria-hidden />}
                    </span>
                    <span>{lineState === "playing" ? "pause" : "play"}</span>
                  </button>
                  <button type="button" onClick={returnToMenu} className="iphone-control">
                    <span className="iphone-control-circle">
                      <Grid3X3 aria-hidden />
                    </span>
                    <span>keypad</span>
                  </button>
                  <button type="button" onClick={playNext} className="iphone-control">
                    <span className="iphone-control-circle">
                      <SkipForward aria-hidden />
                    </span>
                    <span>next</span>
                  </button>
                  <button type="button" onClick={replay} className="iphone-control">
                    <span className="iphone-control-circle">
                      <RotateCcw aria-hidden />
                    </span>
                    <span>replay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNote((visible) => !visible)}
                    className="iphone-control"
                    aria-pressed={showNote}
                  >
                    <span className={`iphone-control-circle ${showNote ? "is-active" : ""}`}>
                      <ImageIcon aria-hidden />
                    </span>
                    <span>the note</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showNote ? (
                    <motion.figure
                      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 18 }}
                      className="iphone-note-peek"
                    >
                      <button
                        type="button"
                        onClick={() => setShowNote(false)}
                        className="iphone-note-close font-type"
                      >
                        close
                      </button>
                      <img src={selected.image} alt={selected.transcript} />
                      <figcaption className="sr-only">{selected.transcript}</figcaption>
                    </motion.figure>
                  ) : null}
                </AnimatePresence>

                <div className="iphone-active-footer">
                  <p className="font-type">the next voice will play automatically</p>
                  <button
                    type="button"
                    onClick={hangUp}
                    className="iphone-hangup-button"
                    aria-label="Hang up"
                  >
                    <PhoneOff aria-hidden />
                  </button>
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-5 flex w-full max-w-[430px] items-start justify-between gap-5 font-type text-[10px] leading-relaxed text-ink/45">
          <p>Real voices from the Stranger FM archive.</p>
          <Link to="/" className="shrink-0 border-b border-current pb-0.5 uppercase">
            back to letters
          </Link>
        </div>
      </div>
    </main>
  );
}
