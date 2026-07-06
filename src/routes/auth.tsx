import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: p } = await supabase.from("profiles").select("is_super_admin").eq("id", data.session.user.id).maybeSingle();
      if (p?.is_super_admin) nav({ to: "/admin" });
      else nav({ to: "/dashboard" });
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: p } = await supabase.from("profiles").select("is_super_admin").eq("id", data.user!.id).maybeSingle();
      if (p?.is_super_admin) nav({ to: "/admin" });
      else nav({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-bold text-xl">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">H</div>
          HerdOS
        </Link>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Access your farm dashboard. Accounts are created by the Super Admin.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
            <div><Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "…" : "Sign in"}</Button>
          </form>

          <div className="mt-4 text-sm text-center">
            <Link to="/auth/forgot" className="text-muted-foreground hover:underline">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
