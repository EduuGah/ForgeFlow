import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
        eyebrow="Início"
        title="ForgeFlow"
        description="Resumo rápido para decidir seu próximo treino sem parecer painel de site."
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
    </>
  
    </div>
  )
}

export default Dashboard
