"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { uploadFatura } from "../actions";

const TIPOS_PERMITIDOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const TAMANHO_MAX = 10 * 1024 * 1024; // 10 MB

type Estado = "idle" | "uploading" | "sucesso" | "erro";

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadFaturaModal({
  projetoId,
  onClose,
}: {
  projetoId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensagem, setMensagem] = useState<string | null>(null);
  // NOVO: aviso complementar quando a fatura salva mas a IA falha
  const [avisoIa, setAvisoIa] = useState<string | null>(null);

  const bloqueado = estado === "uploading";

  // Fechar com a tecla Esc (exceto durante o upload).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !bloqueado) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bloqueado, onClose]);

  function validarESelecionar(f: File | undefined) {
    if (!f) return;

    if (!TIPOS_PERMITIDOS.includes(f.type)) {
      setEstado("erro");
      setMensagem("Formato não suportado. Envie PDF, PNG, JPG ou WEBP.");
      return;
    }

    if (f.size > TAMANHO_MAX) {
      setEstado("erro");
      setMensagem("Arquivo excede o limite de 10 MB.");
      return;
    }

    setArquivo(f);
    setEstado("idle");
    setMensagem(null);
    setAvisoIa(null);
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setArrastando(false);
      if (bloqueado) return;
      validarESelecionar(e.dataTransfer.files?.[0]);
    },
    [bloqueado]
  );

  async function enviar() {
    if (!arquivo || bloqueado) return;

    setEstado("uploading");
    setMensagem(null);
    setAvisoIa(null);

    const fd = new FormData();
    fd.append("projetoId", projetoId);
    fd.append("file", arquivo);

    const res = await uploadFatura(fd);

    if (res.ok) {
      setEstado("sucesso");
      // NOVO: mensagens diferenciadas conforme resultado da IA
      if (res.iaOk) {
        setMensagem("Fatura enviada e analisada com sucesso.");
        setAvisoIa(
          "Os dados do cliente foram extraídos e salvos no projeto automaticamente."
        );
      } else {
        setMensagem("Fatura enviada com sucesso.");
        setAvisoIa(res.iaError ?? null);
      }
    } else {
      setEstado("erro");
      setMensagem(res.error ?? "Erro ao enviar a fatura.");
    }
  }

  function concluir() {
    router.refresh();
    onClose();
  }

  const IconeArquivo =
    arquivo?.type === "application/pdf" ? FileText : ImageIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => !bloqueado && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-enertrack-slate-800 bg-enertrack-slate-900 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-enertrack-slate-800 px-6 py-4">
          <h2 className="text-base font-semibold text-enertrack-white">
            Upload de Fatura de Energia
          </h2>
          <button
            type="button"
            onClick={() => !bloqueado && onClose()}
            disabled={bloqueado}
            className="rounded-md p-1 text-enertrack-gray-light/60 transition-colors hover:bg-white/5 hover:text-enertrack-white disabled:opacity-40"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="px-6 py-6">
          {estado === "sucesso" ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-enertrack-green-success" />
              <p className="mt-4 text-base font-semibold text-enertrack-white">
                {mensagem}
              </p>
              {arquivo && (
                <p className="mt-1 text-sm text-enertrack-gray-light/60">
                  {arquivo.name}
                </p>
              )}
              {/* NOVO: aviso sobre o resultado da análise por IA */}
              {avisoIa && (
                <p className="mt-3 text-sm text-enertrack-gray-light/70">
                  {avisoIa}
                </p>
              )}
              <button
                type="button"
                onClick={concluir}
                className="mt-6 w-full rounded-lg bg-enertrack-orange-main px-4 py-2.5 text-sm font-semibold text-enertrack-white transition-colors hover:bg-enertrack-orange-secondary"
              >
                Concluir
              </button>
            </div>
          ) : (
            <>
              {/* Área de Drag and Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!bloqueado) setArrastando(true);
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={onDrop}
                onClick={() => !bloqueado && inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  arrastando
                    ? "border-enertrack-orange-main bg-enertrack-orange-main/5"
                    : "border-enertrack-slate-800 hover:border-enertrack-orange-main/50 hover:bg-white/[0.02]"
                } ${bloqueado ? "pointer-events-none opacity-60" : ""}`}
              >
                <UploadCloud className="h-10 w-10 text-enertrack-orange-main" />
                <p className="mt-3 text-sm font-medium text-enertrack-white">
                  Arraste a fatura aqui ou clique para selecionar
                </p>
                <p className="mt-1 text-xs text-enertrack-gray-light/50">
                  PDF, PNG, JPG ou WEBP — até 10 MB
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => validarESelecionar(e.target.files?.[0])}
                />
              </div>

              {/* Arquivo selecionado */}
              {arquivo && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-enertrack-slate-800 bg-enertrack-slate-800/40 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconeArquivo className="h-5 w-5 shrink-0 text-enertrack-blue-accent" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-enertrack-white">
                        {arquivo.name}
                      </p>
                      <p className="text-xs text-enertrack-gray-light/50">
                        {formatarTamanho(arquivo.size)}
                      </p>
                    </div>
                  </div>
                  {!bloqueado && (
                    <button
                      type="button"
                      onClick={() => {
                        setArquivo(null);
                        setEstado("idle");
                        setMensagem(null);
                        setAvisoIa(null);
                      }}
                      className="rounded-md p-1.5 text-enertrack-gray-light/50 transition-colors hover:bg-white/5 hover:text-red-400"
                      aria-label="Remover arquivo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Mensagem de erro */}
              {estado === "erro" && mensagem && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">{mensagem}</p>
                </div>
              )}

              {/* Rodapé */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !bloqueado && onClose()}
                  disabled={bloqueado}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-enertrack-gray-light transition-colors hover:bg-white/5 hover:text-enertrack-white disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={enviar}
                  disabled={!arquivo || bloqueado}
                  className="inline-flex items-center gap-2 rounded-lg bg-enertrack-orange-main px-4 py-2.5 text-sm font-semibold text-enertrack-white transition-colors hover:bg-enertrack-orange-secondary focus:outline-none focus:ring-2 focus:ring-enertrack-orange-main/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bloqueado ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando e analisando com IA...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Enviar Fatura
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
