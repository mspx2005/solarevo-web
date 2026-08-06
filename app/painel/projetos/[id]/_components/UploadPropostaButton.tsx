"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { UploadPropostaModal } from "./UploadPropostaModal";

export function UploadPropostaButton({
  projetoId,
  temProposta = false,
}: {
  projetoId: string;
  temProposta?: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-enertrack-green-success px-4 py-2.5 text-sm font-semibold text-enertrack-slate-950 transition-colors hover:bg-enertrack-green-light focus:outline-none focus:ring-2 focus:ring-enertrack-green-success/40"
      >
        <UploadCloud className="h-4 w-4" />
        {temProposta ? "Substituir Proposta" : "Upload de Proposta"}
      </button>

      {aberto && (
        <UploadPropostaModal
          projetoId={projetoId}
          onClose={() => setAberto(false)}
        />
      )}
    </>
  );
}
