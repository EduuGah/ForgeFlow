import { useState } from 'react'
import { CalendarDays, Camera, Columns2, ImagePlus, X } from 'lucide-react'

import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import { formatDate } from '../progressPhotosUtils'

export function ProgressPhotosStats({ stats }) {
  return (
    <section className="ff-progress-photos-stats-grid grid grid-cols-3 gap-2 sm:gap-4">
      <Card className="ff-compact-stat-card p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--ff-muted)]">Fotos</p>
          <Camera size={20} className="text-[var(--ff-accent-text)]" />
        </div>

        <h2 className="mt-2 text-2xl font-black text-[var(--ff-text)] sm:text-3xl">
          {stats.total}
        </h2>

        <p className="mt-2 text-xs text-[var(--ff-muted)]">registros salvos</p>
      </Card>

      <Card className="ff-compact-stat-card p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--ff-muted)]">Angulos</p>
          <ImagePlus size={20} className="text-[var(--ff-accent-text)]" />
        </div>

        <h2 className="mt-2 text-2xl font-black text-[var(--ff-text)] sm:text-3xl">
          {stats.angles}
        </h2>

        <p className="mt-2 text-xs text-[var(--ff-muted)]">tipos registrados</p>
      </Card>

      <Card className="ff-compact-stat-card p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--ff-muted)]">Ultima</p>
          <CalendarDays size={20} className="text-[var(--ff-accent-text)]" />
        </div>

        <h2 className="mt-2 text-lg font-black text-[var(--ff-text)] sm:text-2xl">
          {stats.lastDate ? formatDate(stats.lastDate) : '-'}
        </h2>

        <p className="mt-2 text-xs text-[var(--ff-muted)]">mais recente</p>
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
  const [isPhotoSheetOpen, setIsPhotoSheetOpen] = useState(false)

  const photoForm = (
    <form onSubmit={onSubmit} className="ff-progress-photo-form">
      <label className="ff-progress-photo-picker">
        <Camera size={28} />

        <span>
          {file ? file.name : 'Selecionar foto'}
        </span>

        <small>JPG, PNG ou WEBP ate 5MB</small>

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
          className="hidden"
        />
      </label>

      <Input
        label="Data"
        type="date"
        value={date}
        onChange={(event) => onDateChange(event.target.value)}
      />

      <Select label="Angulo" value={angle} onChange={(event) => onAngleChange(event.target.value)}>
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
        label="Observacao"
        rows={4}
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="Ex: inicio do cutting, foto em jejum..."
      />

      <Button type="submit" disabled={uploading} className="w-full">
        {uploading ? 'Enviando...' : 'Salvar foto'}
      </Button>
    </form>
  )

  return (
    <aside className="space-y-4 sm:space-y-6">
      <Card className="ff-progress-photo-launcher">
        <div className="ff-progress-photo-launcher__copy">
          <span>
            <ImagePlus size={21} />
          </span>

          <div>
            <h2>Nova foto</h2>
            <p>Abra uma tela limpa para enviar a foto.</p>
          </div>
        </div>

        <Button type="button" onClick={() => setIsPhotoSheetOpen(true)} className="w-full">
          <ImagePlus size={17} />
          Adicionar foto
        </Button>
      </Card>

      <Card className="ff-progress-photo-compare-card">
        <div className="ff-progress-photo-launcher__copy">
          <span>
            <Columns2 size={21} />
          </span>

          <div>
            <h2>Comparacao rapida</h2>
            <p>{selectedCompareIds.length}/2 fotos selecionadas</p>
          </div>
        </div>

        <Button
          type="button"
          variant={compareMode ? 'primary' : 'secondary'}
          onClick={onToggleCompareMode}
          className="w-full"
        >
          <Columns2 size={17} />
          {compareMode ? 'Comparacao ativa' : 'Comparar fotos'}
        </Button>
      </Card>

      {isPhotoSheetOpen && (
        <div className="ff-progress-photo-sheet" role="dialog" aria-modal="true" aria-label="Nova foto">
          <button
            type="button"
            className="ff-progress-photo-sheet__backdrop"
            onClick={() => setIsPhotoSheetOpen(false)}
            aria-label="Fechar nova foto"
          />

          <div className="ff-progress-photo-sheet__panel">
            <header>
              <div>
                <span>Fotos</span>
                <h2>Nova foto</h2>
                <p>Registre data, angulo e peso sem poluir a galeria.</p>
              </div>

              <button type="button" onClick={() => setIsPhotoSheetOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </header>

            {photoForm}
          </div>
        </div>
      )}
    </aside>
  )
}
