"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, FileDown, Save } from "lucide-react";
import type { Order } from "@/lib/types";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { Button, Card } from "@/components/ui";
import { openOrderPdf } from "@/lib/pdf";
import { computeTotals } from "@/lib/pricing";
import { eur } from "@/lib/format";
import { STEPS, emptyOrder, validateCustomer, type CustomerErrors } from "./model";
import { StepClient } from "./step-client";
import { StepProducts } from "./step-products";
import { StepPricing } from "./step-pricing";
import { StepReview } from "./step-review";

export function OrderWizard({ initial }: { initial?: Order }) {
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = React.useState<Order>(() => initial ?? emptyOrder(user));
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<CustomerErrors>({});
  const [accepted, setAccepted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(initial ? initial.updatedAt : null);
  const persisted = React.useRef(Boolean(initial));
  const dirty = React.useRef(false);

  const update = React.useCallback((patch: Partial<Order>) => {
    dirty.current = true;
    setOrder((o) => ({ ...o, ...patch }));
  }, []);

  const persist = React.useCallback(
    async (o: Order) => {
      setSaving(true);
      setError(null);
      try {
        const saved = await getStore().saveOrder(o);
        persisted.current = true;
        dirty.current = false;
        setSavedAt(saved.updatedAt);
        setOrder((cur) => ({ ...cur, numero: saved.numero, createdAt: saved.createdAt, updatedAt: saved.updatedAt }));
        return saved;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Enregistrement impossible");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  // Avertit si l'utilisateur quitte avec des modifications non enregistrées.
  React.useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const stepValid = (s: number) => {
    if (s === 0) return Object.keys(validateCustomer(order.customer)).length === 0;
    if (s === 1) return order.lines.length > 0;
    return true;
  };

  const canLeaveStep = (s: number) => {
    if (s === 0) setErrors(validateCustomer(order.customer));
    return stepValid(s);
  };

  const next = async () => {
    if (!canLeaveStep(step)) return;
    try {
      await persist(order);
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* erreur affichée */
    }
  };

  const goTo = (s: number) => {
    if (s < step || canLeaveStep(step)) {
      setStep(s);
      window.scrollTo({ top: 0 });
    }
  };

  const saveDraft = async () => {
    try {
      const saved = await persist(order);
      router.push(`/commandes/${saved.id}`);
    } catch {
      /* erreur affichée */
    }
  };

  const sign = async () => {
    if (!accepted || !order.signatureClient || !order.signatureCommercial) return;
    const signed: Order = {
      ...order,
      status: "signe",
      signedAt: new Date().toISOString(),
      lieuSignature: order.lieuSignature || order.customer.ville,
    };
    try {
      const saved = await persist(signed);
      router.push(`/commandes/${saved.id}?signed=1`);
    } catch {
      /* erreur affichée */
    }
  };

  const t = computeTotals(order);
  const readyToSign = accepted && Boolean(order.signatureClient) && Boolean(order.signatureCommercial);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{initial ? `Bon ${initial.numero}` : "Nouveau bon de commande"}</h1>
          <p className="text-sm text-brand-gray">
            {order.numero ? `N° ${order.numero} · ` : ""}
            {savedAt ? `Enregistré ${new Date(savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Non enregistré"}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={saveDraft} loading={saving} className="no-print">
          <Save className="size-4" /> <span className="hidden sm:inline">Enregistrer le brouillon</span>
          <span className="sm:hidden">Brouillon</span>
        </Button>
      </div>

      {/* Stepper */}
      <ol className="grid grid-cols-4 gap-1.5 mb-6">
        {STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s.key}>
              <button type="button" onClick={() => goTo(i)} className="w-full text-left" disabled={i > step && !stepValid(step)}>
                <div className={`h-1.5 rounded-full ${state === "todo" ? "bg-gray-200" : state === "done" ? "bg-brand-green" : "bg-brand-blue"}`} />
                <div className={`mt-1.5 text-[11px] sm:text-xs font-semibold leading-tight ${state === "current" ? "text-brand-blue-dark" : state === "done" ? "text-brand-green-dark" : "text-gray-400"}`}>
                  {i + 1}. {s.label}
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <Card className={`p-4 sm:p-6 ${step === STEPS.length - 1 ? "mb-24" : ""}`}>
        {step === 0 && (
          <StepClient
            customer={order.customer}
            errors={errors}
            onChange={(customer) => {
              update({ customer });
              // Ne garde que les erreurs encore présentes sur les champs déjà signalés.
              setErrors((prev) => {
                if (Object.keys(prev).length === 0) return prev;
                const fresh = validateCustomer(customer);
                return Object.fromEntries(Object.entries(fresh).filter(([k]) => k in prev)) as CustomerErrors;
              });
            }}
          />
        )}
        {step === 1 && <StepProducts lines={order.lines} vatRate={order.vatRate} onChange={(lines) => update({ lines })} />}
        {step === 2 && <StepPricing order={order} onChange={update} />}
        {step === 3 && <StepReview order={order} onChange={update} accepted={accepted} onAccepted={setAccepted} />}
      </Card>

      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}

      {/* Barre d'action */}
      <div className="sticky bottom-0 mt-4 no-print" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="rounded-2xl bg-white/95 backdrop-blur border border-black/5 shadow-lg p-3 flex items-center gap-3">
          <Button variant="secondary" onClick={() => goTo(step - 1)} disabled={step === 0 || saving}>
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Précédent</span>
          </Button>
          <div className="flex-1 text-sm">
            <div className="text-[11px] uppercase tracking-wide text-brand-gray font-semibold">Total TTC</div>
            <div className="font-bold text-lg leading-tight tabular-nums">{eur(t.totalTTC)}</div>
          </div>
          {step === 3 && (
            <Button variant="secondary" onClick={() => openOrderPdf(order)} title="Aperçu du PDF">
              <FileDown className="size-4" /> <span className="hidden sm:inline">Aperçu PDF</span>
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} loading={saving} disabled={step === 1 && order.lines.length === 0}>
              Suivant <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button variant="accent" onClick={sign} loading={saving} disabled={!readyToSign} size="lg" className="whitespace-nowrap">
              <Check className="size-5" /> <span className="hidden sm:inline">Valider et signer</span>
              <span className="sm:hidden">Signer</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
