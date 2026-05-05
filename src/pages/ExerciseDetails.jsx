import { useEffect, useState } from 'react'
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
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import { useAuth } from '../context/AuthContext'
import { getUserStorageData } from '../utils/userStorage'

function getExerciseMedia(exercise) {
  if (exercise?.media?.gif) return exercise.media.gif
  if (exercise?.media?.image) return exercise.media.image
  if (exercise?.gifUrl) return exercise.gifUrl
  if (exercise?.mediaUrl) return exercise.mediaUrl

  return ''
}

function normalizeList(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return [value]

  return []
}

function InfoList({
  icon: Icon,
  title,
  description,
  items,
  variant = 'default',
}) {
  const normalizedItems = normalizeList(items)

  const styles = {
    default: {
      iconBox: 'bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]',
      number: 'bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]',
      border: 'border-zinc-800',
    },
    success: {
      iconBox: 'bg-emerald-500/10 text-emerald-400',
      number: 'bg-emerald-500/10 text-emerald-400',
      border: 'border-zinc-800',
    },
    danger: {
      iconBox: 'bg-red-500/10 text-red-400',
      number: 'bg-red-500/10 text-red-400',
      border: 'border-red-500/20',
    },
  }

  const currentStyle = styles[variant] || styles.default

  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${currentStyle.iconBox}`}
        >
          <Icon size={22} />
        </div>

        <div>
          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <p className="text-sm text-zinc-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {normalizedItems.length > 0 ? (
          normalizedItems.map((item, index) => (
            <div
              key={index}
              className={`flex gap-3 rounded-2xl border ${currentStyle.border} bg-[#18181b] p-4`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${currentStyle.number}`}
              >
                {variant === 'danger' ? '!' : index + 1}
              </span>

              <p className="text-sm leading-relaxed text-zinc-300">
                {item}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            title={`${title} não cadastrada`}
            description="Edite o exercício para completar essas informações."
          />
        )}
      </div>
    </Card>
  )
}

function SummaryItem({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#18181b] p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        {Icon && <Icon size={16} />}

        <p className="text-xs">
          {label}
        </p>
      </div>

      <p className="mt-1 font-bold text-white">
        {value || 'Não informado'}
      </p>
    </div>
  )
}

function ExerciseDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const [exercise, setExercise] = useState(null)

  useEffect(() => {
    const exercises = getUserStorageData(user, 'exercises', [])
    const foundExercise = exercises.find((item) => String(item.id) === String(id))

    setExercise(foundExercise || null)
  }, [id, user])

  if (!exercise) {
    return (
      <>
        <PageHeader
          title="Exercício não encontrado"
          description="Não foi possível localizar esse exercício."
        />

        <EmptyState
          title="Exercício não encontrado"
          description="Volte para a biblioteca e selecione outro exercício."
          action={
            <Link to="/exercises">
              <Button>
                Voltar
              </Button>
            </Link>
          }
        />
      </>
    )
  }

  const media = getExerciseMedia(exercise)

  const instructionsList = normalizeList(
    exercise.instructions || exercise.execution
  )

  const tipsList = normalizeList(
    exercise.tips || exercise.variations
  )

  const mistakesList = normalizeList(exercise.commonMistakes)
  const secondaryMuscles = normalizeList(exercise.secondaryMuscles)

  return (
    <>
      <div className="mb-6">
        <Link
          to="/exercises"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar para exercícios
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden p-0">
            <div className="relative min-h-[320px] bg-white">
              {media ? (
                <img
                  src={media}
                  alt={exercise.name}
                  className="h-[320px] w-full object-contain"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-zinc-900">
                      <Dumbbell size={44} />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-zinc-500">
                      Imagem do exercício
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      Adicione uma imagem ou GIF depois.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">
                    {exercise.name}
                  </h1>

                  {exercise.originalName && exercise.originalName !== exercise.name && (
                    <p className="mt-1 text-sm text-zinc-500">
                      {exercise.originalName}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="purple">
                      {exercise.muscleGroup}
                    </Badge>

                    <Badge>
                      {exercise.equipment}
                    </Badge>

                    {exercise.targetMuscle && (
                      <Badge>
                        {exercise.targetMuscle}
                      </Badge>
                    )}

                    {media ? (
                      <Badge variant="green">
                        Com mídia
                      </Badge>
                    ) : (
                      <Badge>
                        Sem mídia
                      </Badge>
                    )}
                  </div>
                </div>

                <Link to="/exercises">
                  <Button variant="secondary">
                    Editar na biblioteca
                  </Button>
                </Link>
              </div>

              {exercise.description && (
                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Observações
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                    {exercise.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <InfoList
            icon={CheckCircle2}
            title="Execução correta"
            description="Passo a passo para executar melhor."
            items={instructionsList}
            variant="success"
          />

          <InfoList
            icon={Lightbulb}
            title="Dicas"
            description="Pontos úteis para melhorar a técnica."
            items={tipsList}
          />

          <InfoList
            icon={AlertTriangle}
            title="Erros comuns"
            description="Coisas para evitar durante o movimento."
            items={mistakesList}
            variant="danger"
          />
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold">
              Resumo
            </h2>

            <div className="mt-5 space-y-3">
              <SummaryItem
                label="Grupo muscular"
                value={exercise.muscleGroup}
                icon={Dumbbell}
              />

              <SummaryItem
                label="Músculo alvo"
                value={exercise.targetMuscle}
                icon={Target}
              />

              <SummaryItem
                label="Equipamento"
                value={exercise.equipment}
                icon={Layers3}
              />

              <SummaryItem
                label="Dificuldade"
                value={exercise.difficulty}
                icon={Gauge}
              />

              <SummaryItem
                label="Padrão de movimento"
                value={exercise.movementPattern}
                icon={Repeat}
              />

              <div className="rounded-2xl border border-zinc-800 bg-[#18181b] p-4">
                <p className="text-xs text-zinc-500">
                  Mídia
                </p>

                <div className="mt-1 flex items-center gap-2 font-bold">
                  {media ? (
                    <>
                      <Dumbbell size={18} className="text-[var(--ff-accent-text)]" />
                      Disponível
                    </>
                  ) : (
                    <>
                      <ImageOff size={18} className="text-zinc-500" />
                      Não cadastrada
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Músculos secundários
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {secondaryMuscles.length > 0 ? (
                secondaryMuscles.map((muscle) => (
                  <Badge key={muscle} variant="purple">
                    {muscle}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  Nenhum músculo secundário cadastrado.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Tags
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="purple">
                {exercise.muscleGroup}
              </Badge>

              <Badge>
                {exercise.equipment}
              </Badge>

              {exercise.targetMuscle && (
                <Badge>
                  {exercise.targetMuscle}
                </Badge>
              )}

              {media && (
                <Badge variant="green">
                  GIF
                </Badge>
              )}

              {exercise.source && (
                <Badge>
                  {exercise.source}
                </Badge>
              )}
            </div>
          </Card>
        </div>
      </section>
    </>
  )
}

export default ExerciseDetails
