// components/AvaliacaoInstalador.tsx
import type { AvaliacaoInstaladorDados, ConceitoAvaliacao } from '@/types/enertrack'

const ESTILO_CONCEITO: Record<ConceitoAvaliacao, { badge: string; barra: string }> = {
  Excelente: { badge: 'bg-emerald-100 text-emerald-800', barra: 'bg-emerald-500' },
  Bom: { badge: 'bg-lime-100 text-lime-800', barra: 'bg-lime-500' },
  'Atenção': { badge: 'bg-amber-100 text-amber-800', barra: 'bg-amber-500' },
  'Crítico': { badge: 'bg-red-100 text-red-800', barra: 'bg-red-500' },
}

function formatarData(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR')
}

export function AvaliacaoInstalador({ avaliacao }: { avaliacao: AvaliacaoInstaladorDados }) {
  const estilo = ESTILO_CONCEITO[avaliacao.conceito]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#0B3C49]">Avaliação Automática</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estilo.badge}`}>
          {avaliacao.conceito}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Dias de atraso</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              avaliacao.dias_atraso === 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {avaliacao.dias_atraso}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">Situação</p>
          <p
            className={`mt-1 text-lg font-semibold ${
              avaliacao.no_prazo ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {avaliacao.no_prazo ? 'No prazo' : 'Em atraso'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full ${estilo.barra}`} style={{ width: '100%' }} />
        </div>
      </div>

      <dl className="mt-4 space-y-1 text-xs text-slate-500">
        <div className="flex justify-between">
          <dt>Prazo previsto</dt>
          <dd className="font-medium text-slate-700">
            {formatarData(avaliacao.data_prevista_conclusao)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Conclusão real</dt>
          <dd className="font-medium text-slate-700">
            {formatarData(avaliacao.data_real_conclusao)}
          </dd>
        </div>
      </dl>
    </div>
  )
}