import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/orders")({ component: () => <EmptyModule title="Orders" description="Cart, checkout, invoices, and shipment tracking." /> });
