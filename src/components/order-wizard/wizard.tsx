"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, FileDown, Save } from "lucide-react";
import type { AppSettings, Order } from "@/lib/types";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import { Button, Card, Spinner, cx } from "@/components/ui";
import { openOrderPdf } from "@/lib/pdf";
import { computeTotals } from "@/lib/pricing";
import { eur, eur0 } from "@/lib/format";
import { STEPS, emptyOrder, validateCustomer, type CustomerErrors } from "./model";
import { StepClient } from "./step-client";
import { StepProducts } from "./step-products";
import { StepPricing } from "./step-pricing";
import { StepReview } from "./step-review";

export function OrderWizard({ initial }: { initial?: Order }) {
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  React.useEffect(() => {
    getStore().getSettings().then(setSettings);
  }, []);
  if (!settings) return <Spinner label="Chargement des paramètres…" />;
  return <OrderWizardInner initial={initial} settings={settings} />;
}

function OrderWizardInner({ initial, settings }: { initial?: Order; settings: AppSettings }) {
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = React.useState<Order>(() => initial ?? emptyOrder(user, settings));
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
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

  const persist = React.useCallback(async (o: Order) => {
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
  }, []);

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

  const move = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = async () => {
    if (!canLeaveStep(step)) return;
    try {
      await persist(order);
      move(Math.min(step + 1, STEPS.length - 1));
    } catch {
      /* erreur affichée */
    }
  };

  const goTo = (s: number) => {
    if (s < 0 || s >= STEPS.length) return;
    if (s < step || canLeaveStep(step)) move(s);
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
  const last = step === STEPS.length - 1;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{initial ? "Reprise du bon" : "Nouveau bon de commande"}</p>
          <h1 className="font-display text-[26px] sm:text-[30px] font-semibold text-ink leading-tight mt-1">
            {order.numero ? <span className="font-mono text-brand-blue-dark">{order.numero}</span> : "Brouillon"}
          </h1>
          <p className="text-xs text-muted mt-1">
            {savedAt ? `Enregistré à ${new Date(savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Non enregistré"}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={saveDraft} loading={saving} className="no-print mt-1">
          <Save className="size-4" /> <span className="hidden sm:inline">Enregistrer le brouillon</span>
          <span className="sm:hidden">Brouillon</span>
        </Button>
      </div>

      {/* Stepper */}
      <ol className="relative grid grid-cols-4 gap-2 mb-6">
        {STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          return (
            <li key={s.key}>
              <button type="button" onClick={() => goTo(i)} className="w-full text-left group" disabled={i > step && !stepValid(step)} aria-current={state === "current" ? "step" : undefined}>
                <div className="flex items-center gap-2">
                  <span
                    className={cx(
                      "size-7 shrink-0 rounded-full grid place-items-center text-[12px] font-display font-semibold transition-colors",
                      state === "done" && "bg-brand-green text-white",
                      state === "current" && "bg-night text-white ring-4 ring-night/10",
                      state === "todo" && "bg-ink/6 text-muted",
                    )}
                  >
                    {state === "done" ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className={cx("hidden sm:block text-[13px] font-semibold truncate", state === "current" ? "text-ink" : state === "done" ? "text-ink-2" : "text-muted")}>{s.label}</span>
                </div>
                <div className="mt-2.5 h-1 rounded-full bg-ink/6 overflow-hidden">
                  <motion.div
                    className={cx("h-full rounded-full", state === "done" ? "bg-brand-green" : "bg-night")}
                    initial={false}
                    animate={{ width: state === "todo" ? "0%" : "100%" }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className={cx("sm:hidden mt-1.5 text-[10.5px] font-semibold leading-tight", state === "current" ? "text-ink" : "text-muted")}>{s.label}</div>
              </button>
            </li>
          );
        })}
      </ol>

      <Card className={cx("p-4 sm:p-7 overflow-hidden", last && "mb-24")}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <StepClient
                customer={order.customer}
                errors={errors}
                onChange={(customer) => {
                  update({ customer });
                  setErrors((prev) => {
                    if (Object.keys(prev).length === 0) return prev;
                    const fresh = validateCustomer(customer);
                    return Object.fromEntries(Object.entries(fresh).filter(([k]) => k in prev)) as CustomerErrors;
                  });
                }}
              />
            )}
            {step === 1 && <StepProducts lines={order.lines} vatRate={order.vatRate} onChange={(lines) => update({ lines })} />}
            {step === 2 && <StepPricing order={order} onChange={update} settings={settings} />}
            {step === 3 && <StepReview order={order} onChange={update} accepted={accepted} onAccepted={setAccepted} />}
          </motion.div>
        </AnimatePresence>
      </Card>

      {error && <p className="mt-3 text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}

      {/* Barre d'action flottante */}
      <div className="sticky bottom-0 mt-4 no-print" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
        <div className="rounded-[18px] bg-night text-white shadow-[var(--shadow-float)] p-2.5 pl-3 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0 || saving}
            className="size-11 shrink-0 grid place-items-center rounded-[12px] bg-white/8 hover:bg-white/14 disabled:opacity-30 transition"
            aria-label="Précédent"
          >
            <ArrowLeft className="size-[18px]" />
          </button>
          <div className="flex-1 min-w-0 leading-none">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Total TTC</div>
            <div className="num text-[19px] sm:text-[22px] font-semibold mt-1 truncate">
              <span className="sm:hidden">{eur0(t.totalTTC)}</span>
              <span className="hidden sm:inline">{eur(t.totalTTC)}</span>
            </div>
          </div>
          {last && (
            <button type="button" onClick={() => openOrderPdf(order)} title="Aperçu du PDF" className="h-11 px-3 grid place-items-center rounded-[12px] bg-white/8 hover:bg-white/14 transition">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <FileDown className="size-[18px]" /> <span className="hidden sm:inline">Aperçu PDF</span>
              </span>
            </button>
          )}
          {!last ? (
            <Button onClick={next} loading={saving} disabled={step === 1 && order.lines.length === 0} className="whitespace-nowrap">
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
