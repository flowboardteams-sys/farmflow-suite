import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/health")({ component: () => <EmptyModule title="Health" description="Vaccinations, treatments, and disease analytics." /> });
