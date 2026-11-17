"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type Props = {
  bookingId: string;
  userId: string;
  otherName: string;
  initialMessages: Message[];
  canSend: boolean;
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default function ChatThread({
  bookingId,
  userId,
  otherName,
  initialMessages,
  canSend,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Add new messages without duplicates, keeping them in order
  const merge = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      let changed = false;
      incoming.forEach((m) => {
        if (!map.has(m.id)) {
          map.set(m.id, m);
          changed = true;
        }
      });
      if (!changed) return prev;
      return Array.from(map.values()).sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      );
    });
  }, []);

  const markRead = useCallback(async () => {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("booking_id", bookingId)
      .neq("sender_id", userId)
      .is("read_at", null);
  }, [supabase, bookingId, userId]);

  useEffect(() => {
    setMounted(true);
    markRead();
  }, [markRead]);

  // Instant delivery through Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`booking-chat-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          merge([m]);
          if (m.sender_id !== userId) markRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, bookingId, userId, merge, markRead]);

  // Backup: refresh every 10 seconds and when the tab regains focus
  useEffect(() => {
    async function refresh() {
      if (document.visibilityState !== "visible") return;
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (data) {
        merge(data as Message[]);
        if (data.some((m) => m.sender_id !== userId)) markRead();
      }
    }
    const timer = setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [supabase, bookingId, userId, merge, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setError(null);

    const { data, error } = await supabase
      .from("messages")
      .insert({ booking_id: bookingId, sender_id: userId, body })
      .select("id, sender_id, body, created_at")
      .single();

    if (error) {
      console.error(error);
      setError("Couldn't send your message. Please try again.");
    } else if (data) {
      merge([data as Message]);
      setText("");
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col rounded-2xl border">
      <div className="h-[55vh] min-h-[320px] space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-gray-500">
            No messages yet. Say hello to {otherName} and share any details
            about the job.
          </p>
        )}

        {messages.map((m, i) => {
          const mine = m.sender_id === userId;
          const showDay =
            mounted &&
            (i === 0 ||
              new Date(m.created_at).toDateString() !==
                new Date(messages[i - 1].created_at).toDateString());

          return (
            <div key={m.id}>
              {showDay && (
                <p className="my-4 text-center text-xs text-gray-500">
                  {dayLabel(m.created_at)}
                </p>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-brand-orange text-white"
                      : "rounded-bl-sm bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  {mounted && (
                    <p
                      className={`mt-1 text-[11px] ${
                        mine ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      {new Date(m.created_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4">
        {canSend ? (
          <>
            <div className="flex items-end gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                maxLength={4000}
                placeholder="Write a message"
                aria-label="Write a message"
                className="min-w-0 flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-2 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || !text.trim()}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white transition-colors hover:bg-brand-orange-dark disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <p className="mt-2 text-xs text-gray-500">
              Enter to send, Shift+Enter for a new line. Keep your conversation
              on SERVORA so there&apos;s a record if anything goes wrong.
            </p>
          </>
        ) : (
          <p className="text-center text-sm text-gray-500">
            This booking is closed, so the conversation is read-only.
          </p>
        )}
      </div>
    </div>
  );
}