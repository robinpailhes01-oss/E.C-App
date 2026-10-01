"use client";

import * as React from "react";
import { Check, CircleDashed, XCircle } from "lucide-react";
import type { Decision, PlanItem, PlanStatut } from "@/lib/types";
import { CRENEAU_LABEL, DECISION_LABEL, PLAN_LABEL, PLAN_TONE, type Progress } from "@/lib/dossier";
import { Badge, Field, Input, Segmented, Select, cx } from "./ui";

export function ProgressBar({ progress, dark }: { progress: Progress; dark?: boolean }) {
  return (
    <div>
      <div className={cx("h-2 rounded-full overflow-hidden", dark ? "bg-white/15" : "bg-ink/8")}>
        <div className={cx("h-full rounded-full transition-all duration-500", progress.complete ? "bg-brand-green" : "bg-brand-orange")} style={{ width: `${Math.max(progress.percent, 3)}%` }} />
      </div>
      <div className={cx("flex items-center justify-between text-xs mt-1.5", dark ? "text-white/70" : "text-muted")}>
        <span>
          {progress.done}/{progress.total} étapes
        </span>
        <span className="font-semibold">{progress.complete ? "Dossier terminé" : `Prochaine étape : ${progress.current?.label}`}</span>
      </div>
    </div>
  );
}

/** Frise des étapes du dossier. */
export function StepChips({ progress, dark }: { progress: Progress; dark?: boolean }) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {progress.steps
        .filter((s) => s.applicable)
        .map((s) => (
          <li
            key={s.key}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold border",
              s.done
                ? dark
                  ? "bg-brand-green/25 border-brand-green/40 text-white"
                  : "bg-brand-green-soft border-brand-green/30 text-brand-green-dark"
                : s.blocked
                  ? "bg-red-50 border-red-200 text-red-700"
                  : dark
                    ? "bg-white/8 border-white/15 text-white/70"
                    : "bg-surface border-line text-muted",
            )}
          >
            {s.done ? <Check className="size-3.5" /> : s.blocked ? <XCircle className="size-3.5" /> : <CircleDashed className="size-3.5" />}
            {s.label}
            {s.info && <span className="font-normal opacity-80">· {s.info}</span>}
          </li>
        ))}
    </ol>
  );
}

export function DecisionField({ value, onChange, readOnly }: { value: Decision; onChange: (v: Decision) => void; readOnly?: boolean }) {
  return (
    <div className={cx(readOnly && "pointer-events-none opacity-80")}>
      <Segmented
        value={value}
        onChange={onChange}
        options={(["attente", "accord", "refus"] as Decision[]).map((v) => ({ value: v, label: DECISION_LABEL[v] }))}
      />
    </div>
  );
}

const PLAN_OPTIONS: PlanStatut[] = ["a_planifier", "planifie", "confirme", "en_cours", "fait", "reporte"];

/** Édition d'une étape planifiable : statut, date, créneau, responsable. */
export function PlanEditor({
  title,
  item,
  onChange,
  responsableLabel,
  readOnly,
  hint,
}: {
  title: string;
  item: PlanItem;
  onChange: (p: PlanItem) => void;
  responsableLabel?: string;
  readOnly?: boolean;
  hint?: string;
}) {
  const set = (patch: Partial<PlanItem>) => onChange({ ...item, ...patch });
  return (
    <div className="rounded-[16px] border border-line bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <div className="font-semibold">{title}</div>
          {hint && <div className="text-xs text-muted">{hint}</div>}
        </div>
        <Badge tone={PLAN_TONE[item.statut]} dot>
          {PLAN_LABEL[item.statut]}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Statut">
          <Select
            value={item.statut}
            disabled={readOnly}
            onChange={(e) => {
              const statut = e.target.value as PlanStatut;
              // Une date renseignée passe l'étape de « à planifier » à « planifié ».
              set({ statut });
            }}
          >
            {PLAN_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {PLAN_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date">
          <Input
            type="date"
            value={item.date ?? ""}
            disabled={readOnly}
            onChange={(e) => set({ date: e.target.value || undefined, statut: e.target.value && item.statut === "a_planifier" ? "planifie" : item.statut })}
          />
        </Field>
        <Field label="Créneau">
          <Select value={item.creneau ?? "journee"} disabled={readOnly} onChange={(e) => set({ creneau: e.target.value as PlanItem["creneau"] })}>
            {Object.entries(CRENEAU_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        {responsableLabel ? (
          <Field label={responsableLabel}>
            <Input value={item.responsable ?? ""} disabled={readOnly} onChange={(e) => set({ responsable: e.target.value })} placeholder="Nom" />
          </Field>
        ) : (
          <div />
        )}
        <Field label="Note" className="col-span-2">
          <Input value={item.note ?? ""} disabled={readOnly} onChange={(e) => set({ note: e.target.value })} placeholder="Accès, consignes, remarque…" />
        </Field>
      </div>
    </div>
  );
}
