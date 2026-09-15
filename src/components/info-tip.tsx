"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Info } from "lucide-react";
import { cx } from "./ui";

/** Petit « i » bleu : affiche une information (ex. prix conseillé) au toucher. */
export function InfoTip({ children, className, label = "Information" }: { children: React.ReactNode; className?: string; label?: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <span ref={ref} className={cx("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cx(
          "size-7 grid place-items-center rounded-full transition-colors",
          open ? "bg-brand-blue text-white" : "text-brand-blue hover:bg-brand-blue-soft",
        )}
      >
        <Info className="size-[18px]" strokeWidth={2.2} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="absolute z-40 right-0 top-full mt-1.5 w-56 rounded-[12px] bg-night text-white text-[13px] leading-snug px-3.5 py-2.5 shadow-[var(--shadow-float)]"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
