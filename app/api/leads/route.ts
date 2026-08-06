import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
``

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING');

export async function POST(req: Request) {
  try {
    // 1. Recebe os dados que vieram do formulário
    const body = await req.json();
    const { nome, email, whatsapp } = body;

    // 2. Validação de segurança: verifica se os campos não estão vazios
    if (!nome || !email || !whatsapp) {
      return NextResponse.json(
        { error: 'Nome, e-mail e WhatsApp são obrigatórios.' },
        { status: 400 }
      );
    }

    // 3. Salva os dados na tabela 'leads' do Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert([{ nome, email, whatsapp }])
      .select();

    // 4. Trata possíveis erros do banco de dados
    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
      return NextResponse.json(
        { error: 'Não foi possível salvar o contato no banco de dados.' },
        { status: 500 }
      );
    }

    // 5. Retorna sucesso para o site
    return NextResponse.json(
      { message: 'Lead cadastrado com sucesso!', lead: data },
      { status: 201 }
    );

  } catch (err) {
    console.error('Erro interno na Rota de Leads:', err);
    return NextResponse.json(
      { error: 'Ocorreu um erro interno no servidor.' },
      { status: 500 }
    );
  }
}