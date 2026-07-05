import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/growth")({ component: () => <EmptyModule title="Growth Monitoring" description="Weight, height, milestones, and comparison charts." /> });
