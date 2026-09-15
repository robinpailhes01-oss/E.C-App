"use client";

import * as React from "react";
import { Minus, Plus, Trash2, Wrench } from "lucide-react";
import { CATEGORIES, VAT_RATES, categoryColor, categoryShort, formatLineAttributes, groupsOf, productsByCategory } from "@/lib/catalog";
import type { OrderLine, Product, ProductCategory } from "@/lib/types";
import { eur0, uid } from "@/lib/format";
import { ttcToHT } from "@/lib/pricing";
import { Button, Field, Input, Modal, SectionTitle, Select, cx } from "@/components/ui";
import { NumberInput } from "@/components/number-input";
import { InfoTip } from "@/components/info-tip";

export function StepProducts({ lines, vatRate, onChange }: { lines: OrderLine[]; vatRate: number; onChange: (l: OrderLine[]) => void }) {
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
                          "rounded-[16px] border bg-panel p-3.5 pl-4 flex items-center gap-2 transition",
                          n ? "border-brand-blue ring-[3px] ring-brand-blue/12 shadow-[var(--shadow-ambient)]" : "border-line hover:border-line-strong",
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold leading-snug text-[15px] flex items-center gap-1.5">
                            {p.installation && <Wrench className="size-4 text-muted shrink-0" />}
                            <span>{p.label}</span>
                          </div>
                          {n > 0 && <div className="text-xs text-brand-blue-dark font-semibold mt-0.5">{n} sur le bon</div>}
                        </div>
                        {p.priceTTC > 0 && (
                          <InfoTip label="Prix conseillé">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Prix conseillé</span>
                            <span className="block num text-[16px] font-semibold mt-0.5">{eur0(p.priceTTC)} TTC</span>
                            <span className="block text-white/70">soit {eur0(ttcToHT(p.priceTTC, vatRate))} HT à {vatRate} %</span>
                          </InfoTip>
                        )}
                        <Button type="button" size="sm" variant={n ? "secondary" : "primary"} onClick={() => openSheet(p)}>
                          <Plus className="size-4" /> Ajouter
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
                    <div className="text-xs text-muted">
                      {[categoryShort(l.category), attrsText(l), l.detail].filter(Boolean).join(" · ")}
                    </div>
                    <div className="text-xs text-muted">
                      {eur0(l.unitPriceTTC)} TTC / unité · soit {eur0(ttcToHT(l.unitPriceTTC, l.vatRate))} HT · TVA {l.vatRate} %
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

      <AddLineSheet key={sheetKey} open={sheet !== null} preset={sheet?.preset} defaultVat={vatRate} category={cat} onClose={() => setSheet(null)} onAdd={(l) => onChange([...lines, l])} />
    </div>
  );
}

export const attrsText = (l: OrderLine) => formatLineAttributes(l);

function AddLineSheet({
  open,
  preset,
  defaultVat,
  category,
  onClose,
  onAdd,
}: {
  open: boolean;
  preset?: Product;
  defaultVat: number;
  category: ProductCategory;
  onClose: () => void;
  onAdd: (l: OrderLine) => void;
}) {
  const [label, setLabel] = React.useState(preset?.label ?? "");
  const [detail, setDetail] = React.useState("");
  const [price, setPrice] = React.useState<number | undefined>(undefined);
  const [qty, setQty] = React.useState(1);
  const [vat, setVat] = React.useState(defaultVat);
  const [cat, setCat] = React.useState<ProductCategory>(preset?.category ?? category);
  const [attrs, setAttrs] = React.useState<Record<string, string>>({});
  const priceRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) setTimeout(() => priceRef.current?.focus(), 80);
  }, [open]);

  const valid = label.trim().length > 0 && price !== undefined && price >= 0;
  const submit = () => {
    if (!valid) return;
    onAdd({
      id: uid(),
      productId: preset?.id,
      category: cat,
      label: label.trim(),
      description: preset?.description,
      detail: detail.trim() || undefined,
      attributes: Object.keys(attrs).length ? attrs : undefined,
      quantity: Math.max(1, qty),
      unitPriceTTC: price ?? 0,
      vatRate: vat,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={preset ? preset.label : "Autre produit"}>
      <div className="space-y-4">
        {!preset && (
          <Field label="Désignation" required>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex. Carport solaire, reprise de toiture…" />
          </Field>
        )}
        {preset?.description && <p className="text-xs text-muted leading-relaxed rounded-[12px] bg-surface px-3 py-2">{preset.description}</p>}

        {preset?.attributes && (
          <div className="grid grid-cols-2 gap-3">
            {preset.attributes.map((a) => (
              <Field key={a.key} label={a.label} className={a.type === "text" && a.key === "produits" ? "col-span-2" : ""}>
                {a.type === "select" ? (
                  <Select value={attrs[a.key] ?? ""} onChange={(e) => setAttrs({ ...attrs, [a.key]: e.target.value })}>
                    <option value="">—</option>
                    {a.options?.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                ) : (
                  <Input value={attrs[a.key] ?? ""} onChange={(e) => setAttrs({ ...attrs, [a.key]: e.target.value })} placeholder={a.placeholder} />
                )}
              </Field>
            ))}
          </div>
        )}

        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Field label="Prix unitaire TTC" required hint={preset?.priceTTC ? undefined : "Aucun prix conseillé pour cet article"}>
            <div className="flex items-center gap-1.5">
              <NumberInput ref={priceRef} value={price} onChange={setPrice} suffix="€" placeholder="0" className="text-[17px] font-semibold" />
              {preset?.priceTTC ? (
                <InfoTip label="Prix conseillé">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">Prix conseillé</span>
                  <span className="block num text-[16px] font-semibold mt-0.5">{eur0(preset.priceTTC)} TTC</span>
                  <span className="block text-white/70">soit {eur0(ttcToHT(preset.priceTTC, vat))} HT à {vat} %</span>
                </InfoTip>
              ) : null}
            </div>
          </Field>
          <Field label="Qté">
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || "1", 10)))} className="text-center" />
          </Field>
        </div>
        {price !== undefined && price > 0 && (
          <p className="text-xs text-muted -mt-2">
            soit <b className="text-ink">{eur0(ttcToHT(price, vat))} HT</b> · TVA {vat} % : {eur0(price - ttcToHT(price, vat))}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="TVA">
            <Select value={vat} onChange={(e) => setVat(parseFloat(e.target.value))}>
              {VAT_RATES.map((r) => (
                <option key={r} value={r}>
                  {r} %
                </option>
              ))}
            </Select>
          </Field>
          {!preset ? (
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
        {!preset && (
          <Field label="Précision (facultatif)">
            <Input value={detail} onChange={(e) => setDetail(e.target.value)} />
          </Field>
        )}

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
