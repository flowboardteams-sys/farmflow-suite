import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/module-shell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({ component: Notifs });

function Notifs() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("notif-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function markAllRead() {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <ModuleShell title="Notifications" description="Realtime alerts and reminders"
      actions={<Button variant="outline" size="sm" onClick={markAllRead}>Mark all read</Button>}>
      {q.data && q.data.length > 0 ? (
        <div className="space-y-2">
          {q.data.map((n) => (
            <Card key={n.id} className={`p-4 flex items-start gap-3 ${!n.read_at ? "border-primary/40" : ""}`}>
              <Bell className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-sm">{n.title}</div>
                {n.message && <div className="text-sm text-muted-foreground">{n.message}</div>}
                <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">You're all caught up 🎉</div>
      )}
    </ModuleShell>
  );
}
