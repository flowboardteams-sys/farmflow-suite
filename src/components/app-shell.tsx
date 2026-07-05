import { Link } from "@tanstack/react-router";
import { LogOut, Moon, Sun, Menu, X, Bell } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MODULES, MODULE_GROUPS, type ModuleDef } from "@/lib/modules";
import { useTheme } from "@/lib/theme";
import { useFarm } from "@/lib/farm-context";
import { useAuth } from "@/lib/auth";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">H</div>
            HerdOS
          </Link>
          <button className="md:hidden" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {MODULE_GROUPS.map((g) => (
            <div key={g}>
              <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{g}</div>
              <div className="space-y-1">
                {MODULES.filter((m) => m.group === g).map((m) => <NavItem key={m.path} m={m} active={pathname === m.path} onClick={onClose} />)}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

function NavItem({ m, active, onClick }: { m: ModuleDef; active: boolean; onClick: () => void }) {
  return (
    <Link to={m.path} onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}`}>
      <m.icon className="h-4 w-4" />
      <span className="flex-1 truncate">{m.label}</span>
      {!m.ready && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">soon</Badge>}
    </Link>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const { farms, farm, setFarmId, locations, location, setLocationId } = useFarm();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const unreadQ = useQuery({
    queryKey: ["notifications", "unread", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).is("read_at", null);
      return count ?? 0;
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/80 backdrop-blur px-4 h-14">
      <button className="md:hidden" onClick={onMenu}><Menu className="h-5 w-5" /></button>
      <Select value={farm?.id ?? ""} onValueChange={setFarmId}>
        <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Select farm" /></SelectTrigger>
        <SelectContent>{farms.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
      </Select>
      {locations.length > 0 && (
        <Select value={location?.id ?? ""} onValueChange={setLocationId}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Location" /></SelectTrigger>
          <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
        </Select>
      )}
      <div className="ml-auto flex items-center gap-1">
        <Link to="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {(unreadQ.data ?? 0) > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />}
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={toggle}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7"><AvatarFallback>{initials}</AvatarFallback></Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav({ to: "/profile" })}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav({ to: "/settings" })}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav({ to: "/support" })}>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive"><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
