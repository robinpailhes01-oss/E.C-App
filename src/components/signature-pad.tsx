"use client";

import * as React from "react";
import SignaturePad from "signature_pad";
import { Button } from "./ui";

export function SignatureField({
  value,
  onChange,
  label,
  height = 200,
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  label: string;
  height?: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const padRef = React.useRef<SignaturePad | null>(null);
  const [locked, setLocked] = React.useState(Boolean(value));

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || locked) return;
    const pad = new SignaturePad(canvas, { minWidth: 1, maxWidth: 2.5, penColor: "#1f2328", backgroundColor: "rgba(255,255,255,0)" });
    padRef.current = pad;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = pad.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      pad.clear();
      pad.fromData(data);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      pad.off();
    };
  }, [locked]);

  const validate = () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    onChange(pad.toDataURL("image/png"));
    setLocked(true);
  };

  const clear = () => {
    padRef.current?.clear();
    onChange(undefined);
    setLocked(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{label}</span>
        {locked ? (
          <span className="text-xs font-semibold text-emerald-700">✓ Signature enregistrée</span>
        ) : (
          <span className="text-xs text-gray-400">Signez avec le doigt ou le stylet</span>
        )}
      </div>
      <div className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-white overflow-hidden touch-none" style={{ height }}>
        {locked && value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="w-full h-full object-contain" />
        ) : (
          <canvas ref={canvasRef} className="w-full h-full block" />
        )}
        {!locked && <div className="pointer-events-none absolute left-4 right-4 bottom-8 border-b border-gray-200" />}
      </div>
      <div className="flex gap-2 mt-2">
        <Button type="button" variant="secondary" size="sm" onClick={clear}>
          Effacer
        </Button>
        {!locked && (
          <Button type="button" size="sm" onClick={validate}>
            Valider la signature
          </Button>
        )}
      </div>
    </div>
  );
}
