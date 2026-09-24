import {
  DIVISOR_POTENCIA,
  FATOR_POTENCIA,
  TIPOS_ACEITOS,
  type MimeAceito,
} from "./constantes";
import type { DadosConferencia, RespostaAnaliseFatura } from "./tipos";

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function ehUuidValido(valor: string): boolean {
  return REGEX_UUID.test(valor);
}

export function ehMimeAceito(mime: string): mime is MimeAceito {
  return Object.prototype.hasOwnProperty.call(TIPOS_ACEITOS, mime);
}

/** Converte "1.234,56", "1234.56", "350 kWh" ou number em number. Retorna null se inválido. */
export function parseNumeroBR(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;

  let texto = valor.trim().replace(/[^\d.,-]/g, "");
  if (!texto) return null;

  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");
  if (temVirgula && temPonto) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    texto = texto.replace(",", ".");
  } else if (temPonto && /^\d{1,3}(\.\d{3})+$/.test(texto)) {
    texto = texto.replace(/\./g, "");
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

export function arredondar(valor: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

/** potencia_kwp = (media_consumo_kwh * 1.3) / 100 */
export function calcularPotenciaEstimada(consumoKwh: number | null): number | null {
  if (consumoKwh === null || !Number.isFinite(consumoKwh) || consumoKwh <= 0) return null;
  return arredondar((consumoKwh * FATOR_POTENCIA) / DIVISOR_POTENCIA, 2);
}

export function formatarNumeroBR(valor: number | null, casas = 2): string {
  if (valor === null) return "";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
    useGrouping: false,
  });
}

/** Aceita a resposta da API crua ou encapsulada em { data } / { dados }. */
export function extrairPayloadAnalise(json: unknown): RespostaAnaliseFatura {
  if (!json || typeof json !== "object") return {};
  const obj = json as Record<string, unknown>;
  const interno = (obj.data ?? obj.dados) as unknown;
  if (interno && typeof interno === "object") return interno as RespostaAnaliseFatura;
  return obj as RespostaAnaliseFatura;
}

function texto(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).trim();
}

export function mapearAnaliseParaConferencia(resposta: RespostaAnaliseFatura): DadosConferencia {
  const consumo = parseNumeroBR(resposta.media_consumo_kwh);
  const consumoArredondado = consumo === null ? null : arredondar(consumo, 2);
  return {
    cliente_nome: texto(resposta.cliente_nome),
    cliente_cnpj_cpf: texto(resposta.cpf_cliente),
    cliente_endereco: texto(resposta.endereco),
    tipo_conexao: texto(resposta.tipo_conexao),
    classe: texto(resposta.classe),
    consumo_mensal_kwh: formatarNumeroBR(consumoArredondado),
    potencia_kwp: formatarNumeroBR(calcularPotenciaEstimada(consumoArredondado)),
  };
}

export const CONFERENCIA_VAZIA: DadosConferencia = {
  cliente_nome: "",
  cliente_cnpj_cpf: "",
  cliente_endereco: "",
  tipo_conexao: "",
  classe: "",
  consumo_mensal_kwh: "",
  potencia_kwp: "",
};

/** Validação de assinatura binária (magic bytes) para impedir extensão/MIME falsificados. */
export function assinaturaConfere(bytes: Uint8Array, mime: MimeAceito): boolean {
  const inicia = (...assinatura: number[]) => assinatura.every((b, i) => bytes[i] === b);
  switch (mime) {
    case "application/pdf":
      return inicia(0x25, 0x50, 0x44, 0x46); // %PDF
    case "image/png":
      return inicia(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "image/jpeg":
      return inicia(0xff, 0xd8, 0xff);
    case "image/webp":
      return (
        inicia(0x52, 0x49, 0x46, 0x46) && // RIFF
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP
      );
    default:
      return false;
  }
}
