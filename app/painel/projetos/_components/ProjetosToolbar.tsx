"use client";

import { useRouter } from "next/navigation";

/**
 * ProjetosToolbar — ações do topo da tela de Projetos.
 *
 * Os handlers usam navegação por rota como padrão. Reaproveite o fluxo já
 * existente (ex.: abrir modal de upload) substituindo o corpo de cada onClick.
 * Nenhuma lógica de autenticação é tratada aqui.
 */
export function ProjetosToolbar() {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Upload de Fatura → Verde Sucesso */}
      <button
        type="button"
        onClick={() => router.push("/painel/projetos/upload-fatura")}
        className="inline-flex items-center gap-2 rounded-lg bg-enertrack-green-success px-4 py-2.5 text-sm font-semibold text-enertrack-slate-950 transition-colors hover:bg-enertrack-green-light focus:outline-none focus:ring-2 focus:ring-enertrack-green-success/40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M9.25 13.25V5.66l-2.72 2.72a.75.75 0 0 1-1.06-1.06l4-4a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06L10.75 5.66v7.59a.75.75 0 0 1-1.5 0Z" />
          <path d="M3.5 13a.75.75 0 0 1 .75.75v1.5c0 .14.11.25.25.25h11a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 15.5 17h-11a1.75 1.75 0 0 1-1.75-1.75v-1.5A.75.75 0 0 1 3.5 13Z" />
        </svg>
        Upload de Fatura
      </button>

      {/* Novo Projeto → Laranja Principal */}
      <button
        type="button"
        onClick={() => router.push("/painel/projetos/novo")}
        className="inline-flex items-center gap-2 rounded-lg bg-enertrack-orange-main px-4 py-2.5 text-sm font-semibold text-enertrack-white transition-colors hover:bg-enertrack-orange-secondary focus:outline-none focus:ring-2 focus:ring-enertrack-orange-main/40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M10 3.5a.75.75 0 0 1 .75.75v5h5a.75.75 0 0 1 0 1.5h-5v5a.75.75 0 0 1-1.5 0v-5h-5a.75.75 0 0 1 0-1.5h5v-5A.75.75 0 0 1 10 3.5Z" />
        </svg>
        Novo Projeto
      </button>
    </div>
  );
}
