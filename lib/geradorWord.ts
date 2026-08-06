import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

// Função auxiliar para calcular a Taxa Interna de Retorno (TIR)
const calcularTIR = (fluxosDeCaixa: number[]): string => {
  let min = 0.0; let max = 1.0; let irr = 0.0;
  for (let i = 0; i < 100; i++) {
    irr = (min + max) / 2;
    let npv = 0;
    for (let j = 0; j < fluxosDeCaixa.length; j++) npv += fluxosDeCaixa[j] / Math.pow(1 + irr, j);
    if (Math.abs(npv) < 0.01) break;
    if (npv > 0) min = irr; else max = irr;
  }
  return (irr * 100).toFixed(2);
};

export const gerarDocumentoWord = async (file: File, dadosProjeto: any, dadosUtilizador: any = {}) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const content = e.target?.result as ArrayBuffer;
    
    try {
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '[', end: ']' } // ⚡ LÊ EXATAMENTE O SEU FORMATO DE WORD
      });

      // ==========================================
      // 🧠 MOTOR MATEMÁTICO E REGRAS DE NEGÓCIO
      // ==========================================
      
      const formatarDinheiro = (valor: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
      
      const kwp = dadosProjeto?.potencia_kwp || 0;
      const modulosQtde = dadosProjeto?.modulo_qtde || 0;
      const geracaoMensal = Math.round(kwp * 120);
      const tarifa = dadosProjeto?.tarifa_energia || 0.95;
      
      // Regra de Venda e Engenharia
      const areaUtil = modulosQtde * 3; // 3m² por módulo
      const precoSugerido = kwp * 3000;
      const precoVenda = dadosProjeto?.preco_venda ? parseFloat(dadosProjeto.preco_venda) : precoSugerido;
      
      // Regra de Economia (85%)
      const gastoAtual = dadosProjeto?.consumo_mensal_kwh * tarifa || 0;
      const economiaMensal = gastoAtual * 0.85;
      const gastoNovo = gastoAtual * 0.15;
      const paybackAnos = economiaMensal > 0 ? (precoVenda / (economiaMensal * 12)) : 0;

      // ==========================================
      // 📊 GERAÇÃO DO FLUXO DE CAIXA (25 ANOS)
      // ==========================================
      
      const tagsFluxoCaixa: any = {};
      const arrayFluxosTIR = [-precoVenda]; // Ano 0 é o investimento negativo
      let fluxoAcumulado = -precoVenda;
      let geracaoAnual = geracaoMensal * 12;
      let tarifaAno = tarifa;
      let vpl = -precoVenda;
      const taxaDescontoVPL = 0.10; // 10% (Referência Selic)

      for (let i = 0; i <= 24; i++) {
        if (i === 0) {
          tagsFluxoCaixa[`geracao_anual_0`] = '-';
          tagsFluxoCaixa[`tarifa_distribuidora_0`] = '-';
          tagsFluxoCaixa[`economia_anual_valor_0`] = '-';
          tagsFluxoCaixa[`investimento_anual_0`] = formatarDinheiro(precoVenda);
          tagsFluxoCaixa[`fluxo_caixa_acumulado_anual_0`] = formatarDinheiro(fluxoAcumulado);
        } else {
          geracaoAnual = geracaoAnual * 0.9945; // Perda de 0.55% ao ano dos painéis
          tarifaAno = tarifaAno * 1.06; // Inflação de energia de 6% ao ano
          
          const economiaAnoReal = geracaoAnual * tarifaAno * 0.85;
          fluxoAcumulado += economiaAnoReal;
          arrayFluxosTIR.push(economiaAnoReal);
          vpl += economiaAnoReal / Math.pow(1 + taxaDescontoVPL, i);

          tagsFluxoCaixa[`geracao_anual_${i}`] = Math.round(geracaoAnual).toLocaleString('pt-BR');
          tagsFluxoCaixa[`tarifa_distribuidora_${i}`] = formatarDinheiro(tarifaAno);
          tagsFluxoCaixa[`economia_anual_valor_${i}`] = formatarDinheiro(economiaAnoReal);
          tagsFluxoCaixa[`investimento_anual_${i}`] = '-';
          tagsFluxoCaixa[`fluxo_caixa_acumulado_anual_${i}`] = formatarDinheiro(fluxoAcumulado);
        }
      }

      // ==========================================
      // 🖨️ INJEÇÃO DE DADOS NO DOCUMENTO FINAL
      // ==========================================
      
      doc.render({
        ...tagsFluxoCaixa, // Despeja as 125 tags da tabela de fluxo de caixa aqui
        
        // Dados do Cliente
        cliente_nome: dadosProjeto?.cliente_nome || 'Nome do Cliente',
        cliente_cnpj_cpf: dadosProjeto?.cliente_cnpj_cpf || '000.000.000-00',
        cliente_endereco: dadosProjeto?.cliente_endereco || 'Rua Padrão',
        cliente_numero: dadosProjeto?.cliente_numero || 'S/N',
        cliente_bairro: dadosProjeto?.cliente_bairro || 'Centro',
        cliente_cidade: dadosProjeto?.cliente_cidade || 'Cidade',
        cliente_estado: dadosProjeto?.cliente_estado || 'UF',
        cliente_cep: dadosProjeto?.cliente_cep || '00000-000',

        // Dados do Vendedor (Integrador)
        representante_nome: dadosUtilizador?.nome || 'Consultor Solarevo',
        representante_celular: dadosUtilizador?.celular || '(00) 00000-0000',
        responsavel_email: dadosUtilizador?.email || 'contato@energialimpa.com.br',

        // Engenharia Básica
        potencia_sistema: kwp.toString(),
        geracao_mensal: geracaoMensal.toLocaleString('pt-BR'),
        area_util: areaUtil.toString(),
        modulo_fabricante: dadosProjeto?.modulo_modelo?.split(' ')[0] || 'Fabricante',
        modulo_modelo: dadosProjeto?.modulo_modelo || 'Módulo Padrão',
        modulo_potencia: dadosProjeto?.modulo_potencia_w?.toString() || '0',
        modulo_quantidade: modulosQtde.toString(),
        inversores_utilizados: dadosProjeto?.inversor_qtde ? `${dadosProjeto.inversor_qtde} Inversor(es)` : 'Inversor',
        inversor_fabricante: dadosProjeto?.inversor_modelo?.split(' ')[0] || 'Fabricante',
        inversor_modelo: dadosProjeto?.inversor_modelo || 'Modelo',

        // Financeiro
        preco: formatarDinheiro(precoVenda),
        gasto_energia_mensal_atual: formatarDinheiro(gastoAtual),
        gasto_energia_mensal_novo: formatarDinheiro(gastoNovo),
        economia_energia_mensal: formatarDinheiro(economiaMensal),
        economia_mensal_p: '85',
        payback: paybackAnos.toFixed(1),
        vpl: formatarDinheiro(vpl),
        tir: calcularTIR(arrayFluxosTIR),
        
        proposta_link: `https://solarevo.com.br/proposta/${dadosProjeto?.id || 'demo'}`,
        'data_hoje': new Date().toLocaleDateString('pt-BR'), // Substitua {{dd/mm/yyyy}} por [data_hoje] no seu Word!
      });

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      saveAs(out, `Proposta_${dadosProjeto?.cliente_nome?.replace(/\s+/g, '_') || 'Cliente'}.docx`);
      
    } catch (error: any) {
      console.error("Erro detalhado no Word:", error);
      alert("⚠️ Erro de Formatação no Word detectado. Verifique as tags [ ]");
    }
  };

  reader.readAsArrayBuffer(file);
};