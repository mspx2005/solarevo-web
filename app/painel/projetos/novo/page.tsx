'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Battery, Zap } from 'lucide-react';
import { salvarProjetoDB } from './actions'; // <-- Importamos nossa Server Action

export default function NovoProjeto() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados do Formulário
  const [clienteNome, setClienteNome] = useState('');
  const [potencia, setPotencia] = useState('');
  const [tipoSistema, setTipoSistema] = useState('On-Grid');
  const [possuiBateria, setPossuiBateria] = useState(false);
const handleSalvarProjeto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Chama a função lá no servidor, passando os dados do formulário
      await salvarProjetoDB({
        clienteNome,
        potencia: parseFloat(potencia),
        tipoSistema,
        possuiBateria
      });

      alert("Projeto criado com sucesso!");
      router.push('/painel/projetos');
      
    } catch (error: any) {
      console.error("Erro ao salvar:", error.message);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Novo Projeto Fotovoltaico</h1>
          <p className="text-slate-400">Preencha os dados iniciais para dimensionar a usina.</p>
        </div>
      </div>

      <form onSubmit={handleSalvarProjeto} className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 shadow-xl">
        
        {/* Dados do Cliente */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Cliente / Empresa</label>
          <input
            type="text"
            required
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            placeholder="Ex: Supermercado Central"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Potência */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Potência Estimada (kWp)</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                value={potencia}
                onChange={(e) => setPotencia(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Ex: 5.4"
              />
              <Zap className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Tipo de Sistema */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Arquitetura do Sistema</label>
            <select
              value={tipoSistema}
              onChange={(e) => setTipoSistema(e.target.value)}
              className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none"
            >
              <option value="On-Grid">Tradicional (On-Grid)</option>
              <option value="Híbrido">Híbrido (On/Off)</option>
              <option value="Off-Grid">Isolado (Off-Grid)</option>
            </select>
          </div>
        </div>

        {/* BESS / Baterias */}
        <div className="pt-4 border-t border-slate-800">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={possuiBateria}
                onChange={(e) => setPossuiBateria(e.target.checked)}
                className="w-6 h-6 rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2 text-white font-medium">
              <Battery className={`w-5 h-5 ${possuiBateria ? 'text-orange-500' : 'text-slate-500'}`} />
              Incluir Sistema de Armazenamento (BESS)
            </div>
          </label>
        </div>

        {/* Botão Salvar */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Salvando...' : 'Criar Projeto'}
            {!isLoading && <Save className="w-5 h-5" />}
          </button>
        </div>

      </form>
    </div>
  );
}