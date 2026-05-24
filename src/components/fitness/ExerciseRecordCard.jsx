import { Link } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Dumbbell, Hash, Medal, Repeat2, Trophy } from 'lucide-react'

import Badge from '../ui/Badge'
import defaultExercises from '../../data/defaultExercises'
import { getExerciseMedia } from '../../utils/exerciseMediaUtils'

function normalizeExerciseName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function findExerciseByName(exerciseName = '') {
  const normalizedName = normalizeExerciseName(exerciseName)
  if (!normalizedName) return null

  return defaultExercises.find((exercise) => {
    const names = [exercise.name, exercise.originalName, exercise.title].filter(Boolean)
    return names.some((name) => normalizeExerciseName(name) === normalizedName)
  }) || null
}

function formatDate(date) {
  if (!date) return 'Sem data'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Sem data'

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

function formatWeight(value) {
  if (value === null || value === undefined || value === '') return '—'
  return `${Number(value || 0).toLocaleString('pt-BR')} kg`
}

function formatVolume(value) {
  if (value === null || value === undefined || value === '') return '—'
  return `${Number(value || 0).toLocaleString('pt-BR')} kg`
}

export default function ExerciseRecordCard({
  exerciseName,
  muscleGroup,
  equipment,
  date,
  workoutName,
  setNumber,
  weight,
  reps,
  volume,
  badge = 'PR',
  rank,
  compact = false,
  emphasis = 'blue',
}) {
  const exercise = findExerciseByName(exerciseName)
  const media = exercise ? getExerciseMedia(exercise) : '/exercise-media/fallback/default.png'
  const exerciseHref = exercise?.id ? `/exercises/${exercise.id}` : '/exercise-progress'
  const hasSet = weight !== null && weight !== undefined && reps !== null && reps !== undefined
  const toneClass = emphasis === 'gold' ? 'ff-record-card--gold' : 'ff-record-card--blue'

  return (
    <article className={`ff-record-card ${toneClass} ${compact ? 'ff-record-card--compact' : ''}`}>
      <Link to={exerciseHref} className="ff-record-card__media" aria-label={`Abrir ${exerciseName || 'exercício'}`}>
        {media ? (
          <img src={media} alt={exerciseName || 'Exercício'} loading="lazy" decoding="async" />
        ) : (
          <Dumbbell size={24} />
        )}
      </Link>

      <div className="ff-record-card__body">
        <div className="ff-record-card__topline">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              {rank && <span className="ff-record-card__rank">#{rank}</span>}
              <Link to={exerciseHref} className="ff-record-card__title">
                {exerciseName || 'Exercício'}
              </Link>
            </div>

            <p className="ff-record-card__meta">
              {muscleGroup || exercise?.muscleGroup || 'Sem grupo'}
              {(equipment || exercise?.equipment) ? ` • ${equipment || exercise?.equipment}` : ''}
            </p>
          </div>

          <Badge variant={emphasis === 'gold' ? 'default' : 'purple'}>
            {badge}
          </Badge>
        </div>

        <div className="ff-record-card__stats">
          <span>
            <Trophy size={14} />
            {hasSet ? `${formatWeight(weight)} × ${reps}` : formatWeight(weight)}
          </span>

          {volume !== null && volume !== undefined && (
            <span>
              <Repeat2 size={14} />
              Vol. {formatVolume(volume)}
            </span>
          )}

          {date && (
            <span>
              <CalendarDays size={14} />
              {formatDate(date)}
            </span>
          )}

          {setNumber && (
            <span>
              <Hash size={14} />
              Série {setNumber}
            </span>
          )}
        </div>

        <div className="ff-record-card__footer">
          <p>
            <Medal size={14} />
            {workoutName || 'Treino'}
          </p>

          <Link to={exerciseHref} className="ff-record-card__link">
            Ver exercício
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  )
}
