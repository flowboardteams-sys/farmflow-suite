import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/breeding")({ component: () => <EmptyModule title="Breeding" description="AI records, pregnancy tests, and fertility analytics." /> });
