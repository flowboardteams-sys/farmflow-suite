import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/analytics")({ component: () => <EmptyModule title="Analytics" description="KPIs, revenue, milk trends, and profitability." /> });
