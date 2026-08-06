import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializa o "Cérebro" do Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL da proposta não fornecida.' }, { status: 400 });
    }

    const fileResponse = await fetch(fileUrl);
    const fileBuffer = await fileResponse.arrayBuffer();
    const mimeType = fileResponse.headers.get('content-type') || 'application/pdf';

    const base64Data = Buffer.from(fileBuffer).toString('base64');

    // ⚡ A VACINA: Obrigando a IA a devolver um JSON perfeito
    // ⚡ O MOTOR CORRETO: Ajustado para usar a versão 2.5 que já está validada no seu projeto!
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // 👈 Se no outro arquivo estiver exatamente assim ou apenas 'gemini-2.5', ajuste aqui igualzinho!
      generationConfig: { responseMimeType: "application/json" } 
    });

    // 🎯 O PROMPT TURBINADO COM BATERIAS
    const prompt = `
      Você é um engenheiro orçamentista especialista em energia solar e sistemas de armazenamento (BESS).
      Leia esta proposta de kit gerador fotovoltaico.
      Sua única tarefa é extrair os dados dos equipamentos (Inversores, Módulos Solares e Baterias) e retornar um JSON válido usando EXATAMENTE esta estrutura de chaves.
      Se você não encontrar algum equipamento (exemplo: se for um sistema On-Grid comum sem bateria), retorne null para as chaves dele.
      
      Estrutura obrigatória:
      {
        "inversor_modelo": "String com marca e modelo do inversor",
        "inversor_qtde": Número inteiro da quantidade,
        "inversor_potencia_w": Número inteiro da potência em Watts,
        "modulo_modelo": "String com marca e modelo da placa solar",
        "modulo_qtde": Número inteiro da quantidade,
        "modulo_potencia_w": Número inteiro da potência em Watts,
        "bateria_modelo": "String com marca e modelo da bateria",
        "bateria_qtde": Número inteiro da quantidade,
        "bateria_potencia_w": Número inteiro com a capacidade/potência em Wh ou W
      }
    `;

    const documentParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...documentParts]);
    const responseText = result.response.text();

    console.log("✅ Resposta limpa da IA:", responseText);

    const dadosExtraidos = JSON.parse(responseText);

    return NextResponse.json(dadosExtraidos);

  } catch (error: any) {
    console.error('❌ Erro REAL na API de Análise de Proposta:', error);
    
    return NextResponse.json(
      { error: 'Falha ao processar a proposta.', detalhes: error.message },
      { status: 500 }
    );
  }
}