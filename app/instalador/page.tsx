'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, HardHat, MapPin, CalendarDays, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function InstaladorDashboard() {
  const [projetos, setProjetos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchObras() {
      // Puxar projetos que já têm o Cronograma iniciado (exclui os que são só lead/proposta)
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .not('data_inicio_instalacao', 'is', null)
        .order('data_inicio_instalacao', { ascending: true });

      if (!error && data) {
        setProjetos(data);
      }
      setIsLoading(false);
    }
    fetchObras();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  }

  // Separar obras em andamento/pendentes das concluídas
  const obrasAtivas = projetos.filter(p => p.status_instalacao !== 'Concluído');
  const obrasConcluidas = projetos.filter(p => p.status_instalacao === 'Concluído');

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      
      {/* CABEÇALHO MOBILE (Fixo no topo) */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-3 rounded-xl shadow-lg shadow-blue-500/20">
            <HardHat className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">App de Campo</h1>
            <p className="text-blue-400 font-medium text-sm mt-0.5">Equipa de Instalação</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto mt-4">
        
        {/* RESUMO RÁPIDO */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Clock className="w-6 h-6 text-orange-500 mb-2" />
            <p className="text-3xl font-black text-white">{obrasAtivas.length}</p>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Pendentes</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
            <p className="text-3xl font-black text-white">{obrasConcluidas.length}</p>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Concluídas</p>
          </div>
        </div>

        {/* LISTA DE OBRAS ATIVAS */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Obras Atribuídas</h2>
          
          <div className="space-y-4">
            {obrasAtivas.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                <p className="text-slate-400 font-medium">Nenhuma obra pendente.</p>
                <p className="text-sm text-slate-500 mt-1">Pode descansar!</p>
              </div>
            ) : (
              obrasAtivas.map((obra) => {
                // Lógica de endereço para geração remota
                const enderecoObra = obra.os_mesmo_endereco !== false 
                  ? `${obra.cliente_cidade || 'Cidade'}/${obra.cliente_estado || 'UF'}`
                  : `${obra.os_cidade || 'Cidade Remota'}/${obra.os_estado || 'UF'}`;

                return (
                  <Link href={`/instalador/os/${obra.id}`} key={obra.id} className="block bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500 transition-colors relative overflow-hidden group active:scale-95">
                    
                    {/* Tarja de Status */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${obra.status_instalacao === 'Em Andamento' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>

                    <div className="pl-2">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-bold text-blue-500 mb-1 uppercase tracking-wider">OS #{String(obra.id).substring(0,6)}</p>
                          <h3 className="text-lg font-bold text-white leading-tight">{obra.cliente_nome}</h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${obra.status_instalacao === 'Em Andamento' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-slate-800 text-slate-300'}`}>
                          {obra.status_instalacao || 'Pendente'}
                        </span>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <CalendarDays className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>Início: <strong className="text-white">{obra.data_inicio_instalacao ? new Date(obra.data_inicio_instalacao + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir'}</strong></span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-300">
                          <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{enderecoObra}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-blue-400 text-sm font-semibold">Abrir Ordem de Serviço</span>
                        <div className="bg-blue-500/10 p-2 rounded-full group-hover:bg-blue-500 transition-colors">
                          <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}