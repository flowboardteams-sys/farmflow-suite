import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/marketplace")({ component: () => <EmptyModule title="Marketplace" description="Your storefront, products, and inventory sync." /> });
