// app/instalador/dashboard/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type ResultadoConclusao = { ok: boolean; mensagem: string }

function traduzErro(mensagem: string): string {
  if (mensagem.includes('já foi concluída')) return 'Esta OS já foi concluída anteriormente.'
  if (mensagem.includes('Acesso negado')) return 'Você não é o responsável por esta OS.'
  if (mensagem.includes('não encontrada')) return 'OS não encontrada. Atualize a página.'
  return 'Não foi possível concluir a OS. Tente novamente em instantes.'
}

export async function concluirOsAction(osId: string): Promise<ResultadoConclusao> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, mensagem: 'Sessão expirada. Faça login novamente.' }
  }

  const { error } = await supabase.rpc('registrar_conclusao_os', { p_os_id: osId })

  if (error) {
    return { ok: false, mensagem: traduzErro(error.message) }
  }

  revalidatePath('/instalador/dashboard')
  return { ok: true, mensagem: 'OS concluída com sucesso.' }
}