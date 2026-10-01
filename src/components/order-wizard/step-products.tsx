"use client";

import * as React from "react";
import { Minus, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { CATEGORIES, VAT_RATES, categoryColor, categoryShort, formatLineAttributes, groupsOf, productsByCategory } from "@/lib/catalog";
import { referencesFor } from "@/lib/references";
import type { OrderLine, Product, ProductAttribute, ProductCategory } from "@/lib/types";
import { eur, eur0, uid } from "@/lib/format";
import { lineParts, ttcToHT } from "@/lib/pricing";
import { Button, Field, Input, Modal, SectionTitle, Segmented, Select, cx } from "@/components/ui";
import { NumberInput } from "@/components/number-input";
import { InfoTip } from "@/components/info-tip";

export const attrsText = (l: OrderLine) => formatLineAttributes(l);

interface Props {
  lines: OrderLine[];
  vatRate: number;
  poseRate: number;
  poseVatRate: number;
  onChange: (l: OrderLine[]) => void;
}

export function StepProducts({ lines, vatRate, poseRate, poseVatRate, onChange }: Props) {
  const [cat, setCat] = React.useState<ProductCategory>("pv");
  const [sheet, setSheet] = React.useState<{ preset?: Product } | null>(null);
  const [sheetKey, setSheetKey] = React.useState(0);

  const countOf = (productId: string) => lines.filter((l) => l.productId === productId).reduce((s, l) => s + l.quantity, 0);
  const openSheet = (preset?: Product) => {
    setSheetKey((k) => k + 1);
    setSheet({ preset });
  };
  const setQty = (id: string, q: number) => onChange(q <= 0 ? lines.filter((l) => l.id !== id) : lines.map((l) => (l.id === id ? { ...l, quantity: q } : l)));

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle sub="Choisissez la rubrique puis touchez un produit : le prix se saisit à l'ajout, le « i » rappelle le prix conseillé.">Choisir les produits</SectionTitle>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {CATEGORIES.filter((c) => c.id !== "autre").map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={cx(
                "shrink-0 snap-start h-10 px-4 rounded-full text-[13px] font-semibold border transition",
                cat === c.id ? "text-white border-transparent shadow-[0_4px_12px_-4px_rgba(18,33,43,0.35)]" : "bg-panel text-ink-2 border-line-strong hover:border-ink/30",
              )}
              style={cat === c.id ? { background: c.color } : undefined}
            >
              {c.short}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted mt-1 mb-4">{CATEGORIES.find((c) => c.id === cat)?.label}</p>

        <div className="space-y-5">
          {groupsOf(cat).map((group) => (
            <div key={group}>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{group}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {productsByCategory(cat)
                  .filter((p) => p.group === group)
                  .map((p) => {
                    const n = countOf(p.id);
                    return (
                      <div
                        key={p.id}
                        className={cx(
                          "rounded-[16px] border p-3.5 pl-4 flex items-center gap-2 transition",
                          p.custom ? "border-dashed border-line-strong bg-surface-2" : "bg-panel",
                          n ? "border-brand-blue ring-[3px] ring-brand-blue/12 shadow-[var(--shadow-ambient)]" : !p.custom && "border-line hover:border-line-strong",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold leading-snug text-[15px] flex items-center gap-1.5">
                            {p.custom && <SlidersHorizontal className="size-4 text-brand-blue shrink-0" />}
                            <span>{p.custom ? "Personnalisé" : p.label}</span>
                          </div>
                          {p.custom && <div className="text-xs text-muted mt-0.5">{p.group.includes("avec") ? "kW et stockage au choix" : "kW au choix"}</div>}
                          {n > 0 && <div className="text-xs text-brand-blue-dark font-semibold mt-0.5">{n} sur le bon</div>}
                        </div>
                        {p.priceTTC > 0 && (
                          <InfoTip label="Prix conseillé">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Prix conseillé</span>
                            <span className="block num text-[16px] font-semibold mt-0.5">{eur0(p.priceTTC)} TTC</span>
                            <span className="block text-white/70">soit {eur0(ttcToHT(p.priceTTC, p.vatRate ?? vatRate))} HT à {p.vatRate ?? vatRate} %</span>
                            {p.priceNote && <span className="block text-white/60 text-[11.5px] mt-1.5">{p.priceNote}</span>}
                          </InfoTip>
                        )}
                        <Button type="button" size="sm" variant={n ? "secondary" : "primary"} onClick={() => openSheet(p)}>
                          <Plus className="size-4" /> {p.custom ? "Choisir" : "Ajouter"}
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" className="mt-5" onClick={() => openSheet()}>
          <Plus className="size-4" /> Autre produit / ligne libre
        </Button>
      </section>

      <section>
        <SectionTitle>Sélection ({lines.length})</SectionTitle>
        {lines.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-line-strong p-6 text-center text-sm text-muted">Aucun produit sélectionné pour le moment.</div>
        ) : (
          <ul className="divide-y divide-line rounded-[16px] border border-line bg-panel overflow-hidden">
            {lines.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3.5">
                <div className="flex items-center gap-3 basis-full sm:basis-0 sm:flex-1 min-w-0">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: categoryColor(l.category) }} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm leading-snug">{l.label}</div>
                    <div className="text-xs text-muted">{[categoryShort(l.category), attrsText(l), l.detail].filter(Boolean).join(" · ")}</div>
                    <div className="text-xs text-muted">
                      {eur0(l.unitPriceTTC)} TTC / unité{l.poseIncluse && poseRate > 0 ? ` · dont installation ${poseRate} %` : ""} · TVA {l.vatRate} %
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-auto sm:ml-0">
                  <button type="button" onClick={() => setQty(l.id, l.quantity - 1)} className="size-9 grid place-items-center rounded-[9px] bg-ink/6 hover:bg-ink/10 transition" aria-label="Moins">
                    <Minus className="size-4" />
                  </button>
                  <span className="w-7 text-center num font-semibold text-sm">{l.quantity}</span>
                  <button type="button" onClick={() => setQty(l.id, l.quantity + 1)} className="size-9 grid place-items-center rounded-[9px] bg-ink/6 hover:bg-ink/10 transition" aria-label="Plus">
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="w-24 text-right num font-semibold text-sm">{eur0(l.quantity * l.unitPriceTTC)}</div>
                <button type="button" onClick={() => setQty(l.id, 0)} className="size-9 grid place-items-center rounded-[9px] text-red-500 hover:bg-red-50 transition" aria-label="Supprimer">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddLineSheet
        key={sheetKey}
        open={sheet !== null}
        preset={sheet?.preset}
        defaultVat={vatRate}
        poseRate={poseRate}
        poseVatRate={poseVatRate}
        category={cat}
        onClose={() => setSheet(null)}
        onAdd={(l) => onChange([...lines, l])}
      />
    </div>
  );
}

const MARQUE_REF: ProductAttribute[] = [
  { key: "marque", label: "Marque", type: "text", required: true, placeholder: "fabricant" },
  { key: "ref", label: "Référence", type: "text", required: true, placeholder: "référence constructeur" },
];

function AddLineSheet({
  open,
  preset,
  defaultVat,
  poseRate,
  poseVatRate,
  category,
  onClose,
  onAdd,
}: {
  open: boolean;
  preset?: Product;
  defaultVat: number;
  poseRate: number;
  poseVatRate: number;
  category: ProductCategory;
  onClose: () => void;
  onAdd: (l: OrderLine) => void;
}) {
  const [freeLabel, setFreeLabel] = React.useState("");
  const [kind, setKind] = React.useState<"materiel" | "prestation">("materiel");
  const [detail, setDetail] = React.useState("");
  const [price, setPrice] = React.useState<number | undefined>(undefined);
  const [qty, setQty] = React.useState(1);
  const [vat, setVat] = React.useState(preset?.vatRate ?? defaultVat);
  const [cat, setCat] = React.useState<ProductCategory>(preset?.category ?? category);
  const [attrs, setAttrs] = React.useState<Record<string, string>>(() => Object.fromEntries((preset?.attributes ?? []).filter((a) => a.default).map((a) => [a.key, a.default as string])));
  const priceRef = React.useRef<HTMLInputElement>(null);

  const free = !preset;
  const attributes: ProductAttribute[] = free ? (kind === "materiel" ? MARQUE_REF : []) : preset.attributes ?? [];
  const poseIncluse = free ? kind === "materiel" : preset.poseIncluse !== false;
  const refs = referencesFor(preset?.id, cat);

  const label = free ? freeLabel.trim() : preset.custom && preset.labelFrom ? preset.labelFrom(attrs) : preset.label;
  const missing = attributes.filter((a) => a.required && !(attrs[a.key] ?? "").trim());
  const valid = label.length > 0 && price !== undefined && price >= 0 && missing.length === 0;

  const parts =
    price !== undefined && price > 0
      ? lineParts({ id: "x", category: cat, label: "", quantity: 1, unitPriceTTC: price, vatRate: vat, poseIncluse, poseVatRate }, poseRate)
      : null;

  const submit = () => {
    if (!valid) return;
    const clean = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v && v.trim()));
    onAdd({
      id: uid(),
      productId: preset?.id,
      category: cat,
      label,
      description: preset?.description,
      detail: detail.trim() || undefined,
      attributes: Object.keys(clean).length ? clean : undefined,
      quantity: Math.max(1, qty),
      unitPriceTTC: price ?? 0,
      vatRate: vat,
      poseIncluse,
      poseVatRate,
    });
    onClose();
  };

  const setAttr = (k: string, v: string) => setAttrs((prev) => ({ ...prev, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title={free ? "Autre produit / ligne libre" : preset.custom ? "Kit personnalisé" : preset.label}>
      <div className="space-y-4">
        {free && (
          <>
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: "materiel", label: "Matériel" },
                { value: "prestation", label: "Prestation" },
              ]}
            />
            <Field label="Désignation" required>
              <Input value={freeLabel} onChange={(e) => setFreeLabel(e.target.value)} placeholder="ex. Carport solaire, reprise de toiture…" />
            </Field>
          </>
        )}
        {!free && preset.custom && label && <p className="text-sm font-semibold text-ink-2 rounded-[12px] bg-brand-blue-soft px-3 py-2">{label}</p>}
        {!free && preset.description && <p className="text-xs text-muted leading-relaxed rounded-[12px] bg-surface px-3 py-2">{preset.description}</p>}

        {attributes.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {attributes.map((a) => (
              <Field key={a.key} label={a.label} required={a.required} className={a.type === "text" && a.key === "produits" ? "col-span-2" : ""}>
                {a.type === "select" ? (
                  <Select value={attrs[a.key] ?? ""} onChange={(e) => setAttr(a.key, e.target.value)}>
                    <option value="">—</option>
                    {a.options?.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                ) : a.type === "number" ? (
                  <NumberInput value={attrs[a.key] ? parseFloat(attrs[a.key].replace(",", ".")) : undefined} onChange={(v) => setAttr(a.key, v === undefined ? "" : String(v))} suffix={a.unit} placeholder={a.placeholder} />
                ) : (
                  <>
                    <Input
                      value={attrs[a.key] ?? ""}
                      onChange={(e) => setAttr(a.key, e.target.value)}
                      placeholder={a.placeholder}
                      list={a.key === "marque" && refs.marques?.length ? "dl-marques" : a.key === "ref" && refs.refs?.length ? "dl-refs" : undefined}
                    />
                  </>
                )}
              </Field>
            ))}
            <datalist id="dl-marques">{refs.marques?.map((m) => <option key={m} value={m} />)}</datalist>
            <datalist id="dl-refs">{refs.refs?.map((m) => <option key={m} value={m} />)}</datalist>
          </div>
        )}

        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Field label="Prix unitaire TTC" required hint={!free && preset.priceTTC ? undefined : "Installation comprise"}>
            <div className="flex items-center gap-1.5">
              <NumberInput ref={priceRef} value={price} onChange={setPrice} suffix="€" placeholder="0" className="text-[17px] font-semibold" />
              {!free && preset.priceTTC ? (
                <InfoTip label="Prix conseillé">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Prix conseillé</span>
                  <span className="block num text-[16px] font-semibold mt-0.5">{eur0(preset.priceTTC)} TTC</span>
                  <span className="block text-white/70">soit {eur0(ttcToHT(preset.priceTTC, vat))} HT à {vat} %</span>
                  {preset.priceNote && <span className="block text-white/60 text-[11.5px] mt-1.5">{preset.priceNote}</span>}
                </InfoTip>
              ) : null}
            </div>
          </Field>
          <Field label="Qté">
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || "1", 10)))} className="text-center" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={poseIncluse ? "TVA du matériel" : "TVA"}>
            <Select value={vat} onChange={(e) => setVat(parseFloat(e.target.value))}>
              {VAT_RATES.map((r) => (
                <option key={r} value={r}>
                  {r} %
                </option>
              ))}
            </Select>
          </Field>
          {free ? (
            <Field label="Rubrique">
              <Select value={cat} onChange={(e) => setCat(e.target.value as ProductCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.short}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Précision (facultatif)">
              <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="ex. garantie, coloris…" />
            </Field>
          )}
        </div>

        {parts && (
          <div className="rounded-[14px] border border-line bg-surface-2 px-3.5 py-3 text-[13px] space-y-1">
            <div className="flex justify-between">
              <span className="text-muted">Matériel</span>
              <span className="num font-semibold">
                {eur(parts.materiel.ttc)} <span className="text-muted font-normal">TTC · {eur(parts.materiel.ht)} HT · TVA {parts.materiel.rate} %</span>
              </span>
            </div>
            {parts.pose && (
              <div className="flex justify-between">
                <span className="text-muted">Installation ({poseRate} %)</span>
                <span className="num font-semibold">
                  {eur(parts.pose.ttc)} <span className="text-muted font-normal">TTC · {eur(parts.pose.ht)} HT · TVA {parts.pose.rate} %</span>
                </span>
              </div>
            )}
          </div>
        )}

        {missing.length > 0 && <p className="text-xs font-medium text-brand-orange-dark">À renseigner : {missing.map((m) => m.label.toLowerCase()).join(", ")}.</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={submit} disabled={!valid}>
            <Plus className="size-4" /> Ajouter au bon
          </Button>
        </div>
      </div>
    </Modal>
  );
}
