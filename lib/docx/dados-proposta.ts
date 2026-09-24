// ============================================================
// FASE 3E.3A — MOTOR DOCX PREMIUM V1
// Mapeador de dados: linha da tabela `projetos` → dicionário
// das tags oficiais, com regras de negócio aprovadas e
// formatação pt-BR.
//
// Regras de negócio (FASE 3E.2 consolidada):
//   potencia_kwp        → coluna oficial do projeto (já recalculada
//                          pela MELHORIA-001 quando há kit do fornecedor;
//                          prioridade: proposta > fatura > manual)
//   geracao_mensal_kwh  = potencia_kwp × 30 × 4
//   area_util           = modulo_qtde × 3
//   economia_mensal     = consumo_mensal_kwh × tarifa_energia
//   payback             = preco_venda ÷ (economia_mensal × 12)
// ============================================================

import type { TagOficial } from "./motor-docx";

// Mesma tarifa média utilizada na Proposta Web (R$/kWh)
const TARIFA_ENERGIA_PADRAO = 0.95;

// ---------- Formatadores pt-BR ----------

function fmtNumero(valor: number, casas = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  }).format(valor);
}

function fmtInteiro(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(valor);
}

function fmtMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function numeroValido(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return !isNaN(n) && n > 0 ? n : null;
}

function textoValido(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

// ---------- Mapeador principal ----------

/**
 * Monta o dicionário de tags oficiais a partir da linha de `projetos`.
 * Campos ausentes simplesmente não entram no dicionário — o motor
 * aplica o fallback seguro "-" na renderização.
 */
export function montarDadosProposta(
  projeto: Record<string, any>
): Partial<Record<TagOficial, string>> {
  const dados: Partial<Record<TagOficial, string>> = {};

  // ----- Cliente -----
  const nome = textoValido(projeto.cliente_nome);
  if (nome) dados.cliente_nome = nome;

  const empresa = textoValido(projeto.cliente_empresa);
  if (empresa) dados.cliente_empresa = empresa;

  const cidade = textoValido(projeto.cliente_cidade);
  if (cidade) dados.cliente_cidade = cidade;

  const estado = textoValido(projeto.cliente_estado);
  if (estado) dados.cliente_estado = estado;

  // ----- Sistema -----
  const potenciaKwp = numeroValido(projeto.potencia_kwp);
  if (potenciaKwp) dados.potencia_kwp = fmtNumero(potenciaKwp, 2);

  // geracao_mensal_kwh = potencia_kwp × 30 × 4
  if (potenciaKwp) {
    const geracaoMensal = potenciaKwp * 30 * 4;
    dados.geracao_mensal_kwh = fmtInteiro(geracaoMensal);
  }

  // area_util = modulo_qtde × 3
  const moduloQtde = numeroValido(projeto.modulo_qtde);
  if (moduloQtde) {
    dados.area_util = fmtInteiro(moduloQtde * 3);
  }

  // ----- Equipamentos -----
  const moduloModelo = textoValido(projeto.modulo_modelo);
  if (moduloModelo) dados.modulo_modelo = moduloModelo;

  const moduloPotencia = numeroValido(projeto.modulo_potencia_w);
  if (moduloPotencia) dados.modulo_potencia_w = fmtInteiro(moduloPotencia);

  if (moduloQtde) dados.modulo_qtde = fmtInteiro(moduloQtde);

  const inversorModelo = textoValido(projeto.inversor_modelo);
  if (inversorModelo) dados.inversor_modelo = inversorModelo;

  const inversorPotencia = numeroValido(projeto.inversor_potencia_w);
  if (inversorPotencia)
    dados.inversor_potencia_w = fmtInteiro(inversorPotencia);

  const inversorQtde = numeroValido(projeto.inversor_qtde);
  if (inversorQtde) dados.inversor_qtde = fmtInteiro(inversorQtde);

  const bateriaModelo = textoValido(projeto.bateria_modelo);
  if (bateriaModelo) dados.bateria_modelo = bateriaModelo;

  const bateriaPotencia = numeroValido(projeto.bateria_potencia_w);
  if (bateriaPotencia) dados.bateria_potencia_w = fmtInteiro(bateriaPotencia);

  const bateriaQtde = numeroValido(projeto.bateria_qtde);
  if (bateriaQtde) dados.bateria_qtde = fmtInteiro(bateriaQtde);

  // ----- Consumo (tag de gráfico — substituição textual na V1) -----
  const consumoMensal = numeroValido(projeto.consumo_mensal_kwh);
  if (consumoMensal) dados.consumo_mensal_kwh = fmtInteiro(consumoMensal);

  // ----- Financeiro -----
  const precoVenda = numeroValido(projeto.preco_venda);
  if (precoVenda) {
  dados.preco_venda = precoVenda.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

  // payback = preco_venda ÷ economia_anual
  // economia_mensal = consumo_mensal_kwh × tarifa_energia
  const tarifa =
  numeroValido(projeto.tarifa_energia) ?? TARIFA_ENERGIA_PADRAO;

if (precoVenda && potenciaKwp) {
  const geracaoMensal = potenciaKwp * 30 * 4;

  const economiaMensal = geracaoMensal * tarifa;

  const economiaAnual = economiaMensal * 12;

  if (economiaAnual > 0) {
    const paybackAnos = precoVenda / economiaAnual;

    dados.payback = `${fmtNumero(paybackAnos, 1)} anos`;
  }
}

  return dados;
}
