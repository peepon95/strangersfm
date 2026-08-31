import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  FileHeart,
  FolderOpen,
  Headphones,
  Minus,
  NotebookPen,
  PhoneCall,
  Radio,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { NoteReveal } from "@/components/NoteReveal";
import { notes as builtInNotes, TOTAL_GOAL } from "@/data/notes";
import { listPublishedNotes } from "@/lib/notes.functions";

const desktopLinks = [
  { label: "Every note", sublabel: "the full archive", to: "/notes", icon: Archive },
  { label: "Why this exists", sublabel: "a note from Ee Von", to: "/about", icon: FolderOpen },
  { label: "Write a note", sublabel: "add your handwriting", to: "/submit", icon: NotebookPen },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "stranger.fm · handwritten messages in their own voices" },
      {
        name: "description",
        content:
          "100 strangers, one notebook. Open a handwritten message and hear it in the stranger's own voice.",
      },
      { property: "og:title", content: "stranger.fm · an archive of human voices" },
      {
        property: "og:description",
        content: "Open a handwritten message from someone you have never met.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => listPublishedNotes(),
  errorComponent: () => (
    <main className="retro-desktop flex min-h-screen items-center justify-center px-6 text-center">
      <div className="retro-window w-full max-w-md">
        <div className="retro-titlebar">stranger.fm</div>
        <p className="p-8 font-type text-sm text-ink/65">
          The notes are resting. Please refresh in a moment.
        </p>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="retro-desktop flex min-h-screen items-center justify-center px-6 text-center">
      <p className="font-type text-sm text-ink/65">Nothing is filed here.</p>
    </main>
  ),
  component: Index,
});

function Index() {
  const uploaded = Route.useLoaderData();
  const notes = useMemo(() => [...builtInNotes, ...uploaded], [uploaded]);
  const [current, setCurrent] = useState<number | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [hotlineOpen, setHotlineOpen] = useState(false);
  const [time, setTime] = useState("MYT");
  const bag = useRef<number[]>([]);

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("en-MY", {
          timeZone: "Asia/Kuala_Lumpur",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );
    };
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const closeTopLayer = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (current !== null) setCurrent(null);
      else if (hotlineOpen) setHotlineOpen(false);
      else setStartOpen(false);
    };
    window.addEventListener("keydown", closeTopLayer);
    return () => window.removeEventListener("keydown", closeTopLayer);
  }, [current, hotlineOpen]);

  const draw = useCallback(() => {
    setStartOpen(false);
    setHotlineOpen(false);
    setCurrent((previous) => {
      if (bag.current.length === 0) {
        bag.current = notes
          .map((_, index) => index)
          .sort(() => Math.random() - 0.5)
          .filter((index) => index !== previous);
        if (bag.current.length === 0) bag.current = notes.map((_, index) => index);
      }
      return bag.current.pop() ?? 0;
    });
  }, [notes]);

  const note = current === null ? null : notes[current];

  return (
    <main className="retro-desktop relative min-h-[100svh] overflow-hidden pb-[58px] text-ink">
      <BackgroundMusic />

      <section
        aria-label="Stranger FM desktop"
        className="relative z-10 min-h-[calc(100svh-58px)] p-4 sm:p-7"
      >
        <div className="desktop-icon-grid">
          <button type="button" onClick={draw} className="desktop-icon group">
            <span className="desktop-icon-art bg-[#ffe48d]">
              <Radio aria-hidden />
            </span>
            <span className="desktop-icon-label">Pull a note</span>
            <span className="desktop-icon-detail">someone is rooting for you</span>
          </button>

          {desktopLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="desktop-icon group">
                <span className="desktop-icon-art bg-[#f1d875]">
                  <Icon aria-hidden />
                </span>
                <span className="desktop-icon-label">{item.label}</span>
                <span className="desktop-icon-detail">{item.sublabel}</span>
              </Link>
            );
          })}

          <button type="button" onClick={() => setHotlineOpen(true)} className="desktop-icon group">
            <span className="desktop-icon-art bg-[#ef9e92]">
              <PhoneCall aria-hidden />
            </span>
            <span className="desktop-icon-label">Call Stranger FM</span>
            <span className="desktop-icon-detail">Malaysia line · soon</span>
          </button>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="retro-window welcome-window"
          aria-labelledby="welcome-title"
        >
          <div className="retro-titlebar">
            <span className="flex min-w-0 items-center gap-2">
              <FileHeart aria-hidden className="h-4 w-4 shrink-0" />
              <span className="truncate">stranger.fm — welcome</span>
            </span>
            <span className="retro-window-controls" aria-hidden>
              <span>
                <Minus />
              </span>
              <span>
                <Sparkles />
              </span>
              <span>
                <X />
              </span>
            </span>
          </div>

          <div className="welcome-window-body">
            <div className="relative z-10 max-w-xl">
              <p className="font-type text-[10px] uppercase tracking-[0.22em] text-ink/50 sm:text-xs">
                an archive of voices / Malaysia
              </p>
              <h1
                id="welcome-title"
                className="mt-4 font-type text-3xl leading-[1.05] tracking-[-0.06em] sm:text-5xl lg:text-6xl"
              >
                a message from someone you have never met
              </h1>
              <p className="mt-5 max-w-lg font-type text-xs leading-6 text-ink/65 sm:text-sm sm:leading-7">
                100 strangers. One handwritten message each. Kept in their own hand and heard in
                their own voice.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button type="button" onClick={draw} className="retro-primary-button">
                  <Headphones aria-hidden className="h-4 w-4" />
                  open a random note
                </button>
                <Link to="/notes" className="retro-secondary-button">
                  browse {String(notes.length).padStart(2, "0")} notes
                </Link>
              </div>
            </div>

            <div className="welcome-note-preview" aria-hidden>
              <div className="font-type text-[9px] uppercase tracking-[0.12em] text-ink/45">
                stranger no. {notes[0]?.id ?? "001"}
              </div>
              {notes[0] ? <img src={notes[0].image} alt="" /> : null}
            </div>

            <div className="welcome-status font-type">
              <span>
                {String(notes.length).padStart(2, "0")} / {TOTAL_GOAL}
              </span>
              <span>voices safely filed</span>
            </div>
          </div>
        </motion.section>
      </section>

      <AnimatePresence>
        {hotlineOpen ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#345777]/45 px-4 py-20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHotlineOpen(false)}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="hotline-title"
              className="retro-window w-full max-w-lg"
              initial={{ y: 24, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 16, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="retro-titlebar">
                <span>Call Stranger FM</span>
                <button
                  type="button"
                  onClick={() => setHotlineOpen(false)}
                  aria-label="Close hotline window"
                  className="retro-close-button"
                >
                  <X aria-hidden />
                </button>
              </div>
              <div className="space-y-5 bg-[#f6f0df] p-6 font-type sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center border-2 border-ink bg-[#ef9e92] shadow-[3px_3px_0_#263d55]">
                  <PhoneCall aria-hidden className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ink/45">
                    Malaysia line / preparing
                  </p>
                  <h2
                    id="hotline-title"
                    className="mt-2 font-type text-2xl tracking-[-0.04em] sm:text-3xl"
                  >
                    a little courage, one call away
                  </h2>
                </div>
                <p className="text-sm leading-7 text-ink/65">
                  The first phone line will use a Malaysian number and play one short voice note per
                  call. For now, you can hear the same voices here on the web.
                </p>
                <button type="button" onClick={draw} className="retro-primary-button">
                  hear one now
                </button>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {note ? (
          <motion.div
            key={note.id}
            className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-[#345777]/75 px-3 py-16 backdrop-blur-[3px] sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="retro-window w-full max-w-3xl">
              <div className="retro-titlebar">
                <span className="flex min-w-0 items-center gap-2">
                  <Volume2 aria-hidden className="h-4 w-4" />
                  <span className="truncate">voice-note-{note.id}.fm</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCurrent(null)}
                  aria-label="Close note"
                  className="retro-close-button"
                >
                  <X aria-hidden />
                </button>
              </div>
              <div className="typewriter-sheet px-5 py-8 sm:px-10 sm:py-12">
                <NoteReveal note={note} autoplay onNext={draw} onBack={() => setCurrent(null)} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <footer className="retro-taskbar">
        <button
          type="button"
          className="retro-start-button"
          aria-expanded={startOpen}
          aria-controls="retro-start-menu"
          onClick={() => setStartOpen((open) => !open)}
        >
          <Sparkles aria-hidden className="h-4 w-4" />
          start here
        </button>

        <AnimatePresence>
          {startOpen ? (
            <motion.nav
              id="retro-start-menu"
              aria-label="Start menu"
              className="retro-start-menu"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <div className="retro-start-menu-brand">stranger.fm</div>
              <div className="min-w-0 flex-1 py-2">
                <button type="button" onClick={draw}>
                  <Radio aria-hidden />I need a note
                </button>
                <Link to="/notes">
                  <Archive aria-hidden />
                  Every note
                </Link>
                <Link to="/about">
                  <FolderOpen aria-hidden />
                  Why this exists
                </Link>
                <Link to="/submit">
                  <NotebookPen aria-hidden />
                  Write a note
                </Link>
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>

        <div className="retro-taskbar-spacer" />
        <div className="retro-taskbar-status">
          <span className="hidden sm:inline">{String(notes.length).padStart(2, "0")} voices</span>
          <span>{time}</span>
        </div>
      </footer>
    </main>
  );
}
