import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/module-shell";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useFarm } from "@/lib/farm-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/support")({ component: Support });

function Support() {
  const { user } = useAuth();
  const { farm } = useFarm();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user!.id, farm_id: farm?.id ?? null, subject, message,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Ticket submitted. We'll get back to you.");
    setSubject(""); setMessage("");
  }

  return (
    <ModuleShell title="Support" description="Get help from the HerdOS team">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Open a ticket</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>Subject</Label><Input required value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea required rows={6} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
            <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Submit ticket"}</Button>
          </form>
        </CardContent>
      </Card>
    </ModuleShell>
  );
}
