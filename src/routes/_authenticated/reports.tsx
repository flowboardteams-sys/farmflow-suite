import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/reports")({ component: () => <EmptyModule title="Reports" description="Animal, health, milk, inventory, and financial reports." /> });
