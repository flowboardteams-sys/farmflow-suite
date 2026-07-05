import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const nav = useNavigate();
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    nav({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Set new password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label>New password</Label><Input type="password" required minLength={8} value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "…" : "Update password"}</Button>
        </form>
      </div>
    </div>
  );
}
