import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/pedigree")({ component: () => <EmptyModule title="Pedigree" description="Family trees, bloodlines, and genetic conflict detection." /> });
