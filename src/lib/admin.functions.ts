import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.is_super_admin) throw new Error("Forbidden: super admin only");
}

export const createFarmWithAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    farmName: string;
    locationName?: string;
    timezone?: string;
    currency?: string;
    adminEmail: string;
    adminPassword: string;
    adminFullName: string;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create auth user (farm admin)
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.adminEmail,
      password: data.adminPassword,
      email_confirm: true,
      user_metadata: { full_name: data.adminFullName },
    });
    if (cErr) throw new Error(cErr.message);
    const adminId = created.user!.id;

    // Ensure profile
    await supabaseAdmin.from("profiles").upsert({ id: adminId, full_name: data.adminFullName });

    // Create farm owned by the new admin
    const { data: farm, error: fErr } = await supabaseAdmin.from("farms").insert({
      owner_id: adminId,
      name: data.farmName,
      timezone: data.timezone ?? "UTC",
      currency: data.currency ?? "USD",
    }).select().single();
    if (fErr) throw new Error(fErr.message);

    await supabaseAdmin.from("farm_locations").insert({
      farm_id: farm.id, name: data.locationName ?? "Main Location", is_primary: true,
    });
    await supabaseAdmin.from("farm_members").insert({
      farm_id: farm.id, user_id: adminId, status: "active",
    });

    // Seed roles for this farm
    const roles = [
      ["Owner", "owner"], ["Farm Manager", "farm_manager"], ["Veterinarian", "veterinarian"],
      ["Accountant", "accountant"], ["Inventory Manager", "inventory_manager"],
      ["HR Manager", "hr_manager"], ["Milker", "milker"], ["Worker", "worker"],
    ] as const;
    for (const [nm, cd] of roles) {
      const { data: role } = await supabaseAdmin.from("roles").insert({
        farm_id: farm.id, name: nm, code: cd, is_system: true,
      }).select().single();
      if (cd === "owner" && role) {
        const { data: perms } = await supabaseAdmin.from("permissions").select("id");
        if (perms?.length) {
          await supabaseAdmin.from("role_permissions").insert(
            perms.map((p: any) => ({ role_id: role.id, permission_id: p.id })),
          );
        }
        await supabaseAdmin.from("user_roles").insert({ user_id: adminId, farm_id: farm.id, role_id: role.id });
      }
    }

    // Assign a subscription (basic plan trial)
    const { data: plan } = await supabaseAdmin.from("plans").select("id").eq("code", "basic").maybeSingle();
    if (plan) {
      await supabaseAdmin.from("subscriptions").insert({
        farm_id: farm.id, plan_id: plan.id, status: "trialing",
        current_period_end: new Date(Date.now() + 14 * 864e5).toISOString(),
      });
    }

    await supabaseAdmin.from("activity_logs").insert({
      farm_id: farm.id, actor_id: context.userId, entity: "farm", entity_id: farm.id,
      action: "created", description: `Farm created by super admin, admin: ${data.adminEmail}`,
    });

    return { farmId: farm.id, adminId };
  });

export const resetFarmAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; newPassword: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.newPassword });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setFarmStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { farmId: string; action: "suspend" | "activate" | "delete" }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "delete") {
      const { error } = await supabaseAdmin.from("farms").update({ deleted_at: new Date().toISOString() }).eq("id", data.farmId);
      if (error) throw new Error(error.message);
    } else {
      const status = data.action === "suspend" ? "suspended" : "active";
      const { error } = await supabaseAdmin.from("farms").update({ status, deleted_at: null }).eq("id", data.farmId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listAllFarmsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("farms").select("*, subscriptions(*), profiles!farms_owner_id_fkey(full_name)").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [farms, subs, tickets, users] = await Promise.all([
      supabaseAdmin.from("farms").select("id,status,deleted_at"),
      supabaseAdmin.from("subscriptions").select("id,status"),
      supabaseAdmin.from("support_tickets").select("id,status"),
      supabaseAdmin.from("profiles").select("id"),
    ]);
    const f = farms.data ?? [];
    return {
      totalFarms: f.length,
      activeFarms: f.filter(x => !x.deleted_at && x.status !== "suspended").length,
      suspendedFarms: f.filter(x => x.status === "suspended").length,
      deletedFarms: f.filter(x => x.deleted_at).length,
      totalUsers: users.data?.length ?? 0,
      activeSubs: subs.data?.filter(s => s.status === "active" || s.status === "trialing").length ?? 0,
      openTickets: tickets.data?.filter(t => t.status !== "closed").length ?? 0,
    };
  });
