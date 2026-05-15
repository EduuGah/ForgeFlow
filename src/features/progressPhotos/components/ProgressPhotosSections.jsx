import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Columns2,
  ImagePlus,
  Maximize2,
  Search,
  Trash2,
  Weight,
  X,
} from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import { formatDate, formatLongDate, getAngleLabel } from '../progressPhotosUtils'

export function ProgressPhotosStats({ stats }) {
  return (
    <section className="grid grid-cols-3 gap-2 sm:gap-4">
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--ff-muted)]">Fotos</p>
          <Camera size={20} className="text-[var(--ff-accent-text)]" />
        </div>

        <h2 className="mt-2 text-2xl font-black sm:text-3xl text-[var(--ff-text)]">
          {stats.total}
        </h2>

        <p className="mt-2 text-xs text-[var(--ff-muted)]">registros salvos</p>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--ff-muted)]">Ângulos</p>
          <ImagePlus size={20} className="text-[var(--ff-accent-text)]" />
        </div>

        <h2 className="mt-2 text-2xl font-black sm:text-3xl text-[var(--ff-text)]">
          {stats.angles}
        </h2>

        <p className="mt-2 text-xs text-[var(--ff-muted)]">tipos registrados</p>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--ff-muted)]">Última foto</p>
          <CalendarDays size={20} className="text-[var(--ff-accent-text)]" />
        </div>

        <h2 className="mt-2 text-lg font-black text-[var(--ff-text)] sm:text-2xl">
          {stats.lastDate ? formatDate(stats.lastDate) : '—'}
        </h2>

        <p className="mt-2 text-xs text-[var(--ff-muted)]">registro mais recente</p>
      </Card>
    </section>
  )
}

export function ProgressPhotosSidebar({
  file,
  date,
  angle,
  weight,
  note,
  uploading,
  compareMode,
  selectedCompareIds,
  onSubmit,
  onFileChange,
  onDateChange,
  onAngleChange,
  onWeightChange,
  onNoteChange,
  onToggleCompareMode,
}) {
  return (
    <aside className="space-y-4 sm:space-y-6">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
            <ImagePlus size={22} />
          </div>

          <div>
            <h2 className="text-xl font-black text-[var(--ff-text)]">Nova foto</h2>
            <p className="text-sm text-[var(--ff-muted)]">Envie JPG, PNG ou WEBP até 5MB.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-5 text-center transition hover:border-[var(--ff-accent)]">
            <Camera size={28} className="text-[var(--ff-accent-text)]" />

            <span className="mt-2 text-sm font-black text-[var(--ff-text)]">
              {file ? file.name : 'Selecionar foto'}
            </span>

            <span className="mt-1 text-xs text-[var(--ff-muted)]">Clique para escolher uma imagem</span>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
              className="hidden"
            />
          </label>

          <Input label="Data" type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />

          <Select label="Ângulo" value={angle} onChange={(event) => onAngleChange(event.target.value)}>
            <option value="front">Frente</option>
            <option value="side">Lado</option>
            <option value="back">Costas</option>
            <option value="other">Outro</option>
          </Select>

          <Input
            label="Peso no dia"
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={(event) => onWeightChange(event.target.value)}
            placeholder="Ex: 72.5"
          />

          <Textarea
            label="Observação"
            rows={4}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Ex: início do cutting, foto em jejum..."
          />

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? 'Enviando...' : 'Salvar foto'}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
            <Columns2 size={22} />
          </div>

          <div>
            <h2 className="text-xl font-black text-[var(--ff-text)]">Comparação rápida</h2>
            <p className="text-sm text-[var(--ff-muted)]">Selecione duas fotos na galeria.</p>
          </div>
        </div>

        <Button
          type="button"
          variant={compareMode ? 'primary' : 'secondary'}
          onClick={onToggleCompareMode}
          className="mt-5 w-full"
        >
          <Columns2 size={17} />
          {compareMode ? 'Comparação ativa' : 'Comparar fotos'}
        </Button>

        <div className="mt-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">Selecionadas</p>
          <p className="mt-1 text-sm font-black text-[var(--ff-text)]">{selectedCompareIds.length}/2 fotos</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--ff-muted)]">
            Ative a comparação e clique em duas fotos. Nada pesado: o app só mostra as duas imagens lado a lado.
          </p>
        </div>
      </Card>
    </aside>
  )
}

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

export function ProgressPhotoLightbox({
  selectedPhoto,
  filteredPhotosCount,
  onClose,
  onPrevious,
  onNext,
  onCompare,
  onDelete,
}) {
  if (!selectedPhoto) return null

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-black/88 p-2 backdrop-blur-sm sm:p-4">
      <button type="button" className="fixed inset-0" onClick={onClose} aria-label="Fechar foto" />

      <div className="relative mx-auto my-2 grid w-full max-w-6xl overflow-hidden rounded-[1.6rem] border border-white/10 bg-[var(--ff-card)] shadow-2xl sm:my-6 sm:rounded-3xl lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative flex min-h-[58dvh] items-center justify-center bg-black sm:min-h-[380px]">
          <img
            src={selectedPhoto.imageUrl}
            alt={`Foto de evolução - ${getAngleLabel(selectedPhoto.angle)}`}
            className="max-h-[64dvh] w-full object-contain sm:max-h-[86vh]"
          />

          {filteredPhotosCount > 1 && (
            <>
              <button
                type="button"
                onClick={onPrevious}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                aria-label="Foto anterior"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                type="button"
                onClick={onNext}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                aria-label="Próxima foto"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>

        <aside className="relative max-h-[42dvh] overflow-y-auto p-4 sm:max-h-none sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]"
            aria-label="Fechar popup"
          >
            <X size={18} />
          </button>

          <div className="pr-12">
            <Badge variant="purple">{getAngleLabel(selectedPhoto.angle)}</Badge>

            <h2 className="mt-3 text-xl font-black text-[var(--ff-text)] sm:mt-4 sm:text-2xl">
              {formatLongDate(selectedPhoto.date)}
            </h2>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">Registro detalhado da foto.</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-1 sm:gap-3">
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">Data</p>
              <p className="mt-1 font-black text-[var(--ff-text)]">{formatLongDate(selectedPhoto.date)}</p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">Ângulo</p>
              <p className="mt-1 font-black text-[var(--ff-text)]">{getAngleLabel(selectedPhoto.angle)}</p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">Peso no dia</p>
              <p className="mt-1 font-black text-[var(--ff-text)]">
                {selectedPhoto.weight !== '' && selectedPhoto.weight !== null ? `${selectedPhoto.weight} kg` : 'Não informado'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">Observação</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[var(--ff-text)]">
                {selectedPhoto.note || 'Nenhuma observação adicionada.'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
            <Button type="button" variant="secondary" onClick={onCompare} className="flex-1">
              <Columns2 size={17} />
              Comparar
            </Button>

            <Button type="button" variant="danger" onClick={onDelete} className="flex-1">
              <Trash2 size={17} />
              Excluir
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
