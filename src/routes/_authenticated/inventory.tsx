import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/inventory")({ component: () => <EmptyModule title="Inventory" description="Feed, medicine, purchase orders, and expiry tracking." /> });
