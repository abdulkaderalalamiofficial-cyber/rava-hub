import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RemoteProfile = {
  firstSeen: string;
  visits: number;
  lastGreeted: string | null;
  categories: Record<string, number>;
};

/** Reads the signed-in user's silent profile (occasions + interests). */
export const getPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RemoteProfile | null> => {
    const { data, error } = await context.supabase
      .from("user_preferences")
      .select("first_seen, visits, last_greeted, categories")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      firstSeen: data.first_seen as string,
      visits: data.visits as number,
      lastGreeted: (data.last_greeted as string | null) ?? null,
      categories: (data.categories as Record<string, number>) ?? {},
    };
  });

/** Upserts the profile so occasions/interests persist across devices. */
export const savePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: RemoteProfile) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_preferences").upsert(
      {
        user_id: context.userId,
        first_seen: data.firstSeen,
        visits: data.visits,
        last_greeted: data.lastGreeted,
        categories: data.categories,
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    return { ok: true };
  });
