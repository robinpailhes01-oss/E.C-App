"use client";

import * as React from "react";
import { Input } from "./ui";

/** Champ numérique tolérant (virgule ou point), synchronisé sur blur. */
export function NumberInput({
  value,
  onChange,
  suffix,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number | undefined | null;
  onChange: (v: number | undefined) => void;
  suffix?: string;
}) {
  const fmt = (v: number | undefined | null) => (v === undefined || v === null || Number.isNaN(v) ? "" : String(v).replace(".", ","));
  const [text, setText] = React.useState(fmt(value));
  const focused = React.useRef(false);

  React.useEffect(() => {
    if (!focused.current) setText(fmt(value));
  }, [value]);

  const commit = (raw: string) => {
    const cleaned = raw.replace(/\s/g, "").replace(",", ".");
    if (cleaned === "" || cleaned === "-") return onChange(undefined);
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n)) onChange(n);
  };

  return (
    <div className="relative">
      <Input
        {...rest}
        value={text}
        inputMode="decimal"
        onFocus={() => (focused.current = true)}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => {
          focused.current = false;
          setText(fmt(value));
        }}
        className={`${suffix ? "pr-10" : ""} ${className ?? ""}`}
      />
      {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-brand-gray pointer-events-none">{suffix}</span>}
    </div>
  );
}
