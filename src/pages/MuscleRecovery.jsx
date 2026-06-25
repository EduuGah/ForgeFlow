import { useDeferredValue, useEffect, useMemo, useState } from 'react'

import AppPageIntro from '../components/app/AppPageIntro'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import MuscleRecoveryPageSections, { SorenessSheet } from '../features/muscleRecovery/components/MuscleRecoveryPageSections'
import {
  MUSCLE_GROUPS,
  applySorenessToRecovery,
  buildRecoveryInsights,
  buildTodayTrainingSuggestions,
  getRecoverySummary,
  normalizeMuscleGroup,
  normalizeSorenessLog,
} from '../features/muscleRecovery/muscleRecoveryUtils'

const SORENESS_STORAGE_KEY = 'muscle-soreness-logs'

function createSorenessDraft() {
  return {
    date: new Date().toISOString().slice(0, 10),
    muscleGroup: MUSCLE_GROUPS[0],
    level: 'light',
    note: '',
  }
}

function MuscleRecovery() {
  const { user } = useAuth()

  const [baseRecovery, setBaseRecovery] = useState([])
  const [sorenessLogs, setSorenessLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('database')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [statusFilter, setStatusFilter] = useState('')
  const [sorenessSheetOpen, setSorenessSheetOpen] = useState(false)
  const [sorenessDraft, setSorenessDraft] = useState(createSorenessDraft)
  const [savingSoreness, setSavingSoreness] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadRecovery() {
      setLoading(true)
      const cachedLogs = getUserStorageData(user, SORENESS_STORAGE_KEY, [])

      try {
        const [statsData, logsData] = await Promise.all([
          apiFetch('/stats/muscle-recovery'),
          apiFetch('/muscle-soreness-logs').catch(() => cachedLogs),
        ])

        if (!isMounted) return

        const normalizedLogs = Array.isArray(logsData)
          ? logsData.map(normalizeSorenessLog).sort((a, b) => new Date(b.date) - new Date(a.date))
          : []

        setBaseRecovery(Array.isArray(statsData?.recovery) ? statsData.recovery : [])
        setSorenessLogs(normalizedLogs)
        saveUserStorageData(user, SORENESS_STORAGE_KEY, normalizedLogs)
        setSource('database')
      } catch (error) {
        console.error(error)

        if (!isMounted) return

        setBaseRecovery([])
        setSorenessLogs(Array.isArray(cachedLogs) ? cachedLogs.map(normalizeSorenessLog) : [])
        setSource('local')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadRecovery()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    if (!sorenessSheetOpen || typeof document === 'undefined') return undefined

    document.body.classList.add('ff-modal-open')

    return () => {
      document.body.classList.remove('ff-modal-open')
    }
  }, [sorenessSheetOpen])

  const recovery = useMemo(() => applySorenessToRecovery(baseRecovery, sorenessLogs), [baseRecovery, sorenessLogs])

  const filteredRecovery = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim()

    return recovery.filter((item) => {
      const matchesSearch = term
        ? String(item.muscleGroup || '').toLowerCase().includes(term)
        : true
      const matchesStatus = statusFilter ? item.level === statusFilter : true

      return matchesSearch && matchesStatus
    })
  }, [recovery, deferredSearch, statusFilter])

  const summary = useMemo(() => getRecoverySummary(recovery), [recovery])
  const suggestions = useMemo(() => buildTodayTrainingSuggestions(recovery), [recovery])
  const insights = useMemo(() => buildRecoveryInsights(recovery, sorenessLogs), [recovery, sorenessLogs])

  function showToast(type, title, message = '') {
    setToast({ type, title, message })
    window.setTimeout(() => setToast(null), 3200)
  }

  function persistSorenessLogs(nextLogs) {
    const normalizedLogs = nextLogs
      .map(normalizeSorenessLog)
      .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))

    setSorenessLogs(normalizedLogs)
    saveUserStorageData(user, SORENESS_STORAGE_KEY, normalizedLogs)

    return normalizedLogs
  }

  function updateSorenessDraft(key, value) {
    setSorenessDraft((currentDraft) => ({
      ...currentDraft,
      [key]: key === 'muscleGroup' ? normalizeMuscleGroup(value) : value,
    }))
  }

  async function handleSaveSoreness(event) {
    event.preventDefault()
    setSavingSoreness(true)

    const payload = {
      ...sorenessDraft,
      muscleGroup: normalizeMuscleGroup(sorenessDraft.muscleGroup),
      note: sorenessDraft.note.trim(),
    }

    try {
      const createdLog = await apiFetch('/muscle-soreness-logs', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      persistSorenessLogs([normalizeSorenessLog(createdLog), ...sorenessLogs])
      setSource('database')
      showToast('success', 'Sensação registrada', 'A recuperação foi recalculada com esse registro.')
    } catch (error) {
      console.error(error)
      const localLog = normalizeSorenessLog({
        ...payload,
        id: `local-${Date.now()}`,
        storage: 'local',
        createdAt: new Date().toISOString(),
      })
      persistSorenessLogs([localLog, ...sorenessLogs])
      setSource('local')
      showToast('success', 'Sensação salva localmente', 'Não foi possível sincronizar agora, mas o app usou o registro.')
    } finally {
      setSavingSoreness(false)
      setSorenessDraft(createSorenessDraft())
      setSorenessSheetOpen(false)
    }
  }

  function handleDeleteSorenessLog(logId) {
    const log = sorenessLogs.find((item) => item.id === logId)

    setConfirmModal({
      title: 'Excluir registro?',
      description: 'Esse registro manual deixará de afetar a estimativa de recuperação.',
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (log && log.storage !== 'local' && !String(log.id).startsWith('local-')) {
            await apiFetch(`/muscle-soreness-logs/${logId}`, { method: 'DELETE' })
          }
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao excluir no servidor', 'O registro foi removido localmente.')
        } finally {
          persistSorenessLogs(sorenessLogs.filter((item) => item.id !== logId))
          setConfirmModal(null)
          showToast('success', 'Registro excluído', 'A estimativa foi atualizada.')
        }
      },
    })
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-musclerecovery recovery-page">
      <AppPageIntro
        eyebrow="Recuperação"
        title="Músculos"
        description="Veja quais grupos estão prontos para treinar e registre sua sensação do dia."
        metrics={[
          { label: 'Média', value: loading ? '...' : `${summary.average}%` },
          { label: 'Atenção', value: summary.attentionCount },
          { label: 'Fonte', value: source === 'database' ? 'Sync' : 'Local' },
        ]}
      />

      <div className="ff-recovery-body ff-page-mobile-main-grid">
        <MuscleRecoveryPageSections
          source={source}
          loading={loading}
          recovery={recovery}
          filteredRecovery={filteredRecovery}
          summary={summary}
          suggestions={suggestions}
          insights={insights}
          sorenessLogs={sorenessLogs}
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={clearFilters}
          onOpenSoreness={() => setSorenessSheetOpen(true)}
          onDeleteSorenessLog={handleDeleteSorenessLog}
        />
      </div>

      <SorenessSheet
        open={sorenessSheetOpen}
        draft={sorenessDraft}
        saving={savingSoreness}
        onClose={() => setSorenessSheetOpen(false)}
        onDraftChange={updateSorenessDraft}
        onSubmit={handleSaveSoreness}
      />

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

export default MuscleRecovery
