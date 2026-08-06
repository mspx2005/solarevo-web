// app/instalador/dashboard/lista-os.tsx
'use client'

import { useState, useTransition } from 'react'
import type { OsInstalador } from '@/types/enertrack'
import { concluirOsAction } from './actions'

function formatarData(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR')
}

const ESTILO_STATUS: Record<OsInstalador['status'], string> = {
  pendente: 'bg-amber-100 text-amber-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluida: 'bg-emerald-100 text-emerald-800',
}

const ROTULO_STATUS: Record<OsInstalador['status'], string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
}

export function ListaOs({
  nome,
  ordensIniciais,
  erroInicial,
}: {
  nome: string
  ordensIniciais: OsInstalador[]
  erroInicial: string | null
}) {
  const [ordens, setOrdens] = useState<OsInstalador[]>(ordensIniciais)
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    erroInicial ? { tipo: 'erro', texto: erroInicial } : null
  )
  const [osEmProcesso, setOsEmProcesso] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleConcluir(osId: string) {
    setFeedback(null)
    setOsEmProcesso(osId)

    startTransition(async () => {
      const resultado = await concluirOsAction(osId)

      if (resultado.ok) {
        setOrdens((atual) =>
          atual.map((os) =>
            os.id === osId
              ? {
                  ...os,
                  status: 'concluida',
                  data_real_conclusao: new Date().toISOString().slice(0, 10),
                }
              : os
          )
        )
        setFeedback({ tipo: 'ok', texto: resultado.mensagem })
      } else {
        setFeedback({ tipo: 'erro', texto: resultado.mensagem })
      }

      setOsEmProcesso(null)
    })
  }

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-[#0B3C49] px-6 py-5">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-xl font-semibold text-white">Minhas Ordens de Serviço</h1>
          <p className="mt-0.5 text-sm text-slate-300">Bem-vindo, {nome}.</p>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-6">
        {feedback && (
          <div
            role="status"
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
              feedback.tipo === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedback.texto}
          </div>
        )}

        {ordens.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
            Nenhuma Ordem de Serviço atribuída no momento.
          </div>
        ) : (
          <ul className="space-y-4">
            {ordens.map((os) => {
              const concluida = os.status === 'concluida'
              const processando = osEmProcesso === os.id

              return (
                <li
                  key={os.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-[#0B3C49]">{os.titulo}</h2>
                      {os.descricao && (
                        <p className="mt-1 text-sm text-slate-600">{os.descricao}</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        Prazo previsto: {formatarData(os.data_prevista_conclusao)}
                        {os.data_real_conclusao &&
                          ` · Concluída em ${formatarData(os.data_real_conclusao)}`}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${ESTILO_STATUS[os.status]}`}
                    >
                      {ROTULO_STATUS[os.status]}
                    </span>
                  </div>

                  {!concluida && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleConcluir(os.id)}
                        disabled={processando}
                        className="rounded-lg bg-[#10B981] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0ea271] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processando ? 'Concluindo...' : 'Concluir OS'}
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}