import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, Bell, CalendarCheck, Flame, Play, Trophy } from 'lucide-react'
import DashboardTopSection from '../features/dashboard/components/DashboardTopSection'
import DashboardOverviewSection from '../features/dashboard/components/DashboardOverviewSection'
import DashboardGoalsSection from '../features/dashboard/components/DashboardGoalsSection'
import DashboardNotificationsSection from '../features/dashboard/components/DashboardNotificationsSection'
import DashboardRecoverySection from '../features/dashboard/components/DashboardRecoverySection'
import DashboardMetricsSection from '../features/dashboard/components/DashboardMetricsSection'
import DashboardQuickAccessSection from '../features/dashboard/components/DashboardQuickAccessSection'
import DashboardChartsSection from '../features/dashboard/components/DashboardChartsSection'
import DashboardPrsSection from '../features/dashboard/components/DashboardPrsSection'
import TodayScheduledWorkout from '../components/dashboard/TodayScheduledWorkout'

import { useWorkoutSession } from '../context/useWorkoutSession'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { useDashboardData } from '../features/dashboard/hooks/useDashboardData'
import { useDashboardDerivedData } from '../features/dashboard/hooks/useDashboardDerivedData'
import {
  formatDuration,
  formatRecoveryDate,
  formatShortDate,
  formatVolume,
  getRecoveryStyle,
} from '../features/dashboard/dashboardUtils'

import AppPageIntro from '../components/app/AppPageIntro'

function DashboardCommandCenter({
  history,
  lastSession,
  favoriteWorkouts,
  consistencyStats,
  unreadNotificationsCount,
  mostRecoveredMuscles,
  musclesStillRecovering,
  formatShortDate,
}) {
  const nextRoutine = favoriteWorkouts[0] || null
  const readyMuscle = mostRecoveredMuscles[0]
  const recoveringCount = musclesStillRecovering.length

  return (
    <section className="ff-dashboard-command-center">
      <div className="ff-dashboard-command-card is-primary">
        <div>
          <span><CalendarCheck size={15} /> Agora</span>
          <h2>{nextRoutine ? nextRoutine.name : lastSession ? 'Repita ou ajuste seu ultimo treino' : 'Monte sua primeira rotina'}</h2>
          <p>
            {nextRoutine
              ? 'Seu favorito mais acessivel para iniciar rapido.'
              : lastSession
                ? `${lastSession.workoutName} foi seu ultimo treino registrado.`
                : 'Crie um treino simples e deixe o ForgeFlow acompanhar sua evolucao.'}
          </p>
        </div>
        <Link to="/workouts">
          <Play size={17} />
          Treinar
        </Link>
      </div>

      <Link to="/history" className="ff-dashboard-command-card">
        <span><Activity size={15} /> Historico</span>
        <strong>{history.length}</strong>
        <small>{lastSession ? `Ultimo em ${formatShortDate(lastSession.finishedAt)}` : 'Sem treino salvo'}</small>
      </Link>

      <Link to="/progress" className="ff-dashboard-command-card">
        <span><Flame size={15} /> Ritmo</span>
        <strong>{consistencyStats.workoutsLast7Days}</strong>
        <small>treinos nos ultimos 7 dias</small>
      </Link>

      <Link to="/recovery" className="ff-dashboard-command-card">
        <span><Trophy size={15} /> Pronto</span>
        <strong>{readyMuscle?.muscleGroup || 'Sem dados'}</strong>
        <small>{recoveringCount > 0 ? `${recoveringCount} grupo(s) recuperando` : 'recuperacao equilibrada'}</small>
      </Link>

      <Link to="/notifications" className="ff-dashboard-command-card">
        <span><Bell size={15} /> Alertas</span>
        <strong>{unreadNotificationsCount}</strong>
        <small>nao lidas</small>
      </Link>
    </section>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const [prSearch, setPrSearch] = useState('')
  const navigate = useNavigate()
  const { startSession } = useWorkoutSession()

  const {
    exercises,
    workouts,
    history,
    bodyWeight,
    profile,
    loadingDashboard,
    shouldRenderCharts,
    dashboardSource,
    chartAccentColor,
    muscleRecovery,
    goals,
    notifications,
    unreadNotificationsCount,
    consistencyStats,
  } = useDashboardData(user)

  const {
    averageDuration,
    averageVolume,
    bestVolumeSet,
    completedSets,
    currentWeight,
    dashboardGoals,
    dashboardNotifications,
    exercisePRs,
    favoriteExercises,
    favoriteWorkouts,
    heaviestExercise,
    lastSession,
    lastWorkoutVolume,
    mostRecoveredMuscles,
    mostTrainedExercise,
    muscleVolumeChartData,
    musclesStillRecovering,
    prCount,
    profileCompletion,
    radarData,
    recentPRs,
    recentWorkouts,
    setsByWorkout,
    strongestMuscleGroup,
    totalTrainingSeconds,
    totalVolume,
    volumeByWorkout,
    volumePRCount,
    weightPRCount,
    workoutsByWeek,
  } = useDashboardDerivedData({
    bodyWeight,
    exercises,
    goals,
    history,
    muscleRecovery,
    notifications,
    prSearch,
    profile,
    workouts,
  })

  async function handleStartWorkout(workout) {
    try {
      if (workout?.id) {
        await apiFetch(`/workouts/${workout.id}/start`, {
          method: 'POST',
        })
      }
    } catch (error) {
      console.error(error)
    }

    startSession(workout)
    navigate('/start-workout')
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-dashboard">

      <AppPageIntro
        eyebrow="Inicio"
        title="ForgeFlow"
        description="O essencial para decidir o proximo treino sem transformar o app em painel lotado."
        action={
          <Link to="/workouts" className="ff-page-intro-primary-action">
            <Play size={16} />
            Treinar
          </Link>
        }
        metrics={[
          { label: 'Treinos', value: history.length },
          { label: 'Rotinas', value: workouts.length },
          { label: 'PRs', value: prCount },
        ]}
      />

    <>
      <DashboardTopSection
        dashboardSource={dashboardSource}
        loadingDashboard={loadingDashboard}
        history={history}
        recentPRs={recentPRs}
        formatShortDate={formatShortDate}
      />

      <DashboardCommandCenter
        history={history}
        lastSession={lastSession}
        favoriteWorkouts={favoriteWorkouts}
        consistencyStats={consistencyStats}
        unreadNotificationsCount={unreadNotificationsCount}
        mostRecoveredMuscles={mostRecoveredMuscles}
        musclesStillRecovering={musclesStillRecovering}
        formatShortDate={formatShortDate}
      />

      <TodayScheduledWorkout
        workouts={workouts}
        onStartWorkout={handleStartWorkout}
      />

      <DashboardOverviewSection
        profile={profile}
        lastSession={lastSession}
        currentWeight={currentWeight}
        heaviestExercise={heaviestExercise}
        strongestMuscleGroup={strongestMuscleGroup}
        profileCompletion={profileCompletion}
        formatShortDate={formatShortDate}
      />

      <DashboardGoalsSection dashboardGoals={dashboardGoals} goals={goals} />

      <details className="ff-mobile-detail-panel ff-dashboard-detail-panel">
        <summary>Alertas e recuperacao</summary>
        <div className="ff-mobile-detail-panel__content">
          <DashboardNotificationsSection
            unreadNotificationsCount={unreadNotificationsCount}
            dashboardNotifications={dashboardNotifications}
          />

          <DashboardRecoverySection
            muscleRecovery={muscleRecovery}
            mostRecoveredMuscles={mostRecoveredMuscles}
            musclesStillRecovering={musclesStillRecovering}
            getRecoveryStyle={getRecoveryStyle}
            formatRecoveryDate={formatRecoveryDate}
          />
        </div>
      </details>

      <DashboardMetricsSection
        history={history}
        totalVolume={totalVolume}
        totalTrainingSeconds={totalTrainingSeconds}
        prCount={prCount}
        consistencyStats={consistencyStats}
        averageDuration={averageDuration}
        favoriteWorkouts={favoriteWorkouts}
        favoriteExercises={favoriteExercises}
        weightPRCount={weightPRCount}
        volumePRCount={volumePRCount}
        bestVolumeSet={bestVolumeSet}
        lastSession={lastSession}
        lastWorkoutVolume={lastWorkoutVolume}
        averageVolume={averageVolume}
        profile={profile}
        formatVolume={formatVolume}
        formatDuration={formatDuration}
        formatShortDate={formatShortDate}
      />

      <details className="ff-mobile-detail-panel ff-dashboard-detail-panel">
        <summary>Rotinas, graficos e recordes</summary>
        <div className="ff-mobile-detail-panel__content">
          <DashboardQuickAccessSection
            recentWorkouts={recentWorkouts}
            favoriteWorkouts={favoriteWorkouts}
            favoriteExercises={favoriteExercises}
            exercises={exercises}
            heaviestExercise={heaviestExercise}
            mostTrainedExercise={mostTrainedExercise}
            handleStartWorkout={handleStartWorkout}
            formatShortDate={formatShortDate}
          />

          <DashboardChartsSection
            shouldRenderCharts={shouldRenderCharts}
            volumeByWorkout={volumeByWorkout}
            completedSets={completedSets}
            radarData={radarData}
            workoutsByWeek={workoutsByWeek}
            setsByWorkout={setsByWorkout}
            muscleVolumeChartData={muscleVolumeChartData}
            chartAccentColor={chartAccentColor}
          />

          <DashboardPrsSection
            exercisePRs={exercisePRs}
            recentPRs={recentPRs}
            prSearch={prSearch}
            setPrSearch={setPrSearch}
            formatShortDate={formatShortDate}
            formatVolume={formatVolume}
          />
        </div>
      </details>
    </>
  
    </div>
  )
}

export default Dashboard
