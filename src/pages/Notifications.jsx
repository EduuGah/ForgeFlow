import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, AlertTriangle, BellRing, CheckCircle2, Info, Search, Trophy, X } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'

function normalizeApiArray(data, key) { return Array.isArray(data) ? data : Array.isArray(data?.[key]) ? data[key] : [] }
function formatDateTime(value) { if (!value) return 'Sem data'; return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) }
function getNotificationIcon(type) { if (type === 'success') return <Trophy size={18} />; if (type === 'goal') return <CheckCircle2 size={18} />; if (type === 'warning') return <AlertTriangle size={18} />; if (type === 'error' || type === 'danger') return <AlertCircle size={18} />; return <BellRing size={18} /> }

function NotificationDetail({ notification, onClose, onMarkRead }) {
  if (!notification) return null
  return <div className="fixed inset-0 z-[11000] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-4"><div className="w-full max-w-md rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-5 shadow-2xl sm:rounded-[2rem]"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">{getNotificationIcon(notification.type)}</div><div><h2 className="text-xl font-black text-[var(--ff-text)]">{notification.title}</h2><p className="mt-1 text-xs text-[var(--ff-muted)]">{formatDateTime(notification.createdAt)}</p></div></div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ff-muted)] hover:bg-[var(--ff-surface-2)]"><X size={18} /></button></div>{notification.message && <p className="mt-4 text-sm leading-relaxed text-[var(--ff-muted)]">{notification.message}</p>}<div className="mt-5 grid grid-cols-2 gap-2"><Button variant="secondary" onClick={onClose}>Fechar</Button>{notification.status === 'unread' && <Button onClick={() => onMarkRead(notification.id || notification._id)}>Marcar lida</Button>}</div></div></div>
}

function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('local')
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!user) return undefined
    let mounted = true
    const cached = getUserStorageData(user, 'notifications', [])
    setNotifications(Array.isArray(cached) ? cached : [])
    async function load() {
      setLoading(true)
      try {
        const data = await apiFetch('/notifications')
        if (!mounted) return
        const value = normalizeApiArray(data, 'notifications').map((item) => ({ ...item, id: item.id || item._id }))
        setNotifications(value)
        saveUserStorageData(user, 'notifications', value)
        setSource('database')
      } catch (error) { console.error(error) } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [user])

  const stats = useMemo(() => ({ unread: notifications.filter((n) => n.status === 'unread').length, read: notifications.filter((n) => n.status === 'read').length, archived: notifications.filter((n) => n.status === 'archived').length }), [notifications])
  const filteredNotifications = useMemo(() => { const term = search.trim().toLowerCase(); return notifications.filter((item) => { const matchesStatus = !statusFilter || item.status === statusFilter; const text = `${item.title || ''} ${item.message || ''}`.toLowerCase(); return matchesStatus && (!term || text.includes(term)) }) }, [notifications, search, statusFilter])

  async function updateNotification(id, patch) {
    setNotifications((current) => { const next = current.map((item) => (item.id === id || item._id === id ? { ...item, ...patch } : item)); saveUserStorageData(user, 'notifications', next); return next })
    try { await apiFetch(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }) } catch (error) { console.error(error) }
  }
  function handleMarkAsRead(id) { updateNotification(id, { status: 'read' }); setToast({ type: 'success', title: 'Notificação lida', message: 'A notificação foi marcada como lida.' }); setSelectedNotification(null) }
  function handleMarkAllAsRead() { setConfirmModal({ title: 'Marcar todas como lidas?', description: 'Todas as notificações não lidas serão marcadas como lidas.', confirmText: 'Marcar todas', onConfirm: async () => { const next = notifications.map((item) => item.status === 'unread' ? { ...item, status: 'read' } : item); setNotifications(next); saveUserStorageData(user, 'notifications', next); setConfirmModal(null); setToast({ type: 'success', title: 'Notificações lidas', message: 'Todas as notificações foram marcadas como lidas.' }); try { await apiFetch('/notifications/read-all', { method: 'PATCH' }) } catch (error) { console.error(error) } } }) }

  return <>
    <PageHeader title="Notificações" description="Central de alertas de metas, treinos e evolução." action={<div className="flex flex-wrap gap-2"><Badge variant={source === 'database' ? 'purple' : 'default'}>{loading ? 'Carregando' : source === 'database' ? 'Sincronizado' : 'Local'}</Badge>{stats.unread > 0 && <Button onClick={handleMarkAllAsRead}>Marcar todas como lidas</Button>}</div>} />
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Card className="p-4"><p className="text-sm text-[var(--ff-muted)]">Não lidas</p><p className="mt-2 text-3xl font-black text-[var(--ff-accent-text)]">{stats.unread}</p></Card><Card className="p-4"><p className="text-sm text-[var(--ff-muted)]">Lidas</p><p className="mt-2 text-3xl font-black text-[var(--ff-text)]">{stats.read}</p></Card><Card className="p-4"><p className="text-sm text-[var(--ff-muted)]">Arquivadas</p><p className="mt-2 text-3xl font-black text-[var(--ff-muted)]">{stats.archived}</p></Card></section>
    <Card className="mt-5"><div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]"><div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[var(--ff-muted)]"><Search size={18} /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar notificação..." className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]" /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none"><option value="">Todas</option><option value="unread">Não lidas</option><option value="read">Lidas</option><option value="archived">Arquivadas</option></select></div></Card>
    <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">{filteredNotifications.length === 0 ? <div className="xl:col-span-2"><Card><EmptyState title="Nenhuma notificação" description="Não há notificações para o filtro atual." /></Card></div> : filteredNotifications.map((notification) => <article key={notification.id || notification._id || notification.title} className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">{getNotificationIcon(notification.type)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h2 className="line-clamp-2 text-base font-black text-[var(--ff-text)]">{notification.title}</h2>{notification.status === 'unread' && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ff-accent)]" />}</div>{notification.message && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--ff-muted)]">{notification.message}</p>}<p className="mt-2 text-xs text-[var(--ff-muted-2)]">{formatDateTime(notification.createdAt)}</p></div></div><div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={() => setSelectedNotification(notification)}><Info size={15} />Detalhes</Button>{notification.status === 'unread' && <Button onClick={() => handleMarkAsRead(notification.id || notification._id)}><CheckCircle2 size={15} />Lida</Button>}</div></article>)}</section>
    <NotificationDetail notification={selectedNotification} onClose={() => setSelectedNotification(null)} onMarkRead={handleMarkAsRead} />
    <ConfirmModal open={Boolean(confirmModal)} title={confirmModal?.title} description={confirmModal?.description} confirmText={confirmModal?.confirmText} onConfirm={confirmModal?.onConfirm} onCancel={() => setConfirmModal(null)} />
    <Toast show={Boolean(toast)} type={toast?.type} title={toast?.title} message={toast?.message} onClose={() => setToast(null)} />
  </>
}
export default Notifications
