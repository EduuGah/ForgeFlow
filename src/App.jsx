import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { WorkoutSessionProvider } from './context/WorkoutSessionContext'
import { TutorialProvider } from './context/TutorialContext'

import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'
import AppUrlListener from './components/auth/AppUrlListener'
import TutorialController from './components/tutorial/guided/TutorialController'

const AppLayout = lazy(() => import('./components/layouts/AppLayout'))

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Exercises = lazy(() => import('./pages/Exercises'))
const ExerciseDetails = lazy(() => import('./pages/ExerciseDetails'))
const Workouts = lazy(() => import('./pages/Workouts'))
const History = lazy(() => import('./pages/History'))
const StartWorkout = lazy(() => import('./pages/StartWorkout'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'))
const WorkoutCalendar = lazy(() => import('./pages/WorkoutCalendar'))
const WorkoutSchedule = lazy(() => import('./pages/WorkoutSchedule'))
const MuscleRecovery = lazy(() => import('./pages/MuscleRecovery'))
const Progress = lazy(() => import('./pages/Progress'))
const ExerciseProgress = lazy(() => import('./pages/ExerciseProgress'))
const ProgressPhotos = lazy(() => import('./pages/ProgressPhotos'))
const Goals = lazy(() => import('./pages/Goals'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Nutrition = lazy(() => import('./pages/Nutrition'))
const Admin = lazy(() => import('./pages/Admin'))

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const DeleteAccountInfo = lazy(() => import('./pages/DeleteAccountInfo'))
const DataSafety = lazy(() => import('./pages/DataSafety'))

function AppLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ff-bg)] px-4 text-[var(--ff-text)]">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-6 text-center shadow-2xl">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-violet-500/20" />
        <p className="mt-4 text-sm font-bold text-[var(--ff-text-soft)]">
          Carregando ForgeFlow...
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkoutSessionProvider>
          <TutorialProvider>
            <AppUrlListener />
            <TutorialController />
            <Suspense fallback={<AppLoadingFallback />}>
              <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              <Route path="/auth/callback" element={<AuthCallback />} />

              <Route
                path="/verify-email"
                element={
                  <ProtectedRoute>
                    <VerifyEmail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />

              <Route
                path="/reset-password/:token"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />


              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/delete-account" element={<DeleteAccountInfo />} />
              <Route path="/data-safety" element={<DataSafety />} />

              <Route
                path="/complete-profile"
                element={
                  <ProtectedRoute>
                    <CompleteProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="exercises" element={<Exercises />} />
                <Route path="exercises/:exerciseId" element={<ExerciseDetails />} />
                <Route path="workouts" element={<Workouts />} />
                <Route path="start-workout" element={<StartWorkout />} />
                <Route path="history" element={<History />} />
                <Route path="calendar" element={<WorkoutCalendar />} />
                <Route path="schedule" element={<WorkoutSchedule />} />
                <Route path="muscle-recovery" element={<MuscleRecovery />} />
                <Route path="progress" element={<Progress />} />
                <Route path="exercise-progress" element={<ExerciseProgress />} />
                <Route path="progress-photos" element={<ProgressPhotos />} />
                <Route path="goals" element={<Goals />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="nutrition" element={<Nutrition />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<Admin />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </TutorialProvider>
        </WorkoutSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
