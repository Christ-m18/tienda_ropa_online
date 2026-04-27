import { getAdminUsers } from '@/lib/queries/admin'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import ToggleAdminButton from './toggle-admin-button'

export default async function AdminUsersPage() {
  const users = await getAdminUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Usuarios</h1>
        <p className="text-zinc-500">{users.length} cuentas registradas</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Telefono</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Registro</th>
              <th className="text-left px-4 py-3">Rol</th>
              <th className="text-right px-4 py-3">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u) => {
              const initial = (u.full_name ?? u.email ?? '?').trim().charAt(0).toUpperCase()
              return (
                <tr key={u.id} className="hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold line-clamp-1">{u.full_name ?? 'Sin nombre'}</p>
                        <p className="text-xs text-zinc-500 line-clamp-1">{u.email ?? '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-zinc-600">{u.phone ?? '-'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-zinc-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <Badge className="bg-rd-red text-white font-bold uppercase tracking-wider">Admin</Badge>
                    ) : (
                      <Badge className="bg-zinc-100 text-zinc-600">Cliente</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ToggleAdminButton userId={u.id} isAdmin={u.is_admin} />
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
