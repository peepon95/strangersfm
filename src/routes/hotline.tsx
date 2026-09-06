import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Phone, PhoneCall, PhoneOff, RotateCcw, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { notes as builtInNotes } from "@/data/notes";
import type { Note } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";

type LineState = "idle" | "menu" | "connecting" | "ready" | "playing" | "ended";
type CategoryId = "1" | "2" | "3" | "4" | "0";

const categories: Array<{
  id: CategoryId;
  title: string;
  prompt: string;
  noteIds: string[];
}> = [
  {
    id: "1",
    title: "a push to begin",
    prompt: "when you need a little courage to start",
    noteIds: ["001", "006", "009", "016", "022"],
  },
  {
    id: "2",
    title: "comfort for a heavy day",
    prompt: "when today is asking a lot of you",
    noteIds: ["003", "004", "006", "019"],
  },
  {
    id: "3",
    title: "remember your worth",
    prompt: "when you need to come back to yourself",
    noteIds: ["002", "005", "007", "008", "012", "015"],
  },
  {
    id: "4",
    title: "a different perspective",
    prompt: "when your thoughts need a little more room",
    noteIds: ["010", "014", "019"],
  },
];

const heldForReview = new Set(["011", "013", "017", "023"]);

export const Route = createFileRoute("/hotline")({
  head: () => ({
    meta: [
      { title: "The listening line · stranger fm" },
      {
        name: "description",
        content: "Call the Stranger FM listening line and hear a message recorded by a stranger.",
      },
      { property: "og:title", content: "The listening line · stranger fm" },
      {
        property: "og:description",
        content: "Choose what you need today, then hear a stranger's voice.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  loader: () => listPublishedNotes(),
  errorComponent: () => (
    <main className="hotline-stage flex min-h-screen items-center justify-center px-6 text-center font-type text-[#f2eee3]">
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
  const previousNote = useRef<string | null>(null);
  const [lineState, setLineState] = useState<LineState>("idle");
  const [selected, setSelected] = useState<Note | null>(null);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [progress, setProgress] = useState(0);

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
      if (["0", "1", "2", "3", "4"].includes(event.key)) {
        chooseCategory(event.key as CategoryId);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chooseCategory, lineState]);

  function beginCall() {
    setLineState("menu");
  }

  function resumeAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play().then(
      () => setLineState("playing"),
      () => setLineState("ready"),
    );
  }

  function replay() {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    audio.currentTime = selected.clipStart ?? 0;
    setProgress(0);
    resumeAudio();
  }

  function returnToMenu() {
    const audio = audioRef.current;
    audio?.pause();
    setSelected(null);
    setCategory(null);
    setProgress(0);
    setLineState("menu");
  }

  function hangUp() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setSelected(null);
    setCategory(null);
    setProgress(0);
    setLineState("idle");
  }

  function updateProgress() {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) return;

    const start = selected?.clipStart ?? 0;
    const end = selected?.clipEnd ?? audio.duration;
    const span = Math.max(end - start, 0.1);
    setProgress(Math.min(100, Math.max(0, ((audio.currentTime - start) / span) * 100)));

    if (selected?.clipEnd !== undefined && audio.currentTime >= selected.clipEnd) {
      audio.pause();
      setProgress(100);
      setLineState("ended");
    }
  }

  const activeCategory = categories.find((item) => item.id === category);
  const isMessageView = ["connecting", "ready", "playing", "ended"].includes(lineState);

  return (
    <main className="hotline-stage min-h-screen px-4 pb-12 pt-28 text-[#f2eee3] sm:px-8 sm:pb-16 sm:pt-32">
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={updateProgress}
        onEnded={() => {
          setProgress(100);
          setLineState("ended");
        }}
      />

      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between gap-5 border-b border-[#f2eee3]/20 pb-4 font-type">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#f2eee3]/52">
              stranger.fm / line 01
            </p>
            <h1 className="mt-2 text-lg uppercase tracking-[0.16em] sm:text-2xl">
              the listening line
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#f2eee3]/60">
            <span className={`hotline-status-dot ${lineState === "idle" ? "" : "is-live"}`} />
            {lineState === "idle" ? "line ready" : "connected"}
          </div>
        </header>

        <section className="grid items-center gap-9 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-16">
          <div className="hotline-intro max-w-lg">
            <motion.div
              aria-hidden
              initial={reduceMotion ? false : { opacity: 0, rotate: -8, scale: 0.9 }}
              animate={{ opacity: 1, rotate: -3, scale: 1 }}
              className="hotline-receiver-mark"
            >
              <PhoneCall strokeWidth={1.15} />
            </motion.div>
            <p className="mt-7 font-display text-4xl leading-[0.98] sm:text-6xl">
              You don’t need to leave a message.
              <span className="mt-2 block italic text-[#efb84a]">This one is for you.</span>
            </p>
            <p className="mt-6 max-w-md font-type text-xs leading-6 text-[#f2eee3]/58 sm:text-sm">
              Choose what you need today. A stranger will answer in their own voice.
            </p>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.45 }}
            className="hotline-console"
          >
            <div className="hotline-console-top flex items-center justify-between font-type text-[9px] uppercase tracking-[0.16em] text-ink/45">
              <span>web call · no charge</span>
              <span>{String(playableNotes.length).padStart(2, "0")} voices online</span>
            </div>

            <div className="hotline-display" aria-live="polite">
              <AnimatePresence mode="wait">
                {lineState === "idle" ? (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex min-h-[370px] flex-col items-center justify-center px-5 py-9 text-center"
                  >
                    <div className="hotline-call-circle">
                      <Phone aria-hidden strokeWidth={1.4} />
                    </div>
                    <p className="mt-7 font-type text-[10px] uppercase tracking-[0.18em] text-ink/45">
                      an anonymous listening experience
                    </p>
                    <button type="button" onClick={beginCall} className="hotline-call-button mt-7">
                      <PhoneCall aria-hidden size={18} />
                      start a free web call
                    </button>
                    <p className="mt-5 max-w-xs font-type text-[9px] leading-relaxed text-ink/40">
                      Sound will play through your device. No microphone or phone number is used.
                    </p>
                  </motion.div>
                ) : lineState === "menu" ? (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="px-5 py-7 sm:px-8"
                  >
                    <p className="font-type text-[9px] uppercase tracking-[0.18em] text-ink/42">
                      press or tap · what do you need to hear?
                    </p>
                    <div className="mt-6 space-y-3">
                      {categories.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => chooseCategory(item.id)}
                          className="hotline-menu-key group"
                        >
                          <span className="hotline-key-number">{item.id}</span>
                          <span className="min-w-0 text-left">
                            <span className="block font-display text-xl leading-none text-ink sm:text-2xl">
                              {item.title}
                            </span>
                            <span className="mt-1.5 block font-type text-[9px] leading-relaxed text-ink/42 sm:text-[10px]">
                              {item.prompt}
                            </span>
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => chooseCategory("0")}
                        className="hotline-menu-key hotline-menu-key--surprise group"
                      >
                        <span className="hotline-key-number">0</span>
                        <span className="text-left font-type text-[10px] uppercase tracking-[0.12em] text-ink/70">
                          let the line choose for me
                        </span>
                      </button>
                    </div>
                  </motion.div>
                ) : isMessageView && selected ? (
                  <motion.div
                    key={`message-${selected.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex min-h-[440px] flex-col px-6 py-8 sm:px-9"
                  >
                    <div className="flex items-start justify-between gap-5 font-type text-[9px] uppercase tracking-[0.15em] text-ink/42">
                      <span>{activeCategory?.title ?? "something unexpected"}</span>
                      <span>voice {selected.id}</span>
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                      <div
                        className={`hotline-speaker ${lineState === "playing" ? "is-speaking" : ""}`}
                      >
                        <Volume2 aria-hidden strokeWidth={1.3} />
                      </div>
                      <p className="mt-7 font-display text-3xl italic text-ink sm:text-4xl">
                        {lineState === "connecting"
                          ? "connecting you to a stranger…"
                          : lineState === "ended"
                            ? "the line is still open."
                            : "a stranger is speaking…"}
                      </p>

                      <div className="hotline-progress mt-8" aria-hidden>
                        <span style={{ width: `${progress}%` }} />
                      </div>

                      {lineState === "ready" ? (
                        <button
                          type="button"
                          onClick={resumeAudio}
                          className="hotline-listen-button mt-7"
                        >
                          <Volume2 aria-hidden size={16} />
                          tap to hear the message
                        </button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-ink/15 pt-5">
                      <button
                        type="button"
                        onClick={() => chooseCategory(category ?? "0")}
                        className="hotline-small-control"
                      >
                        another voice
                      </button>
                      <button type="button" onClick={replay} className="hotline-small-control">
                        <RotateCcw aria-hidden size={13} /> replay
                      </button>
                      <button
                        type="button"
                        onClick={returnToMenu}
                        className="hotline-small-control"
                      >
                        <ArrowLeft aria-hidden size={13} /> main menu
                      </button>
                      <button
                        type="button"
                        onClick={hangUp}
                        className="hotline-small-control hotline-small-control--hangup"
                      >
                        <PhoneOff aria-hidden size={13} /> hang up
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        <footer className="flex flex-col items-start justify-between gap-4 border-t border-[#f2eee3]/16 pt-5 font-type text-[9px] leading-relaxed tracking-[0.08em] text-[#f2eee3]/42 sm:flex-row sm:items-center">
          <p>A creative archive of real voices. This is not a counselling or crisis service.</p>
          <Link to="/" className="border-b border-current pb-1 uppercase hover:text-[#f2eee3]">
            return to the letters
          </Link>
        </footer>
      </div>
    </main>
  );
}
