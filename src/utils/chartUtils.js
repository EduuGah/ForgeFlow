export function getChartTooltipStyle() {
  return {
    background: 'var(--ff-card)',
    border: '1px solid var(--ff-border)',
    borderRadius: '16px',
    color: 'var(--ff-text)',
    boxShadow: 'var(--ff-shadow-card)',
  }
}

export const chartLabelStyle = {
  color: 'var(--ff-text)',
  fontWeight: 800,
}

export const chartItemStyle = {
  color: 'var(--ff-text)',
  fontWeight: 700,
}

export function formatVolume(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')}kg`
}

export function formatDuration(seconds) {
  const totalSeconds = Number(seconds) || 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) return `${hours}h ${minutes}min`

  return `${minutes}min`
}
