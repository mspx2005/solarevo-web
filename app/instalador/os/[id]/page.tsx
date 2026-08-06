'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, MapPin, Package, Play, CheckCircle2, Camera, Clock, AlertTriangle, FileCheck, ListChecks, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ExecucaoOS({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;

  const [projeto, setProjeto] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // 📝 O Novo Diário de Obra Dinâmico
  const [etapas, setEtapas] = useState<any[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchOS() {
      const { data, error } = await supabase.from('projetos').select('*').eq('id', projectId).single();
      if (!error && data) {
        setProjeto(data);
        if (data.etapas_instalacao) {
          try {
            const parsed = JSON.parse(data.etapas_instalacao);
            if (Array.isArray(parsed)) setEtapas(parsed);
          } catch (e) {
            console.error("Erro ao ler etapas");
          }
        }
      }
      setIsLoading(false);
    }
    fetchOS();
  }, [projectId]);

  const handleMudarStatus = async (novoStatus: string) => {
    setIsUpdating(true);
    await supabase.from('projetos').update({ status_instalacao: novoStatus }).eq('id', projectId);
    setProjeto((prev: any) => ({ ...prev, status_instalacao: novoStatus }));
    setIsUpdating(false);
  };

  // 🧠 O MOTOR DE BUSINESS INTELLIGENCE (Grava Data e Hora Real)
  const handleToggleEtapa = async (id: string) => {
    const novasEtapas = etapas.map(etapa => {
      if (etapa.id === id) {
        const isNowDone = !etapa.concluida;
        return {
          ...etapa,
          concluida: isNowDone,
          // Se marcou como concluído, grava o momento exato (Timestamp). Se desmarcou, apaga.
          data_conclusao: isNowDone ? new Date().toISOString() : null 
        };
      }
      return etapa;
    });

    setEtapas(novasEtapas); // Atualiza na tela instantaneamente
    await supabase.from('projetos').update({ etapas_instalacao: JSON.stringify(novasEtapas) }).eq('id', projectId);
  };

  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const fileName = `foto_${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `instalacao/${projectId}/${fileName}`;
      await supabase.storage.from('arquivos-projetos').upload(filePath, file);
      alert("📸 Foto do dia enviada com sucesso para a central!");
    } catch (error) {
      alert("Erro ao enviar foto. Tente novamente.");
    } finally {
      setIsUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Formatação de data bonita (Ex: 16/06 às 14:30)
  const formatarDataHora = (isoString: string) => {
    const data = new Date(isoString);
    return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatarDataSimples = (dataString: string) => {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}`;
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  if (!projeto) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">OS não encontrada.</div>;

  const enderecoObra = projeto.os_mesmo_endereco !== false 
    ? `${projeto.cliente_endereco || 'Endereço não preenchido'}, ${projeto.cliente_numero || ''} - ${projeto.cliente_bairro || ''}, ${projeto.cliente_cidade || ''}/${projeto.cliente_estado || ''}`
    : `${projeto.os_endereco || 'Rua'}, ${projeto.os_numero || 'S/N'} - ${projeto.os_bairro || 'Bairro'}, ${projeto.os_cidade || 'Cidade'}/${projeto.os_estado || 'UF'}`;

  const potenciaKwp = projeto.potencia_kwp || 0;
  const moduloW = projeto.modulo_potencia_w || 600;
  const qtdPaineis = potenciaKwp ? Math.ceil((potenciaKwp * 1000) / moduloW) : 0;
  const statusAtual = projeto.status_instalacao || 'Pendente';

  const todasEtapasConcluidas = etapas.length > 0 && etapas.every(e => e.concluida === true);

  return (
    <div className="min-h-screen bg-slate-950 pb-28">
      
      {/* CABEÇALHO */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/instalador" className="p-2 bg-slate-800 rounded-lg text-white active:scale-95 transition-transform"><ArrowLeft className="w-6 h-6" /></Link>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight truncate w-64">OS: {projeto.cliente_nome?.split(' ')[0]}</h1>
            <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mt-0.5">#{String(projeto.id).substring(0,8)}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        
        {/* STATUS */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          statusAtual === 'Concluído' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
          statusAtual === 'Em Andamento' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' :
          'bg-slate-800/50 border-slate-700 text-slate-300'
        }`}>
          {statusAtual === 'Concluído' ? <CheckCircle2 className="w-8 h-8" /> : statusAtual === 'Em Andamento' ? <Clock className="w-8 h-8 animate-pulse" /> : <AlertTriangle className="w-8 h-8" />}
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-80 font-bold mb-0.5">Status da Obra</p>
            <p className="text-xl font-black">{statusAtual}</p>
          </div>
        </div>

        {/* DIÁRIO DE OBRA DINÂMICO */}
        {statusAtual !== 'Pendente' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2"><ListChecks className="w-5 h-5 text-blue-500" /><h2 className="font-bold text-white">Diário de Obra</h2></div>
              <span className="text-xs font-bold text-slate-500">{etapas.filter(e=>e.concluida).length}/{etapas.length}</span>
            </div>
            
            <div className="space-y-3">
              {etapas.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhuma etapa definida pela engenharia.</p>
              ) : (
                etapas.map((etapa) => {
                  const isChecked = etapa.concluida;
                  return (
                    <button 
                      key={etapa.id}
                      onClick={() => handleToggleEtapa(etapa.id)}
                      disabled={statusAtual === 'Concluído'}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isChecked 
                          ? 'bg-blue-500/5 border-blue-500/20 text-slate-300' 
                          : 'bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800'
                      } ${statusAtual === 'Concluído' ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                      <div className={`w-6 h-6 mt-0.5 rounded-full flex items-center justify-center border-2 shrink-0 ${isChecked ? 'bg-blue-500 border-blue-500' : 'border-slate-500'}`}>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-medium block leading-tight ${isChecked ? 'line-through opacity-60' : ''}`}>{etapa.label}</span>
                        
                        {/* Exibição Inteligente de Datas */}
                        <div className="flex items-center gap-3 mt-1.5">
                          {etapa.data_prevista && !isChecked && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider">
                              <Calendar className="w-3 h-3" /> Previsto: {formatarDataSimples(etapa.data_prevista)}
                            </span>
                          )}
                          {isChecked && etapa.data_conclusao && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-wider border border-blue-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Feito: {formatarDataHora(etapa.data_conclusao)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* LOGÍSTICA E KIT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-2"><MapPin className="w-5 h-5 text-orange-500" /><h2 className="font-bold text-white">Local da Instalação</h2></div>
            <p className="text-slate-300 text-sm pl-7 leading-relaxed">{enderecoObra}</p>
            <p className="text-xs text-slate-500 pl-7 mt-2"><strong className="text-slate-400">Telhado:</strong> {projeto.tipo_telhado || 'Não informado'}</p>
          </div>
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3"><Package className="w-5 h-5 text-orange-500" /><h2 className="font-bold text-white">Kit a Instalar</h2></div>
            <div className="pl-7 space-y-3">
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Módulos</p>
                <p className="text-white font-medium">{qtdPaineis}x {projeto.modulo_modelo || 'Padrão'}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Inversor(es)</p>
                <p className="text-white font-medium">{projeto.inversor_modelo || 'Não especificado'}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BARRA DE AÇÕES (RODAPÉ) */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 p-4 pb-6 px-4 z-20">
        <div className="max-w-lg mx-auto flex gap-3">
          
          <input type="file" ref={photoInputRef} onChange={handleUploadFoto} accept="image/*" capture="environment" className="hidden" />
          
          <button onClick={() => photoInputRef.current?.click()} disabled={isUploading || statusAtual === 'Concluído'} className={`flex flex-col items-center justify-center w-16 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors ${statusAtual === 'Concluído' ? 'opacity-50' : 'active:bg-slate-700'}`}>
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : <><Camera className="w-6 h-6 mb-1" /><span className="text-[9px] font-bold uppercase">Foto</span></>}
          </button>

          {statusAtual === 'Pendente' && (
            <button onClick={() => handleMudarStatus('Em Andamento')} disabled={isUpdating} className="flex-1 bg-blue-600 active:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
              {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Play className="w-6 h-6 fill-current" /> Iniciar Instalação</>}
            </button>
          )}

          {statusAtual === 'Em Andamento' && (
            <button onClick={() => handleMudarStatus('Concluído')} disabled={isUpdating || !todasEtapasConcluidas} className={`flex-1 font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${todasEtapasConcluidas ? 'bg-emerald-600 active:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}>
              {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : <><FileCheck className="w-6 h-6" /> Concluir Obra</>}
            </button>
          )}

          {statusAtual === 'Concluído' && (
            <button disabled className="flex-1 bg-slate-800 text-emerald-500 font-bold text-lg py-4 rounded-xl border border-slate-800 flex items-center justify-center gap-2 opacity-80 cursor-not-allowed">
              <CheckCircle2 className="w-6 h-6" /> Obra 100% Finalizada
            </button>
          )}

        </div>
      </div>
    </div>
  );
}