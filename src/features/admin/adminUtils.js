export function formatDate(value, withTime = false) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    ...(withTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  })
}

export function formatLastLogin(value, fallbackCreatedAt = null) {
  if (value) return formatDate(value, true)

  if (fallbackCreatedAt) {
    return `Sem login registrado · criado em ${formatDate(fallbackCreatedAt)}`
  }

  return 'Ainda não registrado'
}

export function formatDuration(seconds = 0) {
  const total = Number(seconds || 0)
  const minutes = Math.floor(total / 60)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours > 0) return `${hours}h ${rest}min`
  return `${minutes}min`
}

export function formatCompactNumber(value = 0) {
  const number = Number(value || 0)

  return new Intl.NumberFormat('pt-BR', {
    notation: Math.abs(number) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(number)
}

export function formatShortDate(value) {
  if (!value) return '—'

  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value

  return `${day}/${month}`
}

export function getSeriesMax(series = [], key = 'count') {
  return Math.max(1, ...series.map((item) => Number(item?.[key] || 0)))
}

export function getUserId(item) {
  return item?.id || item?._id || ''
}
