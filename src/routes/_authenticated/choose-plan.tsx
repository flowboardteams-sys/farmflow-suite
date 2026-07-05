import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ModuleShell } from "@/components/module-shell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFarm } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/choose-plan")({ component: ChoosePlan });

function ChoosePlan() {
  const { farm } = useFarm();
  const nav = useNavigate();
  const plansQ = useQuery({ queryKey: ["plans"], queryFn: async () => (await supabase.from("plans").select("*").eq("is_active", true).order("monthly_price")).data ?? [] });

  async function pick(planId: string) {
    if (!farm) return;
    // Phase 1: mark as active without real payment.
    const { error } = await supabase.from("subscriptions").update({
      plan_id: planId, status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    }).eq("farm_id", farm.id);
    if (error) return toast.error(error.message);
    toast.success("Plan updated (billing stubbed for now).");
    nav({ to: "/dashboard" });
  }

  return (
    <ModuleShell title="Choose your plan" description="Real payments arrive in a later phase — pick a tier now to unlock features.">
      <div className="grid gap-6 md:grid-cols-3">
        {plansQ.data?.map((p) => (
          <Card key={p.id}>
            <CardHeader><CardTitle>{p.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${p.monthly_price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {Object.entries(p.limits as Record<string, number>).map(([k, v]) => (
                  <li key={k} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{v === -1 ? "Unlimited" : v} {k}</li>
                ))}
              </ul>
              <Button className="w-full mt-6" onClick={() => pick(p.id)}>Choose {p.name}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </ModuleShell>
  );
}
