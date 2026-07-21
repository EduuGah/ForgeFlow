import { useEffect, useMemo } from 'react'
import { CheckCircle2, ChevronRight, Circle, Eye, EyeOff, ListChecks, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useTutorial } from '../../context/TutorialContext'

function getMissionRoute(mission, { workouts = [], activeSession = null } = {}) {
  if (!mission) return '/'

  if (mission.id === 'start-workout') {
    return activeSession ? '/start-workout' : '/workouts'
  }

  if (mission.id === 'register-set' || mission.id === 'finish-workout') {
    return activeSession ? '/start-workout' : workouts.length > 0 ? '/workouts' : '/workouts'
  }

  return mission.route || '/'
}

function isTutorialWorkoutSession(session) {
  return Boolean(session?.isTutorialDemo || session?.isTutorial || session?.tutorialOnly || session?.demo)
}

export default function FirstStepsChecklist({ workouts = [], history = [], goals = [], activeSession = null, completedSets = 0, compact = false }) {
  const navigate = useNavigate()
  const {
    state,
    firstStepMissions = [],
    firstStepsCompleted = {},
    firstStepsProgress,
    completeFirstStepMission,
    focusFirstStepMission,
    resumeFirstSteps,
    pauseFirstSteps,
    startTutorial,
    restartTutorial,
  } = useTutorial()

  const isCompleted = firstStepsProgress?.isCompleted
  const shouldShow = Boolean(state.firstStepsStarted || !state.hasSeenWelcome || !state.dismissedWelcome)
  const isPaused = Boolean(state.firstStepsPaused)
  const isDismissed = Boolean(state.firstStepsDismissed)

  useEffect(() => {
    if (isDismissed) return
    if (Array.isArray(workouts) && workouts.length > 0) {
      completeFirstStepMission?.('create-workout')
    }
    if (activeSession && !isTutorialWorkoutSession(activeSession)) {
      completeFirstStepMission?.('start-workout')
    }
    if (Number(completedSets || 0) > 0) {
      completeFirstStepMission?.('register-set')
    }
    if (Array.isArray(history) && history.length > 0) {
      completeFirstStepMission?.('finish-workout')
    }
    if (Array.isArray(goals) && goals.length > 0) {
      completeFirstStepMission?.('create-goal')
    }
  }, [activeSession, completeFirstStepMission, completedSets, goals, history, isDismissed, workouts])

  const nextMission = useMemo(
    () => firstStepMissions.find((mission) => !firstStepsCompleted[mission.id]) || firstStepMissions[0],
    [firstStepMissions, firstStepsCompleted]
  )
  const nextMissionIndex = Math.max(0, firstStepMissions.findIndex((mission) => mission.id === nextMission?.id))
  const totalMissions = firstStepsProgress?.total || firstStepMissions.length
  const completedMissions = firstStepsProgress?.completed || 0

  if (isCompleted && !compact) return null
  if (!shouldShow && !compact) return null

  function handleMissionClick(mission) {
    if (!mission) return
    if (startTutorial?.('first-steps', { missionId: mission.id })) return
    focusFirstStepMission?.(mission.id)
    navigate(getMissionRoute(mission, { workouts, activeSession }))
  }

  function handleResume() {
    resumeFirstSteps?.()
  }

  if ((isDismissed || isPaused) && !compact) {
    return (
      <section className="ff-first-steps-restore" data-tutorial="first-steps-checklist">
        <span className="ff-first-steps-restore__icon" aria-hidden="true">
          <ListChecks size={18} />
        </span>
        <div className="ff-first-steps-restore__copy">
          <strong>Guia minimizado</strong>
          <small>{completedMissions}/{totalMissions} missões concluídas. Continue quando quiser.</small>
        </div>
        <button type="button" onClick={handleResume}>
          <Eye size={15} /> Mostrar
        </button>
      </section>
    )
  }

  return (
    <section className={`ff-first-steps ${compact ? 'ff-first-steps--compact' : ''}`} data-tutorial="first-steps-checklist">
      <div className="ff-first-steps__header">
        <span className="ff-first-steps__badge">
          <ListChecks size={14} /> Guia do app
        </span>
        <span className="ff-first-steps__count">
          {completedMissions}/{totalMissions} missões
        </span>
      </div>

      <div className="ff-first-steps__copy">
        <h2>{isCompleted ? 'Tudo pronto para começar' : isPaused ? 'Primeiros passos pausados' : 'Aprenda fazendo'}</h2>
        <p>
          {isCompleted
            ? 'Fluxo principal concluído.'
            : isPaused
              ? 'Seu progresso foi salvo. Continue quando quiser.'
              : 'Complete as missões essenciais direto nas telas do app.'}
        </p>
      </div>

      <div className="ff-first-steps__meter" aria-hidden="true">
        <span style={{ width: `${firstStepsProgress?.percentage || 0}%` }} />
      </div>

      {!compact && !isCompleted && !isPaused && nextMission ? (
        <button type="button" className="ff-first-steps__next" onClick={() => handleMissionClick(nextMission)}>
          <span className="ff-first-steps__next-copy">
            <small>Próxima missão</small>
            <strong>{nextMission.shortTitle || nextMission.title}</strong>
            <em>Passo {nextMissionIndex + 1} de {totalMissions}</em>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      ) : null}

      {!isCompleted && !isPaused ? (
        <ol className="ff-first-steps__list">
          {firstStepMissions.map((mission) => {
            const completed = Boolean(firstStepsCompleted[mission.id])
            const active = nextMission?.id === mission.id && !completed

            return (
              <li key={mission.id} className={completed ? 'is-complete' : active ? 'is-active' : ''}>
                <button type="button" onClick={() => handleMissionClick(mission)} aria-current={active ? 'step' : undefined}>
                  <span className="ff-first-steps__status" aria-hidden="true">
                    {completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </span>
                  <span className="ff-first-steps__mission-copy">
                    <strong>{mission.shortTitle || mission.title}</strong>
                    <small>{mission.description}</small>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ol>
      ) : null}

      <div className="ff-first-steps__actions">
        {isPaused ? (
          <button type="button" className="ff-first-steps__primary" onClick={handleResume}>
            Continuar
          </button>
        ) : !isCompleted && nextMission ? (
          <button type="button" className="ff-first-steps__primary" onClick={() => handleMissionClick(nextMission)}>
            {nextMission.actionLabel || 'Continuar'}
          </button>
        ) : null}

        <button type="button" className="ff-first-steps__ghost" onClick={restartTutorial}>
          <RotateCcw size={14} /> Reiniciar
        </button>

        {!isCompleted ? (
          <button type="button" className="ff-first-steps__ghost" onClick={pauseFirstSteps}>
            <EyeOff size={14} /> Minimizar
          </button>
        ) : null}
      </div>
    </section>
  )
}
