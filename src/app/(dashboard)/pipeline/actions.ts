"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function db() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return supabase;
}

export async function createLead(formData: FormData) {
  const supabase = await db();
  await supabase.from("leads").insert({
    nome: String(formData.get("nome") ?? "").trim(),
    empresa: String(formData.get("empresa") ?? "").trim() || null,
    nicho: String(formData.get("nicho") ?? "").trim() || null,
    localidade: String(formData.get("localidade") ?? "").trim() || null,
    instagram: String(formData.get("instagram") ?? "").trim() || null,
    origem: String(formData.get("origem") ?? "outbound"),
    status: "novo",
  });
  revalidatePath("/pipeline");
}

export async function updateLeadStatus(formData: FormData) {
  const supabase = await db();
  await supabase
    .from("leads")
    .update({
      status: String(formData.get("status")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("lead_id")));
  revalidatePath("/pipeline");
}

export async function createDeal(formData: FormData) {
  const supabase = await db();
  await supabase.from("deals").insert({
    lead_id: String(formData.get("lead_id") ?? "") || null,
    titulo: String(formData.get("titulo") ?? "").trim(),
    valor_estimado: Number(formData.get("valor_estimado") ?? 0) || null,
    tipo_receita: String(formData.get("tipo_receita") ?? "recorrente"),
    etapa: "prospeccao",
  });
  revalidatePath("/pipeline");
}

export async function updateDealEtapa(formData: FormData) {
  const supabase = await db();
  const etapa = String(formData.get("etapa"));
  const patch: Record<string, unknown> = {
    etapa,
    updated_at: new Date().toISOString(),
  };
  if (etapa === "ganho") {
    patch.data_fecho_real = new Date().toISOString().slice(0, 10);
    patch.probabilidade = 100;
    const valorFechado = Number(formData.get("valor_fechado") ?? 0);
    if (valorFechado > 0) patch.valor_fechado = valorFechado;
  }
  if (etapa === "perdido") patch.probabilidade = 0;
  await supabase.from("deals").update(patch).eq("id", String(formData.get("deal_id")));
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function createActivity(formData: FormData) {
  const supabase = await db();
  await supabase.from("activities").insert({
    lead_id: String(formData.get("lead_id") ?? "") || null,
    deal_id: String(formData.get("deal_id") ?? "") || null,
    tipo: String(formData.get("tipo") ?? "nota"),
    descricao: String(formData.get("descricao") ?? "").trim(),
    custo: Number(formData.get("custo") ?? 0) || null,
    data: String(formData.get("data") ?? new Date().toISOString().slice(0, 10)),
  });
  revalidatePath("/pipeline");
  revalidatePath("/");
}

export async function createInvoice(formData: FormData) {
  const supabase = await db();
  await supabase.from("invoices").insert({
    deal_id: String(formData.get("deal_id") ?? "") || null,
    valor: Number(formData.get("valor") ?? 0),
    tipo: String(formData.get("tipo") ?? "mensalidade"),
    status: "paga",
    data_pagamento: String(
      formData.get("data_pagamento") ?? new Date().toISOString().slice(0, 10)
    ),
  });
  revalidatePath("/pipeline");
  revalidatePath("/");
}
