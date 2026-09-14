"use client";

import type { Customer } from "@/lib/types";
import { Field, Input, SectionTitle, SegmentedControl, Select, Toggle } from "@/components/ui";
import type { CustomerErrors } from "./model";

export function StepClient({ customer, errors, onChange }: { customer: Customer; errors: CustomerErrors; onChange: (c: Customer) => void }) {
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => onChange({ ...customer, [k]: v });

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle sub="Identité et adresse du lieu d'installation.">Coordonnées du client</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <Field label="Civilité" className="sm:col-span-2">
            <Select value={customer.civilite} onChange={(e) => set("civilite", e.target.value as Customer["civilite"])}>
              <option>M.</option>
              <option>Mme</option>
              <option>M. et Mme</option>
            </Select>
          </Field>
          <Field label="Nom" required error={errors.nom} className="sm:col-span-2">
            <Input value={customer.nom} onChange={(e) => set("nom", e.target.value.toUpperCase())} autoComplete="off" autoCapitalize="characters" />
          </Field>
          <Field label="Prénom" required error={errors.prenom} className="sm:col-span-2">
            <Input value={customer.prenom} onChange={(e) => set("prenom", e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Adresse" required error={errors.adresse} className="sm:col-span-6">
            <Input value={customer.adresse} onChange={(e) => set("adresse", e.target.value)} placeholder="N° et rue" autoComplete="street-address" />
          </Field>
          <Field label="Complément" className="sm:col-span-6">
            <Input value={customer.complement ?? ""} onChange={(e) => set("complement", e.target.value)} placeholder="Bâtiment, lieu-dit…" />
          </Field>
          <Field label="Code postal" required error={errors.codePostal} className="sm:col-span-2">
            <Input value={customer.codePostal} onChange={(e) => set("codePostal", e.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" autoComplete="postal-code" />
          </Field>
          <Field label="Ville" required error={errors.ville} className="sm:col-span-4">
            <Input value={customer.ville} onChange={(e) => set("ville", e.target.value)} autoComplete="address-level2" />
          </Field>
          <Field label="Téléphone" required error={errors.telephone} className="sm:col-span-3">
            <Input value={customer.telephone} onChange={(e) => set("telephone", e.target.value)} inputMode="tel" type="tel" autoComplete="tel" />
          </Field>
          <Field label="E-mail" error={errors.email} className="sm:col-span-3">
            <Input value={customer.email} onChange={(e) => set("email", e.target.value.trim())} inputMode="email" type="email" autoComplete="email" />
          </Field>
        </div>
      </section>

      <section>
        <SectionTitle sub="Informations utiles à la visite technique (facultatif).">Logement</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <Field label="Type de logement" className="sm:col-span-3">
            <SegmentedControl
              value={customer.typeLogement}
              onChange={(v) => set("typeLogement", v)}
              options={[
                { value: "maison", label: "Maison" },
                { value: "appartement", label: "Appartement" },
              ]}
            />
          </Field>
          <Field label="Statut" className="sm:col-span-3">
            <Toggle checked={customer.proprietaire} onChange={(v) => set("proprietaire", v)} label={customer.proprietaire ? "Propriétaire" : "Locataire"} />
          </Field>
          <Field label="Année de construction" className="sm:col-span-2">
            <Input value={customer.anneeConstruction ?? ""} onChange={(e) => set("anneeConstruction", e.target.value)} inputMode="numeric" placeholder="ex. 1998" />
          </Field>
          <Field label="Surface (m²)" className="sm:col-span-2">
            <Input value={customer.surfaceM2 ?? ""} onChange={(e) => set("surfaceM2", e.target.value)} inputMode="numeric" placeholder="ex. 120" />
          </Field>
          <Field label="Facture énergie annuelle (€)" className="sm:col-span-2">
            <Input value={customer.factureAnnuelle ?? ""} onChange={(e) => set("factureAnnuelle", e.target.value)} inputMode="numeric" placeholder="ex. 2400" />
          </Field>
          <Field label="Chauffage actuel" className="sm:col-span-6">
            <Select value={customer.chauffageActuel ?? ""} onChange={(e) => set("chauffageActuel", e.target.value)}>
              <option value="">— Non renseigné —</option>
              <option>Électrique</option>
              <option>Gaz</option>
              <option>Fioul</option>
              <option>Bois / granulés</option>
              <option>Pompe à chaleur</option>
              <option>Autre</option>
            </Select>
          </Field>
        </div>
      </section>
    </div>
  );
}
