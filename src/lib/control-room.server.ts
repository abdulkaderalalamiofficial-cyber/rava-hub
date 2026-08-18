import { createHash, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const KEY = "control_room_password_hash";

function hash(password: string): string {
  return createHash("sha256").update(`rava-control::${password}`, "utf8").digest("hex");
}

export async function checkControlPassword(password: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", KEY)
    .maybeSingle();
  if (error) throw error;
  const stored = data?.value;
  if (!stored) return false;
  const a = Buffer.from(hash(password), "utf8");
  const b = Buffer.from(stored, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function saveControlPassword(password: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("settings")
    .upsert({ key: KEY, value: hash(password), updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}
