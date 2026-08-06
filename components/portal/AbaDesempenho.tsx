'use client';

import { useState } from 'react';
import {
  Sun,
  Plug,
  TrendingUp,
  PiggyBank,
  Radar,
  Sparkles,
  Droplets,
  Wrench,
  Send,
} from 'lucide-react';

export interface DadosDesempenho {
  mesReferencia: string;
  geracaoKwh: number;
  consumoKwh: number;
  economiaMes: number;
  economiaAcumulada: number;
}

const MOCK_DESEMPENHO: DadosDesempenho = {
  mesReferencia: 'Junho/2026',
  geracaoKwh: 1280,
  consumoKwh: 940,
  economiaMes: 1187.4,
  economiaAcumulada: 14620.85,
};

function formatarBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function GeracaoVsConsumo({ dados }: { dados: DadosDesempenho }) {
  const referencia = Math.max(dados.geracaoKwh, dados.consumoKwh) || 1;
  const pctGeracao = (dados.geracaoKwh / referencia) * 100;
  const pctConsumo = (dados.consumoKwh / referencia) * 100;
  const saldo = dados.geracaoKwh - dados.consumoKwh;
  const superavit = saldo >= 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0A1F3D]/60 p-6 lg:p-8 backdrop-blur-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Balanço Energético
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Geração vs. Consumo
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {dados.mesReferencia}
        </span>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm lg:text-base">
          <span className="flex items-center gap-2 text-slate-200">
            <Sun className="h-4 w-4 text-[#F7931E]" />
            Geração (Inversor)
          </span>
          <span className="font-semibold text-white">
            {dados.geracaoKwh.toLocaleString('pt-BR')} kWh
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F7931E] to-[#ffb65c] transition-[width] duration-700 ease-out"
            style={{ width: `${pctGeracao}%` }}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm lg:text-base">
          <span className="flex items-center gap-2 text-slate-200">
            <Plug className="h-4 w-4 text-sky-400" />
            Consumo (EDP)
          </span>
          <span className="font-semibold text-white">
            {dados.consumoKwh.toLocaleString('pt-BR')} kWh
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-[width] duration-700 ease-out"
            style={{ width: `${pctConsumo}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#00B894]/20 bg-[#00B894]/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp
            className={`h-4 w-4 ${superavit ? 'text-[#00B894]' : 'text-rose-400'}`}
          />
          <span className="text-sm text-slate-300">
            {superavit ? 'Excedente injetado na rede' : 'Déficit do período'}
          </span>
        </div>
        <span
          className={`text-sm font-semibold ${superavit ? 'text-[#00B894]' : 'text-rose-400'}`}
        >
          {superavit ? '+' : ''}
          {saldo.toLocaleString('pt-BR')} kWh
        </span>
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-500">
        Dados simulados • Sincronização automática Inversor + EDP em breve
      </p>
    </section>
  );
}

function CaldeiraoEconomia({ dados }: { dados: DadosDesempenho }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#F7931E]/20 bg-gradient-to-br from-[#0A1F3D] via-[#0A1F3D] to-[#10254a] p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#F7931E]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[#00B894]/10 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7931E]/15 ring-1 ring-[#F7931E]/30">
          <PiggyBank className="h-6 w-6 text-[#F7931E]" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Caldeirão de Economia
          </p>
          <p className="text-sm text-slate-300">Total acumulado com energia solar</p>
        </div>
      </div>
      <div className="relative mt-6">
        <span className="bg-gradient-to-r from-[#F7931E] to-[#00B894] bg-clip-text text-4xl font-bold tracking-tight text-transparent">
          {formatarBRL(dados.economiaAcumulada)}
        </span>
      </div>
      <div className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-[#00B894]/20 bg-[#00B894]/10 px-3 py-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-[#00B894]" />
        <span className="text-xs font-medium text-[#00B894]">
          +{formatarBRL(dados.economiaMes)} em {dados.mesReferencia}
        </span>
      </div>
    </section>
  );
}

interface AlertaRadar {
  id: string;
  titulo: string;
  descricao: string;
  icone: typeof Droplets;
  cor: 'ambar' | 'esmeralda';
}

const ALERTAS_MOCK: AlertaRadar[] = [
  {
    id: 'degradacao',
    titulo: 'Análise de Degradação',
    descricao: 'Queda sutil de rendimento detectada. Sugestão: lavagem dos módulos.',
    icone: Droplets,
    cor: 'ambar',
  },
  {
    id: 'manutencao',
    titulo: 'Manutenção Preventiva',
    descricao: 'Aviso de manutenção preventiva disponível para sua usina.',
    icone: Wrench,
    cor: 'esmeralda',
  },
];

const CORES_ALERTA = {
  ambar: {
    borda: 'border-amber-400/20',
    fundo: 'bg-amber-400/5',
    icone: 'text-amber-400',
    chip: 'bg-amber-400/10 ring-amber-400/30',
  },
  esmeralda: {
    borda: 'border-emerald-400/20',
    fundo: 'bg-emerald-400/5',
    icone: 'text-emerald-400',
    chip: 'bg-emerald-400/10 ring-emerald-400/30',
  },
} as const;

function RadarIA() {
  const [pergunta, setPergunta] = useState('');

  function handleEnviar() {
    if (!pergunta.trim()) return;
    setPergunta('');
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0A1F3D]/60 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B894]/10 ring-1 ring-[#00B894]/30">
          <Radar className="h-5 w-5 text-[#00B894]" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-ping rounded-full bg-[#00B894]" />
        </div>
        <div>
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-white">
            Radar Inteligente
            <Sparkles className="h-3.5 w-3.5 text-[#F7931E]" />
          </h3>
          <p className="text-xs text-slate-400">Insights gerados por IA · SolarEvo</p>
        </div>
      </div>
      <div className="space-y-3">
        {ALERTAS_MOCK.map((alerta) => {
          const Icone = alerta.icone;
          const c = CORES_ALERTA[alerta.cor];
          return (
            <div
              key={alerta.id}
              className={`flex gap-3 rounded-xl border ${c.borda} ${c.fundo} p-4`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${c.chip}`}
              >
                <Icone className={`h-4.5 w-4.5 ${c.icone}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{alerta.titulo}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                  {alerta.descricao}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 focus-within:border-[#00B894]/40">
          <input
            type="text"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
            placeholder="Dúvidas sobre sua usina? Pergunte à nossa IA."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleEnviar}
            aria-label="Enviar pergunta à IA"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F7931E] to-[#00B894] text-white transition-opacity hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

export function AbaDesempenho({
  dados = MOCK_DESEMPENHO,
}: {
  dados?: DadosDesempenho;
}) {
  return (
    <div className="space-y-5">
      <GeracaoVsConsumo dados={dados} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
  <CaldeiraoEconomia dados={dados} />
  <RadarIA />
</div>
    </div>
  );
}