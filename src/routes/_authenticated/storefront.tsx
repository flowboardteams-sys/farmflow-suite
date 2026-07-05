import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/storefront")({ component: () => <EmptyModule title="Public Storefront" description="Public browse, search, and product details." /> });
