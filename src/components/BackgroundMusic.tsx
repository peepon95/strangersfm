import { useEffect, useRef, useState } from "react";
import ambient from "@/assets/wash-bon-iver.mp3.asset.json";

const AMBIENT_VOLUME = 0.14;
const DUCKED_VOLUME = 0.035;
const AMBIENT_URL = `https://project--${ambient.project_id}.lovable.app${ambient.url}`;

/**
 * Soft ambient loop that starts on the visitor's first interaction
 * (browsers block audio before that) and ducks while a note plays.
 */
export function BackgroundMusic() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const mutedByUser = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => setOn(!el.paused);
    el.addEventListener("play", sync);
    el.addEventListener("pause", sync);

    const start = (event?: Event) => {
      if (event?.target instanceof Element && event.target.closest("[data-music-toggle]")) return;
      if (mutedByUser.current || !el.paused) return;
      el.volume = AMBIENT_VOLUME;
      el.play().catch(() => undefined);
    };
    start();
    const events = ["pointerdown", "pointerup", "click", "touchstart", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, start, { passive: true }));
    return () => {
      el.removeEventListener("play", sync);
      el.removeEventListener("pause", sync);
      events.forEach((e) => window.removeEventListener(e, start));
    };
  }, []);

  useEffect(() => {
    const duck = (e: Event) => {
      const el = ref.current;
      if (!el) return;
      el.volume = (e as CustomEvent<boolean>).detail ? DUCKED_VOLUME : AMBIENT_VOLUME;
    };
    window.addEventListener("music-duck", duck);
    return () => window.removeEventListener("music-duck", duck);
  }, []);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      mutedByUser.current = false;
      el.volume = AMBIENT_VOLUME;
      el.play().catch(() => undefined);
    } else {
      mutedByUser.current = true;
      el.pause();
    }
  };

  return (
    <>
      <audio ref={ref} src={AMBIENT_URL} loop preload="auto" />
      <button
        type="button"
        data-music-toggle
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
        {on ? "music on" : "play music"}
      </button>
    </>
  );
}

export function duckMusic(quiet: boolean) {
  window.dispatchEvent(new CustomEvent("music-duck", { detail: quiet }));
}
