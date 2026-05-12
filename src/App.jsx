import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { WorkoutSessionProvider } from './context/WorkoutSessionContext'

import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'

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
const MuscleRecovery = lazy(() => import('./pages/MuscleRecovery'))
const Progress = lazy(() => import('./pages/Progress'))
const ExerciseProgress = lazy(() => import('./pages/ExerciseProgress'))
const ProgressPhotos = lazy(() => import('./pages/ProgressPhotos'))
const Goals = lazy(() => import('./pages/Goals'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Admin = lazy(() => import('./pages/Admin'))

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))

function AppLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-center shadow-2xl">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-violet-500/20" />
        <p className="mt-4 text-sm font-bold text-zinc-300">
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
                <Route path="muscle-recovery" element={<MuscleRecovery />} />
                <Route path="progress" element={<Progress />} />
                <Route path="exercise-progress" element={<ExerciseProgress />} />
                <Route path="progress-photos" element={<ProgressPhotos />} />
                <Route path="goals" element={<Goals />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<Admin />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </WorkoutSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
