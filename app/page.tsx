'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, Zap, Shield, TrendingUp, MapPin, Mail, Phone, ArrowRight } from 'lucide-react';

export default function SolarevoLanding() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrar com SendPulse API
    console.log('Lead Capture:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen h-auto md:h-screen flex items-center justify-center pt-28 pb-20 md:py-0 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradient Mesh */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8 animate-fadeIn">
          {/* Logo/Badge */}
          <div className="inline-block bg-white/10 backdrop-blur border border-orange-500/30 rounded-full px-4 py-2">
            <p className="text-sm font-medium text-orange-400">⚡ Parceria Ganha-Ganha para Integradores Solares</p>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-white via-orange-300 to-orange-400 bg-clip-text text-transparent">
              Transforme cada Usina Instalada em uma Máquina de Vendas Recorrentes.
            </span>
            <br />
            <span className="text-white">
              A plataforma inteligente <span className="text-orange-400 font-extrabold whitespace-nowrap">100% Gratuita</span> que conecta você ao seu cliente todos os dias.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Com o <span className="text-orange-400 font-semibold">app EnerTrack</span>. 
            seu cliente acompanha a economia de energia na 
            <span className="text-green-400 font-semibold"> palma da mão,</span>. 
            enquanto você recebe alertas automáticos para vender limpezas, manutenções e upgrades de sistema.
          </p>

          {/* CTA Primary Button */}
          <div className="pt-6 px-4 md:px-0">
            <button
              onClick={() => document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative flex w-full md:inline-flex md:w-auto items-center justify-center text-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base md:text-lg py-3.5 px-6 md:py-4 md:px-8 rounded-lg shadow-2xl transition-all duration-300 hover:shadow-orange-500/50 hover:scale-105"
            >
              Criar Minha Conta Gratuita
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-orange-400" />
          </div>
        </div>
      </section>

      {/* ===== O RALO DE R$1.2B SECTION ===== */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16">
            <span className="text-orange-400">O Dinheiro Que Fica na Mesa</span> Todo mês
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Pain Point 1 */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-xl p-8 hover:border-orange-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-xl font-bold">⏱️</div>
              <h3 className="text-2xl font-bold mb-4 text-white">A Síndrome do Instalou, Sumiu</h3>
              <p className="text-slate-300 text-lg font-semibold mb-2">
                Você entrega a usina <span className="text-orange-400">e o Cliente</span> esquece de você. Sem um canal direto, 
              </p>
              <p className="text-slate-400 text-sm">você perde oportunidades de expansão e novas indicações.</p>
            </div>

            {/* Pain Point 2 */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-xl p-8 hover:border-orange-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-xl font-bold">⚖️</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Falta de Manutenção</h3>
              <p className="text-slate-300 text-lg font-semibold mb-2">
                Placas sujas e sistemas desatualizados significam perda de eficiência. Se você não avisar que é hora da limpeza, <span className="text-red-400">perde a cobertura do seguro</span>.
              </p>
              <p className="text-slate-400 text-sm">o seu concorrente avisa.</p>
            </div>

            {/* Pain Point 3 */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-orange-500/20 rounded-xl p-8 hover:border-orange-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-xl font-bold">📉</div>
              <h3 className="text-2xl font-bold mb-4 text-white">A Dificuldade do Upsell</h3>
              <p className="text-slate-300 text-lg font-semibold mb-2">
                Convencer <span className="text-orange-400">Um cliente</span> a investir em baterias é difícil quando a relação esfriou. 
              </p>
              <p className="text-slate-400 text-sm">Sem dados práticos para mostrar a ele, vender vira um sacrifício.</p>
            </div>
          </div>

          {/* Big Number */}
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 border border-orange-500/40 rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-2">O Potencial do Seu Pós-Venda</p>
            <p className="text-6xl sm:text-7xl font-bold text-orange-400 mb-4">Gere Receita</p>
            <p className="text-xl text-slate-300">
              Transforme clientes inativos <span className="text-green-400 font-semibold">em lucro recorrente oferecendo O&M, limpeza e upgrades no momento exato da necessidade.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ===== SOLUÇÃO: 3 PILARES SECTION ===== */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4">
            EnerTrack: O Seu Novo Motor de Vendas
          </h2>
          <p className="text-center text-slate-400 text-lg mb-16 max-w-2xl mx-auto">
            A tecnologia que trabalha por você. Fidelize o cliente e gere pedidos automáticos de serviço.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pilar 1: Cérebro */}
            <div className="group relative bg-gradient-to-b from-blue-900/20 to-slate-900/50 border border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
              <div className="mb-6 inline-block bg-blue-500/20 p-3 rounded-lg">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">O App Que O Cliente Ama</h3>
              <p className="text-slate-300 mb-6 font-semibold">
                Entregue valor diário. O cliente acessa um painel simples para ver a economia gerada, <span className="text-blue-400">com a SUA logomarca</span> sempre em destaque na tela dele.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Exemplo real:</p>
                <p className="text-lg font-mono text-blue-300">158 × 0,7kWp = 110,6kWp</p>
                <p className="text-lg font-mono text-green-400">R$ 243.320,00</p>
                <p className="text-xs text-slate-500 mt-2">Redução de 99,9% vs. 4 horas manuais</p>
              </div>
            </div>

            {/* Pilar 2: Braço */}
            <div className="group relative bg-gradient-to-b from-green-900/20 to-slate-900/50 border border-green-500/30 rounded-2xl p-8 hover:border-green-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
              <div className="mb-6 inline-block bg-green-500/20 p-3 rounded-lg">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Vitrine Automática</h3>
              <p className="text-slate-300 mb-6 font-semibold">
                Crie desejo sem ser chato. <span className="text-green-400">O Sistema avisa o Cliente no Aplicativo</span> e sugere o momento ideal para contratar uma limpeza ou banco de baterias.
              </p>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-slate-400">Zero Sinistros por Erro de Processo</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-slate-400">Documentação pronta para EDP em minutos</p>
                </div>
              </div>
            </div>

            {/* Pilar 3: Bolso */}
            <div className="group relative bg-gradient-to-b from-orange-900/20 to-slate-900/50 border border-orange-500/30 rounded-2xl p-8 hover:border-orange-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
              <div className="mb-6 inline-block bg-orange-500/20 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Relacionamento que Gera Caixa</h3>
              <p className="text-slate-300 mb-6 font-semibold">
                Receba as solicitações de orçamento prontas<span className="text-orange-400"> no seu WhatsApp e e-mail.</span> O pós-venda deixa de ser custo e vira o seu maior lucro.
              </p>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-3">Radar IA oferece:</p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✓ Monitoramento inteligente 24/7</li>
                  <li>✓ Alertas de manutenção preditiva</li>
                  <li>✓ Lead quente para seus serviços</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== OFERTA IRRECUSÁVEL SECTION ===== */}
<section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-slate-900">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16">
      Como Funciona a Nossa Parceria <span className="text-green-400 text-2xl sm:text-3xl font-medium whitespace-nowrap">(O Ganha-Ganha)</span>
    </h2>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: O Modelo */}
            <div className="space-y-8">
              {/* A Isca B2B */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-blue-400 mb-3">Para o Integrador</h3>
                <p className="text-slate-300 mb-4">
                  Software EnerTrack <span className="font-bold text-white">100% Gratuito</span> para o integrador.
                </p>
                <p className="text-sm text-slate-500">
                  Acesse seu painel, conecte seus clientes e receba os alertas de manutenção qualificados sem custo de adesão.
                </p>
              </div>

              {/* A Receita B2C */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-green-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-green-400 mb-3">Para o Cliente Final</h3>
                <p className="text-slate-300 mb-4">Ele utiliza o App com assinatura Premium <span className="font-bold text-white">R$ 29,90/mês</span>
                </p>
                <p className="text-sm text-slate-500">
                  para relatórios avançados, sem custo algum para você.
                </p>
              </div>

              {/* O Ganha-Ganha */}
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-orange-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-orange-400 mb-3">A Máquina Rodando</h3>
                <p className="text-slate-300 mb-4">
                  O cliente fica feliz e no controle. <span className="font-bold text-white">Você ganha um vendedor invisível (o aplicativo)</span> gerando leads qualificados 
                </p>
                <p className="text-sm text-slate-500">
                  24h por dia para a sua empresa.
                </p>
              </div>
            </div>

            {/* Right: Visualização */}
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-500/10 to-blue-900/10 border border-orange-500/30 rounded-2xl p-8 space-y-6">
                <h3 className="text-2xl font-bold text-center text-white mb-8">Dinâmica Financeira</h3>

                <div className="space-y-4">
                  {/* CAC */}
                  <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4">
                    <span className="text-slate-400">Custo do Software</span>
                    <span className="text-lg font-bold text-orange-400">R$ 0,00</span>
                  </div>

                  {/* Fidelização */}
                  <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4">
                    <span className="text-slate-400">Fidelização)</span>
                    <span className="text-lg font-bold text-green-400">100%</span>
                  </div>

                  {/* Payback */}
                  <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4">
                    <span className="text-slate-400">Tempo de Setup</span>
                    <span className="text-lg font-bold text-blue-400">minutos</span>
                  </div>

                  {/* LTV/CAC */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
                    <span className="text-slate-300 font-semibold">Geração de Leads)</span>
                    <span className="text-xl font-bold text-green-400">Automática</span>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-400 mb-1">Com uma carteira de apenas 30 clientes</p>
                  <p className="text-2xl font-bold text-green-400">Sua base vira uma máquina de O&M</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROVA SOCIAL: PEDRO PACHECO SECTION ===== */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16">
            Validação por <span className="text-orange-400">Líderes de Mercado</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Testimonio */}
            <div className="bg-gradient-to-br from-orange-900/20 to-slate-900/50 border border-orange-500/40 rounded-2xl p-8">
              <div className="mb-6">
                <p className="text-orange-400 text-lg font-semibold mb-2">Testimonio Real</p>
                <h3 className="text-2xl font-bold text-white">Pedro Pacheco</h3>
                <p className="text-slate-400 text-sm">Líder Pro Energia Solar</p>
              </div>

              <blockquote className="text-xl text-slate-200 italic leading-relaxed mb-6 border-l-4 border-orange-500 pl-6">
                "O Radar IA resolve a dor de clientes que cobram suporte contínuo. É <span className="text-orange-400 font-semibold">autoridade técnica brutal</span> para o integrador se diferenciar."
              </blockquote>

              <div className="space-y-2 text-sm text-slate-400">
                <p>✓ Validou monitoramento + Radar IA</p>
                <p>✓ Confirmou eliminação de horas de engenharia comercial</p>
                <p>✓ Consolidação imediata no pós-venda</p>
              </div>
            </div>

            {/* Visual Proof: Radar Screenshot Mock */}
            <div className="bg-gradient-to-br from-blue-900/20 to-green-900/20 border border-green-500/30 rounded-2xl p-8">
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Portal Cliente Premium</p>
                <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded p-4 space-y-3">
                  <p className="text-sm font-mono text-slate-400">ESTIMATIVA × GERAÇÃO × CONSUMO</p>
                  <div className="h-20 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded flex items-end justify-between p-2">
                    <div className="w-1 h-1/3 bg-blue-400 rounded"></div>
                    <div className="w-1 h-1/2 bg-blue-400 rounded"></div>
                    <div className="w-1 h-2/3 bg-blue-400 rounded"></div>
                    <div className="w-1 h-3/4 bg-green-400 rounded"></div>
                  </div>
                  <p className="text-xs text-slate-500 text-right">Jan • Fev • Mar • Abr • Mai</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-xs text-green-400 uppercase tracking-wider font-semibold mb-2">🎯 Radar Inteligente SolarEvo (IA)</p>
                <p className="text-sm text-slate-300 mb-4">
                  Notamos uma leve queda na eficiência devido ao acúmulo de poeira do período de seca. Uma limpeza preventiva garante a recuperação de 100% da performance.
                </p>
                <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300">
                  💚 Solicitar Limpeza de Placas - R$ 450,00
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LEAD CAPTURE FOOTER SECTION ===== */}
      <section id="lead-capture" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-orange-500/20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-orange-900/30 to-slate-900/50 border border-orange-500/40 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Pronto para ativar a sua receita recorrente?
            </h2>
            <p className="text-center text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Deixe seus dados. Agendaremos uma demonstração de 15 minutos com seu painel de integrador já ativo.
            </p>

            {submitted ? (
              <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-6 text-center">
                <p className="text-xl font-bold text-green-400 mb-2">✓ Lead recebido com sucesso!</p>
                <p className="text-slate-300">Nossa equipe entrará em contato em breve via WhatsApp ou email.</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name Input */}
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />

                  {/* Email Input */}
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />

                  {/* Phone Input */}
                  <input
                    type="tel"
                    placeholder="(27) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-lg shadow-2xl transition-all duration-300 hover:shadow-orange-500/50 hover:scale-105 flex items-center justify-center gap-2"
                >
                  Agendar Demo Gratuita
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-center text-xs text-slate-500 mt-4">
                  Seus dados serão integrados ao pipeline de vendas SolarEvo. Privacidade garantida.
                </p>
              </form>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pt-8 border-t border-slate-700">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-slate-400 mb-1">Email</p>
                  <a href="mailto:mauricio@solarevo.com.br" className="text-white font-semibold hover:text-orange-400 transition">
                    mauricio@solarevo.com.br
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-slate-400 mb-1">WhatsApp</p>
                  <a href="https://wa.me/5527999999999" className="text-white font-semibold hover:text-orange-400 transition">
                    +55 (27) 9 9626-2035
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER MINIMAL ===== */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 SolarEvo EnerTrack. Todos os direitos reservados.
          </p>
          <p className="text-slate-500 text-sm">
            "O futuro da energia solar não é apenas gerar, é <span className="text-orange-400 font-semibold">gerir</span>." — Maurício Peixoto, CEO
          </p>
        </div>
      </footer>

      {/* ===== GLOBAL ANIMATIONS ===== */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce {
          animation: bounce 2s infinite;
        }
      `}</style>
    </div>
  );
}