// SERVER COMPONENT — NÃO inserir 'use client'
import { notFound } from 'next/navigation';
import { Zap, User } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PortalTabsWrapper } from '@/components/portal/PortalTabsWrapper';
import { AbaInstalacao, type ProjetoPublico } from '@/components/portal/AbaInstalacao';
import { AbaDesempenho } from '@/components/portal/AbaDesempenho';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ProjetoRaw = Omit<ProjetoPublico, 'progresso' | 'isUsinaAtiva'>;

function calcularProgresso(p: ProjetoRaw): { progresso: number; isUsinaAtiva: boolean } {
  let docEletrico = { status: 'Pendente' };
  try { if (p.doc_diagrama_unifilar) docEletrico = JSON.parse(p.doc_diagrama_unifilar); } catch {}

  const parecerOk = docEletrico.status === 'Homologado';
  const instalacaoOk = p.status_instalacao === 'Concluído';
  const instalacaoAndamento = p.status_instalacao === 'Em Andamento';
  const seguroOk = p.seguro_equipamento_status === 'Ativo';

  let docHomologacao = { status: 'Pendente' };
  try { if (p.etapa_homologacao_plataforma) docHomologacao = JSON.parse(p.etapa_homologacao_plataforma); } catch {}

  const vistoriaOk = docHomologacao.status === 'Homologado';

  let progresso = 10;
  if (parecerOk) progresso += 25;
  if (instalacaoAndamento) progresso += 20;
  if (instalacaoOk) progresso += 40;
  if (seguroOk) progresso += 5;
  if (vistoriaOk) progresso += 20;
  if (progresso > 100) progresso = 100;

  return { progresso, isUsinaAtiva: progresso >= 90 };
}

async function getProjetoPublico(token: string): Promise<ProjetoPublico | null> {
  if (!token || !UUID_V4.test(token)) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .rpc('get_acompanhamento_publico', { p_token: token })
      .single();

    if (error || !data) return null;

    const raw = data as unknown as ProjetoRaw;
    if (!raw.cliente_nome) return null;

    const { progresso, isUsinaAtiva } = calcularProgresso(raw);
    return { ...raw, progresso, isUsinaAtiva };
  } catch {
    return null;
  }
}

export default async function AcompanharProjetoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projeto = await getProjetoPublico(id);

  if (!projeto) notFound();

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-24 selection:bg-emerald-500/30">
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 shadow-lg flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-2 rounded-lg shadow-lg shadow-orange-500/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-black text-white tracking-tight text-xl uppercase">EnerTrack</span>
        </div>

        <div className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <User className="w-3 h-3" /> Cliente Premium
        </div>
      </div>

      {/* CONTAINER RESPONSIVO */}
      <div className="w-full max-w-md lg:max-w-4xl xl:max-w-5xl mx-auto p-4 space-y-6">
        <PortalTabsWrapper
          instalacao={<AbaInstalacao projeto={projeto} />}
          desempenho={<AbaDesempenho />}
        />
      </div>
    </div>
  );
}
