import { createFileRoute } from "@tanstack/react-router";
import { ModuleShell } from "@/components/module-shell";
import { useFarm } from "@/lib/farm-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Beef, Milk, HeartHandshake, Bell } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

const demoMilk = Array.from({ length: 14 }, (_, i) => ({ day: `D${i + 1}`, liters: 0 }));
const demoRev = Array.from({ length: 6 }, (_, i) => ({ month: `M${i + 1}`, revenue: 0, expenses: 0 }));

function Dashboard() {
  const { farm } = useFarm();

  const kpi = useQuery({
    queryKey: ["kpi", farm?.id],
    enabled: !!farm,
    queryFn: async () => {
      const [{ count: animals }, { count: notifs }] = await Promise.all([
        supabase.from("animals").select("*", { count: "exact", head: true }).eq("farm_id", farm!.id).is("deleted_at", null),
        supabase.from("notifications").select("*", { count: "exact", head: true }).is("read_at", null),
      ]);
      return { animals: animals ?? 0, notifs: notifs ?? 0, milk: 0, pregnant: 0 };
    },
  });

  const activity = useQuery({
    queryKey: ["activity", farm?.id],
    enabled: !!farm,
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("*").eq("farm_id", farm!.id).order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Animals", value: kpi.data?.animals ?? 0, icon: Beef },
    { label: "Milk today (L)", value: kpi.data?.milk ?? 0, icon: Milk },
    { label: "Pregnant", value: kpi.data?.pregnant ?? 0, icon: HeartHandshake },
    { label: "Alerts", value: kpi.data?.notifs ?? 0, icon: Bell },
  ];

  return (
    <ModuleShell title={`Welcome${farm ? ` — ${farm.name}` : ""}`} description="Today's snapshot across your farm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Milk Production (14d)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demoMilk}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" /><YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="liters" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue vs Expenses</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demoRev}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" /><YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#22c55e" />
                <Bar dataKey="expenses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {activity.data && activity.data.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {activity.data.map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <span><span className="font-medium">{a.entity}</span> {a.action}{a.description ? ` — ${a.description}` : ""}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </CardContent>
      </Card>
    </ModuleShell>
  );
}
