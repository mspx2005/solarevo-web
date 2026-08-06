// app/painel/projetos/[id]/atribuir-instalador/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { InstaladorAtivo } from '@/types/enertrack'
import { FormularioAtribuicao } from './formulario-atribuicao'

export const dynamic = 'force-dynamic'

export default async function AtribuirInstaladorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projetoId } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/painel/login')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.role !== 'integrador') redirect('/painel')

  const { data: instaladores, error } = await supabase.rpc('get_instaladores')

  return (
    <FormularioAtribuicao
      projetoId={projetoId}
      instaladores={(instaladores as InstaladorAtivo[]) ?? []}
      erroInicial={error ? 'Não foi possível carregar a lista de instaladores.' : null}
    />
  )
}