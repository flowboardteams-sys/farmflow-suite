import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/enterprise")({ component: () => <EmptyModule title="Enterprise" description="Multi-farm consolidated dashboards and approvals." /> });
