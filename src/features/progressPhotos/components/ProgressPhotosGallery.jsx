import { CalendarDays, Maximize2, Search, Trash2, Weight, X } from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import Select from '../../../components/ui/Select'
import { formatDate, getAngleLabel } from '../progressPhotosUtils'

function ComparisonSummaryCard({ comparisonSummary, onSelectPhoto }) {
  if (!comparisonSummary) return null

  return (
    <Card>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-[var(--ff-text)]">Comparação</h2>

          <p className="mt-1 text-sm text-[var(--ff-muted)]">
            {comparisonSummary.days !== null
              ? `${Math.abs(comparisonSummary.days)} dia(s) entre as fotos`
              : 'Compare duas fotos lado a lado'}
            {comparisonSummary.hasWeights && (
              <>
                {' '}• diferença de peso:{' '}
                <span className="font-black text-[var(--ff-accent-text)]">
                  {comparisonSummary.weightDiff > 0 ? '+' : ''}
                  {comparisonSummary.weightDiff.toFixed(1)} kg
                </span>
              </>
            )}
          </p>
        </div>

        <Badge variant="purple">
          {getAngleLabel(comparisonSummary.before.angle)} → {getAngleLabel(comparisonSummary.after.angle)}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[comparisonSummary.before, comparisonSummary.after].map((photo, index) => (
          <div key={photo.id} className="overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)]">
            <div className="flex items-center justify-between border-b border-[var(--ff-border)] p-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                  {index === 0 ? 'Antes' : 'Depois'}
                </p>
                <p className="text-sm font-black text-[var(--ff-text)]">{formatDate(photo.date)}</p>
              </div>

              <Badge variant="purple">{getAngleLabel(photo.angle)}</Badge>
            </div>

            <button type="button" onClick={() => onSelectPhoto(photo)} className="block aspect-[4/5] w-full overflow-hidden bg-[var(--ff-card)]">
              <img
                src={photo.imageUrl}
                alt={`Foto de comparação ${index + 1}`}
                className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
              />
            </button>

            <div className="p-3 text-sm text-[var(--ff-muted)]">
              {photo.weight !== '' && photo.weight !== null && (
                <p className="font-bold text-[var(--ff-text)]">{photo.weight} kg</p>
              )}
              {photo.note && <p className="mt-1 line-clamp-2">{photo.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ProgressPhotoCard({
  photo,
  compareMode,
  isSelectedForCompare,
  selectedCompareIds,
  onToggleComparePhoto,
  onSelectPhoto,
  onDeletePhoto,
}) {
  return (
    <Card
      className={[
        'relative overflow-hidden p-0 transition duration-200',
        isSelectedForCompare
          ? 'border-[var(--ff-accent)] ring-4 ring-[var(--ff-accent)]/25 shadow-[0_0_34px_var(--ff-accent-shadow)] scale-[1.01]'
          : 'hover:border-[var(--ff-accent-border)]/50 hover:shadow-[0_0_22px_var(--ff-accent-shadow)]/10',
      ].join(' ')}
    >
      {isSelectedForCompare && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-2 border-[var(--ff-accent)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]" />
      )}

      {isSelectedForCompare && (
        <div className="pointer-events-none absolute right-2 top-2 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_22px_var(--ff-accent-shadow)] sm:right-3 sm:top-3 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-base">
          ✓
        </div>
      )}

      <button
        type="button"
        onClick={() => (compareMode ? onToggleComparePhoto(photo.id) : onSelectPhoto(photo))}
        className="group relative block aspect-[3/4] w-full overflow-hidden bg-[var(--ff-surface-2)] sm:aspect-[4/5]"
      >
        <img
          src={photo.imageUrl}
          alt={`Foto de evolução - ${getAngleLabel(photo.angle)}`}
          className={[
            'h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]',
            isSelectedForCompare ? 'brightness-[0.82] saturate-110' : '',
          ].join(' ')}
        />

        {isSelectedForCompare && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--ff-accent-soft),transparent_62%)]" />
        )}

        <div className="absolute left-2 top-2 z-30 flex flex-wrap gap-1.5 pr-10 sm:left-3 sm:top-3 sm:gap-2 sm:pr-14">
          <Badge variant="purple">{getAngleLabel(photo.angle)}</Badge>

          {compareMode && (
            <span
              className={[
                'rounded-full border px-2.5 py-1 text-[11px] font-black shadow-sm backdrop-blur',
                isSelectedForCompare
                  ? 'border-white/30 bg-[var(--ff-accent)] text-white shadow-[0_0_18px_var(--ff-accent-shadow)]'
                  : 'border-white/30 bg-black/45 text-white',
              ].join(' ')}
            >
              {isSelectedForCompare ? `Selecionada ${selectedCompareIds.indexOf(photo.id) + 1}/2` : 'Selecionar'}
            </span>
          )}
        </div>

        {compareMode && !isSelectedForCompare && (
          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/20 bg-black/50 px-3 py-2 text-center text-xs font-black text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
            Clique para comparar
          </div>
        )}

        {!compareMode && (
          <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-black/45 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
            <Maximize2 size={17} />
          </div>
        )}
      </button>

      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--ff-text)] sm:gap-2 sm:text-sm">
              <CalendarDays size={16} />
              {formatDate(photo.date)}
            </p>

            {photo.weight !== '' && photo.weight !== null && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--ff-muted)] sm:mt-2 sm:gap-2 sm:text-sm">
                <Weight size={16} />
                {photo.weight} kg
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDeletePhoto(photo.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-[var(--ff-danger-text)] transition hover:bg-red-500/15 sm:h-10 sm:w-10 sm:rounded-2xl"
            aria-label="Excluir foto"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {photo.note && (
          <p className="mt-2 line-clamp-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-2 text-xs leading-relaxed text-[var(--ff-muted)] sm:mt-3 sm:line-clamp-3 sm:p-3 sm:text-sm">
            {photo.note}
          </p>
        )}
      </div>
    </Card>
  )
}

export function ProgressPhotosGallery({
  photos,
  filteredPhotos,
  photosGroupedByDate,
  search,
  angleFilter,
  compareMode,
  selectedCompareIds,
  comparisonSummary,
  onSearchChange,
  onAngleFilterChange,
  onClearFilters,
  onClearCompareSelection,
  onToggleComparePhoto,
  onSelectPhoto,
  onDeletePhoto,
}) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-[var(--ff-text)]">Galeria</h2>
            <p className="mt-1 text-sm text-[var(--ff-muted)]">Fotos agrupadas por dia para facilitar a comparação visual.</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_190px_auto]">
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-3 text-[var(--ff-muted)] shadow-sm">
              <Search size={17} />

              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar nota, data, peso..."
                className="w-full bg-transparent text-sm font-medium text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
              />

              {search && (
                <button type="button" onClick={() => onSearchChange('')} className="transition hover:text-[var(--ff-text)]">
                  <X size={16} />
                </button>
              )}
            </div>

            <Select value={angleFilter} onChange={(event) => onAngleFilterChange(event.target.value)}>
              <option value="">Todos os ângulos</option>
              <option value="front">Frente</option>
              <option value="side">Lado</option>
              <option value="back">Costas</option>
              <option value="other">Outro</option>
            </Select>

            {(search || angleFilter) && (
              <Button type="button" variant="secondary" onClick={onClearFilters}>
                Limpar
              </Button>
            )}
          </div>
        </div>

        {compareMode && (
          <div className="mt-5 rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black text-[var(--ff-text)]">Modo comparação ativado</p>
                <p className="mt-1 text-xs text-[var(--ff-muted)]">Clique em duas fotos para montar uma comparação lado a lado.</p>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={onClearCompareSelection}
                disabled={selectedCompareIds.length === 0}
              >
                Limpar seleção
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ComparisonSummaryCard comparisonSummary={comparisonSummary} onSelectPhoto={onSelectPhoto} />

      {filteredPhotos.length === 0 ? (
        <Card>
          <EmptyState
            title={photos.length === 0 ? 'Nenhuma foto salva' : 'Nenhuma foto encontrada'}
            description={
              photos.length === 0
                ? 'Envie sua primeira foto de evolução para acompanhar mudanças visuais com o tempo.'
                : 'Tente limpar os filtros ou buscar por outro termo.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {photosGroupedByDate.map((group) => (
            <section key={group.dateKey}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-[var(--ff-text)]">{group.title}</h3>
                  <p className="text-sm text-[var(--ff-muted)]">
                    {formatDate(group.dateKey)} • {group.photos.length} foto(s)
                  </p>
                </div>

                <Badge>{group.photos.length}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                {group.photos.map((photo) => (
                  <ProgressPhotoCard
                    key={photo.id}
                    photo={photo}
                    compareMode={compareMode}
                    isSelectedForCompare={selectedCompareIds.includes(photo.id)}
                    selectedCompareIds={selectedCompareIds}
                    onToggleComparePhoto={onToggleComparePhoto}
                    onSelectPhoto={onSelectPhoto}
                    onDeletePhoto={onDeletePhoto}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
