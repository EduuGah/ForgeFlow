import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ImageOff,
  Target,
  Layers3,
  Gauge,
  Repeat,
  BarChart3,
  Trophy,
  UsersRound,
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useAuth } from '../context/AuthContext'
import { getUserStorageData } from '../utils/userStorage'
import defaultExercises from '../data/defaultExercises'

import { getExerciseMedia, normalizeList } from '../features/exerciseDetails/exerciseDetailsUtils'
import { InfoList, SummaryItem } from '../features/exerciseDetails/components/ExerciseDetailsUi'

const TABS = [
  { id: 'summary', label: 'Resumo' },
  { id: 'history', label: 'Histórico' },
  { id: 'instructions', label: 'Instruções' },
  { id: 'ranking', label: 'Classificações' },
]

import AppPageIntro from '../components/app/AppPageIntro'

function ExerciseTabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 border-b-2 px-4 py-3 text-sm font-black transition',
        active
          ? 'border-[var(--ff-accent)] text-[var(--ff-accent-text)]'
          : 'border-transparent text-[var(--ff-muted)] hover:text-[var(--ff-text)]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function EmptyPanel({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
        <Icon size={28} />
      </span>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--ff-muted)]">{description}</p>
    </div>
  )
}

function ExerciseDetails() {
  const { exerciseId } = useParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('summary')

  const exercise = useMemo(() => {
    const userExercises = getUserStorageData(user, 'exercises', [])
    const allExercises = [
      ...userExercises,
      ...(Array.isArray(defaultExercises) ? defaultExercises : []),
    ]

    return allExercises.find((item) => {
      const ids = [
        item.id,
        item._id,
        item.originalLocalId,
        item.localId,
        item.exerciseId,
      ]
        .filter(Boolean)
        .map((value) => String(value))

      return ids.includes(String(exerciseId))
    }) || null
  }, [exerciseId, user])

  if (!exercise) {
    return (
      <>
        <div className="mb-5">
          <Link to="/exercises" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]">
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>

        <EmptyState
          title="Exercício não encontrado"
          description="Volte para a biblioteca e selecione outro exercício."
          action={
            <Link to="/exercises">
              <Button>Voltar</Button>
            </Link>
          }
        />
      </>
    )
  }

  const media = getExerciseMedia(exercise)
  const instructionsList = normalizeList(exercise.instructions || exercise.execution)
  const tipsList = normalizeList(exercise.tips || exercise.variations)
  const mistakesList = normalizeList(exercise.commonMistakes)
  const secondaryMuscles = normalizeList(exercise.secondaryMuscles)

  return (
    <div className="ff-hevy-page ff-hevy-page-exercisedetails">

      <AppPageIntro
        eyebrow="Exercício"
        title={exercise?.name || 'Detalhes'}
        description="Resumo, histórico, instruções e recordes em visual mais próximo de app."
      />

    <div className="ff-exercise-detail-page space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/exercises"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ff-surface)] text-[var(--ff-text)] transition hover:bg-[var(--ff-surface-2)]"
          aria-label="Voltar para exercícios"
        >
          <ArrowLeft size={22} />
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-base font-black sm:text-xl">{exercise.name}</p>
          <p className="truncate text-xs font-bold text-[var(--ff-muted)]">{exercise.muscleGroup || 'Biblioteca'} · {exercise.equipment || 'Equipamento'}</p>
        </div>

        <Link to="/exercises">
          <Button variant="secondary" className="hidden sm:inline-flex">Editar</Button>
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto border-b border-[var(--ff-border)] bg-[var(--ff-header)]">
          <div className="flex min-w-max">
            {TABS.map((tab) => (
              <ExerciseTabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </ExerciseTabButton>
            ))}
          </div>
        </div>

        <div className="relative bg-white">
          {media ? (
            <img
              src={media}
              alt={exercise.name}
              className="h-[260px] w-full object-contain sm:h-[360px]"
            />
          ) : (
            <div className="flex h-[260px] items-center justify-center sm:h-[360px]">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-zinc-900">
                  <Dumbbell size={44} />
                </div>
                <p className="mt-4 text-sm font-black text-zinc-500">Imagem do exercício</p>
                <p className="mt-1 text-xs text-zinc-400">Adicione uma imagem ou GIF depois.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{exercise.name}</h1>
              {exercise.originalName && exercise.originalName !== exercise.name && (
                <p className="mt-1 text-sm text-[var(--ff-muted)]">{exercise.originalName}</p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                Primário: <span className="font-bold text-[var(--ff-text-soft)]">{exercise.targetMuscle || exercise.muscleGroup || 'Não informado'}</span>
                {secondaryMuscles.length > 0 ? ` · Secundários: ${secondaryMuscles.join(', ')}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="purple">{exercise.muscleGroup || 'Grupo'}</Badge>
              <Badge>{exercise.equipment || 'Equipamento'}</Badge>
              {media ? <Badge variant="green">Com mídia</Badge> : <Badge>Sem mídia</Badge>}
            </div>
          </div>
        </div>
      </Card>

      {activeTab === 'summary' && (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                  <Lightbulb size={24} />
                </span>
                <div>
                  <h2 className="text-xl font-black">Como registrar no ForgeFlow</h2>
                  <p className="text-sm text-[var(--ff-muted)]">Use séries com carga, repetições e observações para acompanhar evolução.</p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.35rem] border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-6 text-center">
                <BarChart3 size={34} className="mx-auto text-[var(--ff-muted)]" />
                <p className="mt-3 text-sm font-black text-[var(--ff-text)]">Ainda sem dados</p>
                <p className="mt-1 text-xs text-[var(--ff-muted)]">Quando você concluir séries deste exercício, os recordes e gráficos aparecem aqui.</p>
              </div>
            </Card>

            {exercise.description && (
              <Card className="p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">Observações</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ff-text-soft)]">{exercise.description}</p>
              </Card>
            )}
          </div>

          <Card className="p-4 sm:p-5">
            <h2 className="text-xl font-black">Resumo</h2>
            <div className="mt-5 space-y-3">
              <SummaryItem label="Grupo muscular" value={exercise.muscleGroup} icon={Dumbbell} />
              <SummaryItem label="Músculo alvo" value={exercise.targetMuscle} icon={Target} />
              <SummaryItem label="Equipamento" value={exercise.equipment} icon={Layers3} />
              <SummaryItem label="Dificuldade" value={exercise.difficulty} icon={Gauge} />
              <SummaryItem label="Padrão de movimento" value={exercise.movementPattern} icon={Repeat} />
              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                <p className="text-xs text-[var(--ff-muted)]">Mídia</p>
                <div className="mt-1 flex items-center gap-2 font-black">
                  {media ? <><Dumbbell size={18} className="text-[var(--ff-accent-text)]" /> Disponível</> : <><ImageOff size={18} className="text-[var(--ff-muted)]" /> Não cadastrada</>}
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {activeTab === 'history' && (
        <EmptyPanel
          icon={BarChart3}
          title="Histórico ainda vazio"
          description="Finalize um treino contendo este exercício para ver séries, cargas, PRs e evolução por data."
        />
      )}

      {activeTab === 'instructions' && (
        <section className="space-y-4">
          <InfoList icon={CheckCircle2} title="Execução correta" description="Passo a passo para executar melhor." items={instructionsList} variant="success" />
          <InfoList icon={Lightbulb} title="Dicas" description="Pontos úteis para melhorar a técnica." items={tipsList} />
          <InfoList icon={AlertTriangle} title="Erros comuns" description="Coisas para evitar durante o movimento." items={mistakesList} variant="danger" />
        </section>
      )}

      {activeTab === 'ranking' && (
        <EmptyPanel
          icon={Trophy}
          title="Classificações em preparação"
          description="A estrutura visual já está pronta para rankings pessoais, amigos e recordes por exercício."
        />
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-black">Músculos secundários</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {secondaryMuscles.length > 0 ? (
              secondaryMuscles.map((muscle) => <Badge key={muscle} variant="purple">{muscle}</Badge>)
            ) : (
              <p className="text-sm text-[var(--ff-muted)]">Nenhum músculo secundário cadastrado.</p>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <UsersRound size={20} className="text-[var(--ff-accent-text)]" />
            <h2 className="text-lg font-black">Tags</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="purple">{exercise.muscleGroup}</Badge>
            <Badge>{exercise.equipment}</Badge>
            {exercise.targetMuscle && <Badge>{exercise.targetMuscle}</Badge>}
            {media && <Badge variant="green">GIF</Badge>}
            {exercise.source && <Badge>{exercise.source}</Badge>}
          </div>
        </Card>
      </section>
    </div>
  
    </div>
  )
}

export default ExerciseDetails
