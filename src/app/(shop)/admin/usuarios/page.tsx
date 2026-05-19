import { Suspense } from 'react'
import { getAdminUsersFiltered, getUserOrderStats, requireAdminProfile } from '@/lib/queries/admin'
import { formatDate, formatRD } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ToggleAdminButton from './toggle-admin-button'
import UserFilters from '@/components/admin/UserFilters'
import { BlockButton, UnblockButton } from '@/components/admin/BlockUserDialog'
import type { UserFilters as Filters } from '@/types/admin'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const filters: Filters = {
    search: typeof params.search === 'string' ? params.search : undefined,
    role: (params.role === 'admin' || params.role === 'client') ? params.role : 'all',
    blocked: (params.blocked === 'active' || params.blocked === 'blocked') ? params.blocked : 'all',
  }

  const [currentAdmin, users] = await Promise.all([
    requireAdminProfile(),
    getAdminUsersFiltered(filters),
  ])

  const orderStats = await getUserOrderStats(users.map((u) => u.id))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl md:text-3xl tracking-tight">Usuarios</h1>
        <p className="text-sm text-zinc-500">{users.length} resultado{users.length !== 1 ? 's' : ''}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <UserFilters />
      </Suspense>

      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-3">
        {users.length === 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 px-4 py-8 text-center text-zinc-400">
            No se encontraron usuarios
          </div>
        )}
        {users.map((u) => {
          const initial = (u.full_name ?? u.email ?? '?').trim().charAt(0).toUpperCase()
          const stats = orderStats.get(u.id)
          const isSelf = currentAdmin?.id === u.id

          return (
            <div key={u.id} className={`bg-white rounded-xl border border-zinc-200 p-4 space-y-3 ${u.is_blocked ? 'border-red-200 bg-red-50/30' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${u.is_blocked ? 'bg-red-200 text-red-700' : 'bg-zinc-200 text-zinc-600'}`}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{u.full_name ?? 'Sin nombre'}</p>
                    {u.is_blocked ? (
                      <Badge className="bg-red-100 text-red-700 text-[10px] font-bold uppercase shrink-0" title={u.blocked_reason ?? undefined}>
                        Bloqueado
                      </Badge>
                    ) : u.is_admin ? (
                      <Badge className="bg-rd-red text-white text-[10px] font-bold uppercase shrink-0">Admin</Badge>
                    ) : (
                      <Badge className="bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase shrink-0">Cliente</Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{u.email ?? '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-zinc-50 rounded-lg p-2">
                <div>
                  <p className="text-[10px] uppercase text-zinc-400 font-bold">Pedidos</p>
                  <p className="text-sm font-bold">{stats?.count ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400 font-bold">Gastado</p>
                  <p className="text-sm font-bold">{formatRD(stats?.total ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-400 font-bold">Registro</p>
                  <p className="text-xs font-medium">{formatDate(u.created_at)}</p>
                </div>
              </div>

              {u.phone && (
                <p className="text-xs text-zinc-500">Tel: {u.phone}</p>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                <ToggleAdminButton userId={u.id} isAdmin={u.is_admin} />
                {u.is_blocked ? (
                  <UnblockButton userId={u.id} />
                ) : (
                  <BlockButton
                    userId={u.id}
                    userName={u.full_name ?? u.email ?? 'este usuario'}
                    isSelf={isSelf}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block bg-white rounded-xl border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-3 py-2.5">Cliente</th>
              <th className="text-left px-3 py-2.5">Telefono</th>
              <th className="text-left px-3 py-2.5 hidden lg:table-cell">Registro</th>
              <th className="text-right px-3 py-2.5">Pedidos</th>
              <th className="text-right px-3 py-2.5">Total gastado</th>
              <th className="text-left px-3 py-2.5">Estado</th>
              <th className="text-right px-3 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
            {users.map((u) => {
              const initial = (u.full_name ?? u.email ?? '?').trim().charAt(0).toUpperCase()
              const stats = orderStats.get(u.id)
              const isSelf = currentAdmin?.id === u.id

              return (
                <tr key={u.id} className={`hover:bg-zinc-50/60 ${u.is_blocked ? 'bg-red-50/30' : ''}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${u.is_blocked ? 'bg-red-200 text-red-700' : 'bg-zinc-200 text-zinc-600'}`}>
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm line-clamp-1">{u.full_name ?? 'Sin nombre'}</p>
                        <p className="text-[11px] text-zinc-500 line-clamp-1">{u.email ?? '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600 text-xs">{u.phone ?? '-'}</td>
                  <td className="px-3 py-2.5 hidden lg:table-cell text-zinc-500 text-xs">{formatDate(u.created_at)}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-medium">
                    {stats?.count ?? 0}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-medium">
                    {formatRD(stats?.total ?? 0)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {u.is_blocked ? (
                        <Badge
                          className="bg-red-100 text-red-700 text-[10px] font-bold uppercase"
                          title={u.blocked_reason ?? undefined}
                        >
                          Bloqueado
                        </Badge>
                      ) : u.is_admin ? (
                        <Badge className="bg-rd-red text-white text-[10px] font-bold uppercase">Admin</Badge>
                      ) : (
                        <Badge className="bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase">Cliente</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <ToggleAdminButton userId={u.id} isAdmin={u.is_admin} />
                      {u.is_blocked ? (
                        <UnblockButton userId={u.id} />
                      ) : (
                        <BlockButton
                          userId={u.id}
                          userName={u.full_name ?? u.email ?? 'este usuario'}
                          isSelf={isSelf}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
