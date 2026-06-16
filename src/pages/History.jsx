import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import WorkoutShareStudio from '../components/workout/WorkoutShareStudio'

import { useAuth } from '../context/AuthContext'
import { useWorkoutSession } from '../context/WorkoutSessionContext'
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
  getSessionMuscles,
  getSessionMuscleLabels,
  groupHistoryByTimeline,
  getHistoryPeriodSummary,
} from '../features/history/historyUtils'
import {
  HistoryHero,
  HistoryListSection,
  HistorySessionDetailView,
  HistorySidebar,
  HistorySummaryCards,
} from '../features/history/components/HistorySections'


function History() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { activeSession, startSessionFromHistory } = useWorkoutSession()

  const [history, setHistory] = useState([])
  const [expandedSessionId, setExpandedSessionId] = useState(null)
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [shareSessionId, setShareSessionId] = useState(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [workoutFilter, setWorkoutFilter] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('')
  const [prOnly, setPrOnly] = useState(false)
  const [timelineMode, setTimelineMode] = useState('week')
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
      setSelectedSessionId(null)
    })
  }, [deferredSearch, workoutFilter, muscleFilter, prOnly, timelineMode, startDate, endDate])

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
      const normalizedWorkoutName = normalizeText(session.workoutName || session.name || '')

      const matchesSearch = normalizedSearch
        ? meta?.searchableText?.includes(normalizedSearch)
        : true

      const matchesWorkout = workoutFilter
        ? normalizedWorkoutName === workoutFilter
        : true

      const matchesMuscle = muscleFilter
        ? getSessionMuscles(session).includes(muscleFilter)
        : true

      const matchesPr = prOnly
        ? (meta?.sessionPRs?.length || 0) > 0
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

      return matchesSearch && matchesWorkout && matchesMuscle && matchesPr && matchesDate
    })
  }, [history, historyMetaMap, deferredSearch, workoutFilter, muscleFilter, prOnly, startDate, endDate])

  const visibleHistory = useMemo(() => {
    return filteredHistory.slice(0, visibleCount)
  }, [filteredHistory, visibleCount])

  const groupedVisibleHistory = useMemo(() => {
    return groupHistoryByTimeline(visibleHistory, historyMetaMap, timelineMode)
  }, [visibleHistory, historyMetaMap, timelineMode])

  const workoutFilterOptions = useMemo(() => {
    const map = new Map()

    history.forEach((session) => {
      const label = session.workoutName || session.name || 'Treino'
      const key = normalizeText(label)
      if (!key || map.has(key)) return
      map.set(key, label)
    })

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  }, [history])

  const muscleFilterOptions = useMemo(() => {
    const map = new Map()

    history.forEach((session) => {
      getSessionMuscleLabels(session).forEach((label) => {
        const key = normalizeText(label)
        if (!key || map.has(key)) return
        map.set(key, label)
      })
    })

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  }, [history])


  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null
    return history.find((session) => session.id === selectedSessionId) || null
  }, [history, selectedSessionId])

  const shareSession = useMemo(() => {
    if (!shareSessionId) return null
    return history.find((session) => session.id === shareSessionId) || null
  }, [history, shareSessionId])

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

  const periodSummary = useMemo(() => {
    return getHistoryPeriodSummary(history, historyMetaMap)
  }, [history, historyMetaMap])

  function handleToggleSession(id) {
    setSelectedSessionId(id)
  }

  function handleShareSession(id) {
    setShareSessionId(id)
  }

  function startHistorySession(session) {
    startSessionFromHistory(session)
    setConfirmModal(null)
    setSelectedSessionId(null)

    showToast(
      'success',
      'Treino recriado',
      'As cargas anteriores foram preenchidas para você ajustar e concluir novamente.'
    )

    navigate('/start-workout')
  }

  function handleRepeatSession(session) {
    if (!session) return

    if (activeSession) {
      setConfirmModal({
        title: 'Substituir treino ativo?',
        description: 'Você já tem um treino em andamento. Refazer este registro vai substituir o treino ativo pelas cargas deste histórico.',
        confirmText: 'Refazer treino',
        variant: 'danger',
        onConfirm: () => startHistorySession(session),
      })
      return
    }

    startHistorySession(session)
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
    setWorkoutFilter('')
    setMuscleFilter('')
    setPrOnly(false)
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

  const hasActiveFilters = Boolean(search || workoutFilter || muscleFilter || prOnly || startDate || endDate)

  if (selectedSession) {
    return (
      <>
        <HistorySessionDetailView
          session={selectedSession}
          meta={historyMetaMap.get(selectedSession.id)}
          onBack={() => setSelectedSessionId(null)}
          onShareSession={handleShareSession}
          onRepeatSession={handleRepeatSession}
          onDeleteSession={handleDeleteSession}
        />

        <WorkoutShareStudio
          open={Boolean(shareSession)}
          session={shareSession}
          meta={shareSession ? historyMetaMap.get(shareSession.id) : null}
          onClose={() => setShareSessionId(null)}
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
      </>
    )
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-history ff-history-native-page">
      <HistoryHero
        historyCount={history.length}
        filteredCount={filteredHistory.length}
        summary={summary}
        periodSummary={periodSummary}
        source={source}
        syncing={syncing}
      />

      <HistorySummaryCards historyCount={history.length} summary={summary} />

      <section className="ff-page-mobile-main-grid mt-4 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_320px] 2xl:gap-6">
        <HistoryListSection
          history={history}
          filteredHistory={filteredHistory}
          groupedVisibleHistory={groupedVisibleHistory}
          historyMetaMap={historyMetaMap}
          expandedSessionId={expandedSessionId}
          loading={loading}
          search={search}
          setSearch={setSearch}
          workoutFilter={workoutFilter}
          setWorkoutFilter={setWorkoutFilter}
          workoutFilterOptions={workoutFilterOptions}
          muscleFilter={muscleFilter}
          setMuscleFilter={setMuscleFilter}
          muscleFilterOptions={muscleFilterOptions}
          prOnly={prOnly}
          setPrOnly={setPrOnly}
          timelineMode={timelineMode}
          setTimelineMode={setTimelineMode}
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
          handleShareSession={handleShareSession}
          handleRepeatSession={handleRepeatSession}
          handleDeleteSession={handleDeleteSession}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
        />

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

      <WorkoutShareStudio
        open={Boolean(shareSession)}
        session={shareSession}
        meta={shareSession ? historyMetaMap.get(shareSession.id) : null}
        onClose={() => setShareSessionId(null)}
      />
    </div>
  )
}

export default History
