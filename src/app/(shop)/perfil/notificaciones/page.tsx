import Link from 'next/link'
import { Bell } from 'lucide-react'
import { getUserNotifications } from '@/lib/queries/user'
import { formatDate } from '@/lib/format'
import MarkAllReadButton from './mark-all-read-button'

export default async function NotificationsPage() {
  const notifications = await getUserNotifications(50)
  const hasUnread = notifications.some((n) => !n.read)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Notificaciones</h1>
        {hasUnread && <MarkAllReadButton />}
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Bell className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
          Sin notificaciones por ahora.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? '#'}
              className={`block bg-white rounded-2xl border p-4 hover:border-rd-red transition ${
                n.read ? 'border-zinc-200' : 'border-rd-red/40 bg-rd-red/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{n.title}</p>
                  <p className="text-sm text-zinc-600">{n.message}</p>
                </div>
                {!n.read && <span className="h-2 w-2 bg-rd-red rounded-full mt-1.5" />}
              </div>
              <p className="text-xs text-zinc-500 mt-2">{formatDate(n.created_at)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
