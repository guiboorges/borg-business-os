import { notFound } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import type { UIMessage } from "ai";
import { getAgent } from "@/lib/agents/registry";
import { createClient } from "@/lib/supabase/server";
import { Chat } from "@/components/chat";
import { MessageSquarePlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChatAgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ agent: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { agent: agentId } = await params;
  const { c } = await searchParams;
  const agent = getAgent(agentId);
  if (!agent) notFound();

  const supabase = await createClient();

  const { data: conversas } = await supabase
    .from("conversations")
    .select("id, titulo, updated_at")
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false })
    .limit(30);

  const conversationId = c ?? randomUUID();
  let initialMessages: UIMessage[] = [];
  if (c) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, role, content")
      .eq("conversation_id", c)
      .order("created_at");
    initialMessages = (msgs ?? []).map((m) => ({
      id: m.id,
      role: m.role as UIMessage["role"],
      parts: m.content as UIMessage["parts"],
    }));
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-zinc-800 p-3">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">{agent.nome}</h2>
          <Link
            href={`/chat/${agentId}`}
            title="Nova conversa"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <MessageSquarePlus size={16} />
          </Link>
        </div>
        <ul className="space-y-0.5">
          {(conversas ?? []).map((conv) => (
            <li key={conv.id}>
              <Link
                href={`/chat/${agentId}?c=${conv.id}`}
                className={`block truncate rounded-md px-2 py-1.5 text-sm ${
                  conv.id === c
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                {conv.titulo ?? "Conversa"}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1">
        <Chat
          key={conversationId}
          agentId={agentId}
          agentNome={agent.nome}
          conversationId={conversationId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
