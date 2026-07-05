import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/module-shell";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin });

function Admin() {
  const { user } = useAuth();
  const meQ = useQuery({
    queryKey: ["me-super", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("is_super_admin").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const farmsQ = useQuery({ queryKey: ["admin-farms"], enabled: !!meQ.data?.is_super_admin, queryFn: async () => (await supabase.from("farms").select("*").limit(100)).data ?? [] });
  const subsQ = useQuery({ queryKey: ["admin-subs"], enabled: !!meQ.data?.is_super_admin, queryFn: async () => (await supabase.from("subscriptions").select("*").limit(100)).data ?? [] });
  const plansQ = useQuery({ queryKey: ["admin-plans"], enabled: !!meQ.data?.is_super_admin, queryFn: async () => (await supabase.from("plans").select("*")).data ?? [] });
  const tixQ = useQuery({ queryKey: ["admin-tix"], enabled: !!meQ.data?.is_super_admin, queryFn: async () => (await supabase.from("support_tickets").select("*").limit(100)).data ?? [] });

  if (meQ.isLoading) return <ModuleShell title="Admin"><div className="text-muted-foreground">Loading…</div></ModuleShell>;
  if (!meQ.data?.is_super_admin) {
    return (
      <ModuleShell title="Admin Panel">
        <div className="rounded-lg border border-dashed p-12 text-center max-w-lg mx-auto">
          <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Super-admin only</h2>
          <p className="mt-2 text-sm text-muted-foreground">Contact your workspace admin to elevate access.</p>
        </div>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell title="Admin Panel" description="Global system view">
      <Tabs defaultValue="farms">
        <TabsList>
          <TabsTrigger value="farms">Farms</TabsTrigger>
          <TabsTrigger value="subs">Subscriptions</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>
        <TabsContent value="farms"><ListCard title={`${farmsQ.data?.length ?? 0} farms`} rows={farmsQ.data?.map(f => `${f.name}${f.deleted_at ? " (deleted)" : ""}`) ?? []} /></TabsContent>
        <TabsContent value="subs"><ListCard title={`${subsQ.data?.length ?? 0} subscriptions`} rows={subsQ.data?.map(s => `${s.status} — ${s.billing_cycle}`) ?? []} /></TabsContent>
        <TabsContent value="plans"><ListCard title={`${plansQ.data?.length ?? 0} plans`} rows={plansQ.data?.map(p => `${p.name} — $${p.monthly_price}/mo`) ?? []} /></TabsContent>
        <TabsContent value="tickets"><ListCard title={`${tixQ.data?.length ?? 0} tickets`} rows={tixQ.data?.map(t => `${t.status} — ${t.subject}`) ?? []} /></TabsContent>
      </Tabs>
    </ModuleShell>
  );
}

function ListCard({ title, rows }: { title: string; rows: string[] }) {
  return (
    <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">Nothing here.</p> :
          <ul className="space-y-1 text-sm">{rows.map((r, i) => <li key={i} className="border-b py-2 last:border-0">{r}</li>)}</ul>}
      </CardContent>
    </Card>
  );
}
