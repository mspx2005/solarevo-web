'use client';

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft, SunMedium, Battery, Cpu, TrendingDown, DollarSign, Leaf, ShieldCheck, Zap, LineChart, Printer } from 'lucide-react';
import Link from 'next/link';

export default function PropostaDigital({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;

  const [projeto, setProjeto] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProjeto() {
      const { data, error } = await supabase.from('projetos').select('*').eq('id', projectId).single();
      if (!error && data) setProjeto(data);
      setIsLoading(false);
    }
    if (projectId) fetchProjeto();
  }, [projectId]);

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  if (!projeto) return <div className="text-center p-12 text-slate-400 bg-slate-950 h-screen">Projeto não encontrado.</div>;

  // --- 🧠 MOTOR DE CÁLCULOS FINANCEIROS (Simulação Automática) ---
  const tarifaMediaKwh = 0.95; // R$ 0,95 por kWh (Média Brasil)
  const fatorGeracao = 120; // 120 kWh/mês por kWp instalado
  
  const kwp = projeto.potencia_kwp || 0;
  const geracaoMensal = kwp * fatorGeracao;
  const economiaMensal = geracaoMensal * tarifaMediaKwh;
  const economiaAnual = economiaMensal * 12;
  
  // Estimativa de preço de venda (R$ 3.800 por kWp para simulação)
  const investimentoEstimado = kwp * 3800; 
  const paybackAnos = investimentoEstimado > 0 ? (investimentoEstimado / economiaAnual) : 0;
  
  // Impacto Ambiental
  const arvoresSalvas = Math.round(geracaoMensal * 12 * 0.007); // Aprox. 7 árvores por MWh/ano
  const co2Evitado = (geracaoMensal * 12 * 0.085).toFixed(1); // Toneladas de CO2

  // Formatador de Moeda (BRL)
  const formatarDinheiro = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      
      {/* 🚀 BARRA DE CONTROLO SUPERIOR (Apenas para o Integrador ver/imprimir) */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 flex justify-between items-center print:hidden">
        <Link href={`/painel/projetos/${projectId}`} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Voltar à Edição
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-orange-500/20">
          <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
        </button>
      </div>

      {/* 📄 O DOCUMENTO DA PROPOSTA */}
      <main className="max-w-4xl mx-auto p-6 md:p-12 space-y-12 print:p-0 print:bg-white print:text-slate-900">
        
        {/* CABEÇALHO */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 print:border-slate-300 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/20">
                <SunMedium className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight print:text-slate-900">EnerTrack Solar</h1>
            </div>
            <p className="text-slate-400 print:text-slate-600">Proposta Tecnológica de Geração Solar</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-slate-500 print:text-slate-500 uppercase tracking-widest font-semibold mb-1">Apresentado a</p>
            <h2 className="text-2xl font-bold text-white print:text-slate-900 uppercase">{projeto.cliente_nome}</h2>
            <p className="text-sm text-slate-400 mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </header>

        {/* MENSAGEM PRINCIPAL */}
        <section className="text-center space-y-4">
          <h3 className="text-3xl md:text-4xl font-black text-white print:text-slate-900 leading-tight">
            Liberte-se da fatura de energia. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 print:from-orange-600 print:to-orange-700">
              Gere a sua própria riqueza.
            </span>
          </h3>
          <p className="text-lg text-slate-400 print:text-slate-600 max-w-2xl mx-auto">
            Desenhamos um sistema fotovoltaico de alta performance sob medida para as suas necessidades de consumo, garantindo independência energética e retorno rápido do investimento.
          </p>
        </section>

        {/* RESUMO FINANCEIRO (CARDS) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingDown className="w-24 h-24 text-emerald-500" /></div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-slate-400 print:text-slate-500">Economia Estimada (Anual)</p>
            <p className="text-3xl font-black text-white print:text-slate-900 mt-1">{formatarDinheiro(economiaAnual)}</p>
            <p className="text-xs text-emerald-500 font-semibold mt-2 bg-emerald-500/10 w-fit px-2 py-1 rounded">Proteção contra inflação</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><LineChart className="w-24 h-24 text-orange-500" /></div>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
              <LineChart className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-sm font-medium text-slate-400 print:text-slate-500">Retorno do Investimento</p>
            <p className="text-3xl font-black text-white print:text-slate-900 mt-1">{paybackAnos.toFixed(1)} <span className="text-lg text-slate-500 font-medium">anos</span></p>
            <p className="text-xs text-orange-500 font-semibold mt-2 bg-orange-500/10 w-fit px-2 py-1 rounded">Payback Rápido</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="w-24 h-24 text-blue-500" /></div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-slate-400 print:text-slate-500">Geração Média Mensal</p>
            <p className="text-3xl font-black text-white print:text-slate-900 mt-1">{geracaoMensal.toFixed(0)} <span className="text-lg text-slate-500 font-medium">kWh</span></p>
            <p className="text-xs text-blue-500 font-semibold mt-2 bg-blue-500/10 w-fit px-2 py-1 rounded">Potência de {kwp} kWp</p>
          </div>
        </section>

        {/* TECNOLOGIA APLICADA (EQUIPAMENTOS) */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-bold text-white print:text-slate-900">Tecnologia Premium do seu Kit</h3>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 print:bg-white print:border-slate-300 rounded-2xl overflow-hidden divide-y divide-slate-800 print:divide-slate-200">
            {/* Módulo */}
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-slate-800 print:bg-slate-100 p-3 rounded-xl"><SunMedium className="w-6 h-6 text-orange-400" /></div>
                <div>
                  <p className="text-sm text-slate-400 print:text-slate-500 font-medium uppercase tracking-wider">Módulos Fotovoltaicos</p>
                  <p className="text-lg font-bold text-white print:text-slate-900">{projeto.modulo_modelo || 'Equipamento de Alta Eficiência'}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-slate-400 print:text-slate-500">Quantidade</p>
                <p className="text-xl font-bold text-white print:text-slate-900">{projeto.modulo_qtde || '-'} un</p>
              </div>
            </div>

            {/* Inversor */}
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-slate-800 print:bg-slate-100 p-3 rounded-xl"><Cpu className="w-6 h-6 text-orange-400" /></div>
                <div>
                  <p className="text-sm text-slate-400 print:text-slate-500 font-medium uppercase tracking-wider">Inversor Solar</p>
                  <p className="text-lg font-bold text-white print:text-slate-900">{projeto.inversor_modelo || 'Inversor Inteligente'}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-slate-400 print:text-slate-500">Quantidade</p>
                <p className="text-xl font-bold text-white print:text-slate-900">{projeto.inversor_qtde || '1'} un</p>
              </div>
            </div>

            {/* Bateria (Se existir) */}
            {projeto.bateria_modelo && (
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-emerald-950/20 print:bg-emerald-50">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-900/50 print:bg-emerald-200 p-3 rounded-xl"><Battery className="w-6 h-6 text-emerald-400 print:text-emerald-600" /></div>
                  <div>
                    <p className="text-sm text-emerald-500 print:text-emerald-600 font-medium uppercase tracking-wider">Armazenamento (BESS)</p>
                    <p className="text-lg font-bold text-white print:text-slate-900">{projeto.bateria_modelo}</p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-slate-400 print:text-slate-500">Capacidade</p>
                  <p className="text-xl font-bold text-white print:text-slate-900">{projeto.bateria_potencia_w} W</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* GARANTIAS E IMPACTO */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800 print:border-slate-300">
          <div className="flex gap-4">
            <ShieldCheck className="w-8 h-8 text-orange-500 shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-white print:text-slate-900">Garantia de Performance</h4>
              <p className="text-sm text-slate-400 print:text-slate-600 mt-1">Os painéis solares desta proposta possuem garantia de fabricação padrão de 12 a 15 anos e garantia de geração de energia de até 25 anos.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Leaf className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h4 className="text-lg font-bold text-white print:text-slate-900">Impacto Ambiental (25 anos)</h4>
              <p className="text-sm text-slate-400 print:text-slate-600 mt-1">Ao aprovar este projeto, você evitará a emissão de <strong>{co2Evitado} toneladas de CO2</strong> na atmosfera, o equivalente a plantar <strong>{arvoresSalvas} árvores</strong>.</p>
            </div>
          </div>
        </section>

        {/* RODAPÉ E ASSINATURA */}
        <footer className="pt-12 pb-8 text-center border-t border-slate-800 print:border-slate-300">
          <p className="text-lg font-bold text-white print:text-slate-900 mb-2">Pronto para gerar a sua própria energia?</p>
          <p className="text-sm text-slate-500 mb-8">Esta proposta é válida por 7 dias a partir da data de emissão.</p>
          <div className="w-64 h-px bg-slate-800 print:bg-slate-400 mx-auto mb-2"></div>
          <p className="text-sm font-medium text-slate-400 print:text-slate-600 uppercase tracking-widest">{projeto.cliente_nome}</p>
        </footer>

      </main>
    </div>
  );
}