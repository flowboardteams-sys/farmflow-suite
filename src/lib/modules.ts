// Central registry of every module in the sidebar.
// Phase 1: routes render a "Coming soon" empty state; future phases fill them in.
import {
  LayoutDashboard, Beef, GitBranch, Stethoscope, TrendingUp, HeartHandshake,
  Milk, Baby, Package, Wrench, Wallet, Users, Store, Globe, ShoppingBag,
  ShoppingCart, Bell, FileText, BarChart3, Building2, Shield, Settings,
  LifeBuoy, User, type LucideIcon,
} from "lucide-react";

export type ModuleGroup = "Farm" | "Business" | "Operations" | "Growth" | "Admin";

export type ModuleDef = {
  path: string;
  label: string;
  icon: LucideIcon;
  group: ModuleGroup;
  ready?: boolean; // shipped this phase
};

export const MODULES: ModuleDef[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Farm", ready: true },
  { path: "/animals", label: "Animals", icon: Beef, group: "Farm" },
  { path: "/pedigree", label: "Pedigree", icon: GitBranch, group: "Farm" },
  { path: "/health", label: "Health", icon: Stethoscope, group: "Farm" },
  { path: "/growth", label: "Growth", icon: TrendingUp, group: "Farm" },
  { path: "/breeding", label: "Breeding", icon: HeartHandshake, group: "Farm" },
  { path: "/milk", label: "Milk Production", icon: Milk, group: "Farm" },
  { path: "/weaning", label: "Weaning", icon: Baby, group: "Farm" },

  { path: "/inventory", label: "Inventory", icon: Package, group: "Operations" },
  { path: "/assets", label: "Assets", icon: Wrench, group: "Operations" },
  { path: "/finance", label: "Finance", icon: Wallet, group: "Operations" },
  { path: "/hr", label: "Human Resources", icon: Users, group: "Operations" },

  { path: "/marketplace", label: "Marketplace", icon: Store, group: "Business" },
  { path: "/storefront", label: "Public Storefront", icon: Globe, group: "Business" },
  { path: "/customers", label: "Customers", icon: ShoppingBag, group: "Business" },
  { path: "/orders", label: "Orders", icon: ShoppingCart, group: "Business" },

  { path: "/notifications", label: "Notifications", icon: Bell, group: "Growth", ready: true },
  { path: "/reports", label: "Reports", icon: FileText, group: "Growth" },
  { path: "/analytics", label: "Analytics", icon: BarChart3, group: "Growth" },
  { path: "/enterprise", label: "Enterprise", icon: Building2, group: "Growth" },

  { path: "/admin", label: "Admin Panel", icon: Shield, group: "Admin", ready: true },
  { path: "/settings", label: "Settings", icon: Settings, group: "Admin", ready: true },
  { path: "/profile", label: "Profile", icon: User, group: "Admin", ready: true },
  { path: "/support", label: "Support", icon: LifeBuoy, group: "Admin", ready: true },
];

export const MODULE_GROUPS: ModuleGroup[] = ["Farm", "Operations", "Business", "Growth", "Admin"];
