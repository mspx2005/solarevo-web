// ============================================================
// FASE 3E.3A — MOTOR DOCX PREMIUM V1
// Núcleo do motor. Independente de layout, de Supabase e de
// template específico. Recebe um buffer DOCX + dicionário de
// dados e devolve o DOCX final.
//
// Regras do motor:
//   - Delimitadores oficiais: [ e ]
//   - Substitui APENAS as tags oficiais aprovadas
//   - Tag oficial sem dado → fallback seguro "-" (não quebra)
//   - Conteúdo entre colchetes que NÃO é tag oficial (ex.: o
//     texto literal "[0,00]" das condições de pagamento do
//     Template 1 Azul) é preservado byte a byte no documento.
// ============================================================

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

// Tags oficiais aprovadas — FASE 3E.2 (Template 1 Azul mapeado)
export const TAGS_OFICIAIS = [
  // Cliente
  "cliente_nome",
  "cliente_empresa",
  "cliente_cidade",
  "cliente_estado",
  // Sistema
  "potencia_kwp",
  "geracao_mensal_kwh",
  "area_util",
  // Equipamentos
  "modulo_modelo",
  "modulo_potencia_w",
  "modulo_qtde",
  "inversor_modelo",
  "inversor_potencia_w",
  "inversor_qtde",
  "bateria_modelo",
  "bateria_potencia_w",
  "bateria_qtde",
  // Financeiro
  "preco_venda",
  "payback",
  // Gráficos (substituição textual na V1)
  "consumo_mensal_kwh",
] as const;

export type TagOficial = (typeof TAGS_OFICIAIS)[number];

const SET_TAGS_OFICIAIS: Set<string> = new Set(TAGS_OFICIAIS);

export const FALLBACK_SEGURO = "-";

export interface ResultadoGeracaoDocx {
  buffer: Buffer;
  /** Tags oficiais presentes no template que ficaram sem dado (renderizadas como "-") */
  tagsComFallback: string[];
}

/**
 * Gera o DOCX final a partir do buffer do template e do dicionário de dados.
 *
 * @param templateBuffer Conteúdo binário do template .docx
 * @param dados Dicionário tag → valor formatado (apenas tags oficiais)
 * @throws Error com mensagem descritiva se o template for inválido/corrompido
 */
export function gerarDocx(
  templateBuffer: Buffer,
  dados: Partial<Record<TagOficial, string>>
): ResultadoGeracaoDocx {
  let zip: PizZip;
  try {
    zip = new PizZip(templateBuffer);
  } catch {
    throw new Error(
      "Template inválido: o arquivo não é um DOCX válido ou está corrompido."
    );
  }

  const tagsComFallback: string[] = [];

  const doc = new Docxtemplater(zip, {
    // Delimitadores oficiais do padrão EnerTrack
    delimiters: { start: "[", end: "]" },
    linebreaks: true,
    // nullGetter é chamado para toda tag sem valor no dicionário:
    //   - tag oficial sem dado  → fallback seguro "-"
    //   - texto entre colchetes que não é tag oficial → preservado
    nullGetter(part: { value?: string }) {
      const nome = (part.value ?? "").trim();
      if (SET_TAGS_OFICIAIS.has(nome)) {
        tagsComFallback.push(nome);
        return FALLBACK_SEGURO;
      }
      return `[${part.value ?? ""}]`;
    },
  });

  // Garantir que somente tags oficiais entram na substituição,
  // mesmo que o chamador envie chaves extras por engano.
  const dadosFiltrados: Record<string, string> = {};
  for (const tag of TAGS_OFICIAIS) {
    const valor = dados[tag];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      dadosFiltrados[tag] = String(valor);
    }
  }

  try {
    doc.render(dadosFiltrados);
  } catch (e: any) {
    // Erros de parsing do Docxtemplater trazem detalhes por tag
    const detalhes =
      e?.properties?.errors
        ?.map((err: any) => err?.properties?.explanation)
        .filter(Boolean)
        .join("; ") ?? e?.message;
    throw new Error(`Falha ao renderizar o template DOCX: ${detalhes}`);
  }

  const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;

  return { buffer, tagsComFallback };
}
