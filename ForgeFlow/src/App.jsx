import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AppLayout from './components/layouts/AppLayout'
import { WorkoutSessionProvider } from './context/WorkoutSessionContext'

import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises'
import Workouts from './pages/Workouts'
import History from './pages/History'
import StartWorkout from './pages/StartWorkout'

function App() {
  return (
    <WorkoutSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/history" element={<History />} />
            <Route path="/start-workout" element={<StartWorkout />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkoutSessionProvider>
  )
}

export default App