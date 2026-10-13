import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type ModelMessage,
  type UIMessage,
} from "ai";
import { getAgent } from "@/lib/agents/registry";
import { buildSystemPrompt } from "@/lib/agents/base-prompt";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agent: string }> }
) {
  const { agent: agentId } = await params;

  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const agent = getAgent(agentId);
  if (!agent) return new Response("Agente não encontrado", { status: 404 });

  const { messages, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    conversationId: string;
  };

  const admin = createAdminClient();

  // Garante a conversa e persiste a mensagem do usuário
  const firstText =
    messages
      .find((m) => m.role === "user")
      ?.parts.find((p) => p.type === "text")?.text ?? "Conversa";
  await admin.from("conversations").upsert(
    {
      id: conversationId,
      agent_id: agentId,
      titulo: firstText.slice(0, 80),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  const lastUser = messages.filter((m) => m.role === "user").at(-1);
  if (lastUser) {
    await admin.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: lastUser.parts,
    });
  }

  // Prompt: bloco estável (cacheado) primeiro; contexto dinâmico como
  // mensagem system separada, fora do prefixo cacheado.
  const modelMessages: ModelMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(agent),
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    },
    {
      role: "system",
      content: `Data atual: ${new Date().toISOString().slice(0, 10)}`,
    },
    // Janela das últimas 30 mensagens para conter o contexto
    ...(await convertToModelMessages(messages.slice(-30))),
  ];

  let tokensIn = 0;
  let tokensOut = 0;

  const result = streamText({
    model: anthropic(agent.model),
    messages: modelMessages,
    tools: agent.buildTools(),
    stopWhen: stepCountIs(10),
    onFinish: ({ totalUsage }) => {
      tokensIn = totalUsage.inputTokens ?? 0;
      tokensOut = totalUsage.outputTokens ?? 0;
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ responseMessage }) => {
      await admin.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: responseMessage.parts,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
      });
    },
  });
}
