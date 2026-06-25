import { BellRing, CalendarCheck, Play, Save, Sparkles } from 'lucide-react'

import Button from '../ui/Button'

function ScheduleHeader({
  weekLabel,
  plannedCount,
  alertCount,
  nextWorkoutLabel,
  todayWorkoutName,
  hasUnsavedChanges,
  isSaving,
  isLoading,
  onSave,
  onStartTodayWorkout,
}) {
  return (
    <section className="ff-schedule-v2-hero" aria-label="Resumo da agenda">
      <div className="ff-schedule-v2-hero__copy">
        <span className="ff-schedule-v2-eyebrow">
          <CalendarCheck size={15} /> Agenda
        </span>
        <h1>Planeje seus treinos da semana</h1>
        <p>Organize rotina, descanso e alertas sem sair do ritmo.</p>
      </div>

      <div className="ff-schedule-v2-hero__panel">
        <span>Esta semana</span>
        <strong>{plannedCount}/7 treinos planejados</strong>
        <small>{weekLabel}</small>
      </div>

      <div className="ff-schedule-v2-hero__stats">
        <div>
          <span>Próximo</span>
          <strong>{nextWorkoutLabel}</strong>
        </div>
        <div>
          <span>Hoje</span>
          <strong>{todayWorkoutName || 'Sem treino'}</strong>
        </div>
        <div>
          <span>Alertas</span>
          <strong>{alertCount} ativo(s)</strong>
        </div>
      </div>

      <div className="ff-schedule-v2-hero__actions">
        {todayWorkoutName && (
          <Button type="button" onClick={onStartTodayWorkout} className="ff-schedule-v2-start-button">
            <Play size={17} /> Iniciar hoje
          </Button>
        )}

        <Button
          type="button"
          variant={hasUnsavedChanges ? 'primary' : 'secondary'}
          onClick={onSave}
          disabled={isSaving || isLoading}
          className="ff-schedule-v2-save-button"
        >
          {hasUnsavedChanges ? <Sparkles size={17} /> : <Save size={17} />}
          {isSaving ? 'Salvando...' : hasUnsavedChanges ? 'Salvar alterações' : 'Agenda salva'}
        </Button>
      </div>

      {hasUnsavedChanges && (
        <div className="ff-schedule-v2-hero__notice">
          <BellRing size={16} /> Salve para atualizar os alertas do APK.
        </div>
      )}
    </section>
  )
}

export default ScheduleHeader
