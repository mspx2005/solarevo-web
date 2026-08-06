import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { KPICard } from "./_components/KPICard";

export const dynamic = "force-dynamic";

export default async function PainelDashboardPage() {
  const supabase = await createSupabaseServerClient();

  // ===========================================================================
  // VALIDAÇÃO DE SESSÃO E ROLE (Documento 4 §3 / Prompt Técnico §5) — segurança.
  // Sem usuário → /painel/login. Role diferente de "integrador" ou inativo → idem.
  // ===========================================================================
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/painel/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, role, ativo")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.ativo || profile.role !== "integrador") {
    redirect("/painel/login");
  }
  // ============================ FIM — validação ==============================

  const primeiroNome = (profile.nome ?? "Integrador").split(" ")[0];

  // ===========================================================================
  // MOCK — indicadores estáticos para layout/estrutura.
  // Substituir por consultas reais (projetos, os_instaladores) em etapa futura.
  // ===========================================================================
  const indicadores = [
    {
      titulo: "Projetos Ativos",
      valor: "12",
      descricao: "Em execução no momento",
      variante: "orange" as const,
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M2 4.75A2.75 2.75 0 0 1 4.75 2h3.34c.73 0 1.43.29 1.95.81L11.4 4h3.85A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25V4.75Z" />
        </svg>
      ),
    },
    {
      titulo: "OS em Aberto",
      valor: "8",
      descricao: "Pendentes ou em andamento",
      variante: "blue" as const,
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M7.5 3.5A1.5 1.5 0 0 1 9 2h2a1.5 1.5 0 0 1 1.5 1.5h1.25A2.25 2.25 0 0 1 16 5.75v9.5A2.25 2.25 0 0 1 13.75 17.5H6.25A2.25 2.25 0 0 1 4 15.25v-9.5A2.25 2.25 0 0 1 6.25 3.5H7.5Zm0 1.5H6.25a.75.75 0 0 0-.75.75v9.5c0 .41.34.75.75.75h7.5a.75.75 0 0 0 .75-.75v-9.5a.75.75 0 0 0-.75-.75H12.5a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5Z" />
        </svg>
      ),
    },
    {
      titulo: "OS Concluídas (mês)",
      valor: "27",
      descricao: "Finalizadas no período",
      variante: "green" as const,
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.79a.75.75 0 0 0-1.06-1.06l-3.7 3.7-1.58-1.58a.75.75 0 1 0-1.06 1.06l2.11 2.11a.75.75 0 0 0 1.06 0l4.23-4.23Z" />
        </svg>
      ),
    },
    {
      titulo: "Instaladores Ativos",
      valor: "5",
      descricao: "Disponíveis para alocação",
      variante: "neutral" as const,
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.5 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.5 16a5.5 5.5 0 0 1 11 0 .75.75 0 0 1-.75.75h-9.5A.75.75 0 0 1 1.5 16Zm12.04.75c.13-.24.21-.5.21-.75 0-1.3-.42-2.51-1.13-3.49a4 4 0 0 1 5.38 3.49.75.75 0 0 1-.75.75h-3.7Z" />
        </svg>
      ),
    },
  ];

  // Resumo de OS por status (MOCK)
  const resumoOS = [
    { rotulo: "Pendentes", valor: 3, ponto: "bg-enertrack-orange-secondary" },
    { rotulo: "Em Andamento", valor: 5, ponto: "bg-enertrack-blue-accent" },
    { rotulo: "Concluídas", valor: 27, ponto: "bg-enertrack-green-success" },
  ];
  // ============================== FIM — MOCK ================================

  return (
    <main className="min-h-screen bg-enertrack-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Boas-vindas */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-enertrack-white">
              Bem-vindo, {primeiroNome}
            </h1>
            <p className="mt-1 text-sm text-enertrack-gray-light/60">
              Visão geral da sua operação no EnerTrack.
            </p>
          </div>
          <Link
            href="/painel/projetos/novo"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-enertrack-orange-main px-4 py-2.5 text-sm font-semibold text-enertrack-white transition-colors hover:bg-enertrack-orange-secondary focus:outline-none focus:ring-2 focus:ring-enertrack-orange-main/40"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M10 3.5a.75.75 0 0 1 .75.75v5h5a.75.75 0 0 1 0 1.5h-5v5a.75.75 0 0 1-1.5 0v-5h-5a.75.75 0 0 1 0-1.5h5v-5A.75.75 0 0 1 10 3.5Z" />
            </svg>
            Novo Projeto
          </Link>
        </header>

        {/* Indicadores principais */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indicadores.map((kpi) => (
            <KPICard
              key={kpi.titulo}
              titulo={kpi.titulo}
              valor={kpi.valor}
              descricao={kpi.descricao}
              variante={kpi.variante}
              icon={kpi.icon}
            />
          ))}
        </section>

        {/* Resumo de OS + Ações rápidas */}
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Resumo de Ordens de Serviço */}
          <div className="rounded-xl border border-white/5 bg-enertrack-slate-900 p-6 lg:col-span-2">
            <h2 className="text-base font-semibold text-enertrack-white">
              Resumo de Ordens de Serviço
            </h2>
            <p className="mt-1 text-xs text-enertrack-gray-light/50">
              Distribuição atual por status
            </p>
            <div className="mt-5 space-y-3">
              {resumoOS.map((item) => (
                <div
                  key={item.rotulo}
                  className="flex items-center justify-between rounded-lg bg-enertrack-slate-800 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.ponto}`} />
                    <span className="text-sm text-enertrack-gray-light">
                      {item.rotulo}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-enertrack-white">
                    {item.valor}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="rounded-xl border border-white/5 bg-enertrack-slate-900 p-6">
            <h2 className="text-base font-semibold text-enertrack-white">
              Ações rápidas
            </h2>
            <div className="mt-5 space-y-3">
              <Link
                href="/painel/projetos"
                className="flex items-center justify-between rounded-lg bg-enertrack-slate-800 px-4 py-3 text-sm font-medium text-enertrack-gray-light transition-colors hover:bg-enertrack-slate-800/60 hover:text-enertrack-white"
              >
                Ver Projetos
                <span className="text-enertrack-orange-main">&rarr;</span>
              </Link>
              <Link
                href="/painel/projetos/upload-fatura"
                className="flex items-center justify-between rounded-lg bg-enertrack-slate-800 px-4 py-3 text-sm font-medium text-enertrack-gray-light transition-colors hover:bg-enertrack-slate-800/60 hover:text-enertrack-white"
              >
                Upload de Fatura
                <span className="text-enertrack-green-success">&rarr;</span>
              </Link>
              <Link
                href="/painel/projetos/novo"
                className="flex items-center justify-between rounded-lg bg-enertrack-slate-800 px-4 py-3 text-sm font-medium text-enertrack-gray-light transition-colors hover:bg-enertrack-slate-800/60 hover:text-enertrack-white"
              >
                Novo Projeto
                <span className="text-enertrack-orange-main">&rarr;</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
