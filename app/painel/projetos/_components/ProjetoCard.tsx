import Link from "next/link";
import { StatusBadge } from "./StatusBadge";

export type Projeto = {
  id: string;
  cliente_nome: string;
  endereco: string | null;
  status: string;
  created_at: string;
};

function formatarData(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function ProjetoCard({ projeto }: { projeto: Projeto }) {
  return (
    <article className="group rounded-xl border border-white/5 bg-enertrack-slate-900 p-5 transition-colors hover:bg-enertrack-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-enertrack-white">
            {projeto.cliente_nome}
          </h2>
          {projeto.endereco && (
            <p className="mt-1 truncate text-sm text-enertrack-gray-light/60">
              {projeto.endereco}
            </p>
          )}
        </div>
        <StatusBadge status={projeto.status} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-xs text-enertrack-gray-light/50">
          Criado em {formatarData(projeto.created_at)}
        </span>
        <Link
          href={`/painel/projetos/${projeto.id}`}
          className="text-sm font-medium text-enertrack-orange-main transition-colors hover:text-enertrack-orange-secondary"
        >
          Abrir &rarr;
        </Link>
      </div>
    </article>
  );
}
