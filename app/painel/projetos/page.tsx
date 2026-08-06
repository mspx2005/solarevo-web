import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjetoCard, type Projeto } from "./_components/ProjetoCard";
import { ProjetosToolbar } from "./_components/ProjetosToolbar";

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const supabase = await createSupabaseServerClient();

  // ===========================================================================
  // ACESSO A DADOS — padrão estabelecido (Documento 4 §4.2 / Prompt Técnico §6).
  // Sessão validada; RLS + filtro garantem integrador_id = auth.uid().
  // Substitua por seu fetch existente, se houver — o foco desta tarefa é visual.
  // ===========================================================================
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/painel/login");
  }

  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, cliente_nome, endereco, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  // =========================== FIM — acesso a dados ==========================

  const lista = (projetos ?? []) as Projeto[];

  return (
    <main className="min-h-screen bg-enertrack-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Cabeçalho + ações */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-enertrack-white">
              Projetos
            </h1>
            <p className="mt-1 text-sm text-enertrack-gray-light/60">
              Gerencie seus projetos fotovoltaicos e o status de cada execução.
            </p>
          </div>
          <ProjetosToolbar />
        </header>

        {/* Listagem */}
        {lista.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-enertrack-slate-900 p-10 text-center">
            <p className="text-sm text-enertrack-gray-light/70">
              Nenhum projeto cadastrado ainda.
            </p>
            <p className="mt-1 text-xs text-enertrack-gray-light/50">
              Utilize &ldquo;Novo Projeto&rdquo; para iniciar o primeiro
              cadastro.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {lista.map((projeto) => (
              <ProjetoCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
