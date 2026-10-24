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
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col">
        {/* Header */}
        <header className="border-b border-border px-4 py-4 sm:px-6">
          <h1 className="text-xl font-semibold text-foreground">AI Agent</h1>
          <p className="mt-1 text-sm text-muted-foreground">n8n + Gemini Agent</p>
        </header>

        {/* Messages */}
        <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
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
                      "max-w-[90%] break-words whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%]",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-card-foreground",
                    ].join(" ")}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-card-foreground">
                  กำลังคิด...
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Composer */}
        <footer className="border-t border-border px-4 py-4 sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-3xl flex-col items-stretch gap-2 sm:flex-row sm:items-end sm:gap-3"
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
              className="min-h-12 w-full min-w-0 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
            />

            <button
              type="submit"
              disabled={!canSend}
              className="min-h-11 w-full rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              ส่ง
            </button>
          </form>
        </footer>
      </div>
    </main>
  );
}
