import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
  removeUserStorageData,
} from '../utils/userStorage'

import {
  INITIAL_VISIBLE_SESSIONS,
  buildSessionMeta,
  normalizeHistoryFromApi,
  normalizeText,
} from '../features/history/historyUtils'
import {
  HistoryListSection,
  HistorySidebar,
  HistorySummaryCards,
} from '../features/history/components/HistorySections'

function History() {
  const { user } = useAuth()

  const [history, setHistory] = useState([])
  const [expandedSessionId, setExpandedSessionId] = useState(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_SESSIONS)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [source, setSource] = useState('local')

  const startDateRef = useRef(null)
  const endDateRef = useRef(null)

  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadHistory() {
      const cachedHistory = getUserStorageData(user, 'history', [])

      setHistory(cachedHistory)
      setSource(cachedHistory.length > 0 ? 'local' : 'empty')
      setLoading(false)
      setSyncing(true)

      try {
        const historyFromApi = await apiFetch('/workout-history')

        if (!isMounted) return

        const normalizedHistory = Array.isArray(historyFromApi)
          ? historyFromApi.map(normalizeHistoryFromApi)
          : []

        setHistory(normalizedHistory)
        saveUserStorageData(user, 'history', normalizedHistory)
        setSource('database')
      } catch (error) {
        console.error(error)

        if (!isMounted) return

        setHistory(cachedHistory)
        setSource('local')

        if (cachedHistory.length > 0) {
          showToast(
            'error',
            'Usando histórico local',
            'Não foi possível carregar o histórico do servidor.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          setSyncing(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    queueMicrotask(() => {
      setVisibleCount(INITIAL_VISIBLE_SESSIONS)
      setExpandedSessionId(null)
    })
  }, [deferredSearch, startDate, endDate])

  const historyMetaMap = useMemo(() => {
    const map = new Map()

    history.forEach((session, index) => {
      map.set(session.id, buildSessionMeta(session, index, history.length))
    })

    return map
  }, [history])

  const filteredHistory = useMemo(() => {
    const normalizedSearch = normalizeText(deferredSearch)

    return history.filter((session) => {
      const meta = historyMetaMap.get(session.id)

      const matchesSearch = normalizedSearch
        ? meta?.searchableText?.includes(normalizedSearch)
        : true

      let matchesDate = true

      if (meta?.finishedDate && startDate) {
        const start = new Date(`${startDate}T00:00:00`)
        matchesDate = matchesDate && meta.finishedDate >= start
      }

      if (meta?.finishedDate && endDate) {
        const end = new Date(`${endDate}T23:59:59`)
        matchesDate = matchesDate && meta.finishedDate <= end
      }

      return matchesSearch && matchesDate
    })
  }, [history, historyMetaMap, deferredSearch, startDate, endDate])

  const visibleHistory = useMemo(() => {
    return filteredHistory.slice(0, visibleCount)
  }, [filteredHistory, visibleCount])

  const summary = useMemo(() => {
    let totalVolume = 0
    let totalPRs = 0
    let totalCompletedSets = 0

    history.forEach((session) => {
      const meta = historyMetaMap.get(session.id)

      totalVolume += meta?.sessionVolume || 0
      totalPRs += meta?.sessionPRs?.length || 0
      totalCompletedSets += meta?.completedSets?.length || 0
    })

    return {
      totalVolume,
      totalPRs,
      totalCompletedSets,
      lastWorkout: history[0] || null,
    }
  }, [history, historyMetaMap])

  function handleToggleSession(id) {
    setExpandedSessionId(expandedSessionId === id ? null : id)
  }

  function showToast(type, title, message = '') {
    setToast({
      type,
      title,
      message,
    })

    window.setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  function clearFilters() {
    setSearch('')
    setStartDate('')
    setEndDate('')
  }

  function handleClearHistory() {
    setConfirmModal({
      title: 'Limpar histórico?',
      description: 'Todos os treinos finalizados serão removidos do histórico. Essa ação não pode ser desfeita.',
      confirmText: 'Limpar tudo',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch('/workout-history', {
            method: 'DELETE',
          })

          removeUserStorageData(user, 'history')
          setHistory([])
          setConfirmModal(null)

          showToast(
            'success',
            'Histórico limpo',
            'Todos os treinos foram removidos.'
          )
        } catch (error) {
          console.error(error)

          showToast(
            'error',
            'Erro ao limpar',
            error.message || 'Não foi possível limpar o histórico.'
          )
        }
      },
    })
  }

  function handleDeleteSession(id) {
    const session = history.find((item) => item.id === id)

    setConfirmModal({
      title: 'Excluir treino?',
      description: `O treino "${session?.workoutName || 'selecionado'}" será removido permanentemente do histórico.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch(`/workout-history/${id}`, {
            method: 'DELETE',
          })

          const updatedHistory = history.filter((session) => session.id !== id)

          setHistory(updatedHistory)
          saveUserStorageData(user, 'history', updatedHistory)
          setConfirmModal(null)

          showToast(
            'success',
            'Treino excluído',
            'O registro foi removido do histórico.'
          )
        } catch (error) {
          console.error(error)

          showToast(
            'error',
            'Erro ao excluir',
            error.message || 'Não foi possível excluir o treino.'
          )
        }
      },
    })
  }

  const hasActiveFilters = Boolean(search || startDate || endDate)

  return (
    <div className="ff-hevy-page ff-hevy-page-history">

    <>
      <PageHeader
        title="Histórico"
        description="Revise seus treinos finalizados, séries, volume e recordes pessoais."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source === 'database' ? 'purple' : 'default'}>
              {syncing || loading
                ? 'Sincronizando...'
                : source === 'database'
                  ? 'Sincronizado'
                  : source === 'empty'
                    ? 'Sem histórico'
                    : 'Local'}
            </Badge>

            <Badge variant="purple">
              {history.length} treinos
            </Badge>
          </div>
        }
      />

      <HistorySummaryCards
        historyCount={history.length}
        summary={summary}
      />

      <section className="mt-6 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_340px] 2xl:gap-6">
        <div>
          <HistoryListSection
            history={history}
            filteredHistory={filteredHistory}
            visibleHistory={visibleHistory}
            historyMetaMap={historyMetaMap}
            expandedSessionId={expandedSessionId}
            loading={loading}
            search={search}
            setSearch={setSearch}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            startDateRef={startDateRef}
            endDateRef={endDateRef}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            handleClearHistory={handleClearHistory}
            handleToggleSession={handleToggleSession}
            handleDeleteSession={handleDeleteSession}
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
          />
        </div>

        <HistorySidebar summary={summary} />
      </section>

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
    </>
  
    </div>
  )
}

export default History
