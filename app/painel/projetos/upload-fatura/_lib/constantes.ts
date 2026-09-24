/**
 * Constantes do fluxo de CRIAÇÃO de projeto a partir de fatura.
 * Não compartilhar com o fluxo de SUBSTITUIÇÃO de fatura (UploadFaturaModal / uploadFatura()).
 */

/** Bucket do Supabase Storage onde as faturas são armazenadas. Ajustar se o bucket oficial tiver outro nome. */
export const BUCKET_FATURAS = "faturas";

export const TABELA_PROJETOS = "projetos";
export const TABELA_PERFIS = "profiles";

export const ROLE_PERMITIDA = "integrador";
export const STATUS_INICIAL_PROJETO = "Em análise";

export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB
export const VALIDADE_URL_ASSINADA_SEGUNDOS = 600; // 10 minutos

export const ROTA_LISTAGEM_PROJETOS = "/painel/projetos";
export const ROTA_API_ANALISE = "/api/analisar-fatura";

export const TIPOS_ACEITOS = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export type MimeAceito = keyof typeof TIPOS_ACEITOS;

export const ACCEPT_INPUT = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp";

/** potencia_kwp = (media_consumo_kwh * 1.3) / 100 */
export const FATOR_POTENCIA = 1.3;
export const DIVISOR_POTENCIA = 100;

export const OPCOES_TIPO_CONEXAO = ["Monofásico", "Bifásico", "Trifásico"] as const;
export const OPCOES_CLASSE = ["Residencial", "Comercial", "Industrial", "Rural", "Poder Público"] as const;
