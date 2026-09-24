"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { obterIntegradorAtivo } from "./_lib/auth";
import {
  BUCKET_FATURAS,
  ROTA_LISTAGEM_PROJETOS,
  STATUS_INICIAL_PROJETO,
  TABELA_PROJETOS,
  TAMANHO_MAXIMO_BYTES,
  TIPOS_ACEITOS,
  VALIDADE_URL_ASSINADA_SEGUNDOS,
} from "./_lib/constantes";
import { arredondar, assinaturaConfere, ehMimeAceito, ehUuidValido } from "./_lib/fatura";
import type {
  CriarProjetoInput,
  FaturaEnviada,
  ProjetoCriado,
  ResultadoAcao,
} from "./_lib/tipos";

const ERRO_SESSAO = "Sessão expirada ou usuário sem permissão. Efetue login novamente.";
const ERRO_INESPERADO = "Não foi possível concluir a operação. Tente novamente em instantes.";

const LIMITES_TEXTO = {
  cliente_nome: 200,
  cliente_cnpj_cpf: 32,
  cliente_endereco: 500,
  tipo_conexao: 50,
  classe: 80,
} as const;

function falha<T>(erro: string): ResultadoAcao<T> {
  return { ok: false, erro };
}

function caminhoPertenceAoProjeto(storagePath: string, projetoId: string): boolean {
  const prefixo = `${projetoId}/${projetoId}-`;
  if (!storagePath.startsWith(prefixo)) return false;
  const nomeArquivo = storagePath.slice(projetoId.length + 1);
  return /^[0-9a-f-]{36}-\d{13}\.(pdf|png|jpg|webp)$/i.test(nomeArquivo);
}

function sanitizarTexto(valor: unknown, limite: number): string {
  if (typeof valor !== "string") return "";
  return valor.replace(/\s+/g, " ").trim().slice(0, limite);
}

/* -------------------------------------------------------------------------- */
/* 1. Envio da fatura ao Storage + URL assinada para a API de análise          */
/* -------------------------------------------------------------------------- */

export async function enviarFaturaParaAnalise(
  formData: FormData,
): Promise<ResultadoAcao<FaturaEnviada>> {
  try {
    const contexto = await obterIntegradorAtivo();
    if (!contexto) return falha(ERRO_SESSAO);

    const arquivo = formData.get("arquivo");
    if (!(arquivo instanceof File)) return falha("Nenhum arquivo foi recebido.");
    if (arquivo.size === 0) return falha("O arquivo enviado está vazio.");
    if (arquivo.size > TAMANHO_MAXIMO_BYTES) return falha("O arquivo excede o limite de 10 MB.");
    if (!ehMimeAceito(arquivo.type)) return falha("Formato não suportado. Envie PDF, PNG, JPG ou WEBP.");

    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    if (!assinaturaConfere(bytes, arquivo.type)) {
      return falha("O conteúdo do arquivo não corresponde ao formato informado.");
    }

    // O projeto ainda não existe: o UUID é reservado aqui e reutilizado como id do projeto,
    // preservando a convenção [projeto_id]/[projeto_id]-[timestamp].[ext].
    const projetoId = randomUUID();
    const extensao = TIPOS_ACEITOS[arquivo.type];
    const storagePath = `${projetoId}/${projetoId}-${Date.now()}.${extensao}`;

    const { error: erroUpload } = await contexto.supabase.storage
      .from(BUCKET_FATURAS)
      .upload(storagePath, bytes, {
        contentType: arquivo.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (erroUpload) {
      console.error("[upload-fatura] Falha no upload:", erroUpload.message);
      return falha("Não foi possível armazenar a fatura. Tente novamente.");
    }

    const { data: assinada, error: erroAssinatura } = await contexto.supabase.storage
      .from(BUCKET_FATURAS)
      .createSignedUrl(storagePath, VALIDADE_URL_ASSINADA_SEGUNDOS);

    if (erroAssinatura || !assinada?.signedUrl) {
      console.error("[upload-fatura] Falha na URL assinada:", erroAssinatura?.message);
      await contexto.supabase.storage.from(BUCKET_FATURAS).remove([storagePath]);
      return falha("Não foi possível preparar a fatura para análise. Tente novamente.");
    }

    return {
      ok: true,
      dados: { projetoId, storagePath, fileUrl: assinada.signedUrl },
    };
  } catch (erro) {
    console.error("[upload-fatura] Erro inesperado no envio:", erro);
    return falha(ERRO_INESPERADO);
  }
}

/* -------------------------------------------------------------------------- */
/* 2. Criação do projeto a partir dos dados conferidos                         */
/* -------------------------------------------------------------------------- */

export async function criarProjetoAPartirDaFatura(
  input: CriarProjetoInput,
): Promise<ResultadoAcao<ProjetoCriado>> {
  try {
    const contexto = await obterIntegradorAtivo();
    if (!contexto) return falha(ERRO_SESSAO);

    if (!input || typeof input !== "object") return falha("Dados do projeto inválidos.");

    const { projetoId, storagePath } = input;
    if (typeof projetoId !== "string" || !ehUuidValido(projetoId)) {
      return falha("Identificador do projeto inválido. Reenvie a fatura.");
    }
    if (typeof storagePath !== "string" || !caminhoPertenceAoProjeto(storagePath, projetoId)) {
      return falha("Referência da fatura inválida. Reenvie a fatura.");
    }

    const cliente_nome = sanitizarTexto(input.cliente_nome, LIMITES_TEXTO.cliente_nome);
    const cliente_cnpj_cpf = sanitizarTexto(input.cliente_cnpj_cpf, LIMITES_TEXTO.cliente_cnpj_cpf);
    const cliente_endereco = sanitizarTexto(input.cliente_endereco, LIMITES_TEXTO.cliente_endereco);
    const tipo_conexao = sanitizarTexto(input.tipo_conexao, LIMITES_TEXTO.tipo_conexao);
    const classe = sanitizarTexto(input.classe, LIMITES_TEXTO.classe);

    if (!cliente_nome) return falha("Informe o nome do cliente.");

    const consumo = Number(input.consumo_mensal_kwh);
    if (!Number.isFinite(consumo) || consumo <= 0 || consumo > 10_000_000) {
      return falha("Informe um consumo médio válido, em kWh, maior que zero.");
    }

    const potencia = Number(input.potencia_kwp);
    if (!Number.isFinite(potencia) || potencia <= 0 || potencia > 100_000) {
      return falha("Informe uma potência estimada válida, em kWp, maior que zero.");
    }

    // A fatura precisa existir no Storage: garante que o UUID foi emitido pelo passo 1.
    const nomeArquivo = storagePath.slice(projetoId.length + 1);
    const { data: objetos, error: erroListagem } = await contexto.supabase.storage
      .from(BUCKET_FATURAS)
      .list(projetoId, { search: nomeArquivo, limit: 1 });

    if (erroListagem) {
      console.error("[upload-fatura] Falha ao verificar a fatura:", erroListagem.message);
      return falha("Não foi possível verificar a fatura enviada. Tente novamente.");
    }
    if (!objetos?.some((objeto) => objeto.name === nomeArquivo)) {
      return falha("A fatura enviada não foi localizada. Reenvie o arquivo.");
    }

    // CORREÇÃO 22P02: projetos.id é bigint gerado pelo banco. O UUID (projetoId) identifica
    // apenas a pasta da fatura no Storage e NUNCA é enviado para a coluna id.
    // Idempotência: um duplo clique não cria dois projetos para a mesma fatura.
    const { data: jaCriado, error: erroDuplicidade } = await contexto.supabase
      .from(TABELA_PROJETOS)
      .select("id")
      .eq("user_id", contexto.userId)
      .eq("fatura_url", storagePath)
      .limit(1)
      .maybeSingle();

    if (erroDuplicidade) {
      console.error("[upload-fatura] Falha na verificação de duplicidade:", erroDuplicidade.code, erroDuplicidade.message);
      return falha("Não foi possível validar a fatura enviada. Tente novamente.");
    }
    if (jaCriado) {
      revalidatePath(ROTA_LISTAGEM_PROJETOS);
      return { ok: true, dados: { projetoId: String(jaCriado.id) } };
    }

    const { data: projeto, error: erroInsercao } = await contexto.supabase
      .from(TABELA_PROJETOS)
      .insert({
        user_id: contexto.userId,
        fatura_url: storagePath,
        cliente_nome,
        cliente_endereco: cliente_endereco || null,
        cliente_cnpj_cpf: cliente_cnpj_cpf || null,
        tipo_conexao: tipo_conexao || null,
        classe: classe || null,
        consumo_mensal_kwh: arredondar(consumo, 2),
        potencia_kwp: arredondar(potencia, 2),
        status: STATUS_INICIAL_PROJETO,
      })
      .select("id")
      .single();

    if (erroInsercao || !projeto) {
      console.error("[upload-fatura] Falha na inserção:", erroInsercao?.code, erroInsercao?.message);
      if (erroInsercao?.code === "23505") {
        return falha("Este projeto já foi criado. Consulte a listagem de projetos.");
      }
      if (erroInsercao?.code === "42501") {
        return falha("Seu usuário não tem permissão para criar projetos.");
      }
      return falha("Não foi possível criar o projeto. Revise os dados e tente novamente.");
    }

    revalidatePath(ROTA_LISTAGEM_PROJETOS);

    return { ok: true, dados: { projetoId: String(projeto.id) } };
  } catch (erro) {
    console.error("[upload-fatura] Erro inesperado na criação:", erro);
    return falha(ERRO_INESPERADO);
  }
}

/* -------------------------------------------------------------------------- */
/* 3. Descarte da fatura quando o usuário troca o arquivo antes de criar       */
/* -------------------------------------------------------------------------- */

export async function descartarFaturaNaoVinculada(
  projetoId: string,
  storagePath: string,
): Promise<ResultadoAcao<null>> {
  try {
    const contexto = await obterIntegradorAtivo();
    if (!contexto) return falha(ERRO_SESSAO);

    if (
      typeof projetoId !== "string" ||
      typeof storagePath !== "string" ||
      !ehUuidValido(projetoId) ||
      !caminhoPertenceAoProjeto(storagePath, projetoId)
    ) {
      return falha("Referência da fatura inválida.");
    }

    // Nunca remove fatura já vinculada a um projeto existente.
    // CORREÇÃO 22P02: o vínculo é pela coluna fatura_url (text), não pela coluna id (bigint).
    const { data: existente, error: erroConsulta } = await contexto.supabase
      .from(TABELA_PROJETOS)
      .select("id")
      .eq("fatura_url", storagePath)
      .limit(1)
      .maybeSingle();

    if (erroConsulta) {
      console.error("[upload-fatura] Falha na validação do descarte:", erroConsulta.code, erroConsulta.message);
      return falha("Não foi possível validar a fatura para descarte.");
    }
    if (existente) return falha("A fatura já está vinculada a um projeto e não pode ser descartada.");

    const { error: erroRemocao } = await contexto.supabase.storage
      .from(BUCKET_FATURAS)
      .remove([storagePath]);

    if (erroRemocao) {
      console.error("[upload-fatura] Falha no descarte:", erroRemocao.message);
      return falha("Não foi possível descartar a fatura anterior.");
    }

    return { ok: true, dados: null };
  } catch (erro) {
    console.error("[upload-fatura] Erro inesperado no descarte:", erro);
    return falha(ERRO_INESPERADO);
  }
}
