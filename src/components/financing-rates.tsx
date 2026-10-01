"use client";

import * as React from "react";
import { Check, Save } from "lucide-react";
import { getStore } from "@/lib/data";
import type { AppSettings, OrganismeRates } from "@/lib/types";
import { ORGANISMES, normalizeSettings } from "@/lib/settings";
import { dateFr } from "@/lib/format";
import { Button, Card, Field, SectionTitle } from "./ui";
import { NumberInput } from "./number-input";

/** Taux de financement par organisme : modifiables par la direction, appliqués aux nouveaux bons. */
export function FinancingRates() {
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [saved, setSaved] = React.useState<AppSettings | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getStore()
      .getSettings()
      .then((s) => {
        setSettings(s);
        setSaved(s);
      });
  }, []);

  if (!settings || !saved) return null;
  const dirty = JSON.stringify(settings.organismes) !== JSON.stringify(saved.organismes);

  const setRate = (org: string, patch: Partial<OrganismeRates>) => {
    setDone(false);
    setSettings({ ...settings, organismes: { ...settings.organismes, [org]: { ...settings.organismes[org], ...patch } } });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // On repart des paramètres enregistrés pour ne modifier que les taux.
      const latest = await getStore().getSettings();
      const next = await getStore().saveSettings(normalizeSettings({ ...latest, organismes: settings.organismes }));
      setSettings(next);
      setSaved(next);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle
          className="mb-0"
          sub={
            <>
              Taux d&apos;intérêt des organismes. Ils s&apos;appliquent aux <b className="text-ink">nouveaux bons</b> : les bons déjà créés gardent leur taux.
              {saved.updatedAt && (
                <>
                  {" "}
                  Dernière modification {dateFr(saved.updatedAt, true)}
                  {saved.updatedBy ? ` par ${saved.updatedBy}` : ""}.
                </>
              )}
            </>
          }
        >
          Taux de financement
        </SectionTitle>
        <Button onClick={save} loading={saving} disabled={!dirty} variant={done && !dirty ? "secondary" : "accent"} className="whitespace-nowrap">
          {done && !dirty ? (
            <>
              <Check className="size-4" /> Enregistré
            </>
          ) : (
            <>
              <Save className="size-4" /> Enregistrer les taux
            </>
          )}
        </Button>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}

      <div className="grid lg:grid-cols-3 gap-3 mt-5">
        {ORGANISMES.map((org) => {
          const r = settings.organismes[org];
          return (
            <div key={org} className="rounded-[16px] border border-line bg-surface-2 p-4">
              <div className="font-display font-semibold text-[16px] mb-3">{org}</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Normal">
                  <NumberInput value={r.tauxNormal} onChange={(v) => setRate(org, { tauxNormal: v ?? 0 })} suffix="%" />
                </Field>
                <Field label="Compensé">
                  <NumberInput value={r.tauxCompense} onChange={(v) => setRate(org, { tauxCompense: v ?? 0 })} suffix="%" />
                </Field>
                <Field label="TAEG (normal)">
                  <NumberInput value={r.taeg} onChange={(v) => setRate(org, { taeg: v ?? 0 })} suffix="%" />
                </Field>
                <Field label="Assurance DIM" hint="% annuel du capital">
                  <NumberInput value={r.tauxAssurance} onChange={(v) => setRate(org, { tauxAssurance: v ?? 0 })} suffix="%" />
                </Field>
              </div>
              <p className="text-[11.5px] text-muted mt-3">Intérêts gratuits : 0 % pour le client.</p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted mt-3">Valeurs initiales indicatives (taux Domofinance cité en rendez-vous) : à remplacer par les taux en vigueur de chaque organisme.</p>
    </Card>
  );
}
