// app/painel/projetos/[id]/atribuir-instalador/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type ResultadoAtribuicao = { ok: boolean; mensagem: string }

export async function atribuirInstaladorAction(input: {
  projetoId: string
  instaladorId: string
  titulo: string
  descricao: string
  dataPrevista: string
}): Promise<ResultadoAtribuicao> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, mensagem: 'Sessão expirada. Faça login novamente.' }
  }

  if (!input.instaladorId || !input.titulo.trim() || !input.dataPrevista) {
    return { ok: false, mensagem: 'Preencha o instalador, o título e o prazo previsto.' }
  }

  const { error } = await supabase.from('os_instaladores').insert({
    projeto_id: input.projetoId,
    instalador_id: input.instaladorId,
    titulo: input.titulo.trim(),
    descricao: input.descricao.trim() || null,
    data_prevista_conclusao: input.dataPrevista,
    status: 'pendente',
  })

  if (error) {
    return {
      ok: false,
      mensagem: 'Não foi possível vincular o instalador. Verifique suas permissões e tente novamente.',
    }
  }

  revalidatePath(`/painel/projetos/${input.projetoId}/atribuir-instalador`)
  return { ok: true, mensagem: 'Instalador vinculado ao projeto com sucesso.' }
}