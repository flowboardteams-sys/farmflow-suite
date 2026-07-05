import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/module-shell";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (q.data) { setName(q.data.full_name ?? ""); setPhone(q.data.phone ?? ""); } }, [q.data]);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <ModuleShell title="Your Profile">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Account details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>
    </ModuleShell>
  );
}
