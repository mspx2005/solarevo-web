import Link from "next/link";
import { redirect } from "next/navigation";

import { obterIntegradorAtivo } from "./_lib/auth";
import { ROTA_LISTAGEM_PROJETOS } from "./_lib/constantes";
import UploadFaturaNovoProjeto from "./_components/UploadFaturaNovoProjeto";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Novo projeto por fatura | EnerTrack",
};

export default async function UploadFaturaPage() {
  const contexto = await obterIntegradorAtivo();
  if (!contexto) redirect("/login");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Navegação estrutural" className="mb-6 text-sm text-slate-400">
          <Link
            href={ROTA_LISTAGEM_PROJETOS}
            className="rounded transition-colors hover:text-[#F7931E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931E]"
          >
            Projetos
          </Link>
          <span className="mx-2 text-slate-600">/</span>
          <span className="text-slate-300">Novo projeto por fatura</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Criar projeto a partir da fatura
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Envie a fatura de energia do cliente. Os dados extraídos serão exibidos para conferência
            antes da criação do projeto.
          </p>
        </header>

        <UploadFaturaNovoProjeto />
      </div>
    </main>
  );
}
