import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEMO_PASSWORD = "RavaDemo2026";
const DEMO_USERS: { email: string; role: "customer" | "captain" | "merchant" }[] = [
  { email: "demo.customer@rava.app", role: "customer" },
  { email: "demo.captain@rava.app", role: "captain" },
  { email: "demo.merchant@rava.app", role: "merchant" },
];

export const seedDemoAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: rpcErr } = await context.supabase.rpc("has_role" as never, {
      _user_id: context.userId,
      _role: "admin",
    } as never);
    if (rpcErr) throw new Error("Permission check failed");
    if (!isAdmin) throw new Error("Forbidden — admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const results: { email: string; role: string; status: "created" | "existing" | "error"; message?: string }[] = [];

    for (const u of DEMO_USERS) {
      try {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const existing = list?.users.find((x) => x.email?.toLowerCase() === u.email);
        if (existing) {
          // ensure password is the unified one
          await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD, email_confirm: true });
          results.push({ email: u.email, role: u.role, status: "existing" });
          continue;
        }
        const { error } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { demo: true, role: u.role },
        });
        if (error) {
          results.push({ email: u.email, role: u.role, status: "error", message: error.message });
        } else {
          results.push({ email: u.email, role: u.role, status: "created" });
        }
      } catch (e) {
        results.push({ email: u.email, role: u.role, status: "error", message: e instanceof Error ? e.message : String(e) });
      }
    }

    return { password: DEMO_PASSWORD, accounts: results };
  });