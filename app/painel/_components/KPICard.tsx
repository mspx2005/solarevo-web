import type { ReactNode } from "react";

type Variante = "orange" | "blue" | "green" | "neutral";

/**
 * KPICard — card de indicador do Dashboard do Integrador.
 * O valor permanece em branco (legibilidade); o acento da paleta é aplicado
 * ao chip do ícone. Classes estáticas para serem detectadas pelo Tailwind.
 */
const ICONE_VARIANTE: Record<Variante, string> = {
  orange: "bg-enertrack-orange-main/15 text-enertrack-orange-main",
  blue: "bg-enertrack-blue-accent/15 text-enertrack-blue-accent",
  green: "bg-enertrack-green-success/15 text-enertrack-green-success",
  neutral: "bg-white/5 text-enertrack-gray-light",
};

export function KPICard({
  titulo,
  valor,
  descricao,
  variante = "neutral",
  icon,
}: {
  titulo: string;
  valor: string;
  descricao?: string;
  variante?: Variante;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-enertrack-slate-900 p-5 transition-colors hover:bg-enertrack-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-enertrack-gray-light/70">
          {titulo}
        </span>
        {icon && (
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${ICONE_VARIANTE[variante]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-enertrack-white">
        {valor}
      </p>
      {descricao && (
        <p className="mt-1 text-xs text-enertrack-gray-light/50">{descricao}</p>
      )}
    </div>
  );
}
