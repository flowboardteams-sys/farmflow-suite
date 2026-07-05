import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/customers")({ component: () => <EmptyModule title="Customers" description="Customer portal — profiles, orders, and addresses." /> });
