"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// ============================================================
// Helper: descobre a URL base da aplicação para chamar as APIs
// internas (/api/analisar-fatura, /api/analisar-proposta) a
// partir de Server Actions.
// Prioridade: variável de ambiente > host da requisição atual.
// ============================================================
async function getBaseUrl(): Promise<string> {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// ============================================================
// UPLOAD DE FATURA — fluxo validado na FASE anterior.
// NÃO ALTERADO nesta etapa.
// ============================================================
export async function uploadFatura(formData: FormData) {
  const projetoId = formData.get("projetoId") as string;
  const file = formData.get("file") as File;

  // 1. Validação de ID Numérico (nossa correção!)
  if (!projetoId || isNaN(Number(projetoId))) {
    return { ok: false, error: "Identificador de projeto inválido." };
  }

  if (!file) return { ok: false, error: "Nenhum arquivo enviado." };

  const supabase = await createSupabaseServerClient();

  // 2. Validação de Sessão
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Sessão expirada." };

  // 3. Validação de Role e Propriedade (user_id)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "integrador")
    return { ok: false, error: "Acesso negado. Apenas integradores." };

  const { data: projeto } = await supabase
    .from("projetos")
    .select("id")
    .eq("id", projetoId)
    .eq("user_id", user.id) // Nossa correção!
    .single();

  if (!projeto)
    return { ok: false, error: "Projeto não encontrado ou não pertence a você." };

  // 4. Upload para o Storage
  const ext = file.name.split(".").pop();
  const fileName = `${projetoId}/${projetoId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("faturas_projetos")
    .upload(fileName, file);

  if (uploadError) return { ok: false, error: uploadError.message };

  // 5. Atualização no Banco de Dados
  const { error: updateError } = await supabase
    .from("projetos")
    .update({ fatura_url: fileName })
    .eq("id", projetoId);

  if (updateError)
    return { ok: false, error: "Erro ao vincular fatura ao projeto." };

  // 6. Integração com a IA (Gemini) — best-effort
  try {
    const { data: signed, error: signedError } = await supabase.storage
      .from("faturas_projetos")
      .createSignedUrl(fileName, 60 * 10);

    if (signedError || !signed?.signedUrl) {
      console.error("Signed URL error:", signedError);
      revalidatePath(`/painel/projetos/${projetoId}`);
      return {
        ok: true,
        iaOk: false,
        iaError:
          "Fatura salva, mas não foi possível gerar acesso ao arquivo para análise.",
      };
    }

    const baseUrl = await getBaseUrl();
    const resp = await fetch(`${baseUrl}/api/analisar-fatura`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl: signed.signedUrl }),
      cache: "no-store",
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => null);
      console.error("Erro na API analisar-fatura:", errBody);
      revalidatePath(`/painel/projetos/${projetoId}`);
      return {
        ok: true,
        iaOk: false,
        iaError: "Fatura salva, mas a análise por IA falhou.",
      };
    }

    const dadosExtraidos = await resp.json();

    const camposUpdate: Record<string, string | number> = {};

    if (dadosExtraidos.cliente_nome)
      camposUpdate.cliente_nome = String(dadosExtraidos.cliente_nome);

    if (dadosExtraidos.cpf_cliente)
      camposUpdate.cliente_cnpj_cpf = String(dadosExtraidos.cpf_cliente);

    if (dadosExtraidos.endereco) {
      camposUpdate.endereco = String(dadosExtraidos.endereco);
      camposUpdate.cliente_endereco = String(dadosExtraidos.endereco);
    }

    if (dadosExtraidos.tipo_conexao)
      camposUpdate.tipo_conexao = String(dadosExtraidos.tipo_conexao);

    if (dadosExtraidos.classe)
      camposUpdate.classe = String(dadosExtraidos.classe);

    const consumo = Number(dadosExtraidos.media_consumo_kwh);
    if (!isNaN(consumo) && consumo > 0)
      camposUpdate.consumo_mensal_kwh = consumo;

    if (Object.keys(camposUpdate).length === 0) {
      revalidatePath(`/painel/projetos/${projetoId}`);
      return {
        ok: true,
        iaOk: false,
        iaError: "Fatura salva, mas a IA não extraiu dados utilizáveis.",
      };
    }

    const { error: iaUpdateError } = await supabase
      .from("projetos")
      .update(camposUpdate)
      .eq("id", projetoId)
      .eq("user_id", user.id);

    if (iaUpdateError) {
      console.error("Erro ao gravar dados extraídos:", iaUpdateError);
      revalidatePath(`/painel/projetos/${projetoId}`);
      return {
        ok: true,
        iaOk: false,
        iaError: "Fatura salva, mas houve erro ao gravar os dados extraídos.",
      };
    }

    revalidatePath(`/painel/projetos/${projetoId}`);
    return { ok: true, iaOk: true, dadosExtraidos };
  } catch (e: any) {
    console.error("Exceção na análise por IA:", e);
    revalidatePath(`/painel/projetos/${projetoId}`);
    return {
      ok: true,
      iaOk: false,
      iaError: "Fatura salva, mas a análise por IA não pôde ser concluída.",
    };
  }
}

// ============================================================
// FASE 3E.1 — ETAPA 02
// UPLOAD DE PROPOSTA — integração real.
// Segue exatamente o padrão validado de uploadFatura().
//
// Fluxo:
//   Modal → uploadProposta() → Storage (propostas_fornecedores)
//   → Signed URL → POST /api/analisar-proposta → Gemini
//   → Extração dos equipamentos → update em projetos
//   → revalidatePath() → feedback no modal.
//
// REQUISITO DE INFRA: bucket privado "propostas_fornecedores"
// precisa existir no Supabase Storage (ver relatório de entrega).
// Esta action NÃO cria o bucket automaticamente.
// ============================================================
export async function uploadProposta(formData: FormData) {
  const projetoId = formData.get("projetoId") as string;
  const file = formData.get("file") as File;

  // 1. Validação de ID Numérico
  if (!projetoId || isNaN(Number(projetoId))) {
    return { ok: false, error: "Identificador de projeto inválido." };
  }

  // 2. Validação de arquivo
  if (!file) return { ok: false, error: "Nenhum arquivo enviado." };

  const supabase = await createSupabaseServerClient();

  // 3. Validação de Sessão
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Sessão expirada." };

  // 4. Validação de Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "integrador")
    return { ok: false, error: "Acesso negado. Apenas integradores." };

  // 5. Validação de Propriedade do projeto (user_id)
  const { data: projeto } = await supabase
    .from("projetos")
    .select("id")
    .eq("id", projetoId)
    .eq("user_id", user.id)
    .single();

  if (!projeto)
    return { ok: false, error: "Projeto não encontrado ou não pertence a você." };

  // 6. Upload para o Storage (bucket privado de propostas)
  const BUCKET_PROPOSTAS = "propostas_fornecedores";
  const ext = file.name.split(".").pop();
  const fileName = `${projetoId}/${projetoId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_PROPOSTAS)
    .upload(fileName, file);

  if (uploadError) {
    // Orientação clara caso o bucket ainda não exista
    if (uploadError.message?.toLowerCase().includes("bucket not found")) {
      return {
        ok: false,
        error:
          'Bucket "propostas_fornecedores" não encontrado no Supabase Storage. ' +
          "Crie o bucket privado com esse nome (e as policies de insert/select " +
          "para integradores autenticados) e tente novamente.",
      };
    }
    return { ok: false, error: uploadError.message };
  }

  // 7. Vincular o caminho da proposta ao projeto
  const { error: updateError } = await supabase
    .from("projetos")
    .update({ proposta_url: fileName })
    .eq("id", projetoId)
    .eq("user_id", user.id);

  if (updateError)
    return { ok: false, error: "Erro ao vincular proposta ao projeto." };

  // ============================================================
  // 8. Análise por IA — best-effort.
  // Falha na IA NUNCA desfaz o upload já concluído.
  // ============================================================
  try {
    // 8.1 Signed URL (bucket privado) — 10 min é suficiente
    const { data: signed, error: signedError } = await supabase.storage
      .from(BUCKET_PROPOSTAS)
      .createSignedUrl(fileName, 60 * 10);

    if (signedError || !signed?.signedUrl) {
      console.error("Signed URL error (proposta):", signedError);
      revalidatePath(`/painel/projetos/${projetoId}`);
      return {
        ok: true,
        iaOk: false,
        iaError:
          "Proposta salva, mas não foi possível gerar acesso ao arquivo para análise.",
      };
    }

    // 8.2 Chamar a API interna de análise de proposta
    const baseUrl = await getBaseUrl();
    const resp = await fetch(`${baseUrl}/api/analisar-proposta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl: signed.signedUrl }),
      cache: "no-store",
    });

    if (!resp.ok) {
      const errBody = await resp.json().catch(() => null);
      console.error("Erro na API analisar-proposta:", errBody);
      revalidatePath(`/painel/projetos/${projetoId}`);
      return {
        ok: true,
        iaOk: false,
        iaError: "Proposta salva, mas a análise por IA falhou.",
      };
    }

    const dadosExtraidos = await resp.json();

    // 8.3 Montar update apenas com campos válidos.
    // Regras: nunca gravar null/undefined/string vazia;
    // números somente se válidos e > 0.
    const camposUpdate: Record<string, string | number> = {};

    const setTexto = (coluna: string, valor: unknown) => {
      if (valor === null || valor === undefined) return;
      const s = String(valor).trim();
      if (s.length === 0) return;
      camposUpdate[coluna] = s;
    };

    const setNumero = (coluna: string, valor: unknown) => {
      if (valor === null || valor === undefined || valor === "") return;
      const n = Number(valor);
      if (isNaN(n) || n <= 0) return;
      camposUpdate[coluna] = n;
    };

    // Inversor
    setTexto("inversor_modelo", dadosExtraidos.inversor_modelo);
    setNumero("inversor_qtde", dadosExtraidos.inversor_qtde);
    setNumero("inversor_potencia_w", dadosExtraidos.inversor_potencia_w);

    // Módulos
    setTexto("modulo_modelo", dadosExtraidos.modulo_modelo);
    setNumero("modulo_qtde", dadosExtraidos.modulo_qtde);
    setNumero("modulo_potencia_w", dadosExtraidos.modulo_potencia_w);

    // Baterias
    setTexto("bateria_modelo", dadosExtraidos.bateria_modelo);
    setNumero("bateria_qtde", dadosExtraidos.bateria_qtde);
    setNumero("bateria_potencia_w", dadosExtraidos.bateria_potencia_w);

    if (Object.keys(camposUpdate).length === 0) {
      revalidatePath(`/painel/projetos/${projetoId}`);
      return {
        ok: true,
        iaOk: false,
        iaError:
          "Proposta salva, mas a IA não extraiu equipamentos utilizáveis.",
      };
    }

    // 8.4 Atualizar o projeto (sempre com filtro de propriedade)
    const { error: iaUpdateError } = await supabase
      .from("projetos")
      .update(camposUpdate)
      .eq("id", projetoId)
      .eq("user_id", user.id);

    if (iaUpdateError) {
      console.error("Erro ao gravar equipamentos extraídos:", iaUpdateError);
      revalidatePath(`/painel/projetos/${projetoId}`);
      return {
        ok: true,
        iaOk: false,
        iaError:
          "Proposta salva, mas houve erro ao gravar os equipamentos extraídos.",
      };
    }

    revalidatePath(`/painel/projetos/${projetoId}`);
    return { ok: true, iaOk: true, dadosExtraidos };
  } catch (e: any) {
    console.error("Exceção na análise da proposta por IA:", e);
    revalidatePath(`/painel/projetos/${projetoId}`);
    return {
      ok: true,
      iaOk: false,
      iaError: "Proposta salva, mas a análise por IA não pôde ser concluída.",
    };
  }
}
