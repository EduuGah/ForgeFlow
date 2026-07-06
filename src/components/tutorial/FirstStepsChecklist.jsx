import { useEffect, useMemo } from 'react'
import { CheckCircle2, ChevronRight, Circle, EyeOff, RotateCcw, Sparkles } from 'lucide-react'
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

export default function FirstStepsChecklist({ workouts = [], history = [], activeSession = null, completedSets = 0, compact = false }) {
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
    dismissFirstSteps,
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
    if (activeSession && !activeSession.isTutorial && !activeSession.tutorialOnly) {
      completeFirstStepMission?.('start-workout')
    }
    if (Number(completedSets || 0) > 0) {
      completeFirstStepMission?.('register-set')
    }
    if (Array.isArray(history) && history.length > 0) {
      completeFirstStepMission?.('finish-workout')
    }
  }, [activeSession, completeFirstStepMission, completedSets, history, isDismissed, workouts])

  const nextMission = useMemo(
    () => firstStepMissions.find((mission) => !firstStepsCompleted[mission.id]) || firstStepMissions[0],
    [firstStepMissions, firstStepsCompleted]
  )

  if (isDismissed && !compact) return null
  if (isCompleted && !compact) return null
  if (!shouldShow && !compact) return null

  function handleMissionClick(mission) {
    if (!mission) return
    focusFirstStepMission?.(mission.id)
    navigate(getMissionRoute(mission, { workouts, activeSession }))
  }

  function handleResume() {
    resumeFirstSteps?.()
  }

  return (
    <section className={`ff-first-steps ${compact ? 'ff-first-steps--compact' : ''}`} data-tutorial="first-steps-checklist">
      <div className="ff-first-steps__header">
        <span className="ff-first-steps__badge">
          <Sparkles size={14} /> Primeiros passos
        </span>
        <span className="ff-first-steps__count">
          {firstStepsProgress?.completed || 0}/{firstStepsProgress?.total || firstStepMissions.length}
        </span>
      </div>

      <div className="ff-first-steps__copy">
        <h2>{isCompleted ? 'Tudo pronto para começar' : isPaused ? 'Primeiros passos pausados' : 'Aprenda fazendo'}</h2>
        <p>
          {isCompleted
            ? 'Fluxo principal concluído.'
            : isPaused
              ? 'Seu progresso foi salvo. Continue quando quiser.'
              : 'Siga 5 passos rápidos para aprender o essencial.'}
        </p>
      </div>

      <div className="ff-first-steps__meter" aria-hidden="true">
        <span style={{ width: `${firstStepsProgress?.percentage || 0}%` }} />
      </div>

      {!isCompleted && !isPaused ? (
        <ol className="ff-first-steps__list">
          {firstStepMissions.map((mission) => {
            const completed = Boolean(firstStepsCompleted[mission.id])
            const active = nextMission?.id === mission.id && !completed

            return (
              <li key={mission.id} className={completed ? 'is-complete' : active ? 'is-active' : ''}>
                <button type="button" onClick={() => handleMissionClick(mission)}>
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
          <button type="button" className="ff-first-steps__ghost" onClick={isPaused ? dismissFirstSteps : pauseFirstSteps}>
            <EyeOff size={14} /> {isPaused ? 'Ocultar' : 'Ver depois'}
          </button>
        ) : null}
      </div>
    </section>
  )
}
