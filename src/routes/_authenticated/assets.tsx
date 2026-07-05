import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/assets")({ component: () => <EmptyModule title="Assets" description="Vehicles, machinery, maintenance, and depreciation." /> });
