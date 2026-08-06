"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function salvarProjetoDB(dados: any) {
  // A MÁGICA ACONTECE AQUI: Adicionamos o 'await' para esperar o cliente montar
  const supabase = await createSupabaseServerClient();

  // 1. Pega o usuário logado diretamente dos cookies do servidor
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sessão não encontrada no servidor. Faça login novamente.");
  }

  // 2. Faz o insert no banco com o ID do usuário garantido
  const { error } = await supabase.from('projetos').insert([{
    user_id: user.id,
    cliente_nome: dados.clienteNome,
    potencia_kwp: dados.potencia,
    tipo_sistema: dados.tipoSistema,
    possui_bateria: dados.possuiBateria,
    status: 'Em análise'
  }]);

  if (error) {
    throw new Error(error.message);
  }

  // 3. Atualiza a lista de projetos em tempo real
  revalidatePath('/painel/projetos');
  return { ok: true };
}