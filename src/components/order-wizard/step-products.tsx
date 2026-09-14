"use client";

import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CATEGORIES, PRODUCTS, categoryColor, categoryShort } from "@/lib/catalog";
import type { OrderLine, Product, ProductCategory } from "@/lib/types";
import { eur0, uid } from "@/lib/format";
import { Button, Field, Input, Modal, SectionTitle, Select } from "@/components/ui";

export function StepProducts({ lines, vatRate, onChange }: { lines: OrderLine[]; vatRate: number; onChange: (l: OrderLine[]) => void }) {
  const [cat, setCat] = React.useState<ProductCategory>("pv_sans_stockage");
  const [custom, setCustom] = React.useState<false | { open: true; preset?: Product }>(false);
  const [customKey, setCustomKey] = React.useState(0);

  const qtyOf = (productId: string) => lines.find((l) => l.productId === productId)?.quantity ?? 0;

  const add = (p: Product) => {
    const existing = lines.find((l) => l.productId === p.id);
    if (existing) return onChange(lines.map((l) => (l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l)));
    // Produit sans prix conseillé : le commercial saisit le prix TTC.
    if (!p.priceTTC) {
      setCustomKey((k) => k + 1);
      return setCustom({ open: true, preset: p });
    }
    onChange([...lines, { id: uid(), productId: p.id, category: p.category, label: p.label, detail: p.detail, quantity: 1, unitPriceTTC: p.priceTTC }]);
  };
  const setQty = (id: string, q: number) => onChange(q <= 0 ? lines.filter((l) => l.id !== id) : lines.map((l) => (l.id === id ? { ...l, quantity: q } : l)));

  const visible = PRODUCTS.filter((p) => p.category === cat);
  const ht = (ttc: number) => ttc / (1 + vatRate / 100);

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle sub="Touchez un produit pour l'ajouter au bon.">Choisir les produits</SectionTitle>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {CATEGORIES.filter((c) => c.id !== "autre").map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`shrink-0 snap-start h-10 px-4 rounded-full text-[13px] font-semibold border transition ${
                cat === c.id ? "text-white border-transparent shadow-[0_4px_12px_-4px_rgba(18,33,43,0.35)]" : "bg-panel text-ink-2 border-line-strong hover:border-ink/30"
              }`}
              style={cat === c.id ? { background: c.color } : undefined}
            >
              {c.short}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted mt-1 mb-3">{CATEGORIES.find((c) => c.id === cat)?.label}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((p) => {
            const q = qtyOf(p.id);
            return (
              <div key={p.id} className={`rounded-[16px] border bg-panel p-4 flex items-center gap-3 transition ${q ? "border-brand-blue ring-[3px] ring-brand-blue/12 shadow-[var(--shadow-ambient)]" : "border-line hover:border-line-strong"}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold leading-snug text-[15px]">{p.label}</div>
                  {p.detail && <div className="text-xs text-muted mt-0.5">{p.detail}</div>}
                  <div className="mt-1.5 flex items-baseline gap-x-2 flex-wrap">
                    {p.priceTTC ? (
                      <>
                        <span className="num font-semibold text-brand-blue-dark whitespace-nowrap">{eur0(p.priceTTC)} TTC</span>
                        <span className="text-xs text-muted whitespace-nowrap">soit {eur0(ht(p.priceTTC))} HT</span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-brand-orange-dark">Prix TTC à saisir</span>
                    )}
                  </div>
                </div>
                {q ? (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setQty(lines.find((l) => l.productId === p.id)!.id, q - 1)} className="size-10 grid place-items-center rounded-[10px] bg-ink/6 hover:bg-ink/10 transition" aria-label="Retirer">
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center num font-semibold">{q}</span>
                    <button type="button" onClick={() => add(p)} className="size-10 grid place-items-center rounded-[10px] bg-brand-blue text-white hover:bg-brand-blue-dark transition" aria-label="Ajouter">
                      <Plus className="size-4" />
                    </button>
                  </div>
                ) : (
                  <Button type="button" size="sm" onClick={() => add(p)}>
                    <Plus className="size-4" /> Ajouter
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <Button type="button" variant="secondary" className="mt-4" onClick={() => {
            setCustomKey((k) => k + 1);
            setCustom({ open: true });
          }}
        >
          <Plus className="size-4" /> Ligne personnalisée (option, sur devis…)
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
                      {categoryShort(l.category)} · {eur0(l.unitPriceTTC)} TTC / unité
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

      <CustomLineModal key={customKey} open={Boolean(custom)} preset={custom ? custom.preset : undefined} onClose={() => setCustom(false)} onAdd={(l) => onChange([...lines, l])} />
    </div>
  );
}

function CustomLineModal({ open, preset, onClose, onAdd }: { open: boolean; preset?: Product; onClose: () => void; onAdd: (l: OrderLine) => void }) {
  const [label, setLabel] = React.useState(preset?.label ?? "");
  const [detail, setDetail] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [category, setCategory] = React.useState<ProductCategory>(preset?.category ?? "autre");

  const submit = () => {
    const p = parseFloat(price.replace(",", "."));
    if (!label.trim() || isNaN(p)) return;
    onAdd({ id: uid(), productId: preset?.id, category, label: label.trim(), detail: detail.trim() || undefined, quantity: 1, unitPriceTTC: p });
    setLabel("");
    setDetail("");
    setPrice("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={preset ? preset.label : "Ligne personnalisée"}>
      <div className="space-y-4">
        <Field label="Désignation" required>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex. Reprise de toiture, carport solaire…" />
        </Field>
        <Field label="Détail">
          <Input value={detail} onChange={(e) => setDetail(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prix unitaire TTC (€)" required>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0,00" />
          </Field>
          <Field label="Famille">
            <Select value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.short}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={submit} disabled={!label.trim() || isNaN(parseFloat(price.replace(",", ".")))}>
            Ajouter
          </Button>
        </div>
      </div>
    </Modal>
  );
}
