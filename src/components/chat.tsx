"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, Search, Send, Wrench } from "lucide-react";

const toolLabels: Record<string, string> = {
  memory_search: "pesquisou a memória",
  memory_read: "leu uma nota",
  memory_list: "listou notas",
  memory_write: "gravou uma nota",
  memory_edit: "editou uma nota",
  query_kpis: "consultou os KPIs",
  list_deals: "consultou o pipeline",
  list_leads: "consultou os leads",
  get_goals_progress: "consultou as metas",
};

export function Chat({
  agentId,
  agentNome,
  conversationId,
  initialMessages,
}: {
  agentId: string;
  agentNome: string;
  conversationId: string;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `/api/chat/${agentId}`,
      body: { conversationId },
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <p className="mt-12 text-center text-sm text-zinc-500">
            Fala com o agente de {agentNome}. Ele conhece a memória do negócio e
            os dados atuais.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-800 text-zinc-100"
              }`}
            >
              {m.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <p key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  );
                }
                if (part.type.startsWith("tool-")) {
                  const toolName = part.type.slice(5);
                  const label = toolLabels[toolName] ?? `usou ${toolName}`;
                  return (
                    <p
                      key={i}
                      className="my-1 flex items-center gap-1.5 text-xs text-zinc-400"
                    >
                      {toolName.startsWith("memory") ? (
                        <Search size={12} />
                      ) : (
                        <Wrench size={12} />
                      )}
                      {label}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 size={14} className="animate-spin" />A pensar…
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-zinc-800 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Pergunta ao agente de ${agentNome}…`}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
