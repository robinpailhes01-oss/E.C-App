"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { AlertTriangle, ArrowUpRight, LifeBuoy, MessageSquarePlus, Plus, Search } from "lucide-react";
import { getStore } from "@/lib/data";
import { useAuth } from "@/components/auth-provider";
import type { Creneau, Order, Sav, SavStatut, SavUrgence } from "@/lib/types";
import { CRENEAU_LABEL } from "@/lib/dossier";
import { customerName, dateFr, uid } from "@/lib/format";
import { isStaff, ROLE_LABEL } from "@/lib/permissions";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Reveal, SegmentedControl, Segmented, Select, Spinner, Textarea, cx } from "@/components/ui";
import { PhotoGrid } from "@/components/photo-grid";

const STATUT_LABEL: Record<SavStatut, string> = { ouvert: "Ouvert", en_cours: "En cours", planifie: "Planifié", resolu: "Résolu" };
const STATUT_TONE: Record<SavStatut, "red" | "orange" | "blue" | "green"> = { ouvert: "red", en_cours: "orange", planifie: "blue", resolu: "green" };
const OBJETS = ["Panne onduleur / micro-onduleurs", "Production anormale", "Panne batterie", "Pompe à chaleur : défaut", "Ballon thermodynamique", "Fuite / infiltration toiture", "Finitions / pose", "Autre"];

type Filter = "cours" | "resolus" | "tous";

export default function SavPage() {
  const { user } = useAuth();
  const staff = isStaff(user.role);
  const [savs, setSavs] = React.useState<Sav[] | null>(null);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [filter, setFilter] = React.useState<Filter>("cours");
  const [q, setQ] = React.useState("");
  const [declare, setDeclare] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const [tick, setTick] = React.useState(0);
  const load = React.useCallback(async () => setTick((t) => t + 1), []);
  React.useEffect(() => {
    let alive = true;
    Promise.all([getStore().listSav(), getStore().listOrders()]).then(([sv, o]) => {
      if (!alive) return;
      setSavs(sv);
      setOrders(o.filter((x) => x.status === "signe"));
    });
    return () => {
      alive = false;
    };
  }, [tick]);

  const list = React.useMemo(() => {
    if (!savs) return [];
    const needle = q.trim().toLowerCase();
    return savs
      .filter((s) => (filter === "cours" ? s.statut !== "resolu" : filter === "resolus" ? s.statut === "resolu" : true))
      .filter((s) => !needle || [s.numero, s.client.nom, s.client.ville, s.objet, s.orderNumero].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => Number(b.urgence === "urgente") - Number(a.urgence === "urgente") || b.createdAt.localeCompare(a.createdAt));
  }, [savs, filter, q]);

  const open = savs?.find((s) => s.id === openId) ?? null;
  const counts = { cours: savs?.filter((s) => s.statut !== "resolu").length ?? 0, urgents: savs?.filter((s) => s.statut !== "resolu" && s.urgence === "urgente").length ?? 0 };

  return (
    <div>
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Après-vente</p>
            <h1 className="font-display text-[28px] sm:text-[32px] font-semibold text-ink leading-tight mt-1">SAV en cours</h1>
            <p className="text-sm text-muted mt-1">
              <b className="text-ink num">{counts.cours}</b> en cours
              {counts.urgents > 0 && (
                <>
                  {" "}· <b className="text-red-600 num">{counts.urgents}</b> urgent{counts.urgents > 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>
          <Button variant="accent" onClick={() => setDeclare(true)}>
            <Plus className="size-4" /> Déclarer un SAV
          </Button>
        </div>
      </Reveal>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client, un numéro, un objet…" className="pl-10" />
        </div>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: "cours", label: "En cours" },
            { value: "resolus", label: "Résolus" },
            { value: "tous", label: "Tous" },
          ]}
          className="sm:w-80"
        />
      </div>

      {!savs ? (
        <Spinner />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState title={savs.length === 0 ? "Aucun SAV déclaré" : "Aucun SAV ne correspond"}>
            {savs.length === 0 && "Un client signale un problème ? Déclarez-le ici, la direction et le secrétariat sont prévenus."}
          </EmptyState>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {list.map((s, i) => (
            <motion.li key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04 }}>
              <button type="button" onClick={() => setOpenId(s.id)} className="w-full text-left group">
                <Card className="relative overflow-hidden p-4 pl-5 hover:border-brand-blue/40 transition">
                  <span className={cx("absolute left-0 top-3 bottom-3 w-1 rounded-r-full", s.urgence === "urgente" ? "bg-red-500" : s.statut === "resolu" ? "bg-brand-green" : "bg-brand-orange")} />
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-[16px]">{s.client.nom}</span>
                        <Badge tone={STATUT_TONE[s.statut]} dot>{STATUT_LABEL[s.statut]}</Badge>
                        {s.urgence === "urgente" && <Badge tone="red"><AlertTriangle className="size-3" /> Urgent</Badge>}
                      </div>
                      <div className="text-sm text-ink-2 mt-1">{s.objet}</div>
                      <div className="text-xs text-muted mt-1">
                        <span className="font-mono">{s.numero}</span>
                        {s.client.ville ? ` · ${s.client.ville}` : ""} · déclaré le {dateFr(s.createdAt)} par {s.declaredByName}
                        {s.assigneA ? ` · ${s.assigneA}` : ""}
                        {s.datePrevue ? ` · intervention le ${dateFr(s.datePrevue)}` : ""}
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-muted/60 group-hover:text-brand-blue transition shrink-0 mt-1" />
                  </div>
                </Card>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <DeclareModal key={declare ? "open" : "closed"} open={declare} orders={orders} onClose={() => setDeclare(false)} onSaved={(id) => { setDeclare(false); load(); setOpenId(id); }} />
      <DetailModal sav={open} staff={staff} onClose={() => setOpenId(null)} onSaved={load} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function DeclareModal({ open, orders, onClose, onSaved }: { open: boolean; orders: Order[]; onClose: () => void; onSaved: (id: string) => void }) {
  const { user } = useAuth();
  const [id] = React.useState(() => uid());
  const [source, setSource] = React.useState<"bon" | "autre">(orders.length ? "bon" : "autre");
  const [orderId, setOrderId] = React.useState("");
  const [nom, setNom] = React.useState("");
  const [tel, setTel] = React.useState("");
  const [ville, setVille] = React.useState("");
  const [objet, setObjet] = React.useState(OBJETS[0]);
  const [description, setDescription] = React.useState("");
  const [urgence, setUrgence] = React.useState<SavUrgence>("normale");
  const [files, setFiles] = React.useState<Sav["files"]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const order = orders.find((o) => o.id === orderId);
  const valid = description.trim().length > 0 && (source === "bon" ? Boolean(order) : nom.trim().length > 0);

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      const client =
        source === "bon" && order
          ? { nom: customerName(order.customer), telephone: order.customer.portable || order.customer.telephone, adresse: order.customer.chantierIdentique ? order.customer.adresse : order.customer.adresseChantier, ville: order.customer.chantierIdentique ? order.customer.ville : order.customer.villeChantier }
          : { nom: nom.trim(), telephone: tel.trim() || undefined, ville: ville.trim() || undefined };
      const saved = await getStore().saveSav({
        id,
        numero: "",
        statut: "ouvert",
        urgence,
        objet,
        description: description.trim(),
        orderId: source === "bon" ? order?.id : undefined,
        orderNumero: source === "bon" ? order?.numero : undefined,
        commercialId: source === "bon" ? order?.commercialId : undefined,
        client,
        declaredById: user.id,
        declaredByName: user.fullName,
        declaredByRole: user.role,
        files,
        comments: [],
        createdAt: "",
        updatedAt: "",
      });
      onSaved(saved.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Déclaration impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Déclarer un SAV" wide>
      <div className="space-y-4">
        <Segmented
          value={source}
          onChange={setSource}
          options={[
            { value: "bon", label: "Client avec un bon" },
            { value: "autre", label: "Autre client" },
          ]}
          className="max-w-sm"
        />
        {source === "bon" ? (
          <Field label="Bon de commande" required>
            <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">— Choisir le client —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {customerName(o.customer)} · {o.customer.ville} · {o.numero}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Nom du client" required>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} />
            </Field>
            <Field label="Téléphone">
              <Input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" />
            </Field>
            <Field label="Ville">
              <Input value={ville} onChange={(e) => setVille(e.target.value)} />
            </Field>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Objet">
            <Select value={objet} onChange={(e) => setObjet(e.target.value)}>
              {OBJETS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <Field label="Urgence">
            <Segmented
              value={urgence}
              onChange={setUrgence}
              options={[
                { value: "normale", label: "Normale" },
                { value: "urgente", label: "Urgente" },
              ]}
            />
          </Field>
        </div>
        <Field label="Description du problème" required>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ce que le client constate, depuis quand, voyants allumés…" />
        </Field>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-1.5">Photos</div>
          <PhotoGrid scope={`sav/${id}`} files={files} onChange={setFiles} />
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={submit} loading={saving} disabled={!valid}>
            <LifeBuoy className="size-4" /> Déclarer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailModal({ sav, staff, onClose, onSaved }: { sav: Sav | null; staff: boolean; onClose: () => void; onSaved: () => Promise<void> | void }) {
  const { user } = useAuth();
  const [comment, setComment] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const patch = async (p: Partial<Sav>) => {
    if (!sav) return;
    setBusy(true);
    setError(null);
    try {
      await getStore().saveSav({ ...sav, ...p });
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible");
    } finally {
      setBusy(false);
    }
  };

  const addComment = async () => {
    if (!sav || !comment.trim()) return;
    await patch({ comments: [...sav.comments, { id: uid(), at: new Date().toISOString(), authorId: user.id, authorName: user.fullName, authorRole: user.role, text: comment.trim() }] });
    setComment("");
  };

  return (
    <Modal open={sav !== null} onClose={onClose} title={sav ? `${sav.numero} · ${sav.client.nom}` : ""} wide>
      {sav && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUT_TONE[sav.statut]} dot>{STATUT_LABEL[sav.statut]}</Badge>
            {sav.urgence === "urgente" && <Badge tone="red"><AlertTriangle className="size-3" /> Urgent</Badge>}
            <span className="text-sm text-muted">
              Déclaré le {dateFr(sav.createdAt, true)} par {sav.declaredByName} ({ROLE_LABEL[sav.declaredByRole]})
            </span>
          </div>

          <div className="rounded-[14px] bg-surface-2 border border-line p-4 text-sm space-y-1">
            <div className="font-semibold">{sav.objet}</div>
            <p className="text-ink-2 whitespace-pre-wrap">{sav.description}</p>
            <div className="text-xs text-muted pt-1">
              {[sav.client.adresse, sav.client.ville, sav.client.telephone].filter(Boolean).join(" · ")}
              {sav.orderId && (
                <>
                  {" · "}
                  <Link href={`/commandes/${sav.orderId}`} className="text-brand-blue font-semibold">
                    Bon {sav.orderNumero}
                  </Link>
                </>
              )}
            </div>
          </div>

          {sav.files.length > 0 && <PhotoGrid scope={`sav/${sav.id}`} files={sav.files} readOnly onChange={() => {}} />}

          {staff && (
            <div className="rounded-[14px] border border-line p-4 grid sm:grid-cols-4 gap-3">
              <Field label="Statut">
                <Select value={sav.statut} onChange={(e) => patch({ statut: e.target.value as SavStatut, resolvedAt: e.target.value === "resolu" ? new Date().toISOString() : undefined })} disabled={busy}>
                  {(Object.keys(STATUT_LABEL) as SavStatut[]).map((s) => (
                    <option key={s} value={s}>{STATUT_LABEL[s]}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Technicien">
                <Input defaultValue={sav.assigneA ?? ""} onBlur={(e) => e.target.value !== (sav.assigneA ?? "") && patch({ assigneA: e.target.value })} placeholder="Nom" />
              </Field>
              <Field label="Intervention prévue">
                <Input
                  type="date"
                  value={sav.datePrevue ?? ""}
                  onChange={(e) => patch({ datePrevue: e.target.value || undefined, statut: e.target.value && sav.statut === "ouvert" ? "planifie" : sav.statut })}
                />
              </Field>
              <Field label="Créneau">
                <Select value={sav.creneau ?? "journee"} onChange={(e) => patch({ creneau: e.target.value as Creneau })}>
                  {Object.entries(CRENEAU_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          {!staff && (sav.assigneA || sav.datePrevue) && (
            <p className="text-sm text-ink-2">
              {sav.assigneA ? `Pris en charge par ${sav.assigneA}. ` : ""}
              {sav.datePrevue ? `Intervention prévue le ${dateFr(sav.datePrevue)} (${CRENEAU_LABEL[sav.creneau ?? "journee"].toLowerCase()}).` : ""}
            </p>
          )}

          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">Suivi</div>
            {sav.comments.length === 0 ? (
              <p className="text-sm text-muted">Aucun commentaire pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {sav.comments.map((c) => (
                  <li key={c.id} className="rounded-[12px] bg-surface px-3.5 py-2.5 text-sm">
                    <div className="text-xs text-muted mb-0.5">
                      <b className="text-ink-2">{c.authorName}</b> · {ROLE_LABEL[c.authorRole]} · {dateFr(c.at, true)}
                    </div>
                    <div className="whitespace-pre-wrap">{c.text}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 mt-3 items-end">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire…" className="min-h-14" />
              <Button onClick={addComment} loading={busy} disabled={!comment.trim()} aria-label="Ajouter le commentaire">
                <MessageSquarePlus className="size-4" />
              </Button>
            </div>
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex justify-between gap-2">
            {staff && sav.statut !== "resolu" ? (
              <Button variant="primary" onClick={() => patch({ statut: "resolu", resolvedAt: new Date().toISOString() })} loading={busy}>
                Marquer comme résolu
              </Button>
            ) : (
              <span />
            )}
            <Button variant="secondary" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
