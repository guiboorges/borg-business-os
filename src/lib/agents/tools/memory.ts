import { tool } from "ai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { NEGOCIO } from "@/config/negocio";

const AGENT_FOLDER = "09 - Agentes";

// Filtro de scope aplicado no SERVIDOR — o agente só vê notas {all} ou do seu scope.
function scopeFilter(agentId: string) {
  return `scope.cs.{all},scope.cs.{${agentId}}`;
}

export function memoryTools(agentId: string) {
  const supabase = createAdminClient();

  return {
    memory_list: tool({
      description:
        "Lista as notas da memória do negócio (títulos e caminhos), opcionalmente filtradas por pasta. Usa para navegar antes de ler notas específicas.",
      inputSchema: z.object({
        pasta: z
          .string()
          .optional()
          .describe('Prefixo de pasta, ex. "03 - Go-To-Market". Omite para listar tudo.'),
      }),
      execute: async ({ pasta }) => {
        let query = supabase
          .from("agent_memory")
          .select("path, title, source")
          .or(scopeFilter(agentId))
          .order("path")
          .limit(200);
        if (pasta) query = query.like("path", `${pasta}%`);
        const { data, error } = await query;
        if (error) return { erro: error.message };
        return { notas: data };
      },
    }),

    memory_read: tool({
      description:
        "Lê o conteúdo completo de uma nota da memória pelo seu caminho (obtido via memory_list ou memory_search).",
      inputSchema: z.object({
        path: z.string().describe('Caminho da nota, ex. "01 - Vision & Strategy/ICP.md"'),
      }),
      execute: async ({ path }) => {
        const { data, error } = await supabase
          .from("agent_memory")
          .select("path, title, content")
          .eq("path", path)
          .or(scopeFilter(agentId))
          .single();
        if (error) return { erro: `Nota não encontrada: ${path}` };
        return data;
      },
    }),

    memory_search: tool({
      description:
        `Busca full-text (português) nas notas da memória do negócio. Usa SEMPRE antes de responder perguntas sobre ${NEGOCIO.nome} — nunca inventes factos do negócio.`,
      inputSchema: z.object({
        query: z.string().describe('Termos de busca, ex. "ICP" ou "pricing"'),
        limit: z.number().int().min(1).max(20).optional().default(8),
      }),
      execute: async ({ query, limit }) => {
        const { data, error } = await supabase
          .from("agent_memory")
          .select("path, title")
          .or(scopeFilter(agentId))
          .textSearch("fts", query, { type: "websearch", config: "portuguese" })
          .limit(limit ?? 8);
        if (error) return { erro: error.message };
        if (!data?.length) return { resultado: "Nenhuma nota encontrada para essa busca." };
        return { resultados: data };
      },
    }),

    memory_write: tool({
      description:
        `Grava um aprendizado ou decisão durável numa nota tua (pasta "${AGENT_FOLDER}/${agentId}/"). Usa para registar conclusões importantes, não conversas triviais. Atualiza notas existentes em vez de duplicar.`,
      inputSchema: z.object({
        nome_ficheiro: z
          .string()
          .describe('Nome do ficheiro em kebab-case, ex. "aprendizado-pricing.md"'),
        titulo: z.string(),
        conteudo: z.string().describe("Conteúdo markdown da nota"),
      }),
      execute: async ({ nome_ficheiro, titulo, conteudo }) => {
        const safeName = nome_ficheiro.replace(/[^a-zA-Z0-9à-ÿÀ-ß\-_. ]/g, "").trim();
        if (!safeName.endsWith(".md")) return { erro: "O ficheiro deve terminar em .md" };
        const path = `${AGENT_FOLDER}/${agentId}/${safeName}`;
        const { createHash } = await import("node:crypto");
        const { error } = await supabase.from("agent_memory").upsert(
          {
            path,
            title: titulo,
            content: conteudo,
            scope: ["all"],
            source: "agent",
            content_hash: createHash("sha256").update(conteudo).digest("hex"),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "path" }
        );
        if (error) return { erro: error.message };
        return { gravado: path };
      },
    }),

    memory_edit: tool({
      description:
        "Edita uma nota TUA (criada por agentes) substituindo um trecho exato de texto. Notas do vault humano são só de leitura.",
      inputSchema: z.object({
        path: z.string(),
        texto_antigo: z.string().describe("Trecho exato a substituir"),
        texto_novo: z.string(),
      }),
      execute: async ({ path, texto_antigo, texto_novo }) => {
        const { data, error } = await supabase
          .from("agent_memory")
          .select("content, source")
          .eq("path", path)
          .single();
        if (error) return { erro: `Nota não encontrada: ${path}` };
        if (data.source !== "agent")
          return { erro: "Só podes editar notas criadas por agentes (o vault humano é read-only)." };
        if (!data.content.includes(texto_antigo))
          return { erro: "texto_antigo não encontrado na nota." };
        const novoConteudo = data.content.replace(texto_antigo, texto_novo);
        const { createHash } = await import("node:crypto");
        const { error: upErr } = await supabase
          .from("agent_memory")
          .update({
            content: novoConteudo,
            content_hash: createHash("sha256").update(novoConteudo).digest("hex"),
            updated_at: new Date().toISOString(),
          })
          .eq("path", path);
        if (upErr) return { erro: upErr.message };
        return { editado: path };
      },
    }),
  };
}
