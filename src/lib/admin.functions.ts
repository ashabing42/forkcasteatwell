import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: !!data };
  });

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const ids = data.users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }, { data: recipes }, { data: plans }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, diets, onboarded").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
      supabaseAdmin.from("recipes").select("user_id").in("user_id", ids),
      supabaseAdmin.from("meal_plans").select("user_id").in("user_id", ids),
    ]);
    const count = (rows: { user_id: string }[] | null, id: string) => (rows ?? []).filter((r) => r.user_id === id).length;
    return data.users.map((u) => {
      const p = profiles?.find((x) => x.id === u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at ?? null,
        onboarded: p?.onboarded ?? false,
        diets: p?.diets ?? [],
        isAdmin: (roles ?? []).some((r) => r.user_id === u.id && r.role === "admin"),
        recipes: count(recipes, u.id),
        weeks: count(plans, u.id),
      };
    });
  });

export const impersonateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input?.userId ?? "")) throw new Error("Invalid user");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("That's you already");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (error || !target.user?.email) throw new Error("User not found");
    const { data: link, error: e2 } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: target.user.email });
    if (e2) throw new Error(e2.message);
    await supabaseAdmin.from("admin_audit").insert({ admin_id: context.userId, target_user_id: data.userId, action: "impersonate" });
    return { tokenHash: link.properties.hashed_token, email: target.user.email };
  });
