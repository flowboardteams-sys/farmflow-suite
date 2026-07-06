import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/module-shell";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Plus, Users, Building2, Wallet, LifeBuoy, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  createFarmWithAdmin, listAllFarmsAdmin, adminStats, setFarmStatus, resetFarmAdminPassword,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({ component: Admin });

function Admin() {
  const { user } = useAuth();
  const meQ = useQuery({
    queryKey: ["me-super", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("is_super_admin").eq("id", user!.id).maybeSingle()).data,
  });

  if (meQ.isLoading) return <ModuleShell title="Admin"><div className="text-muted-foreground">Loading…</div></ModuleShell>;
  if (!meQ.data?.is_super_admin) {
    return (
      <ModuleShell title="Admin Panel">
        <div className="rounded-lg border border-dashed p-12 text-center max-w-lg mx-auto">
          <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Super-admin only</h2>
          <p className="mt-2 text-sm text-muted-foreground">Only Super Admins can access this panel.</p>
        </div>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell title="Super Admin Panel" description="Global system view">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="farms">Farms & Admins</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="tickets">Support</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><Overview /></TabsContent>
        <TabsContent value="farms" className="mt-4"><FarmsTab /></TabsContent>
        <TabsContent value="plans" className="mt-4"><PlansTab /></TabsContent>
        <TabsContent value="tickets" className="mt-4"><TicketsTab /></TabsContent>
      </Tabs>
    </ModuleShell>
  );
}

function Overview() {
  const fn = useServerFn(adminStats);
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });
  const s = q.data;
  const items = [
    { label: "Total Farms", value: s?.totalFarms ?? 0, icon: Building2 },
    { label: "Active Farms", value: s?.activeFarms ?? 0, icon: Activity },
    { label: "Suspended", value: s?.suspendedFarms ?? 0, icon: ShieldAlert },
    { label: "Total Users", value: s?.totalUsers ?? 0, icon: Users },
    { label: "Active Subs", value: s?.activeSubs ?? 0, icon: Wallet },
    { label: "Open Tickets", value: s?.openTickets ?? 0, icon: LifeBuoy },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map(i => (
        <Card key={i.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">{i.label}</CardTitle>
            <i.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{i.value}</div></CardContent>
        </Card>
      ))}
    </div>
  );
}

function FarmsTab() {
  const qc = useQueryClient();
  const list = useServerFn(listAllFarmsAdmin);
  const create = useServerFn(createFarmWithAdmin);
  const setStatus = useServerFn(setFarmStatus);
  const resetPwd = useServerFn(resetFarmAdminPassword);
  const farmsQ = useQuery({ queryKey: ["admin-farms"], queryFn: () => list() });

  const createM = useMutation({
    mutationFn: (v: any) => create({ data: v }),
    onSuccess: () => { toast.success("Farm + admin created"); qc.invalidateQueries({ queryKey: ["admin-farms"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const statusM = useMutation({
    mutationFn: (v: any) => setStatus({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-farms"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ farmName: "", locationName: "Main Location", timezone: "UTC", currency: "USD", adminEmail: "", adminPassword: "", adminFullName: "" });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{farmsQ.data?.length ?? 0} farms</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create Farm + Admin</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Farm & Farm Admin</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Farm Name</Label><Input value={form.farmName} onChange={e => setForm({ ...form, farmName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Location</Label><Input value={form.locationName} onChange={e => setForm({ ...form, locationName: e.target.value })} /></div>
                <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} /></div>
              </div>
              <div><Label>Admin Full Name</Label><Input value={form.adminFullName} onChange={e => setForm({ ...form, adminFullName: e.target.value })} /></div>
              <div><Label>Admin Email</Label><Input type="email" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} /></div>
              <div><Label>Admin Password</Label><Input type="text" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} placeholder="min 8 chars" /></div>
            </div>
            <DialogFooter>
              <Button disabled={createM.isPending || !form.farmName || !form.adminEmail || form.adminPassword.length < 8}
                onClick={() => createM.mutate(form, { onSuccess: () => { setOpen(false); setForm({ farmName: "", locationName: "Main Location", timezone: "UTC", currency: "USD", adminEmail: "", adminPassword: "", adminFullName: "" }); } })}>
                {createM.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {farmsQ.data?.map((f: any) => (
          <Card key={f.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium flex items-center gap-2">
                  {f.name}
                  {f.deleted_at && <Badge variant="destructive">Deleted</Badge>}
                  {f.status === "suspended" && <Badge variant="secondary">Suspended</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">Owner: {f.profiles?.full_name ?? f.owner_id.slice(0, 8)} · {f.currency} · {f.timezone}</div>
              </div>
              <div className="flex gap-2">
                {f.status !== "suspended" && !f.deleted_at && <Button size="sm" variant="outline" onClick={() => statusM.mutate({ farmId: f.id, action: "suspend" })}>Suspend</Button>}
                {(f.status === "suspended" || f.deleted_at) && <Button size="sm" variant="outline" onClick={() => statusM.mutate({ farmId: f.id, action: "activate" })}>Activate</Button>}
                <Button size="sm" variant="outline" onClick={async () => {
                  const pwd = prompt("New password for farm owner (min 8 chars):");
                  if (!pwd || pwd.length < 8) return;
                  try { await resetPwd({ data: { userId: f.owner_id, newPassword: pwd } }); toast.success("Password reset"); }
                  catch (e: any) { toast.error(e.message); }
                }}>Reset PW</Button>
                {!f.deleted_at && <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this farm?")) statusM.mutate({ farmId: f.id, action: "delete" }); }}>Delete</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
        {farmsQ.data?.length === 0 && <p className="text-sm text-muted-foreground">No farms yet. Create the first one above.</p>}
      </div>
    </div>
  );
}

function PlansTab() {
  const q = useQuery({ queryKey: ["admin-plans"], queryFn: async () => (await supabase.from("plans").select("*").order("monthly_price")).data ?? [] });
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {q.data?.map(p => (
        <Card key={p.id}>
          <CardHeader><CardTitle>{p.name}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${p.monthly_price}<span className="text-sm text-muted-foreground">/mo</span></div>
            <div className="mt-2 text-xs text-muted-foreground">code: {p.code}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TicketsTab() {
  const q = useQuery({ queryKey: ["admin-tickets"], queryFn: async () => (await supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [] });
  return (
    <div className="space-y-2">
      {q.data?.length === 0 && <p className="text-sm text-muted-foreground">No tickets.</p>}
      {q.data?.map(t => (
        <Card key={t.id}><CardContent className="p-4 flex justify-between">
          <div><div className="font-medium">{t.subject}</div><div className="text-xs text-muted-foreground">{t.status}</div></div>
        </CardContent></Card>
      ))}
    </div>
  );
}
