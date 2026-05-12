import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

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
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Admin = lazy(() => import('./pages/Admin'))

function AppLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-[#121214] p-6 text-center shadow-2xl shadow-black/20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_24px_var(--ff-accent-shadow)]">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-zinc-700 border-t-[var(--ff-accent)]" />
        </div>

        <h1 className="mt-5 text-lg font-black tracking-tight text-white">
          Carregando ForgeFlow
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Preparando sua experiência de treino.
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

              <Route path="/auth/callback" element={<AuthCallback />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/exercises/:id" element={<ExerciseDetails />} />
                <Route path="/workouts" element={<Workouts />} />
                <Route path="/history" element={<History />} />
                <Route path="/start-workout" element={<StartWorkout />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/calendar" element={<WorkoutCalendar />} />
                <Route path="/recovery" element={<MuscleRecovery />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/exercise-progress" element={<ExerciseProgress />} />
                <Route path="/progress-photos" element={<ProgressPhotos />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/admin" element={<Admin />} />
              </Route>
            </Routes>
          </Suspense>
        </WorkoutSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App