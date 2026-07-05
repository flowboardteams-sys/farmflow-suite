import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/finance")({ component: () => <EmptyModule title="Finance" description="Income, expenses, invoices, and P&L." /> });
