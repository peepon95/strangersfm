import { motion } from "motion/react";
import jar from "@/assets/jar.png";

export function Jar({ onPull, idle }: { onPull: () => void; idle: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onPull}
      aria-label="Pull a note out of the jar"
      className="group relative block cursor-pointer select-none focus-visible:outline-none"
      initial={{ y: "-120vh", rotate: -14 }}
      animate={{ y: 0, rotate: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 12, mass: 1.1, delay: 0.15 }}
      whileHover={{ rotate: -1.5, scale: 1.02 }}
      whileTap={{ scale: 0.97, rotate: 2 }}
    >
      <motion.span
        className="block"
        animate={idle ? { rotate: [0, -1.2, 0, 1.2, 0] } : { rotate: 0 }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
      >
        <img
          src={jar}
          alt="A glass jar full of folded handwritten notes"
          width={912}
          height={1104}
          className="h-[52vh] max-h-[540px] w-auto drop-shadow-[0_28px_40px_var(--paper-shadow)]"
        />
      </motion.span>
      <span className="pointer-events-none absolute inset-x-0 -bottom-2 mx-auto h-4 w-2/3 rounded-[100%] bg-ink/10 blur-md" />
    </motion.button>
  );
}
