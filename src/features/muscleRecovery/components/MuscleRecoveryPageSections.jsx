import { Link } from 'react-router-dom'
import {
  Activity,
  CalendarDays,
  Dumbbell,
  HeartPulse,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import {
  MUSCLE_GROUPS,
  RECOVERY_INFO_STEPS,
  SORENESS_LEVELS,
  buildRecoveryRegions,
  formatDate,
  formatRelativeDate,
  formatVolume,
  getRecoveryStyle,
  getSorenessLevelLabel,
} from '../muscleRecoveryUtils'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'attention', label: 'Atenção' },
  { value: 'low', label: 'Em recuperação' },
  { value: 'medium', label: 'Quase pronto' },
  { value: 'good', label: 'Quase pronto' },
  { value: 'ready', label: 'Recuperado' },
]

export function RecoveryHero({ source, loading, summary, onOpenSoreness }) {
  return (
    <section className="ff-recovery-hero-card">
      <div className="ff-recovery-hero-card__copy">
        <Badge variant={source === 'database' ? 'purple' : 'default'}>
          {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Local'}
        </Badge>
        <h2>Recuperação Muscular</h2>
        <p>Veja quais grupos estão prontos para treinar com base nos treinos registrados, volume e sensação manual.</p>
      </div>

      <div className="ff-recovery-hero-card__metrics">
        <span><small>Mais recuperado</small><strong>{summary.mostReady?.muscleGroup || '--'}</strong></span>
        <span><small>Atenção</small><strong>{summary.mostTired?.muscleGroup || '--'}</strong></span>
        <span><small>Último treino</small><strong>{summary.lastWorkout ? formatRelativeDate(summary.lastWorkout.lastTrainedAt) : '--'}</strong></span>
      </div>

      <Button type="button" onClick={onOpenSoreness} className="w-full sm:w-auto">
        <Plus size={17} />
        Registrar sensação
      </Button>
    </section>
  )
}

export function RecoveryStats({ summary }) {
  const cards = [
    { label: 'Média', value: `${summary.average}%`, description: 'estimativa geral', icon: HeartPulse, variant: 'accent' },
    { label: 'Prontos', value: summary.readyCount, description: 'bons para planejar', icon: ShieldCheck, variant: 'success' },
    { label: 'Atenção', value: summary.attentionCount, description: 'cautela hoje', icon: Activity, variant: 'warning' },
    { label: 'Analisados', value: summary.available, description: 'com dados úteis', icon: Dumbbell, variant: 'default' },
  ]

  return (
    <section className="ff-recovery-stats-grid">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className={`ff-recovery-stat-card ff-recovery-stat-card--${card.variant}`}>
            <div>
              <p>{card.label}</p>
              <Icon size={19} />
            </div>
            <strong>{card.value}</strong>
            <span>{card.description}</span>
          </Card>
        )
      })}
    </section>
  )
}

export function RecoveryFilters({ search, statusFilter, onSearchChange, onStatusFilterChange, onClearFilters }) {
  return (
    <Card className="ff-recovery-filter-card">
      <div className="ff-recovery-search-box">
        <Search size={17} />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar grupo muscular"
        />
        {search && <button type="button" onClick={() => onSearchChange('')} aria-label="Limpar busca"><X size={16} /></button>}
      </div>

      <div className="ff-recovery-chip-row">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value || 'all'}
            type="button"
            onClick={() => onStatusFilterChange(option.value)}
            className={statusFilter === option.value ? 'is-active' : ''}
          >
            {option.label}
          </button>
        ))}
        {(search || statusFilter) && <button type="button" onClick={onClearFilters}>Limpar</button>}
      </div>
    </Card>
  )
}

function RecoveryBar({ item }) {
  const style = getRecoveryStyle(item.level)

  return (
    <div className="ff-recovery-bar-row">
      <div>
        <strong>{item.muscleGroup}</strong>
        <span>{item.status} • Último treino: {formatRelativeDate(item.lastTrainedAt)}</span>
      </div>
      <b className={style.text}>{item.recoveryPercent}%</b>
      <div className="ff-recovery-bar-track">
        <i className={style.bar} style={{ width: `${item.recoveryPercent}%` }} />
      </div>
    </div>
  )
}

export function RecoveryMuscleMap({ recovery }) {
  const regions = buildRecoveryRegions(recovery)

  if (regions.length === 0) return null

  return (
    <Card className="ff-recovery-map-card">
      <div className="ff-section-heading-inline">
        <span><Activity size={18} /></span>
        <div>
          <h2>Mapa muscular</h2>
          <p>Visual simples por região, sem desenho complexo.</p>
        </div>
      </div>

      <div className="ff-recovery-map-regions">
        {regions.map((region) => (
          <div key={region.title}>
            <h3>{region.title}</h3>
            <div>
              {region.items.map((item) => <RecoveryBar key={item.muscleGroup} item={item} />)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MuscleRecoveryCard({ item }) {
  const style = getRecoveryStyle(item.level)
  const Icon = style.icon

  return (
    <div className={`recovery-card ff-recovery-native-card ${style.bg} ${style.border}`}>
      <div className="ff-recovery-native-card__header">
        <div>
          <span className={style.text}><Icon size={22} /></span>
          <div>
            <h3 className="recovery-card__title">{item.muscleGroup}</h3>
            <p className={style.text}>{item.status}</p>
          </div>
        </div>
        <strong className={style.text}>{item.recoveryPercent}%</strong>
      </div>

      <div className="ff-recovery-native-card__bar"><i className={style.bar} style={{ width: `${item.recoveryPercent}%` }} /></div>
      <p className="recovery-card__description">{item.message}</p>

      {item.soreness && (
        <div className="ff-recovery-soreness-chip">
          Sensação: {getSorenessLevelLabel(item.soreness.level)}
          {item.soreness.note ? ` • ${item.soreness.note}` : ''}
        </div>
      )}

      <div className="ff-recovery-native-card__stats">
        <span><small>Último treino</small><strong>{formatRelativeDate(item.lastTrainedAt)}</strong></span>
        <span><small>Séries</small><strong>{item.totalSets || 0}</strong></span>
        <span><small>Sessões</small><strong>{item.totalSessions || 0}</strong></span>
        <span><small>Volume</small><strong>{formatVolume(item.totalVolume)}</strong></span>
      </div>
    </div>
  )
}

export function RecoveryGrid({ filteredRecovery, loading }) {
  if (loading) {
    return (
      <Card>
        <div className="ff-loading-row"><Loader2 size={18} className="animate-spin" /> Calculando recuperação...</div>
      </Card>
    )
  }

  return (
    <Card className="ff-recovery-grid-card">
      <div className="ff-section-heading-inline ff-section-heading-inline--split">
        <span><Dumbbell size={18} /></span>
        <div>
          <h2>Status por músculo</h2>
          <p>{filteredRecovery.length} grupo(s) encontrados.</p>
        </div>
      </div>

      {filteredRecovery.length === 0 ? (
        <EmptyState
          title="Ainda não há dados de recuperação"
          description="Finalize alguns treinos para o ForgeFlow estimar o descanso dos grupos musculares."
        />
      ) : (
        <div className="ff-recovery-card-scroll" role="region" aria-label="Lista de grupos musculares">
          <div className="ff-recovery-card-grid">
            {filteredRecovery.map((item) => <MuscleRecoveryCard key={item.muscleGroup} item={item} />)}
          </div>
        </div>
      )}
    </Card>
  )
}

export function RecoverySuggestions({ suggestions, insights }) {
  return (
    <Card className="ff-recovery-suggestions-card">
      <div className="ff-section-heading-inline">
        <span><HeartPulse size={18} /></span>
        <div>
          <h2>Sugestões para hoje</h2>
          <p>Linguagem simples e segura, sem diagnóstico.</p>
        </div>
      </div>

      <div className="ff-recovery-suggestions-list">
        {suggestions.map((suggestion) => <p key={suggestion}>{suggestion}</p>)}
      </div>

      <div className="ff-recovery-insight-list">
        {insights.map((insight) => <span key={insight} className="recovery-insight">{insight}</span>)}
      </div>

      <Link to="/workouts" className="ff-recovery-workout-link">
        <Dumbbell size={17} />
        Ver treinos
      </Link>
    </Card>
  )
}

export function RecoveryInfoCard() {
  return (
    <Card className="ff-recovery-info-card">
      <h2>Como funciona?</h2>
      <p>A recuperação é uma estimativa baseada nos seus registros, não uma avaliação médica.</p>
      <div>
        {RECOVERY_INFO_STEPS.map((step) => {
          const Icon = step.icon
          return (
            <span key={step.title}>
              <Icon size={17} />
              <strong>{step.title}</strong>
              <small>{step.description}</small>
            </span>
          )
        })}
      </div>
    </Card>
  )
}

export function SorenessSheet({ open, draft, saving, onClose, onDraftChange, onSubmit }) {
  if (!open) return null

  return (
    <div className="ff-recovery-soreness-modal" role="dialog" aria-modal="true" aria-label="Registrar sensação">
      <button type="button" className="ff-recovery-soreness-modal__backdrop" onClick={onClose} aria-label="Fechar" />
      <form className="ff-recovery-soreness-modal__panel" onSubmit={onSubmit}>
        <header>
          <div>
            <span>Recuperação</span>
            <h2>Como está se sentindo hoje?</h2>
            <p>Registre dor/fadiga por grupo muscular para ajustar a estimativa.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </header>

        <div className="ff-recovery-soreness-form-grid">
          <Input label="Data" type="date" value={draft.date} onChange={(event) => onDraftChange('date', event.target.value)} />
          <Select label="Grupo muscular" value={draft.muscleGroup} onChange={(event) => onDraftChange('muscleGroup', event.target.value)}>
            {MUSCLE_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
          </Select>
          <Select label="Dor/fadiga" value={draft.level} onChange={(event) => onDraftChange('level', event.target.value)}>
            {SORENESS_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
          </Select>
        </div>

        <Textarea label="Observação opcional" rows={3} value={draft.note} onChange={(event) => onDraftChange('note', event.target.value)} placeholder="Ex: pernas pesadas, ombro sensível..." />

        <div className="ff-recovery-soreness-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">Cancelar</Button>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
            {saving ? 'Salvando...' : 'Salvar sensação'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function SorenessHistory({ logs, onDeleteLog }) {
  return (
    <Card className="ff-recovery-soreness-history">
      <div className="ff-section-heading-inline">
        <span><CalendarDays size={18} /></span>
        <div>
          <h2>Histórico de sensação</h2>
          <p>Últimos registros manuais de dor/fadiga.</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className="ff-progress-muted-box">Nenhum registro manual ainda.</p>
      ) : (
        <div>
          {logs.slice(0, 8).map((log) => (
            <div key={log.id} className="ff-soreness-history-row">
              <div>
                <strong>{formatDate(log.date)}</strong>
                <span>{log.muscleGroup} — dor/fadiga {getSorenessLevelLabel(log.level).toLowerCase()}</span>
                {log.note && <small>{log.note}</small>}
              </div>
              <button type="button" onClick={() => onDeleteLog(log.id)} aria-label="Excluir registro">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function MuscleRecoveryPageSections({
  source,
  loading,
  recovery,
  filteredRecovery,
  summary,
  suggestions,
  insights,
  sorenessLogs,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onClearFilters,
  onOpenSoreness,
  onDeleteSorenessLog,
}) {
  return (
    <>
      <RecoveryHero source={source} loading={loading} summary={summary} onOpenSoreness={onOpenSoreness} />
      <RecoveryStats summary={summary} />

      <section className="ff-recovery-main-layout">
        <div className="ff-recovery-main-layout__content">
          <RecoveryFilters
            search={search}
            statusFilter={statusFilter}
            onSearchChange={onSearchChange}
            onStatusFilterChange={onStatusFilterChange}
            onClearFilters={onClearFilters}
          />
          <RecoveryGrid filteredRecovery={filteredRecovery} loading={loading} />
          <RecoveryMuscleMap recovery={recovery} />
        </div>

        <aside className="ff-recovery-main-layout__side">
          <RecoverySuggestions suggestions={suggestions} insights={insights} />
          <SorenessHistory logs={sorenessLogs} onDeleteLog={onDeleteSorenessLog} />
          <RecoveryInfoCard />
        </aside>
      </section>
    </>
  )
}
