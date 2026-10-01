"use client";

import type { AppSettings, Financing, InteretModalite, Order, OrderLine, PaymentSchedule } from "@/lib/types";
import { FINANCING_ORGANISMS, VAT_RATES, productById } from "@/lib/catalog";
import { lineParts, computeTotals, paymentTable, poseRateOf, round2, ttcToHT } from "@/lib/pricing";
import { ratesFor } from "@/lib/settings";
import { InfoTip } from "@/components/info-tip";
import { eur } from "@/lib/format";
import { Field, Input, SectionTitle, Segmented, Select, Textarea, Toggle, cx } from "@/components/ui";
import { NumberInput } from "@/components/number-input";
import { attrsText } from "./step-products";
import type { PaymentErrors } from "./model";

const SCHEDULE_ROWS: { key: keyof PaymentSchedule; label: string; hint: string }[] = [
  { key: "commande", label: "À la commande", hint: "Aucun encaissement avant 7 jours (vente à domicile)" },
  { key: "visiteTechnique", label: "À la visite technique", hint: "" },
  { key: "livraison", label: "À la livraison", hint: "" },
  { key: "installation", label: "À l'installation", hint: "Solde en fin de chantier" },
];

export function StepPricing({
  order,
  onChange,
  settings,
  errors,
}: {
  order: Order;
  onChange: (patch: Partial<Order>) => void;
  settings: AppSettings;
  errors: PaymentErrors;
}) {
  const t = computeTotals(order);
  const poseRate = poseRateOf(order);
  const f = order.financing;
  const setF = (patch: Partial<Financing>) => onChange({ financing: { ...f, ...patch } });
  const setSchedule = (key: keyof PaymentSchedule, v: number | undefined) => setF({ echeancier: { ...f.echeancier, [key]: v ?? 0 } });
  const setLine = (id: string, patch: Partial<Pick<OrderLine, "quantity" | "unitPriceTTC" | "vatRate" | "poseVatRate">>) =>
    onChange({ lines: order.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const setRates = (organisme: string, modalite: InteretModalite) => setF({ organisme, modaliteInteret: modalite, ...ratesFor(settings, organisme, modalite) });

  const tip = (l: OrderLine) => {
    const p = l.productId ? productById(l.productId) : undefined;
    if (!p?.priceTTC) return null;
    return (
      <InfoTip label="Prix conseillé">
        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Prix conseillé</span>
        <span className="block num text-[16px] font-semibold mt-0.5">{eur(p.priceTTC)} TTC</span>
        <span className="block text-white/70">soit {eur(ttcToHT(p.priceTTC, l.vatRate))} HT</span>
        {p.priceNote && <span className="block text-white/60 text-[11.5px] mt-1.5">{p.priceNote}</span>}
      </InfoTip>
    );
  };
  const hasReducedVat = order.lines.some((l) => l.vatRate < 20 || (l.poseIncluse && l.poseVatRate < 20));
  const vatKeys = Object.keys(t.tvaParTaux).sort((a, b) => parseFloat(b) - parseFloat(a));

  const table = t.montantFinance > 0 ? paymentTable(t.montantFinance, f.taux || 0, f.tauxAssurance || 0, settings.dureesProposees) : [];
  const soldeVers = (key: keyof PaymentSchedule) => {
    const others = SCHEDULE_ROWS.filter((r) => r.key !== key).reduce((s, r) => s + (f.echeancier[r.key] || 0), 0);
    setSchedule(key, Math.max(0, round2(t.totalTTC - others)));
  };
  const showMode = f.mode === "comptant" || t.acomptes > 0;
  const modalite = f.modaliteInteret ?? "normal";

  /** Détail sous le TTC d'une ligne : matériel et installation avec HT et TVA. */
  const detail = (l: OrderLine) => {
    const parts = lineParts(l, poseRate);
    const rows: { key: string; label: string; ht: number; tva: number; ttc: number; select?: boolean; rate: number }[] = [
      { key: "mat", label: l.poseIncluse && parts.pose ? "Matériel" : "Montant", ht: parts.materiel.ht, tva: parts.materiel.tva, ttc: parts.materiel.ttc, rate: l.vatRate },
    ];
    if (parts.pose) rows.push({ key: "pose", label: `Installation (${poseRate} %)`, ht: parts.pose.ht, tva: parts.pose.tva, ttc: parts.pose.ttc, rate: l.poseVatRate, select: true });
    return (
      <div className="rounded-[12px] bg-surface px-3 py-2 text-[12.5px]">
        <div className="hidden sm:grid grid-cols-[1fr_6.5rem_8.5rem_6.5rem] gap-x-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted pb-1">
          <span>Détail</span>
          <span className="text-right">HT</span>
          <span className="text-right">TVA</span>
          <span className="text-right">TTC</span>
        </div>
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-2 sm:grid-cols-[1fr_6.5rem_8.5rem_6.5rem] gap-x-3 gap-y-0.5 items-center py-0.5">
            <span className="font-medium text-ink-2 col-span-2 sm:col-span-1">{r.label}</span>
            <span className="sm:text-right tabular-nums text-muted">
              <span className="sm:hidden text-[10px] uppercase tracking-wider mr-1">HT</span>
              {eur(r.ht)}
            </span>
            <span className="sm:text-right tabular-nums text-muted flex items-center sm:justify-end gap-1.5 justify-end">
              {r.select ? (
                <select
                  value={r.rate}
                  onChange={(e) => setLine(l.id, { poseVatRate: parseFloat(e.target.value) })}
                  className="h-7 rounded-md border border-line-strong bg-panel text-[12px] px-1"
                  aria-label="TVA installation"
                >
                  {VAT_RATES.map((v) => (
                    <option key={v} value={v}>
                      {v} %
                    </option>
                  ))}
                </select>
              ) : (
                <span>{r.rate} %</span>
              )}
              <span>{eur(r.tva)}</span>
            </span>
            <span className="text-right tabular-nums font-semibold text-ink">
              <span className="sm:hidden text-[10px] uppercase tracking-wider text-muted font-bold mr-1">TTC</span>
              {eur(r.ttc)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------ Tarifs */}
      <section>
        <SectionTitle sub={`Le prix TTC saisi comprend l'installation (${poseRate} % du TTC, répartie automatiquement). Le « i » rappelle le prix conseillé.`}>Tarifs</SectionTitle>

        {/* Mobile : cartes */}
        <ul className="sm:hidden space-y-2.5">
          {order.lines.map((l) => (
            <li key={l.id} className="rounded-[16px] border border-line bg-panel p-3.5 space-y-2.5">
              <div>
                <div className="font-medium leading-snug">{l.label}</div>
                {attrsText(l) && <div className="text-xs text-muted">{attrsText(l)}</div>}
              </div>
              <div className="grid grid-cols-[4rem_1fr_auto] gap-2 items-end">
                <Field label="Qté">
                  <Input type="number" min={1} value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })} className="text-center h-10 px-1" />
                </Field>
                <Field label="PU TTC">
                  <div className="flex items-center gap-1">
                    <NumberInput value={l.unitPriceTTC} onChange={(v) => setLine(l.id, { unitPriceTTC: v ?? 0 })} suffix="€" className="text-right h-10" />
                    {tip(l)}
                  </div>
                </Field>
                <div className="text-right pb-2.5">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted font-bold">Total TTC</div>
                  <div className="num font-semibold">{eur(l.quantity * l.unitPriceTTC)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted">TVA du matériel</span>
                <Select value={l.vatRate} onChange={(e) => setLine(l.id, { vatRate: parseFloat(e.target.value) })} className="h-9 w-28 text-[13px]">
                  {VAT_RATES.map((r) => (
                    <option key={r} value={r}>
                      {r} %
                    </option>
                  ))}
                </Select>
              </div>
              {detail(l)}
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
                <th className="text-right font-semibold px-2 py-2.5 w-44">PU TTC</th>
                <th className="text-center font-semibold px-2 py-2.5 w-28">TVA matériel</th>
                <th className="text-right font-semibold px-4 py-2.5 w-32">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.lines.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="px-4 py-3" colSpan={5}>
                    <div className="grid grid-cols-[1fr_5rem_11rem_7rem_8rem] items-center gap-x-2">
                      <div>
                        <div className="font-medium leading-snug">{l.label}</div>
                        {attrsText(l) && <div className="text-xs text-muted">{attrsText(l)}</div>}
                      </div>
                      <Input type="number" min={1} value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Math.max(1, parseInt(e.target.value || "1", 10)) })} className="text-center h-10 px-1" />
                      <div className="flex items-center gap-1">
                        <NumberInput value={l.unitPriceTTC} onChange={(v) => setLine(l.id, { unitPriceTTC: v ?? 0 })} suffix="€" className="text-right h-10" />
                        {tip(l)}
                      </div>
                      <Select value={l.vatRate} onChange={(e) => setLine(l.id, { vatRate: parseFloat(e.target.value) })} className="h-10 text-[13px] px-2 pr-7">
                        {VAT_RATES.map((r) => (
                          <option key={r} value={r}>
                            {r} %
                          </option>
                        ))}
                      </Select>
                      <div className="text-right num font-semibold">{eur(l.quantity * l.unitPriceTTC)}</div>
                    </div>
                    <div className="mt-2">{detail(l)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid sm:grid-cols-4 gap-4 mt-4">
          <Field label="Remise commerciale (TTC)" hint="Déduite du total TTC">
            <NumberInput value={order.remiseTTC || undefined} onChange={(v) => onChange({ remiseTTC: v ?? 0 })} suffix="€" placeholder="0" />
          </Field>
          <Field label="TVA des prochaines lignes" hint="Chaque ligne garde son propre taux">
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
          <div className="px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-white/55">TVA</div>
            {vatKeys.length === 0 ? (
              <div className="num font-semibold mt-0.5 text-[17px]">—</div>
            ) : (
              vatKeys.map((k) => (
                <div key={k} className="flex items-baseline gap-2">
                  <span className="text-white/60 text-xs w-10">{k} %</span>
                  <span className="num font-semibold text-[15px]">{eur(t.tvaParTaux[k].tva)}</span>
                </div>
              ))
            )}
          </div>
          <Stat label="Remise TTC" value={t.remiseTTC ? `- ${eur(t.remiseTTC)}` : "—"} />
          <Stat label="Total TTC" value={eur(t.totalTTC)} accent />
        </div>
        {t.pose.ttc > 0 && (
          <p className="text-xs text-muted mt-2 px-1">
            Dont installation : <b className="text-ink">{eur(t.pose.ttc)} TTC</b> · {eur(t.pose.ht)} HT · TVA {eur(t.pose.tva)}. Matériel : {eur(round2(t.totalTTC - t.pose.ttc))} TTC.
          </p>
        )}

        {hasReducedVat && (
          <label className="mt-4 flex items-start gap-3 rounded-[16px] border border-line bg-surface-2 p-4 text-sm cursor-pointer has-[:checked]:border-brand-green has-[:checked]:bg-brand-green-soft/50 transition-colors">
            <input type="checkbox" checked={Boolean(order.attestationTvaReduite)} onChange={(e) => onChange({ attestationTvaReduite: e.target.checked })} className="mt-0.5 size-5 accent-brand-green" />
            <span>
              <b>Attestation TVA réduite.</b> Le client certifie que son habitation a plus de deux ans et est occupée à plus de 50 % à usage d&apos;habitation (imprimée sur le bon).
            </span>
          </label>
        )}
      </section>

      {/* -------------------------------------------------------- Paiement */}
      <section id="paiement">
        <SectionTitle sub="Comptant ou financement. L'échéancier et le mode de règlement sont obligatoires.">Paiement</SectionTitle>
        <Segmented
          value={f.mode}
          onChange={(mode) => {
            // Passer au crédit avec un échéancier qui couvre déjà tout le montant laisserait 0 € à financer : on repart à zéro.
            if (mode === "credit" && t.acomptes >= t.totalTTC && t.totalTTC > 0) setF({ mode, echeancier: { commande: 0, visiteTechnique: 0, livraison: 0, installation: 0 } });
            else setF({ mode });
          }}
          options={[
            { value: "comptant", label: "Paiement comptant" },
            { value: "credit", label: "Financement" },
          ]}
          className="max-w-md"
        />

        {showMode && (
          <div className="mt-4 rounded-[16px] border border-line bg-panel p-4">
            <Field label="Mode de règlement" required error={errors.mode}>
              <Segmented
                value={(f.acompteMode ?? "") as "cheque" | "virement" | ""}
                onChange={(v) => v && setF({ acompteMode: v })}
                options={[
                  { value: "cheque", label: "Chèque" },
                  { value: "virement", label: "Virement" },
                ]}
                className="max-w-xs"
              />
            </Field>
            {f.acompteMode === "cheque" && (f.echeancier.commande || 0) > 0 && (
              <div className="mt-3">
                <Toggle checked={Boolean(f.chequeRecupere)} onChange={(v) => setF({ chequeRecupere: v })} label={f.chequeRecupere ? "Chèque d'acompte récupéré" : "Chèque d'acompte non récupéré"} />
              </div>
            )}
          </div>
        )}

        <div className={cx("mt-4 rounded-[16px] border bg-panel p-4", errors.echeancier ? "border-red-300" : "border-line")}>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div>
              <div className="font-semibold">
                {f.mode === "comptant" ? "Échéancier de règlement" : "Apport (acomptes versés hors crédit)"}
                {f.mode === "comptant" && <span className="text-brand-orange"> *</span>}
              </div>
              <div className="text-xs text-muted">{f.mode === "comptant" ? "Répartissez la totalité du total TTC entre les étapes." : "Le plus souvent 0 : la totalité est financée."}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted font-bold">{f.mode === "comptant" ? "Reste à répartir" : "Apport total"}</div>
              <div className={cx("num font-semibold", f.mode === "comptant" && t.resteARepartir !== 0 ? "text-brand-orange-dark" : "text-brand-green-dark")}>
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
          {errors.echeancier && <p className="mt-3 text-sm font-medium text-red-600">{errors.echeancier}</p>}
        </div>

        {f.mode === "credit" && (
          <div className="mt-4 rounded-[16px] border border-brand-blue/25 bg-brand-blue-soft/60 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Crédit {f.organisme || settings.organismeDefaut}</div>
                <div className="text-xs text-muted">
                  Taux nominal <b className="text-ink">{(f.taux ?? 0).toString().replace(".", ",")} %</b> · TAEG <b className="text-ink">{(f.taeg ?? 0).toString().replace(".", ",")} %</b> · assurance DIM{" "}
                  <b className="text-ink">{(f.tauxAssurance ?? 0).toString().replace(".", ",")} %</b> / an · fixés par la direction
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted font-bold">Montant financé</div>
                <div className="num font-semibold text-lg">{eur(t.montantFinance)}</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Organisme" required error={errors.organisme}>
                <Select value={f.organisme ?? ""} onChange={(e) => setRates(e.target.value, modalite)}>
                  {FINANCING_ORGANISMS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Intérêts" className="sm:col-span-2">
                <Segmented
                  value={modalite}
                  onChange={(m) => setRates(f.organisme ?? settings.organismeDefaut, m)}
                  options={[
                    { value: "normal", label: "Normal" },
                    { value: "compense", label: "Compensé" },
                    { value: "gratuit", label: "Gratuit" },
                  ]}
                />
              </Field>
              <Field label="Assurance DIM" hint="Décès, invalidité, maladie">
                <Toggle checked={Boolean(f.avecAssurance)} onChange={(v) => setF({ avecAssurance: v })} label={f.avecAssurance ? "Avec assurance DIM" : "Sans assurance"} />
              </Field>
              <Field label="Report de la 1re échéance">
                <Select value={f.reportJours ?? 0} onChange={(e) => setF({ reportJours: parseInt(e.target.value, 10) || undefined })}>
                  <option value={0}>Sans report</option>
                  <option value={180}>180 jours (6 mois)</option>
                </Select>
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
              {(f.nbEmprunteurs ?? 1) === 2 && (
                <Field label="Date de naissance (emprunteur 2)">
                  <Input type="date" value={f.dateNaissance2 ?? ""} onChange={(e) => setF({ dateNaissance2: e.target.value })} />
                </Field>
              )}
              <Field label="Situation" className="sm:col-span-2">
                <Segmented
                  value={f.situation ?? "activite"}
                  onChange={(v) => setF({ situation: v })}
                  options={[
                    { value: "activite", label: "En activité" },
                    { value: "retraite", label: "Retraité" },
                  ]}
                  className="max-w-xs"
                />
              </Field>
            </div>

            {/* Tableau des durées */}
            {table.length > 0 ? (
              <div>
                <div className={cx("text-[11px] font-bold uppercase tracking-[0.12em] mb-2", errors.duree ? "text-red-600" : "text-muted")}>
                  Choisir la durée * · mensualité {f.avecAssurance ? "avec" : "sans"} assurance DIM
                </div>
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
                {errors.duree && <p className="mt-2 text-sm font-medium text-red-600">{errors.duree}</p>}
                {t.mensualite && f.dureeMois ? (
                  <p className="text-sm mt-3">
                    <b>{f.dureeMois} × {eur(t.mensualite)}</b> = {eur(t.coutTotalCredit)} au total
                    {t.assuranceMensuelle ? ` (dont assurance DIM ${eur(t.assuranceMensuelle)} / mois)` : ""}
                    {f.reportJours ? ` · report ${f.reportJours} jours` : ""} · sous réserve d&apos;acceptation du dossier par l&apos;organisme.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted">Ajoutez des produits pour calculer les mensualités.</p>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <Field label="Prime CEE" hint="Montant imprimé dans la clause CEE du bon">
            <NumberInput value={f.primeCEE} onChange={(v) => setF({ primeCEE: v })} suffix="€" placeholder="0" />
          </Field>
          <Field label="Autres aides estimées" hint="Indicatif, non déduit du bon">
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
