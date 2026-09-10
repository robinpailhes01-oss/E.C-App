"use client";

import * as React from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none";
  const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-13 px-6 text-base" };
  const variants = {
    primary: "bg-brand-blue text-white hover:bg-brand-blue-dark shadow-sm",
    accent: "bg-brand-orange text-white hover:bg-brand-orange-dark shadow-sm",
    secondary: "bg-white text-ink border border-gray-200 hover:bg-gray-50",
    ghost: "text-brand-gray hover:bg-black/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading && <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("bg-white rounded-2xl border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]", className)} {...rest}>
      {children}
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
      <span className="block text-xs font-semibold uppercase tracking-wide text-brand-gray mb-1.5">
        {label}
        {required && <span className="text-brand-orange"> *</span>}
      </span>
      {children}
      {error ? <span className="block mt-1 text-xs text-red-600">{error}</span> : hint ? <span className="block mt-1 text-xs text-gray-400">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-[15px] text-ink placeholder:text-gray-300 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cx(inputCls, className)} {...rest} />;
});

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(inputCls, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236d6e71%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_12px_center] pr-9", className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputCls, "h-auto min-h-24 py-2.5", className)} {...rest} />;
}

export function Badge({ children, tone = "gray", className }: { children: React.ReactNode; tone?: "gray" | "green" | "orange" | "blue" | "red"; className?: string }) {
  const tones = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    blue: "bg-sky-50 text-sky-700",
    red: "bg-red-50 text-red-700",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

export const statusTone = (s: string): "gray" | "green" | "red" => (s === "signe" ? "green" : s === "annule" ? "red" : "gray");

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-[15px]"
    >
      <span className={cx("relative inline-block w-10 h-6 rounded-full transition", checked ? "bg-brand-green" : "bg-gray-300")}>
        <span className={cx("absolute top-0.5 size-5 rounded-full bg-white shadow transition", checked ? "left-[18px]" : "left-0.5")} />
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
  return (
    <div className={cx("grid gap-1 rounded-xl bg-gray-100 p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            "h-9 rounded-lg text-sm font-semibold transition",
            value === o.value ? "bg-white text-ink shadow-sm" : "text-brand-gray hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-14 px-6">
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="mt-2 text-sm text-brand-gray">{children}</div>}
    </div>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-brand-gray">
      <span className="size-5 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin" /> {label}
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className={cx("bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[95dvh] flex flex-col", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="size-9 grid place-items-center rounded-full hover:bg-gray-100 text-brand-gray" aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
