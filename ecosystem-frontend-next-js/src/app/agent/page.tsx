"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
};

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "สวัสดีครับ มีอะไรให้ผมช่วยไหมครับ?",
  },
];

export default function AgentPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [conversationId] = useState(() => crypto.randomUUID());

  const canSend = useMemo(
    () => input.trim().length > 0 && !isSending,
    [input, isSending],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = input.trim();

    if (!content || isSending) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("ไม่พบ Clerk token");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/program/agent/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            message: content,
            conversationId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? "ไม่สามารถส่งข้อความไปยัง Agent ได้");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.responseDataString,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      };

      setMessages((current) => [...current, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex h-screen max-w-5xl flex-col">
        {/* Header */}
        <header className="border-b border-white/10 px-6 py-4">
          <h1 className="text-xl font-semibold">AI Agent</h1>
          <p className="mt-1 text-sm text-slate-400">n8n + Gemini Agent</p>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={[
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6",
                      isUser
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-slate-100",
                    ].join(" ")}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-400">
                  กำลังคิด...
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Composer */}
        <footer className="border-t border-white/10 px-6 py-4">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl items-end gap-3"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                // Enter = send
                // Shift + Enter = new line
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();

                  if (canSend) {
                    event.currentTarget.form?.requestSubmit();
                  }
                }
              }}
              placeholder="พิมพ์ข้อความ..."
              rows={1}
              className="max-h-40 min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={!canSend}
              className="h-12 rounded-2xl bg-blue-600 px-5 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ส่ง
            </button>
          </form>
        </footer>
      </div>
    </main>
  );
}
