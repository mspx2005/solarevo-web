'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Mail, Phone, Calendar, Loader2, Pencil, X, Save, FileText, LayoutGrid, List } from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // NOVO: Estado para controlar a visualização (Tabela ou Cards)
  const [modoVisualizacao, setModoVisualizacao] = useState<'lista' | 'cards'>('cards');

  // Estados do Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [leadEditando, setLeadEditando] = useState<any>(null);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '', email: '', whatsapp: '', cpf: ''
  });

  useEffect(() => {
    // Detecta se é celular (tela pequena) e já força o modo 'cards' ao carregar a página
    if (window.innerWidth < 768) {
      setModoVisualizacao('cards');
    } else {
      setModoVisualizacao('lista');
    }
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setIsLoading(true);
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!error && data) setLeads(data);
    setIsLoading(false);
  }

  const abrirModalEdicao = (lead: any) => {
    setLeadEditando(lead);
    setFormData({ nome: lead.nome || '', email: lead.email || '', whatsapp: lead.whatsapp || '', cpf: lead.cpf || '' });
    setIsEditModalOpen(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('leads').update(formData).eq('id', leadEditando.id);
      if (error) throw error;
      setLeads(leads.map(l => l.id === leadEditando.id ? { ...l, ...formData } : l));
      setIsEditModalOpen(false);
      alert('✅ Cliente atualizado com sucesso!');
    } catch (error: any) {
      alert('⚠️ Erro ao atualizar os dados do cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Leads</h1>
          <p className="text-slate-400">Gerencie seus contatos, enriqueça dados e acompanhe seus clientes.</p>
        </div>

        {/* MUDANÇA DE VISUALIZAÇÃO (TOGGLE) */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
          <button 
            onClick={() => setModoVisualizacao('cards')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${modoVisualizacao === 'cards' ? 'bg-slate-800 text-orange-500 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button 
            onClick={() => setModoVisualizacao('lista')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${modoVisualizacao === 'lista' ? 'bg-slate-800 text-orange-500 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      <div className={`${modoVisualizacao === 'lista' ? 'bg-slate-900 border border-slate-800 rounded-xl overflow-hidden' : ''}`}>
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
            <p>Carregando seus contatos...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum lead capturado ainda. Faça o upload de uma fatura para começar!</p>
          </div>
        ) : modoVisualizacao === 'cards' ? (
          
          /* VISUALIZAÇÃO EM CARDS (FORMATO MOBILE/GRID) */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <div key={lead.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-lg shrink-0">
                    {lead.nome ? lead.nome.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate" title={lead.nome}>{lead.nome}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">CPF: {lead.cpf || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="truncate">{lead.email || <span className="italic text-slate-600">E-mail pendente</span>}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="truncate">{lead.whatsapp || <span className="italic text-slate-600">WhatsApp pendente</span>}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <button 
                    onClick={() => abrirModalEdicao(lead)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-orange-500 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>

        ) : (
          
          /* VISUALIZAÇÃO EM LISTA (TABELA TRADICIONAL) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm">
                  <th className="p-4 font-medium">Nome do Cliente</th>
                  <th className="p-4 font-medium">E-mail</th>
                  <th className="p-4 font-medium">WhatsApp</th>
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4 text-white font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs shrink-0">
                        {lead.nome ? lead.nome.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{lead.nome}</span>
                        {lead.cpf && <span className="text-xs text-slate-500 font-normal">CPF: {lead.cpf}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="truncate">{lead.email || <span className="text-slate-600 text-sm italic">Pendente</span>}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                        {lead.whatsapp || <span className="text-slate-600 text-sm italic">Pendente</span>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => abrirModalEdicao(lead)}
                        className="p-2 bg-slate-800 hover:bg-orange-500 text-slate-400 hover:text-white rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium border border-slate-700 hover:border-orange-500"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-orange-500" /> Editar Dados do Cliente</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="form-edicao-cliente" onSubmit={handleSalvarEdicao} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo / Empresa *</label>
                  <input type="text" required value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">CPF / CNPJ</label>
                  <input type="text" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-orange-500" placeholder="Somente números" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">E-mail</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-orange-500" placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">WhatsApp</label>
                    <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white focus:ring-2 focus:ring-orange-500" placeholder="(DD) 90000-0000" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-950/50 shrink-0 flex gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-700">Cancelar</button>
              <button type="submit" form="form-edicao-cliente" disabled={isSaving} className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</> : <><Save className="w-5 h-5" /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}