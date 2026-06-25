import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Edit3,
  EyeOff,
  ImagePlus,
  Images,
  Loader2,
  LockKeyhole,
  MoreVertical,
  Ruler,
  Scale,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  ZoomIn,
} from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import {
  MEASUREMENT_FIELDS,
  PHOTO_ANGLE_OPTIONS,
  formatDate,
  formatLongDate,
  getAngleLabel,
} from '../progressPhotosUtils'

function formatOptionalNumber(value, suffix = '') {
  if (value === null || value === undefined || value === '') return ''

  const number = Number(value)
  if (!Number.isFinite(number)) return ''

  return `${number.toLocaleString('pt-BR')}${suffix}`
}

function MeasurementSummary({ photo }) {
  const items = []
  const weight = formatOptionalNumber(photo.bodyWeight ?? photo.weight, ' kg')

  if (weight) items.push({ label: 'Peso', value: weight })

  MEASUREMENT_FIELDS.forEach((field) => {
    const value = formatOptionalNumber(photo.measurements?.[field.key], ` ${field.unit}`)
    if (value) items.push({ label: field.label, value })
  })

  if (items.length === 0) return null

  return (
    <div className="ff-photo-measurements">
      {items.slice(0, 6).map((item) => (
        <span key={item.label}>
          <strong>{item.label}</strong>
          {item.value}
        </span>
      ))}
    </div>
  )
}

export function ProgressPhotosStats({ stats, source, loading, onAddPhoto }) {
  return (
    <section className="ff-progress-hero-card">
      <div className="ff-progress-hero-card__copy">
        <Badge variant={source === 'database' ? 'purple' : 'default'}>
          {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Salvo localmente'}
        </Badge>
        <h2>Fotos de Progresso</h2>
        <p>Compare sua evolução visual ao longo do tempo com fotos privadas, medidas opcionais e histórico por data.</p>
      </div>

      <div className="ff-progress-hero-card__metrics">
        <span><strong>{stats.total}</strong><small>fotos</small></span>
        <span><strong>{stats.lastDate ? formatDate(stats.lastDate, { shortYear: true }) : '--'}</strong><small>última foto</small></span>
        <span><strong>{stats.angles}</strong><small>ângulos</small></span>
      </div>

      <Button type="button" onClick={onAddPhoto} className="w-full sm:w-auto">
        <ImagePlus size={17} />
        Adicionar foto
      </Button>
    </section>
  )
}

export function ProgressPhotoAddSheet({
  open,
  draft,
  imageState,
  processing,
  saving,
  error,
  onClose,
  onPickCamera,
  onPickGallery,
  onDraftChange,
  onMeasurementChange,
  onSubmit,
}) {
  if (!open) return null

  return (
    <div className="ff-progress-photo-modal" role="dialog" aria-modal="true" aria-label="Adicionar foto de progresso">
      <button type="button" className="ff-progress-photo-modal__backdrop" onClick={onClose} aria-label="Fechar" />

      <form className="ff-progress-photo-modal__panel" onSubmit={onSubmit}>
        <header className="ff-progress-photo-modal__header">
          <div>
            <span>Fotos</span>
            <h2>Adicionar foto de progresso</h2>
            <p>Escolha câmera ou galeria e registre só o que fizer sentido.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <div className="ff-progress-source-grid">
          <button type="button" onClick={onPickCamera}>
            <Camera size={22} />
            <strong>Câmera</strong>
            <small>Tirar foto agora</small>
          </button>
          <button type="button" onClick={onPickGallery}>
            <Images size={22} />
            <strong>Galeria</strong>
            <small>Escolher imagem</small>
          </button>
        </div>

        {processing && (
          <div className="ff-progress-processing">
            <Loader2 size={18} className="animate-spin" />
            Preparando imagem...
          </div>
        )}

        {error && (
          <div className="ff-progress-photo-error">
            <strong>Não foi possível preparar a foto</strong>
            <span>{error}</span>
          </div>
        )}

        {imageState?.dataUrl && (
          <div className="ff-progress-photo-preview">
            <img src={imageState.dataUrl} alt="Prévia da foto escolhida" />
            <div>
              <strong>{imageState.file?.name || 'Foto preparada'}</strong>
              <span>{Math.round((imageState.size || 0) / 1024)} KB após compressão</span>
            </div>
          </div>
        )}

        <div className="ff-progress-form-grid">
          <Input
            label="Data"
            type="date"
            value={draft.date}
            onChange={(event) => onDraftChange('date', event.target.value)}
          />

          <Select
            label="Ângulo"
            value={draft.angle}
            onChange={(event) => onDraftChange('angle', event.target.value)}
          >
            {PHOTO_ANGLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>

          <Input
            label="Peso corporal opcional"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={draft.bodyWeight}
            onChange={(event) => onDraftChange('bodyWeight', event.target.value)}
            placeholder="Ex: 72.5"
          />
        </div>

        <details className="ff-progress-measurements-details">
          <summary>
            <Ruler size={17} />
            Medidas opcionais
          </summary>

          <div className="ff-progress-measurements-grid">
            {MEASUREMENT_FIELDS.map((field) => (
              <Input
                key={field.key}
                label={`${field.label} (${field.unit})`}
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={draft.measurements[field.key] || ''}
                onChange={(event) => onMeasurementChange(field.key, event.target.value)}
                placeholder="Opcional"
              />
            ))}
          </div>
        </details>

        <Textarea
          label="Observação opcional"
          rows={3}
          value={draft.note}
          onChange={(event) => onDraftChange('note', event.target.value)}
          placeholder="Ex: final do cutting, foto em jejum..."
        />

        <div className="ff-progress-privacy-note">
          <LockKeyhole size={16} />
          <span>Suas fotos são privadas e usadas apenas para acompanhar seu progresso.</span>
        </div>

        <div className="ff-progress-photo-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || processing || !imageState?.file} className="w-full">
            {saving ? <Loader2 size={17} className="animate-spin" /> : <ImagePlus size={17} />}
            {saving ? 'Salvando foto...' : 'Salvar foto'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function ProgressPhotosInsights({ insights }) {
  return (
    <Card className="ff-progress-insights-card">
      <div className="ff-section-heading-inline">
        <span><Sparkles size={18} /></span>
        <div>
          <h2>Insights</h2>
          <p>Sem análise automática do corpo, apenas dados registrados por você.</p>
        </div>
      </div>

      <div className="ff-progress-insights-list">
        {insights.map((insight) => (
          <p key={insight} className="photo-insight">{insight}</p>
        ))}
      </div>
    </Card>
  )
}

export function ProgressPhotosCompare({
  photos,
  beforeId,
  afterId,
  comparisonSummary,
  onBeforeChange,
  onAfterChange,
  onSelectPhoto,
}) {
  if (photos.length < 2) {
    return (
      <Card className="ff-progress-compare-card">
        <div className="ff-section-heading-inline">
          <span><Columns2 size={18} /></span>
          <div>
            <h2>Comparar evolução</h2>
            <p>Adicione pelo menos duas fotos para comparar sua evolução.</p>
          </div>
        </div>
      </Card>
    )
  }

  const selectedPhotos = [comparisonSummary?.before, comparisonSummary?.after].filter(Boolean)

  return (
    <Card className="ff-progress-compare-card">
      <div className="ff-section-heading-inline">
        <span><Columns2 size={18} /></span>
        <div>
          <h2>Comparar evolução</h2>
          <p>Priorize fotos do mesmo ângulo para uma comparação mais justa.</p>
        </div>
      </div>

      <div className="ff-progress-compare-selects">
        <Select label="Foto inicial" value={beforeId} onChange={(event) => onBeforeChange(event.target.value)}>
          <option value="">Escolher foto</option>
          {photos.map((photo) => (
            <option key={photo.id} value={photo.id}>{formatDate(photo.date)} • {getAngleLabel(photo.angle)}</option>
          ))}
        </Select>

        <Select label="Foto atual" value={afterId} onChange={(event) => onAfterChange(event.target.value)}>
          <option value="">Escolher foto</option>
          {photos.map((photo) => (
            <option key={photo.id} value={photo.id}>{formatDate(photo.date)} • {getAngleLabel(photo.angle)}</option>
          ))}
        </Select>
      </div>

      {selectedPhotos.length === 2 ? (
        <>
          <div className="ff-progress-compare-summary">
            <span>{comparisonSummary.days !== null ? `${Math.abs(comparisonSummary.days)} dia(s) entre as fotos` : 'Comparação lado a lado'}</span>
            {comparisonSummary.weightDiff !== null && (
              <span>Peso: {comparisonSummary.weightDiff > 0 ? '+' : ''}{comparisonSummary.weightDiff.toFixed(1)} kg</span>
            )}
            <span>{getAngleLabel(comparisonSummary.before.angle)} → {getAngleLabel(comparisonSummary.after.angle)}</span>
          </div>

          <div className="ff-progress-compare-grid">
            {selectedPhotos.map((photo, index) => (
              <button key={photo.id} type="button" onClick={() => onSelectPhoto(photo)}>
                <span>{index === 0 ? 'Antes' : 'Depois'}</span>
                <img src={photo.imageUrl} alt={`Foto ${index === 0 ? 'inicial' : 'atual'}`} />
                <strong>{formatDate(photo.date)}</strong>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="ff-progress-muted-box">Escolha duas fotos para montar a comparação.</p>
      )}
    </Card>
  )
}

function ProgressPhotoCard({ photo, onSelectPhoto, onStartCompare, onEditPhoto, onDeletePhoto }) {
  return (
    <Card className="photo-card ff-progress-photo-card p-0">
      <button type="button" className="ff-progress-photo-card__image" onClick={() => onSelectPhoto(photo)}>
        <img src={photo.imageUrl} alt={`Foto de progresso - ${getAngleLabel(photo.angle)}`} />
        <Badge variant="purple">{getAngleLabel(photo.angle)}</Badge>
        <span><ZoomIn size={16} /> Ver foto</span>
      </button>

      <div className="ff-progress-photo-card__body">
        <div className="ff-progress-photo-card__topline">
          <div>
            <h3 className="photo-card__title">{formatLongDate(photo.date)}</h3>
            <p><CalendarDays size={14} /> {formatDate(photo.date)}</p>
          </div>

          <div className="ff-photo-options">
            <MoreVertical size={18} />
            <div>
              <button type="button" onClick={() => onSelectPhoto(photo)}><ZoomIn size={14} /> Ver foto</button>
              <button type="button" onClick={() => onStartCompare(photo)}><Columns2 size={14} /> Comparar</button>
              <button type="button" onClick={() => onEditPhoto(photo)}><Edit3 size={14} /> Editar informações</button>
              <button type="button" onClick={() => onDeletePhoto(photo.id)}><Trash2 size={14} /> Excluir</button>
            </div>
          </div>
        </div>

        <MeasurementSummary photo={photo} />

        {photo.note && (
          <p className="photo-card__description">{photo.note}</p>
        )}

        {photo.storage === 'local' && (
          <div className="ff-progress-local-badge">
            <EyeOff size={14} /> Fotos salvas neste dispositivo/app.
          </div>
        )}
      </div>
    </Card>
  )
}

export function ProgressPhotosTimeline({ groupedPhotos, loading, hasPhotos, onSelectPhoto, onStartCompare, onEditPhoto, onDeletePhoto, onAddPhoto }) {
  if (loading) {
    return (
      <Card>
        <div className="ff-loading-row"><Loader2 size={18} className="animate-spin" /> Carregando fotos...</div>
      </Card>
    )
  }

  if (!hasPhotos) {
    return (
      <Card>
        <EmptyState
          title="Nenhuma foto registrada ainda"
          description="Adicione fotos de progresso para comparar sua evolução visual ao longo do tempo."
          action={(
            <Button type="button" onClick={onAddPhoto}>
              <ImagePlus size={17} />
              Adicionar primeira foto
            </Button>
          )}
        />
      </Card>
    )
  }

  return (
    <section className="ff-progress-timeline">
      <div className="ff-section-heading-inline">
        <span><CalendarDays size={18} /></span>
        <div>
          <h2>Timeline de fotos</h2>
          <p>Histórico por data, com miniaturas e medidas opcionais.</p>
        </div>
      </div>

      <div className="ff-progress-timeline__groups">
        {groupedPhotos.map((group) => (
          <div key={group.dateKey} className="ff-progress-timeline__group">
            <h3>{group.title}</h3>
            <div className="ff-progress-photo-grid">
              {group.photos.map((photo) => (
                <ProgressPhotoCard
                  key={photo.id}
                  photo={photo}
                  onSelectPhoto={onSelectPhoto}
                  onStartCompare={onStartCompare}
                  onEditPhoto={onEditPhoto}
                  onDeletePhoto={onDeletePhoto}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ProgressPhotoLightbox({ photo, photosCount, onClose, onPrevious, onNext, onStartCompare, onDeletePhoto }) {
  if (!photo) return null

  return (
    <div className="ff-progress-lightbox" role="dialog" aria-modal="true" aria-label="Visualização da foto">
      <button type="button" className="ff-progress-lightbox__backdrop" onClick={onClose} aria-label="Fechar foto" />

      <div className="ff-progress-lightbox__panel">
        <div className="ff-progress-lightbox__image-wrap">
          <img src={photo.imageUrl} alt={`Foto de progresso - ${getAngleLabel(photo.angle)}`} />

          {photosCount > 1 && (
            <>
              <button type="button" className="ff-progress-lightbox__nav ff-progress-lightbox__nav--left" onClick={onPrevious} aria-label="Foto anterior">
                <ChevronLeft size={22} />
              </button>
              <button type="button" className="ff-progress-lightbox__nav ff-progress-lightbox__nav--right" onClick={onNext} aria-label="Próxima foto">
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>

        <aside className="ff-progress-lightbox__details">
          <button type="button" className="ff-progress-lightbox__close" onClick={onClose} aria-label="Fechar">
            <X size={19} />
          </button>

          <Badge variant="purple">{getAngleLabel(photo.angle)}</Badge>
          <h2>{formatLongDate(photo.date)}</h2>
          <p>Registro privado da sua evolução visual.</p>

          <MeasurementSummary photo={photo} />

          {photo.note && <div className="ff-progress-lightbox__note">{photo.note}</div>}

          <div className="ff-progress-lightbox__actions">
            <Button type="button" variant="secondary" onClick={() => onStartCompare(photo)} className="w-full">
              <Columns2 size={17} /> Comparar
            </Button>
            <Button type="button" variant="danger" onClick={() => onDeletePhoto(photo.id)} className="w-full">
              <Trash2 size={17} /> Excluir
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function ProgressPhotosPrivacyCard({ source }) {
  return (
    <Card className="ff-progress-privacy-card">
      <div className="ff-section-heading-inline">
        <span><ShieldCheck size={18} /></span>
        <div>
          <h2>Privacidade</h2>
          <p>
            Suas fotos são privadas e usadas apenas para acompanhar seu progresso.
            {source === 'local' ? ' Fotos salvas neste dispositivo/app.' : ' Quando sincronizado, o app usa o padrão real de armazenamento do ForgeFlow.'}
          </p>
        </div>
      </div>
    </Card>
  )
}

export function ProgressPhotoEditSheet({ open, draft, onClose, onDraftChange, onMeasurementChange, onSubmit }) {
  if (!open) return null

  return (
    <div className="ff-progress-photo-modal" role="dialog" aria-modal="true" aria-label="Editar foto de progresso">
      <button type="button" className="ff-progress-photo-modal__backdrop" onClick={onClose} aria-label="Fechar" />

      <form className="ff-progress-photo-modal__panel ff-progress-photo-modal__panel--compact" onSubmit={onSubmit}>
        <header className="ff-progress-photo-modal__header">
          <div>
            <span>Editar</span>
            <h2>Editar informações</h2>
            <p>Altere data, ângulo, observação e medidas sem trocar a imagem.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <div className="ff-progress-form-grid">
          <Input label="Data" type="date" value={draft.date} onChange={(event) => onDraftChange('date', event.target.value)} />
          <Select label="Ângulo" value={draft.angle} onChange={(event) => onDraftChange('angle', event.target.value)}>
            {PHOTO_ANGLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <Input label="Peso corporal" type="number" min="0" step="0.1" inputMode="decimal" value={draft.bodyWeight} onChange={(event) => onDraftChange('bodyWeight', event.target.value)} />
        </div>

        <details className="ff-progress-measurements-details" open>
          <summary><Ruler size={17} /> Medidas opcionais</summary>
          <div className="ff-progress-measurements-grid">
            {MEASUREMENT_FIELDS.map((field) => (
              <Input
                key={field.key}
                label={`${field.label} (${field.unit})`}
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={draft.measurements[field.key] || ''}
                onChange={(event) => onMeasurementChange(field.key, event.target.value)}
              />
            ))}
          </div>
        </details>

        <Textarea label="Observação" rows={3} value={draft.note} onChange={(event) => onDraftChange('note', event.target.value)} />

        <div className="ff-progress-photo-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">Cancelar</Button>
          <Button type="submit" className="w-full"><Edit3 size={17} /> Salvar alterações</Button>
        </div>
      </form>
    </div>
  )
}

export function ProgressMeasurementsOverview({ latestPhoto }) {
  if (!latestPhoto) return null

  return (
    <Card className="ff-progress-measures-card">
      <div className="ff-section-heading-inline">
        <span><Scale size={18} /></span>
        <div>
          <h2>Medidas</h2>
          <p>Resumo da última foto com medidas preenchidas.</p>
        </div>
      </div>
      <MeasurementSummary photo={latestPhoto} />
    </Card>
  )
}
