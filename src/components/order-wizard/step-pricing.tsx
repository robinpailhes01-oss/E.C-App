"use client";

import type { AppSettings, Financing, Order, PaymentSchedule } from "@/lib/types";
import { FINANCING_ORGANISMS, VAT_RATES } from "@/lib/catalog";
import { computeTotals, paymentTable, round2, ttcToHT } from "@/lib/pricing";
import { eur } from "@/lib/format";
import { Field, Input, SectionTitle, SegmentedControl, Select, Textarea, Toggle, cx } from "@/components/ui";
import { NumberInput } from "@/components/number-input";

const SCHEDULE_ROWS: { key: keyof PaymentSchedule; label: string; hint: string }[] = [
  { key: "commande", label: "À la commande", hint: "Aucun encaissement avant 7 jours (vente à domicile)" },
  { key: "visiteTechnique", label: "À la visite technique", hint: "" },
  { key: "livraison", label: "À la livraison", hint: "" },
  { key: "installation", label: "À l'installation", hint: "Solde en fin de chantier" },
];

export function StepPricing({ order, onChange, settings }: { order: Order; onChange: (patch: Partial<Order>) => void; settings: AppSettings }) {
  const t = computeTotals(order);
  const f = order.financing;
  const setF = (patch: Partial<Financing>) => onChange({ financing: { ...f, ...patch } });
  const setSchedule = (key: keyof PaymentSchedule, v: number | undefined) => setF({ echeancier: { ...f.echeancier, [key]: v ?? 0 } });
  const setLine = (id: string, patch: { quantity?: number; unitPriceTTC?: number }) =>
    onChange({ lines: order.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  const table = t.montantFinance > 0 ? paymentTable(t.montantFinance, f.taux || 0, f.tauxAssurance || 0, settings.dureesProposees) : [];
  const soldeVers = (key: keyof PaymentSchedule) => {
    const others = SCHEDULE_ROWS.filter((r) => r.key !== key).reduce((s, r) => s + (f.echeancier[r.key] || 0), 0);
    setSchedule(key, Math.max(0, round2(t.totalTTC - others)));
  };

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------ Tarifs */}
      <section>
        <SectionTitle sub="Prix conseillés TTC pré-remplis, ajustables ligne par ligne. Le HT et la TVA sont déduits automatiquement.">Tarifs</SectionTitle>

        {/* Mobile : cartes */}
        <ul className="sm:hidden space-y-2.5">
          {order.lines.map((l) => (
            <li key={l.id} className="rounded-[16px] border border-line bg-panel p-3.5">
              <div className="font-medium leading-snug">{l.label}</div>
              <div className="grid grid-cols-[4.5rem_1fr_auto] gap-2 items-end mt-2.5">
                <Field label="Qté">
                  <Input type="number" min={1} value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })} className="text-center h-10 px-1" />
                </Field>
                <Field label="PU TTC">
                  <NumberInput value={l.unitPriceTTC} onChange={(v) => setLine(l.id, { unitPriceTTC: v ?? 0 })} suffix="€" className="text-right h-10" />
                </Field>
                <div className="text-right pb-2.5">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted font-bold">Total TTC</div>
                  <div className="num font-semibold">{eur(l.quantity * l.unitPriceTTC)}</div>
                </div>
              </div>
              <div className="text-xs text-muted mt-1.5">soit {eur(ttcToHT(l.unitPriceTTC, order.vatRate))} HT / unité</div>
            </li>
          ))}
        </ul>

        {/* Tablette / bureau : tableau */}
        <div className="hidden sm:block rounded-[16px] border border-line bg-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface text-[10.5px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">Désignation</th>
                <th className="text-center font-semibold px-2 py-2.5 w-20">Qté</th>
                <th className="text-right font-semibold px-2 py-2.5 w-40">PU TTC</th>
                <th className="text-right font-semibold px-3 py-2.5 w-28">PU HT</th>
                <th className="text-right font-semibold px-4 py-2.5 w-32">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium leading-snug">{l.label}</div>
                  </td>
                  <td className="px-2 py-2">
                    <Input type="number" min={1} value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })} className="text-center h-10 px-1" />
                  </td>
                  <td className="px-2 py-2">
                    <NumberInput value={l.unitPriceTTC} onChange={(v) => setLine(l.id, { unitPriceTTC: v ?? 0 })} suffix="€" className="text-right h-10" />
                  </td>
                  <td className="text-right px-3 py-2.5 text-muted tabular-nums">{eur(ttcToHT(l.unitPriceTTC, order.vatRate))}</td>
                  <td className="text-right px-4 py-2.5 num font-semibold">{eur(l.quantity * l.unitPriceTTC)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 mt-4">
          <Field label="Remise commerciale (TTC)" hint="Déduite du total TTC">
            <NumberInput value={order.remiseTTC || undefined} onChange={(v) => onChange({ remiseTTC: v ?? 0 })} suffix="€" placeholder="0" />
          </Field>
          <Field label="Taux de TVA" hint="20 % dans la plupart des cas">
            <Select value={order.vatRate} onChange={(e) => onChange({ vatRate: parseFloat(e.target.value) })}>
              {VAT_RATES.map((r) => (
                <option key={r} value={r}>
                  {r} %
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Délai d'installation" hint="Annoncé au client">
            <NumberInput value={order.delaiInstallationMois} onChange={(v) => onChange({ delaiInstallationMois: v ? Math.round(v) : undefined })} suffix="mois" placeholder="3" />
          </Field>
          <Field label="Date prévue (facultatif)">
            <Input type="date" value={order.dateInstallationPrevue ?? ""} onChange={(e) => onChange({ dateInstallationPrevue: e.target.value })} />
          </Field>
        </div>

        <div className="mt-4 rounded-[16px] bg-night text-white p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Total HT" value={eur(t.totalHT)} />
          <Stat label={`TVA ${order.vatRate} %`} value={eur(t.tva)} />
          <Stat label="Remise TTC" value={t.remiseTTC ? `- ${eur(t.remiseTTC)}` : "—"} />
          <Stat label="Total TTC" value={eur(t.totalTTC)} accent />
        </div>
      </section>

      {/* -------------------------------------------------------- Paiement */}
      <section>
        <SectionTitle sub="Comptant ou financement. Le pavé crédit n'apparaît qu'en cas de financement.">Paiement</SectionTitle>
        <SegmentedControl
          value={f.mode}
          onChange={(mode) => setF({ mode })}
          options={[
            { value: "comptant", label: "Paiement comptant" },
            { value: "credit", label: "Financement" },
          ]}
          className="max-w-md"
        />

        <div className="mt-4 rounded-[16px] border border-line bg-panel p-4">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div>
              <div className="font-semibold">{f.mode === "comptant" ? "Échéancier de règlement" : "Apport (acomptes versés hors crédit)"}</div>
              <div className="text-xs text-muted">{f.mode === "comptant" ? "Répartissez le total TTC. Laissez à 0 les étapes sans règlement." : "Le plus souvent 0 : la totalité est financée."}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted font-bold">{f.mode === "comptant" ? "Reste à répartir" : "Apport total"}</div>
              <div className={cx("num font-semibold", f.mode === "comptant" && t.resteARepartir !== 0 ? "text-brand-orange-dark" : "text-ink")}>
                {eur(f.mode === "comptant" ? t.resteARepartir : t.acomptes)}
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {SCHEDULE_ROWS.map((r) => (
              <div key={r.key} className="flex items-end gap-2">
                <Field label={r.label} hint={r.hint || undefined} className="flex-1">
                  <NumberInput value={f.echeancier[r.key] || undefined} onChange={(v) => setSchedule(r.key, v)} suffix="€" placeholder="0" />
                </Field>
                {f.mode === "comptant" && (
                  <button
                    type="button"
                    onClick={() => soldeVers(r.key)}
                    className={cx("h-11 px-3 rounded-[10px] text-xs font-semibold border border-line-strong bg-surface-2 hover:bg-panel transition whitespace-nowrap", r.hint && "mb-5")}
                    title="Mettre le solde restant sur cette échéance"
                  >
                    Solde
                  </button>
                )}
              </div>
            ))}
          </div>
          {(f.echeancier.commande || 0) > 0 && (
            <div className="grid sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-line">
              <Field label="Règlement de l'acompte à la commande">
                <Select value={f.acompteMode ?? "cheque"} onChange={(e) => setF({ acompteMode: e.target.value as Financing["acompteMode"] })}>
                  <option value="cheque">Chèque</option>
                  <option value="virement">Virement</option>
                  <option value="cb">Carte bancaire</option>
                  <option value="especes">Espèces</option>
                </Select>
              </Field>
              <Field label="Chèque d'acompte">
                <Toggle checked={Boolean(f.chequeRecupere)} onChange={(v) => setF({ chequeRecupere: v })} label={f.chequeRecupere ? "Récupéré par le commercial" : "Non récupéré"} />
              </Field>
            </div>
          )}
        </div>

        {f.mode === "credit" && (
          <div className="mt-4 rounded-[16px] border border-brand-blue/25 bg-brand-blue-soft/60 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Crédit {f.organisme || settings.organismeDefaut}</div>
                <div className="text-xs text-muted">
                  Taux débiteur <b className="text-ink">{(f.taux ?? 0).toString().replace(".", ",")} %</b> · assurance{" "}
                  <b className="text-ink">{(f.tauxAssurance ?? 0).toString().replace(".", ",")} %</b> / an · fixés par la direction
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted font-bold">Montant financé</div>
                <div className="num font-semibold text-lg">{eur(t.montantFinance)}</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Organisme">
                <Select value={f.organisme ?? ""} onChange={(e) => setF({ organisme: e.target.value })}>
                  {FINANCING_ORGANISMS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Assurance emprunteur">
                <Toggle checked={Boolean(f.avecAssurance)} onChange={(v) => setF({ avecAssurance: v })} label={f.avecAssurance ? "Avec assurance" : "Sans assurance"} />
              </Field>
              <Field label="Report (mois)">
                <NumberInput value={f.reportMois} onChange={(v) => setF({ reportMois: v ? Math.round(v) : undefined })} suffix="mois" placeholder="0" />
              </Field>
              <Field label="Nombre d'emprunteurs">
                <Select value={f.nbEmprunteurs ?? 1} onChange={(e) => setF({ nbEmprunteurs: parseInt(e.target.value, 10) })}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </Select>
              </Field>
              <Field label="Date de naissance (emprunteur 1)">
                <Input type="date" value={f.dateNaissance1 ?? ""} onChange={(e) => setF({ dateNaissance1: e.target.value })} />
              </Field>
              {(f.nbEmprunteurs ?? 1) === 2 ? (
                <Field label="Date de naissance (emprunteur 2)">
                  <Input type="date" value={f.dateNaissance2 ?? ""} onChange={(e) => setF({ dateNaissance2: e.target.value })} />
                </Field>
              ) : (
                <Field label="Situation">
                  <Toggle checked={f.enActivite !== false} onChange={(v) => setF({ enActivite: v })} label={f.enActivite !== false ? "En activité" : "Sans activité / retraité"} />
                </Field>
              )}
            </div>

            {/* Tableau des durées */}
            {table.length > 0 ? (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">Choisir la durée · mensualité {f.avecAssurance ? "avec" : "sans"} assurance</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {table.map((row) => {
                    const active = f.dureeMois === row.mois;
                    const m = f.avecAssurance ? row.avecAssurance : row.sansAssurance;
                    return (
                      <button
                        key={row.mois}
                        type="button"
                        onClick={() => setF({ dureeMois: row.mois })}
                        className={cx(
                          "rounded-[12px] border p-2.5 text-left transition",
                          active ? "border-night bg-night text-white shadow-[var(--shadow-float)]" : "border-line bg-panel hover:border-line-strong",
                        )}
                      >
                        <div className={cx("text-[10px] font-bold uppercase tracking-[0.1em]", active ? "text-white/60" : "text-muted")}>
                          {row.mois} mois{row.mois % 12 === 0 ? ` · ${row.mois / 12} ans` : ""}
                        </div>
                        <div className="num font-semibold text-[15px] mt-0.5">{eur(m)}</div>
                        <div className={cx("text-[10px]", active ? "text-white/60" : "text-muted")}>/ mois</div>
                      </button>
                    );
                  })}
                </div>
                {t.mensualite && f.dureeMois ? (
                  <p className="text-sm mt-3">
                    <b>{f.dureeMois} × {eur(t.mensualite)}</b> = {eur(t.coutTotalCredit)} au total
                    {t.assuranceMensuelle ? ` (dont assurance ${eur(t.assuranceMensuelle)} / mois)` : ""} · sous réserve d&apos;acceptation du dossier par l&apos;organisme.
                  </p>
                ) : (
                  <p className="text-sm mt-3 text-brand-orange-dark font-medium">Sélectionnez une durée pour fixer la mensualité.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Ajoutez des produits pour calculer les mensualités.</p>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Aides / primes estimées" hint="Indicatif, non déduit du bon">
            <NumberInput value={f.aides} onChange={(v) => setF({ aides: v })} suffix="€" placeholder="0" />
          </Field>
          <Field label="Commentaire paiement">
            <Input value={f.commentaire ?? ""} onChange={(e) => setF({ commentaire: e.target.value })} placeholder="Conditions particulières…" />
          </Field>
        </div>
      </section>

      <section>
        <SectionTitle sub="Imprimées sur le bon de commande.">Observations</SectionTitle>
        <Textarea value={order.notes ?? ""} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Précisions techniques, accès, contraintes de pose, matériel existant…" />
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={accent ? "rounded-[12px] bg-brand-orange px-3 py-2.5" : "px-3 py-2.5"}>
      <div className={`text-[10px] uppercase tracking-[0.14em] font-bold ${accent ? "text-white/80" : "text-white/55"}`}>{label}</div>
      <div className={`num font-semibold mt-0.5 ${accent ? "text-white text-xl" : "text-white text-[17px]"}`}>{value}</div>
    </div>
  );
}
