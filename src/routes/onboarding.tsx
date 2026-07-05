import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  component: Onboarding,
});

function Onboarding() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [locName, setLocName] = useState("Main Location");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return nav({ to: "/auth" });
      const { data } = await supabase.from("farms").select("id").limit(1);
      if (data && data.length > 0) nav({ to: "/dashboard" });
    })();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("bootstrap_farm", { _name: name, _location_name: locName });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Farm created!");
    nav({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground"><Leaf className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold">Set up your farm</h1>
            <p className="text-sm text-muted-foreground">Just a couple of details to get started.</p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label>Farm name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Green Valley Dairy" /></div>
          <div><Label>Primary location</Label><Input required value={locName} onChange={(e) => setLocName(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy || !name}>{busy ? "Creating…" : "Create farm"}</Button>
        </form>
      </div>
    </div>
  );
}
