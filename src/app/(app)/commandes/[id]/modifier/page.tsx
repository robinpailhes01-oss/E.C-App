"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { getStore } from "@/lib/data";
import type { Order } from "@/lib/types";
import { OrderWizard } from "@/components/order-wizard/wizard";
import { EmptyState, Spinner } from "@/components/ui";

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = React.useState<Order | null | undefined>(undefined);

  React.useEffect(() => {
    getStore()
      .getOrder(id)
      .then((o) => {
        if (o && o.status !== "brouillon") router.replace(`/commandes/${id}`);
        else setOrder(o);
      });
  }, [id, router]);

  if (order === undefined) return <Spinner />;
  if (!order) return <EmptyState title="Bon de commande introuvable" />;
  return <OrderWizard initial={order} />;
}
