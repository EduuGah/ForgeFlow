import { Droplets, Flame, Scale, Utensils } from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const modules = [
  { title: 'Água', description: 'Meta diária e lembretes de hidratação.', icon: Droplets },
  { title: 'Refeições', description: 'Registro simples de refeições e horários.', icon: Utensils },
  { title: 'Calorias e macros', description: 'Base para calorias, proteínas e objetivos.', icon: Flame },
  { title: 'Peso corporal', description: 'Integração futura com evolução e objetivos.', icon: Scale },
]

function Nutrition() {
  return (
    <>
      <PageHeader
        title="Nutrição"
        description="Base preparada para acompanhar água, refeições, calorias, proteínas e metas nutricionais junto com seus treinos."
        action={<Badge>Em breve</Badge>}
      />

      <Card className="overflow-hidden">
        <div className="rounded-3xl border border-[var(--ff-accent-border)]/20 bg-[radial-gradient(circle_at_top_left,var(--ff-accent-soft),transparent_42%)] p-5 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">Próxima evolução</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Nutrição em breve</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ff-muted)] sm:text-base">
            Aqui você poderá acompanhar água, refeições, calorias, proteínas e metas nutricionais sem misturar tudo na tela de treinos. A estrutura de rota e menu já está pronta para a próxima etapa.
          </p>
        </div>
      </Card>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Card key={module.title} className="p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 text-lg font-black">{module.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">{module.description}</p>
            </Card>
          )
        })}
      </section>
    </>
  )
}

export default Nutrition
