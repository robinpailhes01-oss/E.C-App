"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent" | "night";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-[var(--radius-ctl)] font-semibold tracking-[-0.01em] transition-[transform,background-color,box-shadow,border-color] duration-200 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none select-none";
  const sizes = { sm: "h-9 px-3.5 text-[13px]", md: "h-11 px-4.5 text-sm", lg: "h-13 px-6 text-[15px]" };
  const variants = {
    primary: "bg-brand-blue text-white hover:bg-brand-blue-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(18,33,43,0.12)]",
    accent: "bg-brand-orange text-white hover:bg-brand-orange-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_16px_-6px_rgba(239,138,42,0.6)]",
    night: "bg-night text-white hover:bg-night-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    secondary: "bg-panel text-ink border border-line-strong hover:border-ink/30 hover:bg-surface-2",
    ghost: "text-ink-2 hover:bg-ink/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading && <span className="size-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, tone = "panel", ...rest }: React.HTMLAttributes<HTMLDivElement> & { tone?: "panel" | "night" }) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius-card)] border",
        tone === "night" ? "bg-night text-white border-transparent shadow-[var(--shadow-float)]" : "bg-panel border-line shadow-[var(--shadow-ambient)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Titre de section avec le filet énergie. */
export function SectionTitle({ children, sub, className }: { children: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("mb-4", className)}>
      <h2 className="font-display text-[19px] font-semibold text-ink">{children}</h2>
      {sub && <p className="text-sm text-muted mt-0.5">{sub}</p>}
      <div className="energy-line w-10 rounded-full mt-2.5" />
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-1.5">
        {label}
        {required && <span className="text-brand-orange"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="block mt-1 text-xs font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="block mt-1 text-xs text-muted/80">{hint}</span>
      ) : null}
    </label>
  );
}

const inputCls =
  "w-full h-11 rounded-[var(--radius-ctl)] border border-line-strong bg-surface-2 px-3.5 text-[15px] text-ink placeholder:text-muted/60 outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:bg-panel focus:border-brand-blue focus:ring-[3px] focus:ring-brand-blue/15 focus-visible:outline-none read-only:bg-surface read-only:text-ink-2";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cx(inputCls, className)} {...rest} />;
});

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        inputCls,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%237a8790%22 stroke-width=%222.2%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_12px_center] pr-9",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputCls, "h-auto min-h-24 py-2.5 leading-relaxed", className)} {...rest} />;
}

export function Badge({
  children,
  tone = "gray",
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "orange" | "blue" | "red";
  className?: string;
  dot?: boolean;
}) {
  const tones = {
    gray: "bg-ink/6 text-ink-2",
    green: "bg-brand-green-soft text-brand-green-dark",
    orange: "bg-brand-orange-soft text-brand-orange-dark",
    blue: "bg-brand-blue-soft text-brand-blue-dark",
    red: "bg-red-50 text-red-700",
  };
  const dots = { gray: "bg-ink/40", green: "bg-brand-green", orange: "bg-brand-orange", blue: "bg-brand-blue", red: "bg-red-500" };
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em]", tones[tone], className)}>
      {dot && <span className={cx("size-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}

export const statusTone = (s: string): "gray" | "green" | "red" => (s === "signe" ? "green" : s === "annule" ? "red" : "gray");

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 h-11 rounded-[var(--radius-ctl)] border border-line-strong bg-surface-2 px-3.5 text-[15px] transition hover:bg-panel"
    >
      <span className={cx("relative inline-block w-10 h-6 rounded-full transition-colors duration-200", checked ? "bg-brand-green" : "bg-ink/20")}>
        <span className={cx("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] duration-200", checked ? "left-[18px]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={cx("grid gap-1 rounded-[var(--radius-ctl)] bg-ink/6 p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cx("relative h-9 rounded-[9px] text-[13px] font-semibold transition-colors", active ? "text-ink" : "text-muted hover:text-ink-2")}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[9px] bg-panel shadow-[0_1px_2px_rgba(18,33,43,0.12),0_0_0_1px_rgba(18,33,43,0.05)]"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="mx-auto mb-4 size-12 rounded-2xl bg-surface border border-line grid place-items-center">
        <span className="energy-line w-5 rounded-full" />
      </div>
      <p className="font-display font-semibold text-ink">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted">
      <span className="size-5 rounded-full border-2 border-brand-blue/25 border-t-brand-blue animate-spin" /> {label}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-night/50 backdrop-blur-[2px] p-0 sm:p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className={cx("bg-panel w-full rounded-t-[24px] sm:rounded-[20px] shadow-[var(--shadow-float)] max-h-[95dvh] flex flex-col overflow-hidden", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <div className="energy-line" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h2 className="font-display font-semibold text-lg">{title}</h2>
              <button type="button" onClick={onClose} className="size-9 grid place-items-center rounded-full hover:bg-ink/5 text-muted" aria-label="Fermer">
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Apparition douce d'un bloc (respecte prefers-reduced-motion via Motion). */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Initials({ name, tone = "blue", className }: { name: string; tone?: "blue" | "orange" | "night"; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const tones = { blue: "bg-brand-blue text-white", orange: "bg-brand-orange text-white", night: "bg-night text-white" };
  return <span className={cx("inline-grid place-items-center rounded-full font-display font-semibold", tones[tone], className)}>{initials}</span>;
}
