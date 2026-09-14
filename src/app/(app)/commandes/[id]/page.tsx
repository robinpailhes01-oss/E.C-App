"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Ban, CheckCircle2, ExternalLink, FileDown, Pencil, Share2, Trash2 } from "lucide-react";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { Order } from "@/lib/types";
import { STATUS_LABEL, customerName, dateFr } from "@/lib/format";
import { downloadOrderPdf, openOrderPdf, shareOrderPdf } from "@/lib/pdf";
import { OrderSummary } from "@/components/order-summary";
import { Badge, Button, Card, EmptyState, Modal, Reveal, Spinner, statusTone } from "@/components/ui";
import { computeTotals } from "@/lib/pricing";
import { eur } from "@/lib/format";

function OrderDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = React.useState<Order | null | undefined>(undefined);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<"annuler" | "supprimer" | null>(null);
  const justSigned = params.get("signed") === "1";

  React.useEffect(() => {
    getStore().getOrder(id).then(setOrder);
  }, [id]);

  if (order === undefined) return <Spinner />;
  if (!order) return <EmptyState title="Bon de commande introuvable" />;

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setBusy(null);
    }
  };

  const cancel = () =>
    run("annuler", async () => {
      const saved = await getStore().saveOrder({ ...order, status: "annule" });
      setOrder(saved);
      setConfirm(null);
    });

  const remove = () =>
    run("supprimer", async () => {
      await getStore().deleteOrder(order.id);
      router.replace("/commandes");
    });

  const c = order.customer;
  const canEdit = order.status === "brouillon";
  const canCancel = order.status !== "annule" && (user.role === "directeur" || order.status === "brouillon");
  const canDelete = order.status === "brouillon";

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/commandes" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink mb-4 transition">
        <ArrowLeft className="size-4" /> Bons de commande
      </Link>

      {justSigned && (
        <Reveal>
          <div className="mb-4 rounded-[16px] bg-brand-green-soft border border-brand-green/30 text-brand-green-dark px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0" />
            <div className="text-sm">
              <b>Bon de commande signé.</b> Téléchargez ou partagez le PDF avec le client.
            </div>
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-night text-white p-5 sm:p-6 mb-4 shadow-[var(--shadow-float)]">
          <div className="absolute -top-24 -right-16 size-64 rounded-full bg-brand-blue/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -left-10 size-64 rounded-full bg-brand-orange/20 blur-3xl pointer-events-none" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-mono text-[22px] sm:text-[26px] font-semibold tracking-tight">{order.numero}</h1>
                <Badge tone={statusTone(order.status)} dot>
                  {STATUS_LABEL[order.status]}
                </Badge>
              </div>
              <p className="text-sm text-white/65 mt-1.5">
                Créé le {dateFr(order.createdAt, true)} par {order.commercialName}
                {order.signedAt && ` · signé le ${dateFr(order.signedAt, true)}`}
              </p>
              <p className="font-display text-lg font-semibold mt-3">{customerName(c)}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Total TTC</div>
              <div className="num text-[30px] font-semibold leading-none mt-1">{eur(computeTotals(order).totalTTC)}</div>
            </div>
          </div>
          <div className="relative flex flex-wrap gap-2 mt-5">
            <Button variant="secondary" size="sm" onClick={() => run("apercu", () => openOrderPdf(order))} loading={busy === "apercu"} className="bg-white/10 border-white/15 text-white hover:bg-white/18 hover:border-white/30">
              <ExternalLink className="size-4" /> Aperçu
            </Button>
            <Button variant="secondary" size="sm" onClick={() => run("dl", () => downloadOrderPdf(order))} loading={busy === "dl"} className="bg-white/10 border-white/15 text-white hover:bg-white/18 hover:border-white/30">
              <FileDown className="size-4" /> PDF
            </Button>
            <Button variant="accent" size="sm" onClick={() => run("share", () => shareOrderPdf(order))} loading={busy === "share"}>
              <Share2 className="size-4" /> Partager
            </Button>
          </div>
        </div>
      </Reveal>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Card className="p-4 text-sm">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted font-bold mb-1.5">Client</div>
          <div className="font-semibold">{customerName(c)}</div>
          <div>{c.adresse}</div>
          {c.complement && <div>{c.complement}</div>}
          <div>
            {c.codePostal} {c.ville}
          </div>
          <div className="text-muted mt-1">
            <a href={`tel:${c.telephone}`} className="underline decoration-dotted">
              {c.telephone}
            </a>
            {c.email && (
              <>
                {" · "}
                <a href={`mailto:${c.email}`} className="underline decoration-dotted">
                  {c.email}
                </a>
              </>
            )}
          </div>
          <div className="text-muted mt-1">
            {c.typeLogement === "maison" ? "Maison" : "Appartement"} · {c.proprietaire ? "Propriétaire" : "Locataire"}
            {c.chauffageActuel && ` · ${c.chauffageActuel}`}
          </div>
        </Card>
        <Card className="p-4 text-sm">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted font-bold mb-1.5">Installation & signature</div>
          <div>
            Installation prévue :{" "}
            <b>{order.dateInstallationPrevue ? new Date(order.dateInstallationPrevue + "T00:00:00").toLocaleDateString("fr-FR") : "à définir"}</b>
          </div>
          {order.signedAt ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                ["Client", order.signatureClient],
                ["Commercial", order.signatureCommercial],
              ].map(([label, img]) => (
                <div key={label} className="rounded-[12px] border border-line bg-surface-2 p-1.5">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-muted font-bold px-1">{label}</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img ? <img src={img} alt={`Signature ${label}`} className="h-16 w-full object-contain" /> : <div className="h-16" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted mt-1">Non signé</div>
          )}
          {order.notes && (
            <div className="mt-2 text-muted">
              <b className="text-ink">Observations :</b> {order.notes}
            </div>
          )}
        </Card>
      </div>

      <OrderSummary order={order} />

      {(canEdit || canCancel || canDelete) && (
        <div className="mt-6 flex flex-wrap gap-2 no-print">
          {canEdit && (
            <Link href={`/commandes/${order.id}/modifier`}>
              <Button variant="accent">
                <Pencil className="size-4" /> Reprendre et signer
              </Button>
            </Link>
          )}
          {canCancel && (
            <Button variant="secondary" onClick={() => setConfirm("annuler")}>
              <Ban className="size-4" /> Annuler le bon
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" className="text-red-600" onClick={() => setConfirm("supprimer")}>
              <Trash2 className="size-4" /> Supprimer le brouillon
            </Button>
          )}
        </div>
      )}

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title={confirm === "annuler" ? "Annuler ce bon de commande ?" : "Supprimer ce brouillon ?"}>
        <p className="text-sm text-muted">
          {confirm === "annuler"
            ? "Le bon restera consultable avec le statut « Annulé » (rétractation, refus de financement…). Cette action est définitive."
            : "Le brouillon sera supprimé définitivement."}
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Retour
          </Button>
          <Button variant="danger" onClick={confirm === "annuler" ? cancel : remove} loading={busy === confirm}>
            Confirmer
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <OrderDetailInner />
    </React.Suspense>
  );
}
