import Header from '../components/layouts/Header'
import SummaryCard from '../components/dashboard/SummaryCard'
import RecentWorkouts from '../components/dashboard/RecentWorkouts'
import TodayWorkout from '../components/dashboard/TodayWorkout'

function Dashboard() {
  return (
    <div>

        <Header />

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <SummaryCard title="Treinos na semana" value="4" description="+2 em relação à semana passada" />
          <SummaryCard title="Carga total" value="12.450 kg" description="Volume acumulado" />
          <SummaryCard title="Exercícios" value="18" description="Cadastrados no sistema" />
          <SummaryCard title="Sequência atual" value="6 dias" description="Continue mantendo o ritmo" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <RecentWorkouts />
          <TodayWorkout />
        </section>
    </div>
  )
}

export default Dashboard