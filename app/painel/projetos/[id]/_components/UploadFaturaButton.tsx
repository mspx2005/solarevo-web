"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { UploadFaturaModal } from "./UploadFaturaModal";

export function UploadFaturaButton({
  projetoId,
  temFatura = false,
}: {
  projetoId: string;
  temFatura?: boolean;
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
        {temFatura ? "Substituir Fatura" : "Upload de Fatura"}
      </button>

      {aberto && (
        <UploadFaturaModal
          projetoId={projetoId}
          onClose={() => setAberto(false)}
        />
      )}
    </>
  );
}
