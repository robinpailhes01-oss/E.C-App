"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Save } from "lucide-react";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { AppSettings } from "@/lib/types";
import { ALL_DURATIONS, normalizeSettings, ratesFor } from "@/lib/settings";
import { monthlyPayment, monthlyInsurance, round2 } from "@/lib/pricing";
import { eur, dateFr } from "@/lib/format";
import { VAT_RATES } from "@/lib/catalog";
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
      // Les taux de financement se modifient depuis le tableau de bord : on les relit pour ne pas les écraser.
      const latest = await getStore().getSettings();
      const s = await getStore().saveSettings(normalizeSettings({ ...settings, organismes: latest.organismes }));
      setSettings(s);
      setSaved(s);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  // Aperçu : mensualités pour 10 000 € avec l'organisme par défaut (intérêts normaux).
  const sample = 10000;
  const rates = ratesFor(settings, settings.organismeDefaut, "normal");
  const preview = settings.dureesProposees.map((m) => ({
    m,
    sans: monthlyPayment(sample, rates.taux, m) ?? 0,
    avec: round2((monthlyPayment(sample, rates.taux, m) ?? 0) + monthlyInsurance(sample, rates.tauxAssurance)),
  }));

  return (
    <div className="max-w-4xl mx-auto">
      <Reveal>
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Direction</p>
            <h1 className="font-display text-[28px] sm:text-[32px] font-semibold text-ink leading-tight mt-1">Paramètres</h1>
            <p className="text-sm text-muted mt-1">
              Ces valeurs s&apos;appliquent aux <b className="text-ink">nouveaux bons</b>.
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
          <Link href="/tableau-de-bord#taux" className="block">
            <Card className="p-4 flex items-center gap-3 hover:border-brand-blue/40 transition">
              <div className="flex-1">
                <div className="font-semibold">Taux de financement des organismes</div>
                <div className="text-sm text-muted">Sofinco, Domofinance, autre : à modifier depuis le tableau de bord.</div>
              </div>
              <ArrowUpRight className="size-5 text-brand-blue" />
            </Card>
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="p-5 sm:p-6">
            <SectionTitle sub="Le prix TTC saisi par le commercial comprend toujours une installation : une part du TTC lui est affectée automatiquement (matériel = TTC − installation).">Installation</SectionTitle>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Part d'installation" hint="% du TTC de chaque ligne de matériel">
                <NumberInput value={settings.poseRate} onChange={(v) => set({ poseRate: v ?? 0 })} suffix="%" />
              </Field>
              <Field label="TVA de l'installation">
                <Select value={settings.poseVatRate} onChange={(e) => set({ poseVatRate: parseFloat(e.target.value) })}>
                  {VAT_RATES.map((r) => (
                    <option key={r} value={r}>
                      {r} %
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="TVA par défaut du matériel">
                <Select value={settings.tvaDefaut} onChange={(e) => set({ tvaDefaut: parseFloat(e.target.value) })}>
                  {VAT_RATES.map((r) => (
                    <option key={r} value={r}>
                      {r} %
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="p-5 sm:p-6">
            <SectionTitle sub="Durées de crédit que le commercial peut proposer au client.">Durées de financement</SectionTitle>
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

            <div className="mt-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">
                Aperçu : {eur(sample)} chez {settings.organismeDefaut}, intérêts normaux ({String(rates.taux).replace(".", ",")} %)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-[10.5px] uppercase tracking-[0.12em] text-muted">
                    <tr>
                      <th className="text-left font-semibold px-3 py-2.5">Durée</th>
                      <th className="text-right font-semibold px-3 py-2.5">Sans assurance</th>
                      <th className="text-right font-semibold px-3 py-2.5">Avec assurance DIM</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
