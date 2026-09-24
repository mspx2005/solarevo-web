"use client";

import { Printer } from "lucide-react";

// ============================================================
// BUG-008 — Micro componente cliente extraído da página.
// Necessário porque window.print() exige interatividade de
// navegador e não pode viver dentro de um Server Component.
// Classes e visual 100% idênticos ao botão original.
// ============================================================
export function BotaoImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
    >
      <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
    </button>
  );
}
