import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  sender_role: string;
  body: string;
  created_at: string;
};

export function useChatThread(threadId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const load = useCallback(async () => {
    if (!threadId) { setMessages([]); return; }
    const { data, error } = await supabase
      .from("chat_messages" as never)
      .select("*")
      .eq("thread_id", threadId as any)
      .order("created_at", { ascending: true });
    if (error) { setError(error.message); return; }
    setMessages((data ?? []) as ChatMessage[]);
  }, [threadId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!threadId) return;
    const ch = supabase
      .channel(`chat-${threadId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  const send = useCallback(async (body: string, role: string) => {
    if (!threadId || !userId || !body.trim()) return;
    const { error } = await (supabase as any).from("chat_messages").insert({
      thread_id: threadId,
      sender_user_id: userId,
      sender_role: role,
      body: body.trim(),
    } as any);
    if (error) setError(error.message);
  }, [threadId, userId]);

  return { messages, userId, error, send, refresh: load };
}

/** Ensures a support thread exists for the current user; returns thread id or null when unauthenticated. */
export async function ensureSupportThread(topic: string): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return null;
  const { data: existing } = await supabase
    .from("chat_threads" as never)
    .select("id")
    .eq("kind", "support" as any)
    .eq("captain_user_id", uid as any)
    .eq("topic", topic as any)
    .limit(1)
    .maybeSingle();
  if (existing && (existing as any).id) return (existing as any).id as string;
  const { data: created, error } = await supabase
    .from("chat_threads" as never)
    .insert({ kind: "support", captain_user_id: uid, topic } as any)
    .select("id")
    .single();
  if (error || !created) return null;
  return (created as any).id as string;
}