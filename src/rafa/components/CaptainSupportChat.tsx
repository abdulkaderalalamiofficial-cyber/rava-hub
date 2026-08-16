import { useEffect, useRef, useState } from "react";
import { useChatThread, ensureSupportThread } from "../hooks/useChatThread";
import { Send, MessageCircle } from "lucide-react";

export function CaptainSupportChat({ topic }: { topic: "sos" | "bug" | "shift" | "general" }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await ensureSupportThread(topic);
      if (!cancelled) { setThreadId(id); setReady(true); }
    })();
    return () => { cancelled = true; };
  }, [topic]);

  const { messages, send, userId } = useChatThread(threadId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  if (!ready) {
    return <div className="text-xs text-muted-foreground p-3">جارٍ التحضير…</div>;
  }
  if (!threadId) {
    return (
      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
        سجّل الدخول لبدء محادثة مباشرة مع خدمة العملاء.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-card overflow-hidden">
      <div className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold flex items-center gap-2">
        <MessageCircle className="w-3.5 h-3.5" /> دعم RAVA · {topic.toUpperCase()}
      </div>
      <div ref={scrollRef} className="h-48 overflow-y-auto p-3 space-y-2 bg-emerald-50/40 dark:bg-emerald-950/10">
        {messages.length === 0 && (
          <div className="text-[11px] text-muted-foreground text-center py-6">ابدأ المحادثة — فريق الدعم سيرد فوراً.</div>
        )}
        {messages.map((m) => {
          const mine = m.sender_user_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-xs ${mine ? "bg-emerald-600 text-white rounded-br-sm" : "bg-white dark:bg-card border border-emerald-200 dark:border-emerald-900 rounded-bl-sm"}`}>
                {m.body}
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="flex items-center gap-1.5 p-2 border-t border-emerald-100 dark:border-emerald-900 bg-white dark:bg-card"
        onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { send(draft, "captain"); setDraft(""); } }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب رسالتك…"
          className="flex-1 px-3 py-1.5 text-xs rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button type="submit" className="p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}