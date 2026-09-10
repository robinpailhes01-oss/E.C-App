"use client";

import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CATEGORIES, PRODUCTS, categoryColor, categoryShort } from "@/lib/catalog";
import type { OrderLine, Product, ProductCategory } from "@/lib/types";
import { eur0, uid } from "@/lib/format";
import { Button, Field, Input, Modal, Select } from "@/components/ui";

export function StepProducts({ lines, vatRate, onChange }: { lines: OrderLine[]; vatRate: number; onChange: (l: OrderLine[]) => void }) {
  const [cat, setCat] = React.useState<ProductCategory>("pv_sans_stockage");
  const [custom, setCustom] = React.useState(false);

  const qtyOf = (productId: string) => lines.find((l) => l.productId === productId)?.quantity ?? 0;

  const add = (p: Product) => {
    const existing = lines.find((l) => l.productId === p.id);
    if (existing) onChange(lines.map((l) => (l.id === existing.id ? { ...l, quantity: l.quantity + 1 } : l)));
    else onChange([...lines, { id: uid(), productId: p.id, category: p.category, label: p.label, detail: p.detail, quantity: 1, unitPriceHT: p.priceHT }]);
  };
  const setQty = (id: string, q: number) => onChange(q <= 0 ? lines.filter((l) => l.id !== id) : lines.map((l) => (l.id === id ? { ...l, quantity: q } : l)));

  const visible = PRODUCTS.filter((p) => p.category === cat);
  const ttc = (ht: number) => ht * (1 + vatRate / 100);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-bold text-lg mb-3">Choisir les produits</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {CATEGORIES.filter((c) => c.id !== "autre").map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`shrink-0 snap-start h-10 px-4 rounded-full text-sm font-semibold border transition ${
                cat === c.id ? "text-white border-transparent" : "bg-white text-brand-gray border-gray-200"
              }`}
              style={cat === c.id ? { background: c.color } : undefined}
            >
              {c.short}
            </button>
          ))}
        </div>
        <p className="text-sm text-brand-gray mt-1 mb-3">{CATEGORIES.find((c) => c.id === cat)?.label}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visible.map((p) => {
            const q = qtyOf(p.id);
            return (
              <div key={p.id} className={`rounded-2xl border bg-white p-4 flex items-center gap-3 transition ${q ? "border-brand-blue ring-2 ring-brand-blue/15" : "border-gray-200"}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold leading-snug">{p.label}</div>
                  {p.detail && <div className="text-xs text-brand-gray mt-0.5">{p.detail}</div>}
                  <div className="mt-1.5 flex items-baseline gap-x-2 flex-wrap">
                    <span className="font-bold text-brand-blue-dark whitespace-nowrap">{eur0(p.priceHT)} HT</span>
                    <span className="text-xs text-brand-gray whitespace-nowrap">{eur0(ttc(p.priceHT))} TTC</span>
                  </div>
                </div>
                {q ? (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setQty(lines.find((l) => l.productId === p.id)!.id, q - 1)} className="size-10 grid place-items-center rounded-xl bg-gray-100 hover:bg-gray-200" aria-label="Retirer">
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{q}</span>
                    <button type="button" onClick={() => add(p)} className="size-10 grid place-items-center rounded-xl bg-brand-blue text-white hover:bg-brand-blue-dark" aria-label="Ajouter">
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

        <Button type="button" variant="secondary" className="mt-4" onClick={() => setCustom(true)}>
          <Plus className="size-4" /> Ligne personnalisée (option, sur devis…)
        </Button>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-3">Sélection ({lines.length})</h2>
        {lines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-brand-gray">Aucun produit sélectionné pour le moment.</div>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {lines.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3.5">
                <div className="flex items-center gap-3 basis-full sm:basis-0 sm:flex-1 min-w-0">
                  <span className="size-2.5 rounded-full shrink-0" style={{ background: categoryColor(l.category) }} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm leading-snug">{l.label}</div>
                    <div className="text-xs text-brand-gray">
                      {categoryShort(l.category)} · {eur0(l.unitPriceHT)} HT / unité
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-auto sm:ml-0">
                  <button type="button" onClick={() => setQty(l.id, l.quantity - 1)} className="size-9 grid place-items-center rounded-lg bg-gray-100" aria-label="Moins">
                    <Minus className="size-4" />
                  </button>
                  <span className="w-7 text-center font-bold text-sm">{l.quantity}</span>
                  <button type="button" onClick={() => setQty(l.id, l.quantity + 1)} className="size-9 grid place-items-center rounded-lg bg-gray-100" aria-label="Plus">
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="w-24 text-right font-bold text-sm">{eur0(l.quantity * l.unitPriceHT)}</div>
                <button type="button" onClick={() => setQty(l.id, 0)} className="size-9 grid place-items-center rounded-lg text-red-500 hover:bg-red-50" aria-label="Supprimer">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CustomLineModal open={custom} onClose={() => setCustom(false)} onAdd={(l) => onChange([...lines, l])} />
    </div>
  );
}

function CustomLineModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (l: OrderLine) => void }) {
  const [label, setLabel] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [category, setCategory] = React.useState<ProductCategory>("autre");

  const submit = () => {
    const p = parseFloat(price.replace(",", "."));
    if (!label.trim() || isNaN(p)) return;
    onAdd({ id: uid(), category, label: label.trim(), detail: detail.trim() || undefined, quantity: 1, unitPriceHT: p });
    setLabel("");
    setDetail("");
    setPrice("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Ligne personnalisée">
      <div className="space-y-4">
        <Field label="Désignation" required>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex. Reprise de toiture, carport solaire…" />
        </Field>
        <Field label="Détail">
          <Input value={detail} onChange={(e) => setDetail(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prix unitaire HT (€)" required>
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
