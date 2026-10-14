"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createRoadmapItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("roadmap_items").insert({
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    categoria: String(formData.get("categoria") ?? "gtm"),
    horizonte: String(formData.get("horizonte") ?? "proximo"),
  });
  revalidatePath("/roadmap");
}

export async function updateRoadmapItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("roadmap_items")
    .update({
      horizonte: String(formData.get("horizonte")),
      status: String(formData.get("status")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("item_id")));
  revalidatePath("/roadmap");
}
