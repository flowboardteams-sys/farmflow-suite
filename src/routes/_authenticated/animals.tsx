import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/animals")({ component: () => <EmptyModule title="Animals" description="Registration, pedigree, tags, and full lifecycle." /> });
