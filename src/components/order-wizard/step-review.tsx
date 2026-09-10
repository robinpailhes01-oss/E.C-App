"use client";

import type { Order } from "@/lib/types";
import { customerName } from "@/lib/format";
import { COMPANY } from "@/lib/company";
import { OrderSummary } from "@/components/order-summary";
import { SignatureField } from "@/components/signature-pad";
import { Field, Input } from "@/components/ui";

export function StepReview({
  order,
  onChange,
  accepted,
  onAccepted,
}: {
  order: Order;
  onChange: (patch: Partial<Order>) => void;
  accepted: boolean;
  onAccepted: (v: boolean) => void;
}) {
  const c = order.customer;
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-bold text-lg mb-3">Récapitulatif</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
            <div className="text-xs uppercase tracking-wide text-brand-gray font-semibold mb-1.5">Client</div>
            <div className="font-semibold">{customerName(c)}</div>
            <div>{c.adresse}</div>
            {c.complement && <div>{c.complement}</div>}
            <div>
              {c.codePostal} {c.ville}
            </div>
            <div className="text-brand-gray mt-1">
              {c.telephone}
              {c.email ? ` · ${c.email}` : ""}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm">
            <div className="text-xs uppercase tracking-wide text-brand-gray font-semibold mb-1.5">Commercial</div>
            <div className="font-semibold">{order.commercialName}</div>
            <div className="text-brand-gray">{COMPANY.name}</div>
            <div className="mt-2">
              Installation prévue :{" "}
              <b>{order.dateInstallationPrevue ? new Date(order.dateInstallationPrevue + "T00:00:00").toLocaleDateString("fr-FR") : "à définir"}</b>
            </div>
          </div>
        </div>
        <OrderSummary order={order} />
      </section>

      <section>
        <h2 className="font-bold text-lg mb-3">Signature</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <Field label="Fait à">
            <Input value={order.lieuSignature ?? ""} onChange={(e) => onChange({ lieuSignature: e.target.value })} placeholder={c.ville || "Ville"} />
          </Field>
          <Field label="Date">
            <Input value={new Date().toLocaleDateString("fr-FR")} readOnly className="bg-gray-50" />
          </Field>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm cursor-pointer">
          <input type="checkbox" checked={accepted} onChange={(e) => onAccepted(e.target.checked)} className="mt-0.5 size-5 accent-brand-blue" />
          <span>
            Le client reconnaît avoir pris connaissance des conditions générales de vente, du bon de commande et de son droit de rétractation de{" "}
            <b>{COMPANY.withdrawalDays} jours</b> (formulaire joint au PDF), et déclare signer <b>« Lu et approuvé, bon pour commande »</b>.
          </span>
        </label>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <SignatureField label="Signature du client" value={order.signatureClient} onChange={(v) => onChange({ signatureClient: v })} />
          <SignatureField label="Signature du commercial" value={order.signatureCommercial} onChange={(v) => onChange({ signatureCommercial: v })} />
        </div>
      </section>
    </div>
  );
}
