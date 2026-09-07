import { useEffect, useRef, useState } from "react";
import ambient from "@/assets/wash-bon-iver.mp3.asset.json";

/**
 * Soft ambient loop that starts on the visitor's first interaction
 * (browsers block audio before that) and ducks while a note plays.
 */
export function BackgroundMusic() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const start = () => {
      const el = ref.current;
      if (!el || !el.paused) return;
      el.volume = 0.32;
      el.play().then(
        () => setStarted(true),
        () => undefined,
      );
    };
    start();
    const events = ["pointerdown", "pointerup", "click", "touchstart", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, start, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, start));
    };
  }, []);

  useEffect(() => {
    const duck = (e: Event) => {
      const el = ref.current;
      if (!el) return;
      el.volume = (e as CustomEvent<boolean>).detail ? 0.07 : 0.32;
    };
    window.addEventListener("music-duck", duck);
    return () => window.removeEventListener("music-duck", duck);
  }, []);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (on) {
      el.pause();
    } else {
      el.play().catch(() => undefined);
    }
    setOn(!on);
  };

  return (
    <>
      <audio ref={ref} src={ambient.url} loop preload="auto" />
      <button
        type="button"
        onClick={toggle}
        aria-label={on ? "Turn the music off" : "Turn the music on"}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        <span className="flex h-3 items-end gap-[2px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[2px] bg-current"
              style={{
                height: on ? `${[6, 11, 8][i]}px` : "3px",
                transition: "height .3s ease",
              }}
            />
          ))}
        </span>
        {on ? "music on" : "music off"}
      </button>
    </>
  );
}

export function duckMusic(quiet: boolean) {
  window.dispatchEvent(new CustomEvent("music-duck", { detail: quiet }));
}
