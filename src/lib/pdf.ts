import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "./types";
import { computeTotals, lineHT, lineTTC } from "./pricing";
import { COMPANY } from "./company";
import { CATEGORIES, categoryLabel, formatLineAttributes } from "./catalog";

const ORANGE: [number, number, number] = [200, 110, 40];
const ORANGE_LIGHT: [number, number, number] = [251, 240, 228];
const GRAY: [number, number, number] = [109, 110, 113];
const INK: [number, number, number] = [31, 35, 40];
const LINE: [number, number, number] = [222, 218, 210];

const eurPdf = (n: number | null | undefined) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0).replace(/[\u202f\u00a0]/g, " ") + " €";
const pct = (n: number | undefined) => (n ?? 0).toString().replace(".", ",") + " %";
const dateFr = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "");
const dateInput = (iso?: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const paymentLabel: Record<string, string> = { cheque: "chèque", virement: "virement", cb: "carte bancaire", especes: "espèces" };

const attrsLine = (l: Order["lines"][number]) => formatLineAttributes(l);

export async function buildOrderPdf(order: Order): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 12;
  const CW = W - 2 * M;
  const t = computeTotals(order);
  const logo = await loadLogo();
  const c = order.customer;
  const f = order.financing;

  const ensure = (need: number) => {
    if (y + need > H - 16) {
      doc.addPage();
      y = M;
    }
  };
  const box = (x: number, yy: number, w: number, h: number, fill?: [number, number, number]) => {
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.5);
    if (fill) {
      doc.setFillColor(...fill);
      doc.roundedRect(x, yy, w, h, 2.5, 2.5, "FD");
    } else doc.roundedRect(x, yy, w, h, 2.5, 2.5, "S");
  };
  const bandTitle = (label: string, yy: number) => {
    doc.setFillColor(...ORANGE);
    doc.roundedRect(M, yy, CW, 7, 3.5, 3.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(label.toUpperCase(), W / 2, yy + 4.9, { align: "center" });
  };
  const checkbox = (x: number, yy: number, checked: boolean, label: string, size = 8) => {
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.3);
    doc.rect(x, yy - 2.6, 3, 3, "S");
    if (checked) {
      doc.setLineWidth(0.6);
      doc.line(x + 0.6, yy - 1.1, x + 1.3, yy + 0.1);
      doc.line(x + 1.3, yy + 0.1, x + 2.6, yy - 2.2);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    doc.text(label, x + 4.5, yy);
  };
  const footer = () => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.setFont("helvetica", "normal");
      doc.text(`${COMPANY.name} · ${COMPANY.address}, ${COMPANY.postalCode} ${COMPANY.city} · RCS ${COMPANY.rcs}`, M, H - 7);
      doc.text(`${order.numero} · page ${i}/${pages}`, W - M, H - 7, { align: "right" });
    }
  };

  // ================================================================ En-tête
  let y = M;
  if (logo) doc.addImage(logo, "PNG", M, y, 36, 22);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.6);
  doc.line(M + 40, y + 1, M + 40, y + 21);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ORANGE);
  doc.text("DES ÉNERGIES", M + 43, y + 6);
  doc.text("RENOUVELABLES", M + 43, y + 11);
  doc.setTextColor(60, 110, 150);
  doc.text("POUR UN FUTUR DURABLE !", M + 43, y + 17);

  checkbox(M + 100, y + 5, false, "DEVIS", 9);
  checkbox(M + 100, y + 11, true, "BON DE COMMANDE", 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(`N° ${order.numero}`, W - M, y + 5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Date : ${dateFr(order.signedAt || order.createdAt)}`, W - M, y + 11, { align: "right" });
  doc.text(`Votre conseiller : ${order.commercialName}`, W - M, y + 16, { align: "right" });

  y += 25;
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(
    `${COMPANY.name} - ${COMPANY.address} ${COMPANY.postalCode} ${COMPANY.city} - RCS ${COMPANY.rcs} - Au capital de ${COMPANY.capital} - Tél. : ${COMPANY.phone} - ${COMPANY.email}`,
    W / 2,
    y,
    { align: "center" },
  );
  y += 4;

  // ================================================================ Client
  const clientRows: [string, string][] = [
    ["NOM / PRÉNOM", `${c.civilite} ${c.nom} ${c.prenom}`.trim()],
    ["ADRESSE DE FACTURATION", [c.adresse, c.complement, `${c.codePostal} ${c.ville}`].filter(Boolean).join(", ")],
    ["ADRESSE DE CHANTIER", c.chantierIdentique ? "Identique à l'adresse de facturation" : [c.adresseChantier, `${c.codePostalChantier ?? ""} ${c.villeChantier ?? ""}`.trim()].filter(Boolean).join(", ")],
    ["TÉL. / PORTABLE", [c.telephone, c.portable].filter(Boolean).join("  ·  ")],
    ["EMAIL", c.email || "—"],
  ];
  const ch = 6 + clientRows.length * 5.2;
  box(M, y, CW, ch);
  clientRows.forEach(([k, v], i) => {
    const yy = y + 5 + i * 5.2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...ORANGE);
    doc.text(`${k} :`, M + 4, yy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.setFontSize(8.5);
    doc.text(v, M + 52, yy);
  });
  y += ch + 4;

  // ================================================================ Produits
  bandTitle("Produits", y);
  y += 10;

  const cats = CATEGORIES.map((x) => x.id).filter((id) => order.lines.some((l) => l.category === id));
  for (const cat of cats) {
    const lines = order.lines.filter((l) => l.category === cat);
    ensure(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...ORANGE);
    doc.text(categoryLabel(cat).toUpperCase(), M + 2, y);
    y += 2;
    const body: (string | { content: string; colSpan?: number; styles?: Record<string, unknown> })[][] = [];
    for (const l of lines) {
      body.push([
        { content: `${l.quantity > 1 ? `${l.quantity} × ` : ""}${l.label}`, styles: { fontStyle: "bold" } },
        eurPdf(lineHT(l)),
        `${eurPdf(lineTTC(l) - lineHT(l))} (${pct(l.vatRate)})`,
        { content: eurPdf(lineTTC(l)), styles: { fontStyle: "bold" } },
      ]);
      const sub = [attrsLine(l), l.detail, l.description].filter(Boolean).join(" · ");
      if (sub) body.push([{ content: sub, colSpan: 4, styles: { fontSize: 6.8, textColor: GRAY, cellPadding: { top: 0.6, bottom: 1.8, left: 3.5, right: 2 } } }]);
    }
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["Désignation", "HT", "TVA", "TTC"]],
      body,
      styles: { font: "helvetica", fontSize: 8, cellPadding: 1.8, textColor: INK, lineColor: LINE, lineWidth: 0.2, valign: "middle" },
      headStyles: { fillColor: ORANGE_LIGHT, textColor: ORANGE, fontStyle: "bold", fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 28, halign: "right" }, 2: { cellWidth: 34, halign: "right" }, 3: { cellWidth: 28, halign: "right" } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  }

  if (order.notes) {
    const notes = doc.splitTextToSize(order.notes, CW - 8) as string[];
    ensure(10 + notes.length * 3.6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text("Autres produits et/ou observations :", M + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    notes.forEach((l, i) => doc.text(l, M + 2, y + 4.5 + i * 3.6));
    y += 6 + notes.length * 3.6;
  }
  ensure(8);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("Toutes les garanties sont des garanties fabricants. / Démarches administratives prises en charge par la société.", W / 2, y, { align: "center" });
  y += 6;

  // ================================================================ Modalités de règlement
  ensure(60);
  doc.setFillColor(...ORANGE);
  doc.roundedRect(M, y, CW, 7, 3.5, 3.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("MODALITÉS DE RÈGLEMENT", M + 4, y + 4.9);
  doc.setFontSize(8.5);
  const cbx = (x: number, checked: boolean, label: string) => {
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.rect(x, y + 1.9, 3.2, 3.2, "S");
    if (checked) {
      doc.setFillColor(255, 255, 255);
      doc.rect(x + 0.7, y + 2.6, 1.8, 1.8, "F");
    }
    doc.setTextColor(255, 255, 255);
    doc.text(label, x + 4.6, y + 4.6);
  };
  cbx(M + 88, f.mode === "comptant", "COMPTANT");
  cbx(M + 120, f.mode === "credit", "FINANCEMENT");
  y += 11;

  // Colonne gauche : totaux HT / TVA / TTC ; colonne droite : échéancier
  const leftX = M + 2;
  const rightX = M + CW / 2 + 4;
  const vatKeys = ["5.5", "10", "20"];
  const totalsRows: [string, string, boolean?][] = [
    ["TOTAL HT", eurPdf(t.totalHT)],
    ...vatKeys.map((k) => [`TVA ${k.replace(".", ",")} %`, t.tvaParTaux[k] ? eurPdf(t.tvaParTaux[k].tva) : "—"] as [string, string]),
  ];
  if (t.remiseTTC > 0) totalsRows.push(["Remise commerciale TTC", `- ${eurPdf(t.remiseTTC)}`]);
  totalsRows.push(["TOTAL TTC", eurPdf(t.totalTTC), true]);

  let ly = y;
  totalsRows.forEach(([k, v, strong]) => {
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setFontSize(strong ? 9.5 : 8.5);
    doc.setTextColor(...INK);
    doc.text(k, leftX, ly);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(leftX + 34, ly + 0.8, leftX + 82, ly + 0.8);
    doc.text(v, leftX + 82, ly, { align: "right" });
    ly += strong ? 6.5 : 5.2;
  });

  const e = f.echeancier;
  const sched: [string, string][] = [
    ["ACOMPTE À LA COMMANDE", e.commande ? `${eurPdf(e.commande)}${f.acompteMode ? ` (${paymentLabel[f.acompteMode]})` : ""}` : "0,00 €"],
    ["VERSEMENT À LA VISITE TECHNIQUE", eurPdf(e.visiteTechnique || 0)],
    ["VERSEMENT À LA LIVRAISON", eurPdf(e.livraison || 0)],
    ["VERSEMENT À L'INSTALLATION", eurPdf(e.installation || 0)],
  ];
  let ry = y;
  sched.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(`${k} :`, rightX, ry);
    doc.setFont("helvetica", "bold");
    doc.text(v, W - M - 2, ry, { align: "right" });
    ry += 5.2;
  });
  ry += 1;
  checkbox(rightX, ry, Boolean(order.delaiInstallationMois), `DÉLAI D'INSTALLATION ${order.delaiInstallationMois ?? 3} MOIS${order.dateInstallationPrevue ? ` (prévue le ${dateInput(order.dateInstallationPrevue)})` : ""}`);
  ry += 5.2;
  checkbox(rightX, ry, Boolean(f.reportJours), `REPORT ${f.reportJours || 180} JOURS`);
  ry += 5.2;
  if (f.mode === "comptant" && t.resteARepartir > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...ORANGE);
    doc.text(`Solde restant à répartir : ${eurPdf(t.resteARepartir)}`, rightX, ry);
    ry += 5;
  }
  y = Math.max(ly, ry) + 2;

  // Tableau de financement (toujours imprimé, vide si comptant, comme sur le carnet)
  ensure(24);
  const finHead = [["Montant total", "Apport personnel", "Solde financement", "Nombre d'échéances", "Mensualité sans assurance", "Taux nominal", "TAEG", "Coût total sans assurance", "Mensualité avec assurance", "Coût total avec assurance"]];
  const credit = f.mode === "credit" && t.montantFinance > 0;
  const finBody = [
    credit
      ? [
          eurPdf(t.totalTTC),
          eurPdf(t.acomptes),
          eurPdf(t.montantFinance),
          f.dureeMois ? String(f.dureeMois) : "",
          t.mensualiteHorsAssurance ? eurPdf(t.mensualiteHorsAssurance) : "",
          pct(f.taux),
          f.taeg ? pct(f.taeg) : "",
          t.coutTotalHorsAssurance ? eurPdf(t.coutTotalHorsAssurance) : "",
          f.avecAssurance && t.mensualite ? eurPdf(t.mensualite) : "",
          f.avecAssurance && t.coutTotalCredit ? eurPdf(t.coutTotalCredit) : "",
        ]
      : ["", "", "", "", "", "", "", "", "", ""],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: finHead,
    body: finBody,
    styles: { font: "helvetica", fontSize: 6.5, cellPadding: 1.2, halign: "center", valign: "middle", lineColor: LINE, lineWidth: 0.2, textColor: INK, minCellHeight: 8, overflow: "linebreak" },
    headStyles: { fillColor: ORANGE, textColor: 255, fontStyle: "bold", fontSize: 6.2 },
    bodyStyles: { fontStyle: "bold" },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

  if (credit) {
    ensure(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK);
    const emp = [
      f.organisme ? `Organisme : ${f.organisme}` : null,
      f.nbEmprunteurs ? `${f.nbEmprunteurs} emprunteur${f.nbEmprunteurs > 1 ? "s" : ""}` : null,
      f.dateNaissance1 ? `né(e) le ${dateInput(f.dateNaissance1)}` : null,
      f.dateNaissance2 ? `et le ${dateInput(f.dateNaissance2)}` : null,
      f.enActivite === false ? "sans activité" : null,
      f.avecAssurance ? "avec assurance emprunteur" : "sans assurance emprunteur",
    ].filter(Boolean);
    doc.text(emp.join(" · ") + ". Vente conclue sous réserve d'acceptation du dossier de financement par l'organisme prêteur (art. L312-45 du Code de la consommation).", M + 2, y, { maxWidth: CW - 4 });
    y += 8;
  }

  // ================================================================ Clauses
  ensure(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  doc.text("Clause de réserve de propriété : La marchandise reste la pleine propriété du vendeur jusqu'au complet paiement du prix.", M + 2, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...GRAY);
  const cee = doc.splitTextToSize(
    `« Tout ou partie des travaux relatifs à ce devis ou bon de commande sont éligibles à une prime d'un montant de ${f.primeCEE ? eurPdf(f.primeCEE) : "______________ euros"} dont EDF (SIREN 552 081 317) est à l'origine dans le cadre du dispositif des Certificats d'Économies d'Énergie. Le montant de cette prime ne pourra être révisé à la baisse qu'en cas de modification du volume de Certificats d'Économies d'Énergie attaché à l'opération ou aux opérations d'économies d'énergie ou de la situation de précarité énergétique et ce, de manière proportionnelle. Dans le cadre de la réglementation un contrôle qualité des travaux sur site ou par contact pourra être demandé. Un refus de ce contrôle sur site ou par contact via EDF ou un prestataire d'EDF conduira au refus de cette prime par EDF. »`,
    CW - 4,
  ) as string[];
  cee.forEach((l, i) => doc.text(l, M + 2, y + i * 3.1));
  y += cee.length * 3.1 + 4;

  // Reconnaissance CGV + attestation TVA
  ensure(34);
  const half = CW / 2 - 3;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  const rec = doc.splitTextToSize(
    "Je reconnais avoir pris connaissance et accepté les conditions générales de vente figurant au verso du présent bon de commande et avoir eu communication d'une manière claire et compréhensible de toutes les informations et renseignements visés à l'article L.111-1 du Code de la Consommation. Je reconnais avoir reçu le formulaire de rétractation joint et disposer d'un délai de 14 jours pour l'exercer (art. L221-18 du Code de la consommation).",
    half,
  ) as string[];
  rec.forEach((l, i) => doc.text(l, M + 2, y + i * 3.3));

  const hasReduced = order.lines.some((l) => l.vatRate < 20);
  const rx = M + half + 8;
  checkbox(rx, y, order.lines.some((l) => l.vatRate === 5.5), "TVA à 5,5 %", 7.5);
  checkbox(rx + 30, y, order.lines.some((l) => l.vatRate === 10), "TVA à 10 %", 7.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  const att = doc.splitTextToSize(
    `Je soussigné(e) ${hasReduced && order.attestationTvaReduite ? `${c.prenom} ${c.nom}` : "______________________"} certifie que mon habitation a plus de deux ans et est occupée à plus de 50 % à usage d'habitation.`,
    half - 2,
  ) as string[];
  att.forEach((l, i) => doc.text(l, rx, y + 5 + i * 3.3));
  y += Math.max(rec.length * 3.3, 5 + att.length * 3.3) + 5;

  // ================================================================ Signatures
  ensure(42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text(`Fait à ${order.lieuSignature || c.ville || "____________"}, le ${dateFr(order.signedAt) || "____/____/________"}`, M + 2, y);
  y += 3;
  const sigW = (CW - 6) / 2;
  const sigH = 32;
  const drawSig = (x: number, title: string, sub: string, img?: string) => {
    box(x, y, sigW, sigH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...ORANGE);
    doc.text(title, x + 3, y + 5);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(sub, x + 3, y + 8.5);
    if (img) {
      try {
        doc.addImage(img, "PNG", x + 3, y + 9.5, sigW - 6, sigH - 11, undefined, "FAST");
      } catch {
        /* image illisible */
      }
    }
  };
  drawSig(M, "SIGNATURE DU CLIENT", "Précédée de la mention « Bon pour accord »", order.signatureClient);
  drawSig(M + sigW + 6, "SIGNATURE DE VOTRE CONSEILLER", order.commercialName, order.signatureCommercial);
  y += sigH;

  // ================================================================ CGV (verso)
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text("CONDITIONS GÉNÉRALES DE VENTE", M, y + 4);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  const cgv = [
    `1. Objet. Le présent bon de commande a pour objet la fourniture et la pose des équipements désignés au recto par ${COMPANY.name}, ci-après « le Prestataire », au domicile du client. Toutes les garanties mentionnées sont des garanties fabricants.`,
    `2. Prix. Les prix sont exprimés en euros, hors taxes et toutes taxes comprises, au taux de TVA applicable au jour de la commande. Le taux réduit de TVA (5,5 % ou 10 %) est appliqué sur la base de l'attestation du client relative à l'ancienneté et à l'usage de son habitation ; toute déclaration inexacte entraîne la facturation du complément de TVA au client.`,
    `3. Droit de rétractation. Pour toute vente conclue hors établissement, le client dispose d'un délai de ${COMPANY.withdrawalDays} jours à compter de la signature du présent bon pour exercer son droit de rétractation, sans motif ni pénalité, en adressant le formulaire joint ou toute déclaration dénuée d'ambiguïté au Prestataire par courrier recommandé ou par courriel. Les sommes éventuellement versées seront restituées dans un délai maximum de 14 jours.`,
    `4. Paiement. Aucun paiement ne peut être exigé ni reçu avant l'expiration d'un délai de 7 jours à compter de la conclusion du contrat hors établissement (art. L221-10). Les versements suivent l'échéancier porté au recto. En cas de financement, la commande est conclue sous la condition suspensive d'obtention du crédit (art. L312-45 du Code de la consommation).`,
    `5. Réserve de propriété. La marchandise reste la pleine propriété du vendeur jusqu'au complet paiement du prix.`,
    `6. Délais et démarches. Le délai d'installation indiqué court à compter de la visite technique et de l'obtention des autorisations administratives (déclaration préalable, raccordement, Consuel), démarches prises en charge par la société. Le Prestataire ne saurait être tenu responsable des retards imputables aux tiers ou aux administrations.`,
    `7. Visite technique. La commande est conclue sous réserve de la faisabilité technique constatée lors de la visite technique. En cas d'impossibilité technique, le bon de commande est annulé de plein droit et les sommes versées restituées intégralement.`,
    `8. Garanties. Les équipements bénéficient de la garantie légale de conformité et de la garantie des vices cachés, ainsi que des garanties constructeur indiquées au recto. La pose est couverte par l'assurance responsabilité civile professionnelle et décennale du Prestataire${COMPANY.insurance ? ` (${COMPANY.insurance})` : ""}.`,
    `9. Primes et aides. Les montants de primes (CEE, MaPrimeRénov', prime à l'autoconsommation…) éventuellement mentionnés sont fournis à titre indicatif sur la base des informations communiquées par le client et de la réglementation en vigueur. Leur obtention dépend des organismes concernés.`,
    `10. Données personnelles. Les données recueillies sont nécessaires au traitement de la commande et conservées pendant la durée légale. Le client dispose d'un droit d'accès, de rectification et d'effacement en s'adressant au Prestataire (${COMPANY.email}).`,
    `11. Litiges. En cas de litige, le client peut recourir gratuitement à un médiateur de la consommation. À défaut d'accord amiable, les tribunaux compétents sont ceux du lieu du domicile du client.`,
  ];
  doc.setTextColor(...INK);
  cgv.forEach((para) => {
    const lines = doc.splitTextToSize(para, CW) as string[];
    lines.forEach((l) => {
      doc.text(l, M, y);
      y += 3.4;
    });
    y += 1.4;
  });

  y += 5;
  doc.setDrawColor(...GRAY);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(M, y, W - M, y);
  doc.setLineDashPattern([], 0);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("FORMULAIRE DE RÉTRACTATION", M, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.setTextColor(...GRAY);
  doc.text("(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)", M, y);
  y += 7;
  doc.setTextColor(...INK);
  doc.setFontSize(8.5);
  const retract = [
    `À l'attention de ${COMPANY.name}, ${COMPANY.address}, ${COMPANY.postalCode} ${COMPANY.city} · ${COMPANY.email} :`,
    `Je/nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la vente du bien / la prestation de services (*) ci-dessous :`,
    `Commandé le : ${dateFr(order.signedAt || order.createdAt)}  ·  Bon de commande n° ${order.numero}`,
    `Nom du (des) consommateur(s) : ${c.civilite} ${c.prenom} ${c.nom}`,
    `Adresse du (des) consommateur(s) : ${[c.adresse, c.complement, `${c.codePostal} ${c.ville}`].filter(Boolean).join(", ")}`,
    `Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) :`,
    ``,
    ``,
    `Date : ____/____/________`,
    `(*) Rayez la mention inutile.`,
  ];
  retract.forEach((l) => {
    const wrapped = l ? (doc.splitTextToSize(l, CW) as string[]) : [""];
    wrapped.forEach((w) => {
      doc.text(w, M, y);
      y += 5;
    });
  });

  footer();
  return doc;
}

export const orderPdfFileName = (order: Order) =>
  `${order.numero}_${order.customer.nom || "client"}.pdf`.replace(/[^\w.\-]+/g, "_");

export async function downloadOrderPdf(order: Order) {
  const doc = await buildOrderPdf(order);
  doc.save(orderPdfFileName(order));
}

export async function openOrderPdf(order: Order) {
  const doc = await buildOrderPdf(order);
  const url = doc.output("bloburl");
  window.open(url as unknown as string, "_blank");
}

/** Partage natif (mobile) si disponible, sinon téléchargement. */
export async function shareOrderPdf(order: Order) {
  const doc = await buildOrderPdf(order);
  const blob = doc.output("blob");
  const file = new File([blob], orderPdfFileName(order), { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: `Bon de commande ${order.numero}` });
  } else {
    doc.save(orderPdfFileName(order));
  }
}
