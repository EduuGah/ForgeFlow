import { ChevronLeft, ChevronRight, Columns2, Trash2, X } from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { formatLongDate, getAngleLabel } from '../progressPhotosUtils'

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
