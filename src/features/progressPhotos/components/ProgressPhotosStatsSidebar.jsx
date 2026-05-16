import { CalendarDays, Camera, Columns2, ImagePlus } from 'lucide-react'

import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import { formatDate } from '../progressPhotosUtils'

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
