// ============================================================
// FASE 3E.3A — MOTOR DOCX PREMIUM V1
// Rota: app/api/gerar-proposta-docx/route.ts
//
// GET /api/gerar-proposta-docx?projetoId=N
//
// Cadeia de segurança (padrão homologado no BUG-008):
//   sessão → role integrador + ativo → propriedade via user_id
//
// Motor paralelo: NÃO substitui nenhum gerador Word antigo.
// ============================================================

export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { gerarDocx } from "@/lib/docx/motor-docx";
import { montarDadosProposta } from "@/lib/docx/dados-proposta";
import fs from "fs";
import path from "path";

// Template homologador oficial — Template Oficial EnerTrack V1
// (baseado no Template 1 Azul, mapeado e auditado na FASE 3E.2)
const CAMINHO_TEMPLATE = path.join(
  process.cwd(),
  "templates",
  "template-oficial-enertrack-v1.docx"
);

export async function GET(req: Request) {
  try {
    // 1. Validação do parâmetro
    const { searchParams } = new URL(req.url);
    const projetoId = searchParams.get("projetoId");

    if (!projetoId || isNaN(Number(projetoId))) {
      return NextResponse.json(
        { error: "Identificador de projeto inválido." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // 2. Validação de sessão
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }

    // 3. Validação de role e perfil ativo
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, ativo")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "integrador" || profile?.ativo !== true) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas integradores ativos." },
        { status: 403 }
      );
    }

    // 4. Validação de propriedade do projeto (user_id)
    const { data: projeto } = await supabase
      .from("projetos")
      .select("*")
      .eq("id", projetoId)
      .eq("user_id", user.id)
      .single();

    if (!projeto) {
      return NextResponse.json(
        { error: "Projeto não encontrado ou não pertence a você." },
        { status: 404 }
      );
    }

    // 5. Carregar o template oficial
    let templateBuffer: Buffer;
    try {
      templateBuffer = fs.readFileSync(CAMINHO_TEMPLATE);
    } catch {
      return NextResponse.json(
        {
          error:
            "Template oficial não encontrado. Verifique se o arquivo " +
            "templates/template-oficial-enertrack-v1.docx existe no projeto.",
        },
        { status: 500 }
      );
    }

    // 6. Montar dados e gerar o documento
    const dados = montarDadosProposta(projeto);
    const { buffer, tagsComFallback } = gerarDocx(templateBuffer, dados);

    if (tagsComFallback.length > 0) {
      // Log operacional: não bloqueia a geração (regra 12)
      console.warn(
        `[Motor DOCX] Projeto ${projetoId}: tags sem dado (fallback "-"):`,
        tagsComFallback
      );
    }

    // 7. Nome do arquivo: Proposta_<cliente>_<data>.docx
    const clienteSlug = String(projeto.cliente_nome ?? "Cliente")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);
    const dataSlug = new Date().toISOString().slice(0, 10);
    const nomeArquivo = `Proposta_${clienteSlug}_${dataSlug}.docx`;

    // 8. Entregar o download
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[Motor DOCX] Erro na geração:", e);
    return NextResponse.json(
      {
        error: "Erro ao gerar a proposta Word.",
        detalhes: e?.message ?? "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
