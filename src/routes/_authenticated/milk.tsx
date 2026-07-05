import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/milk")({ component: () => <EmptyModule title="Milk Production" description="Daily entry by shift, quality, and monthly reports." /> });
