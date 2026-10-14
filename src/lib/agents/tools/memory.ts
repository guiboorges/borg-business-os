import { tool } from "ai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUSINESS } from "@/config/business";

const AGENT_FOLDER = "09 - Agents";

// Scope filter applied on the SERVER — the agent only sees notes scoped {all} or to itself.
function scopeFilter(agentId: string) {
  return `scope.cs.{all},scope.cs.{${agentId}}`;
}

export function memoryTools(agentId: string) {
  const supabase = createAdminClient();

  return {
    memory_list: tool({
      description:
        "Lists the business memory notes (titles and paths), optionally filtered by folder. Use it to browse before reading specific notes.",
      inputSchema: z.object({
        folder: z
          .string()
          .optional()
          .describe('Folder prefix, e.g. "03 - Marketing". Omit to list everything.'),
      }),
      execute: async ({ folder }) => {
        let query = supabase
          .from("agent_memory")
          .select("path, title, source")
          .or(scopeFilter(agentId))
          .order("path")
          .limit(200);
        if (folder) query = query.like("path", `${folder}%`);
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { notes: data };
      },
    }),

    memory_read: tool({
      description:
        "Reads the full content of a memory note by its path (obtained via memory_list or memory_search).",
      inputSchema: z.object({
        path: z.string().describe('Note path, e.g. "01 - Strategy/ICP.md"'),
      }),
      execute: async ({ path }) => {
        const { data, error } = await supabase
          .from("agent_memory")
          .select("path, title, content")
          .eq("path", path)
          .or(scopeFilter(agentId))
          .single();
        if (error) return { error: `Note not found: ${path}` };
        return data;
      },
    }),

    memory_search: tool({
      description:
        `Full-text search across the business memory notes. ALWAYS use it before answering questions about ${BUSINESS.name} — never invent business facts.`,
      inputSchema: z.object({
        query: z.string().describe('Search terms, e.g. "ICP" or "pricing"'),
        limit: z.number().int().min(1).max(20).optional().default(8),
      }),
      execute: async ({ query, limit }) => {
        const { data, error } = await supabase
          .from("agent_memory")
          .select("path, title")
          .or(scopeFilter(agentId))
          .textSearch("fts", query, { type: "websearch", config: "english" })
          .limit(limit ?? 8);
        if (error) return { error: error.message };
        if (!data?.length) return { result: "No notes found for that search." };
        return { results: data };
      },
    }),

    memory_write: tool({
      description:
        `Saves a durable learning or decision to one of your own notes (folder "${AGENT_FOLDER}/${agentId}/"). Use it to record important conclusions, not trivial conversations. Update existing notes instead of duplicating them.`,
      inputSchema: z.object({
        file_name: z
          .string()
          .describe('File name in kebab-case, e.g. "pricing-learnings.md"'),
        title: z.string(),
        content: z.string().describe("Markdown content of the note"),
      }),
      execute: async ({ file_name, title, content }) => {
        const safeName = file_name.replace(/[^a-zA-Z0-9à-ÿÀ-ß\-_. ]/g, "").trim();
        if (!safeName.endsWith(".md")) return { error: "The file name must end in .md" };
        const path = `${AGENT_FOLDER}/${agentId}/${safeName}`;
        const { createHash } = await import("node:crypto");
        const { error } = await supabase.from("agent_memory").upsert(
          {
            path,
            title,
            content,
            scope: ["all"],
            source: "agent",
            content_hash: createHash("sha256").update(content).digest("hex"),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "path" }
        );
        if (error) return { error: error.message };
        return { saved: path };
      },
    }),

    memory_edit: tool({
      description:
        "Edits one of YOUR notes (created by agents) by replacing an exact passage of text. Notes from the human vault are read-only.",
      inputSchema: z.object({
        path: z.string(),
        old_text: z.string().describe("Exact passage to replace"),
        new_text: z.string(),
      }),
      execute: async ({ path, old_text, new_text }) => {
        const { data, error } = await supabase
          .from("agent_memory")
          .select("content, source")
          .eq("path", path)
          .single();
        if (error) return { error: `Note not found: ${path}` };
        if (data.source !== "agent")
          return { error: "You can only edit notes created by agents (the human vault is read-only)." };
        if (!data.content.includes(old_text))
          return { error: "old_text not found in the note." };
        const newContent = data.content.replace(old_text, new_text);
        const { createHash } = await import("node:crypto");
        const { error: upErr } = await supabase
          .from("agent_memory")
          .update({
            content: newContent,
            content_hash: createHash("sha256").update(newContent).digest("hex"),
            updated_at: new Date().toISOString(),
          })
          .eq("path", path);
        if (upErr) return { error: upErr.message };
        return { edited: path };
      },
    }),
  };
}
