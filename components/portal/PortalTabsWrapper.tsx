'use client';

import { useState, type ReactNode } from 'react';
import { HardHat, Activity } from 'lucide-react';

type AbaAtiva = 'instalacao' | 'desempenho';

interface PortalTabsWrapperProps {
  instalacao: ReactNode;
  desempenho: ReactNode;
  abaInicial?: AbaAtiva;
}

const ABAS: { id: AbaAtiva; rotulo: string; Icone: typeof HardHat }[] = [
  { id: 'instalacao', rotulo: 'Instalação', Icone: HardHat },
  { id: 'desempenho', rotulo: 'Desempenho', Icone: Activity },
];

export function PortalTabsWrapper({
  instalacao,
  desempenho,
  abaInicial = 'instalacao',
}: PortalTabsWrapperProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>(abaInicial);

  return (
    <div className="space-y-5">
      <nav
        role="tablist"
        aria-label="Seções do acompanhamento"
        className="sticky top-4 z-10 flex gap-1.5 rounded-2xl border border-white/10 bg-[#0A1F3D]/70 p-1.5 backdrop-blur-md"
      >
        {ABAS.map(({ id, rotulo, Icone }) => {
          const ativa = abaAtiva === id;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={ativa}
              aria-controls={`painel-${id}`}
              onClick={() => setAbaAtiva(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                ativa
                  ? 'bg-white/5 text-white ring-1 ring-[#00B894]/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icone className={`h-4 w-4 ${ativa ? 'text-[#00B894]' : 'text-slate-500'}`} />
              {rotulo}
            </button>
          );
        })}
      </nav>

      <div
        id="painel-instalacao"
        role="tabpanel"
        aria-labelledby="instalacao"
        className={abaAtiva === 'instalacao' ? 'block' : 'hidden'}
      >
        {instalacao}
      </div>

      <div
        id="painel-desempenho"
        role="tabpanel"
        aria-labelledby="desempenho"
        className={abaAtiva === 'desempenho' ? 'block' : 'hidden'}
      >
        {desempenho}
      </div>
    </div>
  );
}
