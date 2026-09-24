"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  criarProjetoAPartirDaFatura,
  descartarFaturaNaoVinculada,
  enviarFaturaParaAnalise,
} from "../actions";
import {
  ACCEPT_INPUT,
  OPCOES_CLASSE,
  OPCOES_TIPO_CONEXAO,
  ROTA_API_ANALISE,
  ROTA_LISTAGEM_PROJETOS,
  TAMANHO_MAXIMO_BYTES,
} from "../_lib/constantes";
import {
  CONFERENCIA_VAZIA,
  calcularPotenciaEstimada,
  ehMimeAceito,
  extrairPayloadAnalise,
  formatarNumeroBR,
  mapearAnaliseParaConferencia,
  parseNumeroBR,
} from "../_lib/fatura";
import type { DadosConferencia, FaturaEnviada } from "../_lib/tipos";

type Etapa = "selecao" | "analisando" | "conferencia" | "salvando" | "concluido";

interface Toast {
  tipo: "sucesso" | "erro";
  mensagem: string;
}

const MENSAGEM_SUCESSO = "Projeto criado com sucesso";
const ATRASO_REDIRECIONAMENTO_MS = 1500;

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2).replace(".", ",")} MB`;
}

function validarArquivo(arquivo: File): string | null {
  if (!ehMimeAceito(arquivo.type)) return "Formato não suportado. Envie PDF, PNG, JPG ou WEBP.";
  if (arquivo.size === 0) return "O arquivo selecionado está vazio.";
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) return "O arquivo excede o limite de 10 MB.";
  return null;
}

async function chamarApiAnalise(fileUrl: string): Promise<DadosConferencia> {
  const resposta = await fetch(ROTA_API_ANALISE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl }),
    cache: "no-store",
  });

  let json: unknown = null;
  try {
    json = await resposta.json();
  } catch {
    json = null;
  }

  if (!resposta.ok) {
    const corpo = (json ?? {}) as Record<string, unknown>;
    const detalhe =
      typeof corpo.error === "string" ? corpo.error : typeof corpo.erro === "string" ? corpo.erro : null;
    throw new Error(detalhe ?? `A análise da fatura falhou (HTTP ${resposta.status}).`);
  }

  return mapearAnaliseParaConferencia(extrairPayloadAnalise(json));
}

export default function UploadFaturaNovoProjeto() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [etapa, setEtapa] = useState<Etapa>("selecao");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [falhaAnalise, setFalhaAnalise] = useState(false);
  const [faturaEnviada, setFaturaEnviada] = useState<FaturaEnviada | null>(null);
  const [dados, setDados] = useState<DadosConferencia>(CONFERENCIA_VAZIA);
  const [potenciaManual, setPotenciaManual] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  /* ------------------------------ Ciclo de vida ------------------------------ */

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!toast || toast.tipo === "sucesso") return;
    const id = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(id);
  }, [toast]);

  /* --------------------------------- Arquivo --------------------------------- */

  const selecionarArquivo = useCallback((novo: File | null) => {
    setErro(null);
    setFalhaAnalise(false);
    if (!novo) return;

    const problema = validarArquivo(novo);
    if (problema) {
      setErro(problema);
      return;
    }

    setArquivo(novo);
    setPreviewUrl(URL.createObjectURL(novo));
  }, []);

  const aoAlterarInput = (evento: ChangeEvent<HTMLInputElement>) => {
    selecionarArquivo(evento.target.files?.[0] ?? null);
    evento.target.value = "";
  };

  const aoSoltar = (evento: DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    setArrastando(false);
    if (etapa !== "selecao") return;
    selecionarArquivo(evento.dataTransfer.files?.[0] ?? null);
  };

  const reiniciar = () => {
    if (faturaEnviada) {
      void descartarFaturaNaoVinculada(faturaEnviada.projetoId, faturaEnviada.storagePath);
    }
    setArquivo(null);
    setPreviewUrl(null);
    setFaturaEnviada(null);
    setDados(CONFERENCIA_VAZIA);
    setPotenciaManual(false);
    setFalhaAnalise(false);
    setErro(null);
    setEtapa("selecao");
  };

  /* --------------------------------- Análise --------------------------------- */

  const analisarFatura = async () => {
    if (!arquivo) {
      setErro("Selecione uma fatura antes de analisar.");
      return;
    }

    setErro(null);
    setFalhaAnalise(false);
    setEtapa("analisando");

    let enviada = faturaEnviada;
    try {
      if (!enviada) {
        const formData = new FormData();
        formData.append("arquivo", arquivo);
        const resultado = await enviarFaturaParaAnalise(formData);
        if (!resultado.ok) {
          setErro(resultado.erro);
          setEtapa("selecao");
          return;
        }
        enviada = resultado.dados;
        setFaturaEnviada(enviada);
      }

      const extraidos = await chamarApiAnalise(enviada.fileUrl);
      setDados(extraidos);
      setPotenciaManual(false);
      setEtapa("conferencia");
    } catch (falha) {
      console.error("[upload-fatura] Falha na análise:", falha);
      setErro(
        falha instanceof Error && falha.message
          ? falha.message
          : "Não foi possível analisar a fatura.",
      );
      setFalhaAnalise(Boolean(enviada));
      setEtapa("selecao");
    }
  };

  const preencherManualmente = () => {
    setErro(null);
    setFalhaAnalise(false);
    setDados(CONFERENCIA_VAZIA);
    setPotenciaManual(false);
    setEtapa("conferencia");
  };

  /* ------------------------------- Conferência ------------------------------- */

  const alterarCampo =
    (campo: keyof DadosConferencia) =>
    (evento: ChangeEvent<HTMLInputElement>) => {
      const valor = evento.target.value;
      setDados((atual) => {
        const proximo = { ...atual, [campo]: valor };
        if (campo === "consumo_mensal_kwh" && !potenciaManual) {
          proximo.potencia_kwp = formatarNumeroBR(calcularPotenciaEstimada(parseNumeroBR(valor)));
        }
        return proximo;
      });
      if (campo === "potencia_kwp") setPotenciaManual(true);
    };

  const recalcularPotencia = () => {
    setPotenciaManual(false);
    setDados((atual) => ({
      ...atual,
      potencia_kwp: formatarNumeroBR(calcularPotenciaEstimada(parseNumeroBR(atual.consumo_mensal_kwh))),
    }));
  };

  const criarProjeto = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);

    if (!faturaEnviada) {
      setErro("A fatura não foi enviada. Selecione o arquivo novamente.");
      return;
    }

    const consumo = parseNumeroBR(dados.consumo_mensal_kwh);
    const potencia = parseNumeroBR(dados.potencia_kwp);

    if (!dados.cliente_nome.trim()) {
      setErro("Informe o nome do cliente.");
      return;
    }
    if (consumo === null || consumo <= 0) {
      setErro("Informe um consumo médio válido, em kWh.");
      return;
    }
    if (potencia === null || potencia <= 0) {
      setErro("Informe uma potência estimada válida, em kWp.");
      return;
    }

    setEtapa("salvando");

    try {
      const resultado = await criarProjetoAPartirDaFatura({
        projetoId: faturaEnviada.projetoId,
        storagePath: faturaEnviada.storagePath,
        cliente_nome: dados.cliente_nome,
        cliente_cnpj_cpf: dados.cliente_cnpj_cpf,
        cliente_endereco: dados.cliente_endereco,
        tipo_conexao: dados.tipo_conexao,
        classe: dados.classe,
        consumo_mensal_kwh: consumo,
        potencia_kwp: potencia,
      });

      if (!resultado.ok) {
        setErro(resultado.erro);
        setToast({ tipo: "erro", mensagem: resultado.erro });
        setEtapa("conferencia");
        return;
      }

      setEtapa("concluido");
      setToast({ tipo: "sucesso", mensagem: MENSAGEM_SUCESSO });
      timerRef.current = setTimeout(() => {
        router.push(ROTA_LISTAGEM_PROJETOS);
        router.refresh();
      }, ATRASO_REDIRECIONAMENTO_MS);
    } catch (falha) {
      console.error("[upload-fatura] Falha na criação:", falha);
      const mensagem = "Não foi possível criar o projeto. Tente novamente.";
      setErro(mensagem);
      setToast({ tipo: "erro", mensagem });
      setEtapa("conferencia");
    }
  };

  /* ---------------------------------- Render --------------------------------- */

  const emSelecao = etapa === "selecao" || etapa === "analisando";
  const ehPdf = arquivo?.type === "application/pdf";
  const bloqueado = etapa === "analisando" || etapa === "salvando" || etapa === "concluido";

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Coluna do arquivo */}
        <section
          aria-label="Fatura"
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2"
        >
          <h2 className="text-base font-semibold text-white">Fatura de energia</h2>
          <p className="mt-1 text-xs text-slate-400">PDF, PNG, JPG ou WEBP, até 10 MB.</p>

          {!arquivo ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={aoSoltar}
              className={
                arrastando
                  ? "mt-4 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#F7931E] bg-[#F7931E]/10 px-4 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E]"
                  : "mt-4 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-950/40 px-4 text-center transition-colors hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E]"
              }
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-200">Arraste a fatura ou clique para selecionar</p>
              <p className="mt-1 text-xs text-slate-500">O arquivo é armazenado com segurança no projeto.</p>
            </div>
          ) : (
            <div className="mt-4">
              <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                {previewUrl && ehPdf ? (
                  <object data={previewUrl} type="application/pdf" className="h-[420px] w-full" aria-label="Pré-visualização da fatura em PDF">
                    <p className="p-4 text-sm text-slate-400">Pré-visualização indisponível neste navegador.</p>
                  </object>
                ) : null}
                {previewUrl && !ehPdf ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Pré-visualização da fatura" className="max-h-[420px] w-full object-contain" />
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <p className="min-w-0 truncate text-slate-300" title={arquivo.name}>
                  {arquivo.name} <span className="text-slate-500">({formatarTamanho(arquivo.size)})</span>
                </p>
                <button
                  type="button"
                  onClick={reiniciar}
                  disabled={bloqueado}
                  className="shrink-0 rounded-md px-2 py-1 font-medium text-slate-300 transition-colors hover:text-[#F7931E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trocar arquivo
                </button>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_INPUT}
            onChange={aoAlterarInput}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />

          {emSelecao ? (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={analisarFatura}
                disabled={!arquivo || etapa === "analisando"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-[#0A1F3D] transition-colors hover:bg-[#ffa53d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {etapa === "analisando" ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1F3D] border-t-transparent" />
                    Analisando fatura…
                  </>
                ) : (
                  "Analisar Fatura"
                )}
              </button>
              {falhaAnalise ? (
                <button
                  type="button"
                  onClick={preencherManualmente}
                  className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E]"
                >
                  Preencher dados manualmente
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Coluna de conferência */}
        <section
          aria-label="Conferência dos dados"
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-3"
        >
          <h2 className="text-base font-semibold text-white">Conferência dos dados</h2>

          {erro ? (
            <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {erro}
            </div>
          ) : null}

          {emSelecao ? (
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              {etapa === "analisando"
                ? "A fatura está sendo lida. Os campos aparecerão aqui para revisão."
                : "Após a análise, os dados do cliente e do consumo aparecerão aqui para revisão antes da criação do projeto."}
            </p>
          ) : (
            <form onSubmit={criarProjeto} className="mt-4 space-y-4" noValidate>
              <fieldset disabled={bloqueado} className="space-y-4">
                <Campo id="cliente_nome" rotulo="Cliente" obrigatorio valor={dados.cliente_nome} onChange={alterarCampo("cliente_nome")} autoComplete="off" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="cliente_cnpj_cpf" rotulo="CPF/CNPJ" valor={dados.cliente_cnpj_cpf} onChange={alterarCampo("cliente_cnpj_cpf")} inputMode="numeric" />
                  <Campo id="classe" rotulo="Classe" valor={dados.classe} onChange={alterarCampo("classe")} lista="opcoes-classe" />
                </div>

                <Campo id="cliente_endereco" rotulo="Endereço" valor={dados.cliente_endereco} onChange={alterarCampo("cliente_endereco")} />

                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo id="tipo_conexao" rotulo="Tipo de Conexão" valor={dados.tipo_conexao} onChange={alterarCampo("tipo_conexao")} lista="opcoes-conexao" />
                  <Campo id="consumo_mensal_kwh" rotulo="Consumo Médio" sufixo="kWh" obrigatorio valor={dados.consumo_mensal_kwh} onChange={alterarCampo("consumo_mensal_kwh")} inputMode="decimal" />
                  <Campo id="potencia_kwp" rotulo="Potência Estimada" sufixo="kWp" obrigatorio valor={dados.potencia_kwp} onChange={alterarCampo("potencia_kwp")} inputMode="decimal" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/50 px-3 py-2 text-xs text-slate-400">
                  <span>
                    {potenciaManual
                      ? "Potência ajustada manualmente."
                      : "Potência calculada: consumo médio × 1,3 ÷ 100."}
                  </span>
                  {potenciaManual ? (
                    <button
                      type="button"
                      onClick={recalcularPotencia}
                      className="rounded px-1 font-medium text-[#00B894] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
                    >
                      Recalcular pelo consumo
                    </button>
                  ) : null}
                </div>

                <datalist id="opcoes-conexao">
                  {OPCOES_TIPO_CONEXAO.map((opcao) => (
                    <option key={opcao} value={opcao} />
                  ))}
                </datalist>
                <datalist id="opcoes-classe">
                  {OPCOES_CLASSE.map((opcao) => (
                    <option key={opcao} value={opcao} />
                  ))}
                </datalist>
              </fieldset>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.push(ROTA_LISTAGEM_PROJETOS)}
                  disabled={bloqueado}
                  className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={bloqueado}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00B894] px-5 py-2.5 text-sm font-semibold text-[#0A1F3D] transition-colors hover:bg-[#1fd1aa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {etapa === "salvando" ? (
                    <>
                      <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1F3D] border-t-transparent" />
                      Criando projeto…
                    </>
                  ) : etapa === "concluido" ? (
                    "Projeto criado"
                  ) : (
                    "Criar Projeto"
                  )}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={
            toast.tipo === "sucesso"
              ? "fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-[#00B894]/50 bg-slate-900 px-4 py-3 text-sm text-slate-100 shadow-lg shadow-black/40"
              : "fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-red-500/50 bg-slate-900 px-4 py-3 text-sm text-slate-100 shadow-lg shadow-black/40"
          }
        >
          <span
            aria-hidden="true"
            className={toast.tipo === "sucesso" ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00B894]" : "mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500"}
          />
          <p>{toast.mensagem}</p>
        </div>
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------------------- */

interface CampoProps {
  id: keyof DadosConferencia;
  rotulo: string;
  valor: string;
  onChange: (evento: ChangeEvent<HTMLInputElement>) => void;
  obrigatorio?: boolean;
  sufixo?: string;
  lista?: string;
  inputMode?: "text" | "numeric" | "decimal";
  autoComplete?: string;
}

function Campo({ id, rotulo, valor, onChange, obrigatorio, sufixo, lista, inputMode, autoComplete }: CampoProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {rotulo}
        {obrigatorio ? <span className="ml-0.5 text-[#F7931E]" aria-hidden="true">*</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type="text"
          value={valor}
          onChange={onChange}
          required={obrigatorio}
          aria-required={obrigatorio}
          list={lista}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={
            sufixo
              ? "w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-3 pr-12 text-sm text-slate-100 placeholder-slate-600 transition-colors focus:border-[#F7931E] focus:outline-none focus:ring-1 focus:ring-[#F7931E] disabled:opacity-60"
              : "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 transition-colors focus:border-[#F7931E] focus:outline-none focus:ring-1 focus:ring-[#F7931E] disabled:opacity-60"
          }
        />
        {sufixo ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
            {sufixo}
          </span>
        ) : null}
      </div>
    </div>
  );
}
