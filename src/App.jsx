import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AppLayout from './components/layouts/AppLayout'
import { WorkoutSessionProvider } from './context/WorkoutSessionContext'
import { AuthProvider } from './context/AuthContext'

import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'

import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises'
import Workouts from './pages/Workouts'
import History from './pages/History'
import StartWorkout from './pages/StartWorkout'
import Profile from './pages/Profile'
import ExerciseDetails from './pages/ExerciseDetails'
import Progress from './pages/Progress'
import ExerciseProgress from './pages/ExerciseProgress'
import Goals from './pages/Goals'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Register from './pages/Register'
import CompleteProfile from './pages/CompleteProfile'
import WorkoutCalendar from './pages/WorkoutCalendar'
import MuscleRecovery from './pages/MuscleRecovery'
import ProgressPhotos from './pages/ProgressPhotos'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkoutSessionProvider>
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
            </Route>
          </Routes>
        </WorkoutSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
