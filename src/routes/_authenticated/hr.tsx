import { createFileRoute } from "@tanstack/react-router";
import { EmptyModule } from "@/components/module-shell";

export const Route = createFileRoute("/_authenticated/hr")({ component: () => <EmptyModule title="Human Resources" description="Employees, attendance, leave, and payroll." /> });
