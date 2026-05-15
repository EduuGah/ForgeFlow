import { Link } from 'react-router-dom'
import { Bell, ChevronRight } from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

function DashboardNotificationsSection({ unreadNotificationsCount, dashboardNotifications }) {
  return (
    <>
      <section id="dashboard-today" className="scroll-mt-24 mb-6">
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-xs font-black text-[var(--ff-accent-text)]">
                <Bell size={14} />
                {unreadNotificationsCount > 0
                  ? `${unreadNotificationsCount} não lida(s)`
                  : 'Tudo em dia'}
              </div>

              <h2 className="mt-3 text-xl font-black text-[var(--ff-text)]">
                Notificações inteligentes
              </h2>

              <p className="mt-1 text-sm text-[var(--ff-muted)]">
                Alertas sobre metas, treino, peso corporal e fotos de evolução.
              </p>
            </div>

            <Link to="/notifications">
              <Button variant="secondary">
                Ver notificações
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {dashboardNotifications.length === 0 ? (
              <div className="md:col-span-3 rounded-2xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">
                Nenhuma notificação por enquanto. O ForgeFlow vai avisar quando encontrar algo importante.
              </div>
            ) : (
              dashboardNotifications.map((notification) => (
                <Link
                  key={notification.id || notification._id}
                  to={notification.actionUrl || '/notifications'}
                  className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-black text-[var(--ff-text)]">
                        {notification.title}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs text-[var(--ff-muted)]">
                        {notification.message || 'Sem detalhes.'}
                      </p>
                    </div>

                    {notification.status === 'unread' && (
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ff-accent)] shadow-[0_0_14px_var(--ff-accent-shadow)]" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </section>
    </>
  )
}

export default DashboardNotificationsSection
