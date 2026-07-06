import type { ReactNode } from "react";
import { AppShell } from "./app-shell";
import { useFarm } from "@/lib/farm-context";

export function ModuleShell({
  title, description, children, actions,
}: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  const { loading } = useFarm();

  if (loading) return <AppShell><div className="text-muted-foreground">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </AppShell>
  );
}

export function EmptyModule({ title, description }: { title: string; description?: string }) {
  return (
    <ModuleShell title={title} description={description}>
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <div className="mx-auto max-w-md">
          <h2 className="text-lg font-semibold">Coming in the next phase</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This module is scaffolded and secured. Full functionality ships in an upcoming phase.
          </p>
        </div>
      </div>
    </ModuleShell>
  );
}
