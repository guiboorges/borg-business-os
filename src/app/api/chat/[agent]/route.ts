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
  if (!user) return new Response("Not authenticated", { status: 401 });

  const agent = getAgent(agentId);
  if (!agent) return new Response("Agent not found", { status: 404 });

  const { messages, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    conversationId: string;
  };

  const admin = createAdminClient();

  // Ensure the conversation exists and persist the user's message
  const firstText =
    messages
      .find((m) => m.role === "user")
      ?.parts.find((p) => p.type === "text")?.text ?? "Conversation";
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

  // Prompt: stable (cached) block first; dynamic context as a separate
  // system message, outside the cached prefix.
  const modelMessages: ModelMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(agent),
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    },
    {
      role: "system",
      content: `Current date: ${new Date().toISOString().slice(0, 10)}`,
    },
    // Window of the last 30 messages to keep the context bounded
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
