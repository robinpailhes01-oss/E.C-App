import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "./types";
import { computeTotals } from "./pricing";
import { COMPANY } from "./company";
import { categoryShort } from "./catalog";

const BLUE: [number, number, number] = [62, 150, 196];
const ORANGE: [number, number, number] = [240, 144, 45];
const GRAY: [number, number, number] = [109, 110, 113];
const INK: [number, number, number] = [31, 35, 40];
const LIGHT: [number, number, number] = [244, 243, 239];

const eurPdf = (n: number | null | undefined) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0).replace(/ | /g, " ") + " €";

const dateFr = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "");

const dateInstallation = (iso?: string) => {
  if (!iso) return "À définir avec le client";
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

const financingLabel = (o: Order) => {
  switch (o.financing.mode) {
    case "comptant":
      return "Paiement comptant";
    case "credit":
      return "Financement par crédit";
    case "mixte":
      return "Paiement mixte (comptant + crédit)";
  }
};

const paymentLabel: Record<string, string> = { cheque: "Chèque", virement: "Virement", cb: "Carte bancaire", especes: "Espèces" };

export async function buildOrderPdf(order: Order): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const t = computeTotals(order);
  const logo = await loadLogo();
  const c = order.customer;

  const footer = () => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      const legal = [COMPANY.name, COMPANY.legalForm, COMPANY.capital && `Capital ${COMPANY.capital}`, COMPANY.siret && `SIRET ${COMPANY.siret}`, COMPANY.rcs && `RCS ${COMPANY.rcs}`, COMPANY.tvaIntra && `TVA ${COMPANY.tvaIntra}`]
        .filter(Boolean)
        .join(" · ");
      doc.text(legal, M, H - 9);
      doc.text(`${order.numero} · page ${i}/${pages}`, W - M, H - 9, { align: "right" });
      doc.setDrawColor(...LIGHT);
      doc.line(M, H - 12, W - M, H - 12);
    }
  };

  // ---------------------------------------------------------------- Header
  let y = M;
  if (logo) doc.addImage(logo, "PNG", M, y - 2, 42, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text("BON DE COMMANDE", W - M, y + 6, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(...BLUE);
  doc.text(`N° ${order.numero}`, W - M, y + 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.setFontSize(9);
  doc.text(`Date : ${dateFr(order.signedAt || order.createdAt)}`, W - M, y + 17, { align: "right" });
  doc.text(`Commercial : ${order.commercialName}`, W - M, y + 21.5, { align: "right" });

  y += 27;
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const companyLine = [COMPANY.name, [COMPANY.address, `${COMPANY.postalCode} ${COMPANY.city}`].filter(Boolean).join(", "), COMPANY.phone, COMPANY.email, COMPANY.website]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(companyLine, M, y);
  y += 6;

  // ------------------------------------------------------------ Client block
  const boxH = 32;
  const half = (W - 2 * M - 4) / 2;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, y, half, boxH, 2, 2, "F");
  doc.roundedRect(M + half + 4, y, half, boxH, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLUE);
  doc.text("CLIENT", M + 4, y + 5.5);
  doc.text("LIEU D'INSTALLATION / INFORMATIONS", M + half + 8, y + 5.5);

  doc.setTextColor(...INK);
  doc.setFontSize(9.5);
  doc.text(`${c.civilite} ${c.prenom} ${c.nom}`.trim(), M + 4, y + 11.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const clientLines = [c.adresse, c.complement, `${c.codePostal} ${c.ville}`, `Tél. ${c.telephone}`, c.email].filter(Boolean) as string[];
  clientLines.forEach((l, i) => doc.text(l, M + 4, y + 16.5 + i * 4.2));

  const info = [
    `Logement : ${c.typeLogement === "maison" ? "Maison" : "Appartement"} · ${c.proprietaire ? "Propriétaire" : "Locataire"}`,
    c.anneeConstruction && `Année de construction : ${c.anneeConstruction}`,
    c.surfaceM2 && `Surface : ${c.surfaceM2} m²`,
    c.chauffageActuel && `Chauffage actuel : ${c.chauffageActuel}`,
    c.factureAnnuelle && `Facture énergie annuelle : ${c.factureAnnuelle} €`,
    `Installation prévue : ${dateInstallation(order.dateInstallationPrevue)}`,
  ].filter(Boolean) as string[];
  info.forEach((l, i) => doc.text(l, M + half + 8, y + 11.5 + i * 4.2));

  y += boxH + 5;

  // ----------------------------------------------------------- Lines table
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Désignation", "Qté", "PU HT", "Total HT"]],
    body: order.lines.map((l) => [
      { content: `${l.label}${l.detail ? `\n${l.detail}` : ""}\n${categoryShort(l.category)}`, styles: {} },
      String(l.quantity),
      eurPdf(l.unitPriceHT),
      eurPdf(l.quantity * l.unitPriceHT),
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2, textColor: INK, lineColor: [230, 230, 230], lineWidth: 0.2 },
    headStyles: { fillColor: BLUE, textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 14, halign: "center" }, 2: { cellWidth: 30, halign: "right" }, 3: { cellWidth: 32, halign: "right" } },
    alternateRowStyles: { fillColor: [250, 250, 248] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        data.cell.styles.fontStyle = "normal";
      }
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // ---------------------------------------------------------------- Totals
  const totalsRows: [string, string, boolean?][] = [];
  if (t.remiseHT > 0) {
    totalsRows.push(["Sous-total HT", eurPdf(t.brutHT)]);
    totalsRows.push(["Remise commerciale HT", `- ${eurPdf(t.remiseHT)}`]);
  }
  totalsRows.push(["Total HT", eurPdf(t.totalHT)]);
  totalsRows.push([`TVA ${order.vatRate.toString().replace(".", ",")} %`, eurPdf(t.tva)]);
  totalsRows.push(["TOTAL TTC", eurPdf(t.totalTTC), true]);

  const tw = 80;
  const tx = W - M - tw;
  totalsRows.forEach(([label, val, strong]) => {
    if (strong) {
      doc.setFillColor(...ORANGE);
      doc.roundedRect(tx, y - 1, tw, 8, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text(label, tx + 3, y + 4.5);
      doc.text(val, tx + tw - 3, y + 4.5, { align: "right" });
      y += 9;
    } else {
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(label, tx + 3, y + 4);
      doc.text(val, tx + tw - 3, y + 4, { align: "right" });
      y += 6;
    }
  });
  y += 4;

  // ------------------------------------------------------------ Financement
  const f = order.financing;
  const finLines: string[] = [financingLabel(order)];
  if (t.acompte > 0) finLines.push(`Acompte à la commande : ${eurPdf(t.acompte)}${f.acompteMode ? ` (${paymentLabel[f.acompteMode]})` : ""}`);
  if (t.montantFinance > 0) {
    finLines.push(`Montant financé : ${eurPdf(t.montantFinance)}${f.organisme ? ` · Organisme : ${f.organisme}` : ""}`);
    const parts = [
      f.dureeMois ? `${f.dureeMois} mensualités` : null,
      t.mensualite ? `de ${eurPdf(t.mensualite)}` : null,
      f.taeg ? `· TAEG ${f.taeg.toString().replace(".", ",")} %` : null,
      f.reportMois ? `· report ${f.reportMois} mois` : null,
    ].filter(Boolean);
    if (parts.length) finLines.push(parts.join(" "));
    if (t.coutTotalCredit) finLines.push(`Coût total du crédit (hors assurance) : ${eurPdf(t.coutTotalCredit)}`);
    finLines.push("Sous réserve d'acceptation du dossier par l'organisme de financement.");
  }
  if (t.soldeComptant > 0) finLines.push(`Solde à régler à l'installation : ${eurPdf(t.soldeComptant)}`);
  if (f.aides && f.aides > 0) finLines.push(`Aides / primes estimées (à titre indicatif, non contractuel) : ${eurPdf(f.aides)}`);
  if (f.commentaire) finLines.push(f.commentaire);

  const finH = 9 + finLines.length * 4.4;
  if (y + finH > H - 70) {
    doc.addPage();
    y = M;
  }
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, y, W - 2 * M, finH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLUE);
  doc.text("MODALITÉS DE PAIEMENT ET FINANCEMENT", M + 4, y + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  finLines.forEach((l, i) => doc.text(l, M + 4, y + 11 + i * 4.4));
  y += finH + 4;

  if (order.notes) {
    const notes = doc.splitTextToSize(order.notes, W - 2 * M - 8) as string[];
    const nh = 9 + notes.length * 4.2;
    if (y + nh > H - 70) {
      doc.addPage();
      y = M;
    }
    doc.setFillColor(...LIGHT);
    doc.roundedRect(M, y, W - 2 * M, nh, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BLUE);
    doc.text("OBSERVATIONS", M + 4, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    notes.forEach((l, i) => doc.text(l, M + 4, y + 11 + i * 4.2));
    y += nh + 4;
  }

  // ------------------------------------------------------------- Signatures
  if (y > H - 68) {
    doc.addPage();
    y = M;
  }
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const mentions = doc.splitTextToSize(
    `Le client reconnaît avoir pris connaissance des conditions générales de vente et du formulaire de rétractation figurant en page suivante, et en avoir reçu un exemplaire. ` +
      `Conformément aux articles L221-18 et suivants du Code de la consommation, le client dispose d'un délai de ${COMPANY.withdrawalDays} jours à compter de la signature du présent bon pour exercer son droit de rétractation, sans avoir à motiver sa décision. ` +
      `Aucun paiement ne peut être exigé avant l'expiration d'un délai de 7 jours à compter de la conclusion du contrat pour une vente hors établissement (art. L221-10). ` +
      `Les prix s'entendent pose et mise en service comprises, hors travaux non prévus au présent bon.`,
    W - 2 * M,
  ) as string[];
  mentions.forEach((l, i) => doc.text(l, M, y + i * 3.4));
  y += mentions.length * 3.4 + 4;

  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Fait à ${order.lieuSignature || c.ville || "____________"}, le ${dateFr(order.signedAt) || "____/____/________"}`, M, y);
  y += 4;

  const sigW = (W - 2 * M - 6) / 2;
  const sigH = 34;
  const drawSig = (x: number, title: string, sub: string, img?: string) => {
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(x, y, sigW, sigH, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(title, x + 3, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(sub, x + 3, y + 9);
    if (img) {
      try {
        doc.addImage(img, "PNG", x + 3, y + 10, sigW - 6, sigH - 12, undefined, "FAST");
      } catch {
        /* ignore corrupt image */
      }
    }
  };
  drawSig(M, "SIGNATURE DU CLIENT", `Précédée de la mention « Lu et approuvé, bon pour commande »`, order.signatureClient);
  drawSig(M + sigW + 6, "SIGNATURE DU COMMERCIAL", `Pour ${COMPANY.name}`, order.signatureCommercial);
  y += sigH;

  // ------------------------------------------------ Page CGV + rétractation
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text("CONDITIONS GÉNÉRALES DE VENTE (extrait)", M, y + 4);
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  const cgv = [
    `1. Objet. Le présent bon de commande a pour objet la fourniture et la pose des équipements désignés ci-avant par ${COMPANY.name}, ci-après « le Prestataire », au domicile du client.`,
    `2. Prix. Les prix sont exprimés en euros, hors taxes et toutes taxes comprises, au taux de TVA applicable au jour de la commande. Ils comprennent la fourniture du matériel, la pose et la mise en service, sauf mention contraire portée au bon de commande.`,
    `3. Droit de rétractation. Le client dispose d'un délai de ${COMPANY.withdrawalDays} jours à compter de la signature du présent bon pour exercer son droit de rétractation, sans motif ni pénalité, en adressant le formulaire ci-dessous ou toute déclaration dénuée d'ambiguïté au Prestataire par courrier recommandé ou par courriel. Les sommes éventuellement versées seront restituées dans un délai maximum de 14 jours.`,
    `4. Paiement. Aucun paiement ne peut être exigé ni reçu avant l'expiration d'un délai de 7 jours à compter de la conclusion du contrat hors établissement. Le solde est exigible à la fin des travaux, sauf financement par un organisme de crédit. En cas de financement, la commande est conclue sous la condition suspensive d'obtention du crédit (art. L312-45 du Code de la consommation).`,
    `5. Délais. La date d'installation indiquée est donnée à titre indicatif et sera confirmée par le Prestataire après visite technique et obtention des autorisations administratives éventuelles (déclaration préalable, demande de raccordement). Le Prestataire ne saurait être tenu responsable des retards imputables aux tiers ou aux administrations.`,
    `6. Visite technique. La commande est conclue sous réserve de la faisabilité technique constatée lors de la visite technique. En cas d'impossibilité technique, le bon de commande est annulé de plein droit et les sommes versées restituées intégralement.`,
    `7. Garanties. Les équipements bénéficient de la garantie légale de conformité et de la garantie des vices cachés, ainsi que des garanties constructeur. La pose est couverte par l'assurance responsabilité civile professionnelle et décennale du Prestataire${COMPANY.insurance ? ` (${COMPANY.insurance})` : ""}.`,
    `8. Aides et primes. Les montants d'aides ou de primes éventuellement mentionnés sont fournis à titre indicatif, sur la base des informations communiquées par le client et de la réglementation en vigueur. Leur obtention dépend des organismes concernés et ne constitue pas une condition du présent contrat, sauf mention expresse.`,
    `9. Données personnelles. Les données recueillies sont nécessaires au traitement de la commande et sont conservées pendant la durée légale. Le client dispose d'un droit d'accès, de rectification et d'effacement en s'adressant au Prestataire.`,
    `10. Litiges. En cas de litige, le client peut recourir gratuitement à un médiateur de la consommation. À défaut d'accord amiable, les tribunaux compétents sont ceux du lieu du domicile du client.`,
  ];
  cgv.forEach((para) => {
    const lines = doc.splitTextToSize(para, W - 2 * M) as string[];
    lines.forEach((l) => {
      doc.text(l, M, y);
      y += 3.6;
    });
    y += 1.6;
  });

  y += 6;
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
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)", M, y);
  y += 7;
  doc.setTextColor(...INK);
  doc.setFontSize(9);
  const retract = [
    `À l'attention de ${COMPANY.name}${COMPANY.address ? `, ${COMPANY.address}, ${COMPANY.postalCode} ${COMPANY.city}` : ""}${COMPANY.email ? ` · ${COMPANY.email}` : ""} :`,
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
    const wrapped = l ? (doc.splitTextToSize(l, W - 2 * M) as string[]) : [""];
    wrapped.forEach((w) => {
      doc.text(w, M, y);
      y += 5.2;
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
