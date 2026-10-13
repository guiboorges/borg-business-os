"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  await supabase.from("goals").insert({
    titulo: String(formData.get("titulo") ?? "").trim(),
    tipo_metrica: String(formData.get("tipo_metrica") ?? "custom"),
    valor_alvo: Number(formData.get("valor_alvo") ?? 0),
    valor_atual_manual:
      Number(formData.get("valor_atual_manual") ?? 0) || null,
    periodo_inicio: String(formData.get("periodo_inicio")),
    periodo_fim: String(formData.get("periodo_fim")),
  });
  revalidatePath("/metas");
}

export async function updateGoalStatus(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  await supabase
    .from("goals")
    .update({
      status: String(formData.get("status")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("goal_id")));
  revalidatePath("/metas");
}
