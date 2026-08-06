'use client';

import { CheckCircle2, Circle, Clock, SunMedium, ShieldCheck } from 'lucide-react';

/* ============================================================
   DTO PÚBLICO — recebido já higienizado e com a REGRA DE NEGÓCIO
   (progresso / isUsinaAtiva) já calculada no servidor.
   ============================================================ */
export interface ProjetoPublico {
  cliente_nome: string;
  potencia_kwp: number | null;
  modulo_potencia_w: number | null;
  status_instalacao: string | null;
  seguro_equipamento_status: string | null;
  doc_diagrama_unifilar: string | null;        // JSON serializado: { status: string }
  etapa_homologacao_plataforma: string | null; // JSON serializado: { status: string }
  progresso: number;       // ← calculado no servidor
  isUsinaAtiva: boolean;   // ← calculado no servidor (progresso >= 90)
}

export function AbaInstalacao({ projeto }: { projeto: ProjetoPublico }) {
  // Regra de negócio vem PRONTA do servidor — sem recálculo no cliente.
  const { progresso, isUsinaAtiva } = projeto;

  // Flags de EXIBIÇÃO das etapas (apenas para colorir os cards de status).
  let docEletrico = { status: 'Pendente' };
  try {
    if (projeto.doc_diagrama_unifilar) docEletrico = JSON.parse(projeto.doc_diagrama_unifilar);
  } catch {}

  const parecerOk = docEletrico.status === 'Homologado';
  const instalacaoOk = projeto.status_instalacao === 'Concluído';
  const instalacaoAndamento = projeto.status_instalacao === 'Em Andamento';
  const seguroOk = projeto.seguro_equipamento_status === 'Ativo';

  let docHomologacao = { status: 'Pendente' };
  try {
    if (projeto.etapa_homologacao_plataforma) docHomologacao = JSON.parse(projeto.etapa_homologacao_plataforma);
  } catch {}

  const vistoriaOk = docHomologacao.status === 'Homologado';

  // DADOS DO KIT (preservado do V1)
  const potenciaKwp = projeto.potencia_kwp || 0;
  const moduloW = projeto.modulo_potencia_w || 600;
  const qtdPaineis = potenciaKwp ? Math.ceil((potenciaKwp * 1000) / moduloW) : 0;
  const inversor = parseFloat(projeto.potencia_kwp ? (projeto.potencia_kwp / 1.5).toFixed(1) : '0');

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {!isUsinaAtiva && (
        <div>
          <h1 className="text-3xl font-black text-white leading-tight">
            Olá, {projeto.cliente_nome?.split(' ')[0]}.
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Acompanhe a jornada de instalação da sua usina solar em tempo real.
          </p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <SunMedium className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-white text-sm">Resumo do Sistema</h2>
        </div>
        <p className="text-slate-300 text-sm font-medium leading-relaxed">
          Usina Híbrida <strong className="text-white">{potenciaKwp}kWp</strong> <br />
          1 Inversor {inversor}kW + {qtdPaineis} Placas {moduloW}W
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex justify-between items-end mb-3">
          <h3 className="font-bold text-slate-300 text-sm">Progresso da Obra</h3>
          <span className="text-emerald-400 font-black text-xl">{progresso}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/50">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            style={{ width: `${progresso}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {/* Etapa 1: Parecer */}
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${parecerOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-3">
            {parecerOk ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-600" />}
            <span className={`font-semibold text-sm ${parecerOk ? 'text-white' : 'text-slate-400'}`}>Parecer de Acesso Emitido (EDP)</span>
          </div>
          {parecerOk ? <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">OK</span> : <span className="text-slate-500 font-bold text-[10px] uppercase">Pendente</span>}
        </div>

        {/* Etapa 2: Instalação */}
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${instalacaoOk ? 'bg-emerald-500/10 border-emerald-500/30' : instalacaoAndamento ? 'bg-orange-500/10 border-orange-500/30 shadow-lg' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-3">
            {instalacaoOk ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : instalacaoAndamento ? <Clock className="w-5 h-5 text-orange-400 animate-pulse" /> : <Circle className="w-5 h-5 text-slate-600" />}
            <span className={`font-semibold text-sm ${instalacaoOk ? 'text-white' : instalacaoAndamento ? 'text-white' : 'text-slate-400'}`}>Engenharia e Montagem</span>
          </div>
          {instalacaoOk ? <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">OK</span> : instalacaoAndamento ? <span className="text-orange-400 font-bold text-[10px] uppercase tracking-wider">Em Obras</span> : <span className="text-slate-500 font-bold text-[10px] uppercase">Pendente</span>}
        </div>

        {/* Etapa 3: Seguro */}
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${seguroOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-5 h-5 ${seguroOk ? 'text-emerald-400' : 'text-slate-600'}`} />
            <span className={`font-semibold text-sm ${seguroOk ? 'text-white' : 'text-slate-400'}`}>Seguro Total do Kit Solar</span>
          </div>
          {seguroOk ? <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">✔ Ativo</span> : <span className="text-slate-500 font-bold text-[10px] uppercase">Opcional</span>}
        </div>

        {/* Etapa 4: Vistoria EDP */}
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${vistoriaOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-slate-800/50'}`}>
          <div className="flex items-center gap-3">
            {vistoriaOk ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Clock className="w-5 h-5 text-slate-500" />}
            <span className={`font-semibold text-sm ${vistoriaOk ? 'text-white' : 'text-slate-500'}`}>Vistoria Técnica & Troca de Relógio</span>
          </div>
          {vistoriaOk ? (
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">OK</span>
          ) : (
            <div className="text-right">
              <span className="text-slate-500 font-bold text-[10px] uppercase block">Pendente</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}