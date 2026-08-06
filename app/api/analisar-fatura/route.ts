import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY?.trim() || '');

export async function POST(req: Request) {
  try {
    const { fileUrl } = await req.json();

    // Robustez: validar entrada antes de qualquer processamento
    if (!fileUrl || typeof fileUrl !== 'string') {
      return NextResponse.json(
        { error: 'Parâmetro fileUrl ausente ou inválido.' },
        { status: 400 }
      );
    }

    // 1. Baixar o arquivo do cofre do Supabase
    const response = await fetch(fileUrl);

    // Robustez: garantir que o download realmente funcionou
    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Não foi possível baixar o arquivo da fatura.',
          detalhes: `HTTP ${response.status}`,
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // 2. Garantir o formato (MimeType) correto
    // Obs.: signed URLs têm querystring — separar o path antes de checar extensão
    let mimeType = 'application/pdf';
    const pathMinusculo = fileUrl.split('?')[0].toLowerCase();
    if (pathMinusculo.endsWith('.png')) mimeType = 'image/png';
    else if (pathMinusculo.endsWith('.jpg') || pathMinusculo.endsWith('.jpeg'))
      mimeType = 'image/jpeg';
    else if (pathMinusculo.endsWith('.webp')) mimeType = 'image/webp';

    // 3. Chamar o Modelo Atualizado Gemini 2.5
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Você é um assistente especialista em energia solar B2B de alta precisão.
      Analise esta fatura de energia elétrica e extraia as seguintes informações solicitadas.

      Regra de Negócio para o Consumo: Calcule a média aritmética do histórico de consumo dos últimos 12 meses impresso na fatura. Se o documento contiver menos de 12 meses (ex: usina nova), calcule a média com base estrita na quantidade de meses disponíveis.

      Retorne APENAS um objeto JSON válido, sem formatação markdown ou textos extras:
      {
        "cliente_nome": "Nome completo do titular da conta",
        "cpf_cliente": "Apenas os números do CPF ou CNPJ do titular encontrados na fatura",
        "endereco": "Endereço completo da instalação com CEP se houver",
        "tipo_conexao": "Monofásico, Bifásico ou Trifásico",
        "classe": "Residencial, Comercial, Rural ou Industrial",
        "media_consumo_kwh": Número correspondente à média calculada (ex: 450.5)
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: mimeType } },
    ]);

    const textoResposta = result.response.text();
    const jsonLimpo = textoResposta.replace(/```json/g, '').replace(/```/g, '').trim();

    // Robustez: JSON.parse isolado para retornar erro claro se a IA
    // devolver texto fora do formato esperado
    let dadosExtraidos;
    try {
      dadosExtraidos = JSON.parse(jsonLimpo);
    } catch {
      return NextResponse.json(
        { error: 'A IA retornou uma resposta em formato inesperado.' },
        { status: 502 }
      );
    }

    return NextResponse.json(dadosExtraidos);
  } catch (error: any) {
    console.error('❌ Erro na leitura IA:', error);
    return NextResponse.json(
      {
        error: 'Erro ao analisar fatura',
        detalhes: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
