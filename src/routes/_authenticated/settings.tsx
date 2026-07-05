import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/module-shell";
import { useFarm } from "@/lib/farm-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });

function Settings() {
  const { farm } = useFarm();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [tz, setTz] = useState("UTC");
  const [currency, setCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (farm) { setName(farm.name); } }, [farm]);

  const rolesQ = useQuery({
    queryKey: ["roles", farm?.id],
    enabled: !!farm,
    queryFn: async () => {
      const { data } = await supabase.from("roles").select("id,name,code,is_system").eq("farm_id", farm!.id).order("name");
      return data ?? [];
    },
  });

  const membersQ = useQuery({
    queryKey: ["members", farm?.id],
    enabled: !!farm,
    queryFn: async () => {
      const { data } = await supabase.from("farm_members").select("id,user_id,status,created_at").eq("farm_id", farm!.id);
      return data ?? [];
    },
  });

  async function saveGeneral() {
    if (!farm) return;
    setBusy(true);
    const { error } = await supabase.from("farms").update({ name, timezone: tz, currency }).eq("id", farm.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["farms"] });
  }

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState<string>("");
  async function invite() {
    if (!farm) return;
    const { error } = await supabase.from("invitations").insert({
      farm_id: farm.id, email: inviteEmail, role_id: inviteRoleId || null,
    });
    if (error) return toast.error(error.message);
    setInviteEmail("");
    toast.success("Invitation created. Share the invite link with your team.");
  }

  return (
    <ModuleShell title="Settings" description="Manage your farm, team, and preferences">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team & Roles</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card><CardHeader><CardTitle>Farm details</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div><Label>Farm name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Timezone</Label><Input value={tz} onChange={(e) => setTz(e.target.value)} /></div>
                <div><Label>Currency</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
              </div>
              <Button onClick={saveGeneral} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Invite a member</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Email</Label><Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></div>
                <div><Label>Role</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={inviteRoleId} onChange={(e) => setInviteRoleId(e.target.value)}>
                    <option value="">— Select role —</option>
                    {rolesQ.data?.filter((r) => r.code !== "owner").map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <Button onClick={invite} disabled={!inviteEmail}>Send invitation</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Roles ({rolesQ.data?.length ?? 0})</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {rolesQ.data?.map((r) => (
                    <li key={r.id} className="flex items-center justify-between border-b py-2 last:border-0">
                      <span className="text-sm">{r.name}</span>
                      {r.is_system && <Badge variant="secondary">system</Badge>}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-4">Custom role editor with per-permission matrix ships in the next phase.</p>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Members ({membersQ.data?.length ?? 0})</CardTitle></CardHeader>
              <CardContent>
                {(membersQ.data?.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground">No members yet.</p> : (
                  <ul className="space-y-1 text-sm">{membersQ.data?.map((m) => <li key={m.id} className="border-b py-2 last:border-0">{m.user_id} — {m.status}</li>)}</ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {["notifications","branding","localization","api"].map((k) => (
          <TabsContent key={k} value={k}>
            <Card><CardContent className="p-8 text-center text-muted-foreground">Configuration UI ships in the next phase.</CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
    </ModuleShell>
  );
}
