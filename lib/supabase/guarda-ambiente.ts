/**
 * Trava de segurança de ambiente — SOLAREVO ENERTRACK
 *
 * Impede que qualquer instância que não esteja declarada como PRODUÇÃO
 * se conecte ao projeto Supabase de produção.
 *
 * Regra:
 *   - URL aponta para o projeto de produção  → exige NEXT_PUBLIC_ENERTRACK_AMBIENTE=producao
 *   - NEXT_PUBLIC_ENERTRACK_AMBIENTE ausente  → bloqueia (o ambiente deve ser declarado)
 *
 * O ref do projeto não é segredo (aparece na URL pública do Supabase).
 */

const REF_PRODUCAO = "fmfxuxolnifcvhjsavwh"; // enertrack-producao

const AMBIENTES_VALIDOS = ["producao", "homologacao", "teste"] as const;
type Ambiente = (typeof AMBIENTES_VALIDOS)[number];

export class ErroAmbienteSupabase extends Error {
  constructor(mensagem: string) {
    super(`[TRAVA DE AMBIENTE] ${mensagem}`);
    this.name = "ErroAmbienteSupabase";
  }
}

let validado = false;

export function garantirAmbienteSupabase(): void {
  if (validado) return;

  // Acesso literal: obrigatório para o Next.js embutir as variáveis no bundle do navegador.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ambiente = (process.env.NEXT_PUBLIC_ENERTRACK_AMBIENTE ?? "").trim().toLowerCase();

  if (!url) {
    throw new ErroAmbienteSupabase("NEXT_PUBLIC_SUPABASE_URL não está definida.");
  }

  if (!AMBIENTES_VALIDOS.includes(ambiente as Ambiente)) {
    throw new ErroAmbienteSupabase(
      "NEXT_PUBLIC_ENERTRACK_AMBIENTE não está declarada ou é inválida. " +
        "Use: producao, homologacao ou teste.",
    );
  }

  const apontaParaProducao = url.includes(REF_PRODUCAO);

  if (apontaParaProducao && ambiente !== "producao") {
    throw new ErroAmbienteSupabase(
      `Ambiente declarado como "${ambiente}", mas NEXT_PUBLIC_SUPABASE_URL aponta para o banco de PRODUÇÃO. ` +
        "Conexão bloqueada. Corrija o .env.local para o projeto Supabase de teste.",
    );
  }

  validado = true;
}
