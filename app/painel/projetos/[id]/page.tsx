'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Zap, FileText, X, Calculator, SunMedium, Cpu, Upload, Eye, FileBox, User, DollarSign, MapPin, HardHat, FileBadge, CalendarDays, Truck, ShieldCheck, ClipboardList, CheckCircle2, ListTodo, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { gerarDocumentoWord } from '@/lib/geradorWord';
import { UploadFaturaButton } from './_components/UploadFaturaButton';
import { UploadPropostaButton } from './_components/UploadPropostaButton';

export default function DetalhesProjeto({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const supabase = createClient();
  const projectId = unwrappedParams.id;

  const [projeto, setProjeto] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'comercial' | 'engenharia'>('comercial');

  const wordInputRef = useRef<HTMLInputElement>(null);
  const docUploadRef = useRef<HTMLInputElement>(null);

  const [isConsumoModalOpen, setIsConsumoModalOpen] = useState(false);
  const [consumoInput, setConsumoInput] = useState('');
  const [isPotenciaModalOpen, setIsPotenciaModalOpen] = useState(false);
  const [potenciaInput, setPotenciaInput] = useState('');
  const [moduloW, setModuloW] = useState(600);
  const [inversorCustom, setInversorCustom] = useState<string>('');

  const [isDadosModalOpen, setIsDadosModalOpen] = useState(false);
  const [dadosCliente, setDadosCliente] = useState({ cnpj_cpf: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' });
  const [isFinanceiroModalOpen, setIsFinanceiroModalOpen] = useState(false);
  const [dadosFinanceiros, setDadosFinanceiros] = useState({ preco_venda: '', tarifa_energia: '0.95' });

  const [documentos, setDocumentos] = useState<Record<string, { status: string, url: string | null }>>({});
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  
  const [dadosEngenharia, setDadosEngenharia] = useState({
    tipo_telhado: '', data_entrega_kit: '', data_inicio_instalacao: '', data_fim_instalacao: '', data_vistoria: '',
    status_instalacao: 'Pendente', seguro_obra_status: 'Pendente', seguro_equipamento_status: 'Pendente',
    os_mesmo_endereco: true, os_cep: '', os_endereco: '', os_numero: '', os_bairro: '', os_cidade: '', os_estado: ''
  });

  const etapasPadrao = [
    { id: '1', label: 'Montagem das Estruturas no Telhado', data_prevista: '', concluida: false, data_conclusao: null },
    { id: '2', label: 'Fixação dos Módulos Solares', data_prevista: '', concluida: false, data_conclusao: null },
    { id: '3', label: 'Instalação do Inversor e Quadros (CA/CC)', data_prevista: '', concluida: false, data_conclusao: null },
    { id: '4', label: 'Configuração Wi-Fi e Testes de Geração', data_prevista: '', concluida: false, data_conclusao: null }
  ];
  const [etapasDinamicas, setEtapasDinamicas] = useState<any[]>(etapasPadrao);

  const docsList = [
    { key: 'doc_art', label: 'ART (Anotação de Responsabilidade Técnica)' },
    { key: 'doc_diagrama_unifilar', label: 'Diagrama Unifilar' },
    { key: 'doc_memorial', label: 'Memorial Descritivo' },
    { key: 'doc_relatorio_ensaio', label: 'Relatório de Ensaio (Inversores)' },
    { key: 'doc_planilha_compartilhamento', label: 'Planilha de Compartilhamento' },
    { key: 'etapa_homologacao_plataforma', label: 'Cadastro e Homologação na EDP' }
  ];

  useEffect(() => {
    async function fetchProjeto() {
      const { data, error } = await supabase.from('projetos').select('*').eq('id', projectId).single();
      if (!error && data) {
        setProjeto(data);
        if (data.consumo_mensal_kwh) setConsumoInput(data.consumo_mensal_kwh.toString());
        if (data.potencia_kwp) setPotenciaInput(data.potencia_kwp.toString());
        setInversorCustom(data.potencia_kwp ? (data.potencia_kwp / 1.50).toFixed(1) : '');
        setDadosCliente({
          cnpj_cpf: data.cliente_cnpj_cpf || '', endereco: data.cliente_endereco || '', numero: data.cliente_numero || '',
          bairro: data.cliente_bairro || '', cidade: data.cliente_cidade || '', estado: data.cliente_estado || '', cep: data.cliente_cep || ''
        });
        setDadosFinanceiros({ preco_venda: data.preco_venda?.toString() || '', tarifa_energia: data.tarifa_energia?.toString() || '0.95' });
        setDadosEngenharia({
          tipo_telhado: data.tipo_telhado || '', data_entrega_kit: data.data_entrega_kit || '', data_inicio_instalacao: data.data_inicio_instalacao || '',
          data_fim_instalacao: data.data_fim_instalacao || '', data_vistoria: data.data_vistoria || '',
          status_instalacao: data.status_instalacao || 'Pendente', seguro_obra_status: data.seguro_obra_status || 'Pendente',
          seguro_equipamento_status: data.seguro_equipamento_status || 'Pendente', os_mesmo_endereco: data.os_mesmo_endereco !== false,
          os_cep: data.os_cep || '', os_endereco: data.os_endereco || '', os_numero: data.os_numero || '',
          os_bairro: data.os_bairro || '', os_cidade: data.os_cidade || '', os_estado: data.os_estado || ''
        });
        if (data.etapas_instalacao) {
          try {
            const parsedEtapas = JSON.parse(data.etapas_instalacao);
            if (Array.isArray(parsedEtapas)) setEtapasDinamicas(parsedEtapas);
          } catch (e) { console.error("Erro ao ler etapas"); }
        }
        const parsedDocs: Record<string, { status: string, url: string | null }> = {};
        docsList.forEach(doc => {
          try { parsedDocs[doc.key] = data[doc.key] ? JSON.parse(data[doc.key]) : { status: 'Pendente', url: null }; } 
          catch { parsedDocs[doc.key] = { status: 'Pendente', url: null }; }
        });
        setDocumentos(parsedDocs);
      }
      setIsLoading(false);
    }
    if (projectId) fetchProjeto();
  }, [projectId]);

  const handleSalvarConsumo = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    await supabase.from('projetos').update({ consumo_mensal_kwh: parseFloat(consumoInput) }).eq('id', projectId); 
    setProjeto((prev: any) => ({ ...prev, consumo_mensal_kwh: parseFloat(consumoInput) }));
    setIsConsumoModalOpen(false); setIsSaving(false);
  };
  const handleSalvarPotencia = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    await supabase.from('projetos').update({ potencia_kwp: parseFloat(potenciaInput) }).eq('id', projectId); 
    setProjeto((prev: any) => ({ ...prev, potencia_kwp: parseFloat(potenciaInput) }));
    setIsPotenciaModalOpen(false); setIsSaving(false);
  };
  const handleSalvarDadosCliente = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    await supabase.from('projetos').update({
  cliente_cnpj_cpf: dadosCliente.cnpj_cpf,
  cliente_endereco: dadosCliente.endereco,
  cliente_numero: dadosCliente.numero,
  cliente_bairro: dadosCliente.bairro,
  cliente_cidade: dadosCliente.cidade,
  cliente_estado: dadosCliente.estado,
  cliente_cep: dadosCliente.cep
}).eq('id', projectId);
    setProjeto((prev: any) => ({...prev, ...dadosCliente}));
    setIsDadosModalOpen(false); setIsSaving(false);
  };
  const handleSalvarFinanceiro = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    const updates = { preco_venda: parseFloat(dadosFinanceiros.preco_venda) || null, tarifa_energia: parseFloat(dadosFinanceiros.tarifa_energia) || null };
    await supabase.from('projetos').update(updates).eq('id', projectId);
    setProjeto((prev: any) => ({...prev, ...updates}));
    setIsFinanceiroModalOpen(false); setIsSaving(false);
  };
  const handleGerarWordCustomizado = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    gerarDocumentoWord(file, projeto, { nome: 'Integrador Solarevo' });
    if (wordInputRef.current) wordInputRef.current.value = ''; 
  };

  const handleAdicionarEtapa = () => { setEtapasDinamicas([...etapasDinamicas, { id: Date.now().toString(), label: '', data_prevista: '', concluida: false, data_conclusao: null }]); };
  const handleRemoverEtapa = (id: string) => { setEtapasDinamicas(etapasDinamicas.filter(etapa => etapa.id !== id)); };
  const handleAtualizarEtapa = (id: string, campo: string, valor: any) => { setEtapasDinamicas(etapasDinamicas.map(etapa => etapa.id === id ? { ...etapa, [campo]: valor } : etapa)); };

  const handleSalvarDadosEngenharia = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);

    // 🧠 MAGIA: Auto-Organizar por ordem de data antes de guardar!
    const etapasOrdenadas = [...etapasDinamicas].sort((a, b) => {
      if (!a.data_prevista) return 1; // Tarefas sem data vão para o fim
      if (!b.data_prevista) return -1;
      return new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime();
    });

    setEtapasDinamicas(etapasOrdenadas); // Atualiza a tela

    const updates = { ...dadosEngenharia, etapas_instalacao: JSON.stringify(etapasOrdenadas) };
    
    const { error } = await supabase.from('projetos').update(updates).eq('id', projectId);
    setIsSaving(false);

    if (error) {
      alert("❌ ERRO: A coluna 'etapas_instalacao' não existe no Supabase.");
      console.error(error);
    } else {
      setProjeto((prev: any) => ({...prev, ...updates}));
      alert("✅ Cronograma, Tarefas e OS atualizados e ordenados com sucesso!");
    }
  };

  const handleMudancaEngenharia = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setDadosEngenharia({ ...dadosEngenharia, [e.target.name]: e.target.value }); };
  const handleMudancaCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => { setDadosEngenharia({ ...dadosEngenharia, os_mesmo_endereco: e.target.checked }); };
  const handleAtualizarStatusDoc = async (docKey: string, novoStatus: string) => {
    const atual = documentos[docKey] || { url: null };
    const novoValor = { status: novoStatus, url: atual.url };
    setDocumentos(prev => ({ ...prev, [docKey]: novoValor }));
    await supabase.from('projetos').update({ [docKey]: JSON.stringify(novoValor) }).eq('id', projectId);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  if (!projeto) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-xl max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Projeto Não Encontrado ou Link Inválido</h2>
          <p className="text-sm text-slate-400 mb-6">Você tentou acessar um projeto que não existe. Se você clicou no menu de Ações Rápidas, lembre-se que o Upload deve ser feito por dentro de um projeto existente.</p>
          <a href="/painel/projetos" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-slate-700">
             Voltar para Projetos
          </a>
        </div>
      </div>
    );
  }

  const potenciaKwp = projeto?.potencia_kwp || 0;
  const qtdPaineis = potenciaKwp ? Math.ceil((potenciaKwp * 1000) / moduloW) : 0;
  const inversorFinalVal = parseFloat(inversorCustom) || (potenciaKwp / 1.50);

  return (
 <div className="space-y-4 md:space-y-6 relative pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-start gap-3 md:gap-4">
          <a href="/painel/projetos" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 mt-0.5">
            <ArrowLeft className="w-6 h-6" />
          </a>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white uppercase">{projeto?.cliente_nome}</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Cadastrado em {projeto?.created_at ? new Date(projeto.created_at).toLocaleDateString('pt-BR') : ''}
            </p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex gap-2">
  <UploadFaturaButton
    projetoId={projectId}
    temFatura={Boolean(projeto?.fatura_url)}
  />

  <UploadPropostaButton
    projetoId={projectId}
    temProposta={false}
  />
</div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 overflow-x-auto">
        <button onClick={() => setActiveTab('comercial')} className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap ${activeTab === 'comercial' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-300'}`}><DollarSign className="w-4 h-4" /> Comercial & Proposta</button>
        <button onClick={() => setActiveTab('engenharia')} className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors whitespace-nowrap ${activeTab === 'engenharia' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-300'}`}><HardHat className="w-4 h-4" /> Engenharia & Operações</button>
      </div>

      {activeTab === 'comercial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3"><Calculator className="w-5 h-5 text-orange-500" /><h2 className="text-lg font-semibold text-white">Dimensionamento Automático</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60"><div className="flex items-center gap-2 text-slate-400 mb-1"><SunMedium className="w-4 h-4 text-orange-400" /><span className="text-xs">Placas ({moduloW}W)</span></div><p className="text-xl font-bold text-white">{qtdPaineis} <span className="text-xs text-slate-400">un</span></p></div>
                <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60"><div className="flex items-center gap-2 text-slate-400 mb-1"><Cpu className="w-4 h-4 text-orange-400" /><span className="text-xs">Inversor</span></div><p className="text-xl font-bold text-white">{inversorFinalVal.toFixed(1)} <span className="text-xs text-slate-400">kW</span></p></div>
                <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/60"><div className="flex items-center gap-2 text-slate-400 mb-1"><Zap className="w-4 h-4 text-orange-400" /><span className="text-xs">Potência</span></div><p className="text-xl font-bold text-white">{potenciaKwp} <span className="text-xs text-slate-400">kWp</span></p></div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3"><FileText className="w-5 h-5 text-orange-500" /><h2 className="text-lg font-semibold text-white">Gerador de Propostas</h2></div>
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="file" ref={wordInputRef} onChange={handleGerarWordCustomizado} accept=".docx" className="hidden" />
                <button onClick={() => wordInputRef.current?.click()} className="flex-1 bg-slate-800 hover:bg-slate-700 text-blue-400 font-medium py-4 rounded-lg flex flex-col items-center justify-center gap-2 border border-slate-700 transition-colors"><FileBox className="w-6 h-6" /><span>Gerar Word Customizado</span></button>
                <Link href={`/painel/projetos/${projectId}/proposta`} className="flex-1 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-lg flex flex-col items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"><FileText className="w-6 h-6" /><span>Ver Proposta Web</span></Link>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3">Dados do Cliente</h3>
              <div className="space-y-3 mb-5">
                <div><p className="text-xs font-medium text-slate-500">CPF / CNPJ</p><p className="text-sm font-medium text-white">{projeto.cliente_cnpj_cpf || '-'}</p></div>
                <div><p className="text-xs font-medium text-slate-500">Localização</p><p className="text-sm font-medium text-white line-clamp-2">{projeto.cliente_cidade ? `${projeto.cliente_cidade}/${projeto.cliente_estado}` : '-'}</p></div>
              </div>
              <button onClick={() => setIsDadosModalOpen(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-3 rounded-lg border border-slate-700">Editar Registo</button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3">Financeiro</h3>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800"><span className="text-xs font-medium text-slate-400">Preço de Venda</span><span className="text-sm font-bold text-emerald-400">R$ {projeto.preco_venda ? parseFloat(projeto.preco_venda).toLocaleString('pt-BR') : '0,00'}</span></div>
              </div>
              <button onClick={() => setIsFinanceiroModalOpen(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-3 rounded-lg border border-slate-700">Ajustar Valores</button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-3">Parâmetros Base</h3>
              <button onClick={() => setIsConsumoModalOpen(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors mb-3">Consumo: {projeto.consumo_mensal_kwh || 0} kWh</button>
              <button onClick={() => setIsPotenciaModalOpen(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors">Potência: {projeto.potencia_kwp || 0} kWp</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'engenharia' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={handleSalvarDadosEngenharia} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4"><CalendarDays className="w-6 h-6 text-orange-500" /><h2 className="text-xl font-bold text-white">Cronograma & Logística</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-slate-400 mb-2">Tipo de Telhado</label><select name="tipo_telhado" value={dadosEngenharia.tipo_telhado} onChange={handleMudancaEngenharia} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white outline-none"><option value="">Selecione...</option><option value="Cerâmica">Cerâmica / Colonial</option><option value="Metálico">Metálico / Zinco</option><option value="Fibrocimento">Fibrocimento</option><option value="Laje">Laje Plana</option><option value="Solo">Estrutura de Solo</option></select></div>
                  <div><label className="block text-sm font-medium text-slate-400 mb-2"><Truck className="w-4 h-4 inline mr-1"/> Previsão Chegada do Kit</label><input type="date" name="data_entrega_kit" value={dadosEngenharia.data_entrega_kit} onChange={handleMudancaEngenharia} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-400 mb-2">Início da Instalação</label><input type="date" name="data_inicio_instalacao" value={dadosEngenharia.data_inicio_instalacao} onChange={handleMudancaEngenharia} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-400 mb-2">Fim da Instalação</label><input type="date" name="data_fim_instalacao" min={dadosEngenharia.data_inicio_instalacao} value={dadosEngenharia.data_fim_instalacao} onChange={handleMudancaEngenharia} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white outline-none" /></div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2"><ListTodo className="w-6 h-6 text-blue-500" /><h2 className="text-xl font-bold text-white">Planeamento de Tarefas (OS)</h2></div>
                  <button type="button" onClick={handleAdicionarEtapa} className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"><Plus className="w-4 h-4" /> Adicionar Etapa</button>
                </div>
                
                <div className="space-y-3">
                  {etapasDinamicas.map((etapa, index) => (
                    <div key={etapa.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 font-bold text-xs w-6">{index + 1}.</span>
                      <input type="text" placeholder="Nome da Tarefa" value={etapa.label} onChange={(e) => handleAtualizarEtapa(etapa.id, 'label', e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 w-full md:w-auto" />
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* 🛡️ TRAVA DO CALENDÁRIO: min impede datas anteriores ao Início da Instalação */}
                        <input 
                          type="date" 
                          min={dadosEngenharia.data_inicio_instalacao || undefined} 
                          title="Data Prevista" 
                          value={etapa.data_prevista} 
                          onChange={(e) => handleAtualizarEtapa(etapa.id, 'data_prevista', e.target.value)} 
                          className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 w-full md:w-auto" 
                        />
                        <button type="button" onClick={() => handleRemoverEtapa(etapa.id)} className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-400/20"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 bg-slate-800/20"><h2 className="text-xl font-bold text-white flex items-center gap-2"><FileBadge className="w-6 h-6 text-orange-500" /> Documentação ANEEL / EDP</h2></div>
                <div className="divide-y divide-slate-800/50">
                  {docsList.map((doc, idx) => {
                    const info = documentos[doc.key] || { status: 'Pendente', url: null };
                    return (
                      <div key={doc.key} className="p-4 md:p-6 hover:bg-slate-800/30 flex justify-between gap-4">
                        <div className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold shrink-0">{idx + 1}</span><h3 className="font-semibold text-white">{doc.label}</h3></div>
                        <select value={info.status} onChange={(e) => handleAtualizarStatusDoc(doc.key, e.target.value)} className="text-sm font-medium px-3 py-2 rounded-lg bg-slate-800 text-slate-400 border-slate-700"><option value="Pendente">Pendente</option><option value="Em Análise">Em Análise</option><option value="Homologado">Homologado</option></select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-950/30 border border-blue-900/50 rounded-2xl p-6 shadow-xl relative">
                <div className="flex items-center gap-2 mb-4 border-b border-blue-900/50 pb-4"><ClipboardList className="w-5 h-5 text-blue-400" /><h2 className="text-lg font-bold text-white">Preview Ordem de Serviço</h2></div>
                <div className="mb-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5"><input type="checkbox" checked={dadosEngenharia.os_mesmo_endereco} onChange={handleMudancaCheckbox} className="peer sr-only" /><div className="w-5 h-5 border-2 border-slate-600 rounded bg-slate-800 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all"></div><CheckCircle2 className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity" /></div>
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">A instalação será no mesmo endereço de cadastro do cliente?</span>
                  </label>
                </div>
                {!dadosEngenharia.os_mesmo_endereco && (
                  <div className="space-y-3 mb-5 p-4 bg-slate-900/80 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-2">Morada da Usina (Geração Remota)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" name="os_cep" placeholder="CEP" value={dadosEngenharia.os_cep} onChange={handleMudancaEngenharia} className="col-span-2 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white" />
                      <input type="text" name="os_endereco" placeholder="Rua/Av" value={dadosEngenharia.os_endereco} onChange={handleMudancaEngenharia} className="col-span-2 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white" />
                      <input type="text" name="os_numero" placeholder="Número" value={dadosEngenharia.os_numero} onChange={handleMudancaEngenharia} className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white" />
                      <input type="text" name="os_bairro" placeholder="Bairro" value={dadosEngenharia.os_bairro} onChange={handleMudancaEngenharia} className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white" />
                      <input type="text" name="os_cidade" placeholder="Cidade" value={dadosEngenharia.os_cidade} onChange={handleMudancaEngenharia} className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white" />
                      <input type="text" name="os_estado" placeholder="UF" maxLength={2} value={dadosEngenharia.os_estado} onChange={handleMudancaEngenharia} className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white uppercase" />
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Salvar Cronograma & OS</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {isDadosModalOpen && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Dados Cadastrais</h3><button onClick={() => setIsDadosModalOpen(false)} className="text-slate-400"><X className="w-6 h-6" /></button></div><form onSubmit={handleSalvarDadosCliente} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><input type="text" placeholder="CPF/CNPJ" value={dadosCliente.cnpj_cpf} onChange={(e) => setDadosCliente({...dadosCliente, cnpj_cpf: e.target.value})} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white" /></div><div><input type="text" placeholder="Endereço" value={dadosCliente.endereco} onChange={(e) => setDadosCliente({...dadosCliente, endereco: e.target.value})} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white" /></div><div><input type="text" placeholder="Número" value={dadosCliente.numero} onChange={(e) => setDadosCliente({...dadosCliente, numero: e.target.value})} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white" /></div><div><input type="text" placeholder="Bairro" value={dadosCliente.bairro} onChange={(e) => setDadosCliente({...dadosCliente, bairro: e.target.value})} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white" /></div><div><input type="text" placeholder="Cidade" value={dadosCliente.cidade} onChange={(e) => setDadosCliente({...dadosCliente, cidade: e.target.value})} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white" /></div></div><div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-lg">Guardar</button></div></form></div></div>)}
      {isFinanceiroModalOpen && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Financeiro</h3><button onClick={() => setIsFinanceiroModalOpen(false)} className="text-slate-400"><X className="w-6 h-6" /></button></div><form onSubmit={handleSalvarFinanceiro} className="space-y-4"><div><label className="text-slate-400 text-sm">Preço Venda (R$)</label><input type="number" step="0.01" value={dadosFinanceiros.preco_venda} onChange={(e) => setDadosFinanceiros({...dadosFinanceiros, preco_venda: e.target.value})} className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white mt-1" /></div><div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg">Guardar</button></div></form></div></div>)}
      {isConsumoModalOpen && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Consumo (kWh)</h3><button onClick={() => setIsConsumoModalOpen(false)} className="text-slate-400"><X className="w-6 h-6" /></button></div><form onSubmit={handleSalvarConsumo} className="flex gap-3"><input type="number" required value={consumoInput} onChange={(e) => setConsumoInput(e.target.value)} className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white" /><button type="submit" className="bg-orange-500 text-white px-6 rounded-lg font-medium">Salvar</button></form></div></div>)}
      {isPotenciaModalOpen && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Potência (kWp)</h3><button onClick={() => setIsPotenciaModalOpen(false)} className="text-slate-400"><X className="w-6 h-6" /></button></div><form onSubmit={handleSalvarPotencia} className="flex gap-3"><input type="number" step="0.01" required value={potenciaInput} onChange={(e) => setPotenciaInput(e.target.value)} className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white" /><button type="submit" className="bg-orange-500 text-white px-6 rounded-lg font-medium">Salvar</button></form></div></div>)}
    </div>
  );
}