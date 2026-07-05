import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/weaning")({ component: () => <EmptyModule title="Automated Weaning" description="Feeding plans, reminders, and progress tracking." /> });
