'use client';

import React, { useState } from 'react';
import { Settings, FileText, Upload, Copy, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Lista de Tags disponíveis para o Integrador usar no Word dele
  const dicionarioTags = [
    { tag: '{{CLIENTE_NOME}}', desc: 'Nome completo do cliente ou empresa' },
    { tag: '{{POTENCIA_KWP}}', desc: 'Potência total do gerador em kWp' },
    { tag: '{{CONSUMO_MENSAL}}', desc: 'Consumo médio mensal lido da fatura (kWh)' },
    { tag: '{{GERACAO_ESTIMADA}}', desc: 'Geração média mensal calculada (kWh)' },
    { tag: '{{MODULO_MARCA}}', desc: 'Marca e modelo dos módulos (placas)' },
    { tag: '{{MODULO_QTDE}}', desc: 'Quantidade de placas solares' },
    { tag: '{{INVERSOR_MARCA}}', desc: 'Marca e modelo do Inversor' },
    { tag: '{{INVERSOR_QTDE}}', desc: 'Quantidade de inversores' },
    { tag: '{{ECONOMIA_ANUAL}}', desc: 'Previsão financeira de economia no 1º ano' },
    { tag: '{{DATA_HOJE}}', desc: 'Data atual da geração do documento' },
  ];

  const copiarTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiadoId(tag);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const handleUploadModelo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.docx')) {
      alert("Por favor, envie um arquivo do tipo Word (.docx)");
      return;
    }

    setIsUploading(true);
    // Aqui no futuro ligaremos ao Supabase para guardar o .docx do integrador
    setTimeout(() => {
      alert("Modelo Word salvo com sucesso! O Motor de Documentos já pode utilizá-lo.");
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      
      {/* CABEÇALHO */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-6">
        <div className="bg-slate-800 p-3 rounded-xl">
          <Settings className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações do Integrador</h1>
          <p className="text-slate-400 mt-1">Gira os seus modelos de proposta e preferências da plataforma.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: Upload do Modelo Word */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" /> Modelo Word (.docx)
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Faça o upload da sua proposta comercial em Word. O sistema irá preencher as tags automaticamente.
            </p>

            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center relative hover:bg-slate-800/50 hover:border-orange-500 transition-all cursor-pointer">
              <input 
                type="file" 
                accept=".docx" 
                onChange={handleUploadModelo}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="animate-pulse flex flex-col items-center">
                  <Upload className="w-8 h-8 text-orange-500 mb-3" />
                  <p className="text-sm font-medium text-white">A guardar modelo...</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-800 p-3 rounded-full mb-3 text-slate-300">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-white">Clique para enviar o seu .docx</p>
                  <p className="text-xs text-slate-500 mt-1">Apenas formato Word</p>
                </>
              )}
            </div>

            <div className="mt-6 bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-orange-400">Dica:</strong> Copie as tags ao lado e cole no seu ficheiro Word exatamente como estão escritas (incluindo as chaves).
              </p>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Dicionário de Tags */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold text-white mb-1">Dicionário de Variáveis (Tags)</h2>
              <p className="text-sm text-slate-400">Clique numa tag para copiar e cole no seu modelo de proposta.</p>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {dicionarioTags.map((item, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors group">
                  <div>
                    <code className="text-orange-400 font-mono text-sm bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                      {item.tag}
                    </code>
                    <p className="text-sm text-slate-400 mt-1">{item.desc}</p>
                  </div>
                  <button 
                    onClick={() => copiarTag(item.tag)}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors border border-slate-700 shrink-0"
                  >
                    {copiadoId === item.tag ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copiado</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copiar Tag</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}