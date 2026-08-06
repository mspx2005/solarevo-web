// app/painel/projetos/[id]/atribuir-instalador/formulario-atribuicao.tsx
'use client'

import { useState, useTransition } from 'react'
import type { InstaladorAtivo } from '@/types/enertrack'
import { atribuirInstaladorAction } from './actions'

export function FormularioAtribuicao({
  projetoId,
  instaladores,
  erroInicial,
}: {
  projetoId: string
  instaladores: InstaladorAtivo[]
  erroInicial: string | null
}) {
  const [instaladorId, setInstaladorId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    erroInicial ? { tipo: 'erro', texto: erroInicial } : null
  )
  const [enviando, startTransition] = useTransition()

  function handleSubmit() {
    setFeedback(null)
    startTransition(async () => {
      const resultado = await atribuirInstaladorAction({
        projetoId,
        instaladorId,
        titulo,
        descricao,
        dataPrevista,
      })

      setFeedback({ tipo: resultado.ok ? 'ok' : 'erro', texto: resultado.mensagem })

      if (resultado.ok) {
        setInstaladorId('')
        setTitulo('')
        setDescricao('')
        setDataPrevista('')
      }
    })
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-[#0B3C49]">Atribuir Instalador ao Projeto</h1>
        <p className="mt-1 text-sm text-slate-500">Vincule um instalador ativo e gere a Ordem de Serviço.</p>

        {feedback && (
          <div
            role="status"
            className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
              feedback.tipo === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {feedback.texto}
          </div>
        )}

        <div className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="instalador" className="mb-1 block text-sm font-medium text-slate-700">
              Instalador
            </label>
            <select
              id="instalador"
              value={instaladorId}
              onChange={(e) => setInstaladorId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30"
            >
              <option value="">Selecione um instalador</option>
              {instaladores.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.nome}
                  {inst.email ? ` — ${inst.email}` : ''}
                </option>
              ))}
            </select>
            {instaladores.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">Nenhum instalador ativo disponível.</p>
            )}
          </div>

          <div>
            <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-slate-700">
              Título da OS
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30"
              placeholder="Ex.: Instalação de 8 módulos — usina 12kWp"
            />
          </div>

          <div>
            <label htmlFor="descricao" className="mb-1 block text-sm font-medium text-slate-700">
              Descrição (opcional)
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30"
              placeholder="Detalhes operacionais da Ordem de Serviço"
            />
          </div>

          <div>
            <label htmlFor="data" className="mb-1 block text-sm font-medium text-slate-700">
              Prazo previsto de conclusão
            </label>
            <input
              id="data"
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={enviando || !instaladorId || !titulo || !dataPrevista}
              className="rounded-lg bg-[#F97316] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ea6a0c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? 'Vinculando...' : 'Vincular Instalador'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}