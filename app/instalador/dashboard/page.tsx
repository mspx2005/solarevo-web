// app/instalador/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { OsInstalador } from '@/types/enertrack'
import { ListaOs } from './lista-os'

export const dynamic = 'force-dynamic'

export default async function DashboardInstaladorPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/instalador/login')

  const { data: perfil } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.role !== 'instalador') redirect('/instalador/login')

  const { data: ordens, error } = await supabase.rpc('get_os_instalador', {
    p_instalador_id: user.id,
  })

  return (
    <ListaOs
      nome={perfil.nome}
      ordensIniciais={(ordens as OsInstalador[]) ?? []}
      erroInicial={error ? 'Não foi possível carregar suas OS. Atualize a página.' : null}
    />
  )
}