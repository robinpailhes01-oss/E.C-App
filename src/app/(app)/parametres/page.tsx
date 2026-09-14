"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { AppSettings } from "@/lib/types";
import { ALL_DURATIONS, normalizeSettings } from "@/lib/settings";
import { monthlyPayment, monthlyInsurance, round2 } from "@/lib/pricing";
import { eur, dateFr } from "@/lib/format";
import { VAT_RATES, FINANCING_ORGANISMS } from "@/lib/catalog";
import { Button, Card, Field, Reveal, SectionTitle, Select, Spinner, cx } from "@/components/ui";
import { NumberInput } from "@/components/number-input";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [saved, setSaved] = React.useState<AppSettings | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user.role !== "directeur") {
      router.replace("/commandes");
      return;
    }
    getStore()
      .getSettings()
      .then((s) => {
        setSettings(s);
        setSaved(s);
      });
  }, [user.role, router]);

  if (user.role !== "directeur") return null;
  if (!settings) return <Spinner />;

  const set = (patch: Partial<AppSettings>) => {
    setDone(false);
    setSettings({ ...settings, ...patch });
  };
  const dirty = JSON.stringify(normalizeSettings(settings)) !== JSON.stringify(saved);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const s = await getStore().saveSettings(normalizeSettings(settings));
      setSettings(s);
      setSaved(s);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  // Aperçu : mensualités pour 10 000 € avec les paramètres saisis.
  const sample = 10000;
  const preview = settings.dureesProposees.map((m) => ({
    m,
    sans: monthlyPayment(sample, settings.tauxNominal, m) ?? 0,
    avec: round2((monthlyPayment(sample, settings.tauxNominal, m) ?? 0) + monthlyInsurance(sample, settings.tauxAssurance)),
  }));

  return (
    <div className="max-w-4xl mx-auto">
      <Reveal>
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Direction</p>
            <h1 className="font-display text-[28px] sm:text-[32px] font-semibold text-ink leading-tight mt-1">Paramètres</h1>
            <p className="text-sm text-muted mt-1">
              Ces valeurs s&apos;appliquent aux <b className="text-ink">nouveaux bons</b>. Les bons déjà créés conservent le taux en vigueur à leur création.
              {saved?.updatedAt && (
                <>
                  {" "}
                  Dernière modification {dateFr(saved.updatedAt, true)}
                  {saved.updatedBy ? ` par ${saved.updatedBy}` : ""}.
                </>
              )}
            </p>
          </div>
          <Button onClick={save} loading={saving} disabled={!dirty} variant={done && !dirty ? "secondary" : "accent"} className="whitespace-nowrap">
            {done && !dirty ? (
              <>
                <Check className="size-4" /> Enregistré
              </>
            ) : (
              <>
                <Save className="size-4" /> Enregistrer
              </>
            )}
          </Button>
        </div>
      </Reveal>

      {error && <p className="mb-4 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}

      <div className="space-y-4">
        <Reveal delay={0.05}>
          <Card className="p-5 sm:p-6">
            <SectionTitle sub="Taux Domofinance en vigueur. Modifiez-le dès qu'il change : les prochains bons utiliseront la nouvelle valeur.">Financement</SectionTitle>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Taux débiteur annuel" hint="Exemple : 6,29">
                <NumberInput value={settings.tauxNominal} onChange={(v) => set({ tauxNominal: v ?? 0 })} suffix="%" />
              </Field>
              <Field label="Assurance emprunteur" hint="% annuel du capital emprunté">
                <NumberInput value={settings.tauxAssurance} onChange={(v) => set({ tauxAssurance: v ?? 0 })} suffix="%" />
              </Field>
              <Field label="Organisme par défaut">
                <Select value={settings.organismeDefaut} onChange={(e) => set({ organismeDefaut: e.target.value })}>
                  {FINANCING_ORGANISMS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">Durées proposées au client</div>
              <div className="flex flex-wrap gap-2">
                {ALL_DURATIONS.map((m) => {
                  const on = settings.dureesProposees.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set({ dureesProposees: on ? settings.dureesProposees.filter((x) => x !== m) : [...settings.dureesProposees, m].sort((a, b) => a - b) })}
                      className={cx(
                        "h-10 px-3.5 rounded-full text-[13px] font-semibold border transition",
                        on ? "bg-night text-white border-night" : "bg-panel text-muted border-line-strong hover:text-ink",
                      )}
                    >
                      {m} mois{m % 12 === 0 ? ` · ${m / 12} ans` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="p-5 sm:p-6">
            <SectionTitle sub={`Ce que verra le commercial pour un capital de ${eur(sample)} avec les valeurs ci-dessus.`}>Aperçu des mensualités</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface text-[10.5px] uppercase tracking-[0.12em] text-muted">
                  <tr>
                    <th className="text-left font-semibold px-3 py-2.5">Durée</th>
                    <th className="text-right font-semibold px-3 py-2.5">Sans assurance</th>
                    <th className="text-right font-semibold px-3 py-2.5">Avec assurance</th>
                    <th className="text-right font-semibold px-3 py-2.5">Total dû (sans)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {preview.map((r) => (
                    <tr key={r.m}>
                      <td className="px-3 py-2">
                        {r.m} mois{r.m % 12 === 0 ? ` · ${r.m / 12} ans` : ""}
                      </td>
                      <td className="text-right px-3 py-2 num font-semibold">{eur(r.sans)}</td>
                      <td className="text-right px-3 py-2 num">{eur(r.avec)}</td>
                      <td className="text-right px-3 py-2 text-muted tabular-nums">{eur(round2(r.sans * r.m))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.15}>
          <Card className="p-5 sm:p-6">
            <SectionTitle sub="Taux appliqué par défaut sur un nouveau bon (modifiable ligne par le commercial).">TVA</SectionTitle>
            <Field label="Taux de TVA par défaut" className="max-w-xs">
              <Select value={settings.tvaDefaut} onChange={(e) => set({ tvaDefaut: parseFloat(e.target.value) })}>
                {VAT_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r} %
                  </option>
                ))}
              </Select>
            </Field>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
