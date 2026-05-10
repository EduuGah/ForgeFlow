export const chartLabelStyle = {
  color: 'var(--ff-text)',
  fontWeight: 800,
}

export const chartItemStyle = {
  color: 'var(--ff-text-soft)',
  fontWeight: 700,
}

export function getChartTooltipStyle() {
  return {
    background: 'var(--ff-card)',
    border: '1px solid var(--ff-border)',
    borderRadius: '16px',
    color: 'var(--ff-text)',
    boxShadow: '0 22px 60px rgba(0,0,0,.35)',
  }
}

export function formatVolume(value) {
  return `${Number(value || 0).toLocaleString('pt-BR')} kg`
}

export function formatDuration(seconds = 0) {
  const totalSeconds = Number(seconds || 0)
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}min` : `${hours}h`
}
