"use client";

import { FileText } from "lucide-react";
import { useState } from "react";

type Props = {
  projetoId: number;
};

export function GerarPropostaWordButton({ projetoId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/gerar-proposta-docx?projetoId=${projetoId}`
      );

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(
          erro?.error || "Erro ao gerar proposta Word."
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const disposition =
        response.headers.get("Content-Disposition");

      let nomeArquivo = "proposta.docx";

      const match =
        disposition?.match(/filename="(.+)"/);

      if (match?.[1]) {
        nomeArquivo = match[1];
      }

      link.download = nomeArquivo;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(
        error?.message ||
          "Erro ao gerar proposta Word."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors"
    >
      <FileText className="w-6 h-6" />

      <span>
        {loading
          ? "Gerando..."
          : "Gerar Proposta Word Premium"}
      </span>
    </button>
  );
}
