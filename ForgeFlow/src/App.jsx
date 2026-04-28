import { BrowserRouter, Routes, Route } from 'react-router-dom'

import AppLayout from './components/layouts/AppLayout'

import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import Exercises from './pages/Exercises'
import History from './pages/History'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/history" element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App