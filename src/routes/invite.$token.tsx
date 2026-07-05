import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({ component: Accept });

function Accept() {
  const { token } = Route.useParams();
  const nav = useNavigate();
  const [inv, setInv] = useState<{ email: string; farm_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("invitations").select("email,farm_id").eq("token", token).maybeSingle();
      setInv(data);
      setLoading(false);
    })();
  }, [token]);

  async function accept() {
    setBusy(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { nav({ to: "/auth" }); return; }
    const { error } = await supabase.rpc("accept_invitation", { _token: token });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Joined farm");
    nav({ to: "/dashboard" });
  }

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!inv) return (
    <div className="min-h-screen grid place-items-center">
      <div className="rounded-lg border p-6 max-w-md text-center">
        <h1 className="text-xl font-semibold">Invitation invalid or expired</h1>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-lg border p-6 text-center">
        <h1 className="text-xl font-semibold">You're invited</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in as {inv.email} to accept.</p>
        <Button className="w-full mt-6" onClick={accept} disabled={busy}>Accept invitation</Button>
      </div>
    </div>
  );
}
