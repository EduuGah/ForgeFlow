import { FileImage, HelpCircle, LinkIcon, Upload, X } from 'lucide-react'

import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Textarea from '../../../components/ui/Textarea'

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <Card className="group overflow-hidden border border-[var(--ff-border)] bg-gradient-to-br from-[var(--ff-surface)] to-[var(--ff-input)] p-4 transition hover:border-[var(--ff-accent-border)]/30 hover:shadow-[0_0_24px_var(--ff-accent-shadow)]/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--ff-muted-2)]">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-black text-[var(--ff-text)]">
            {value}
          </h3>

          <p className="mt-2 text-xs font-semibold tracking-wide text-[var(--ff-accent-text)]">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)] transition group-hover:scale-105">
          <Icon size={22} />
        </div>
      </div>
    </Card>
  )
}

function FilterListButton({ active, title, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'w-full rounded-2xl border border-[var(--ff-accent-border)]/50 bg-[var(--ff-accent-soft)]/15 p-3 text-left shadow-[0_0_16px_var(--ff-accent-shadow)]/15'
          : 'w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 text-left transition hover:border-[var(--ff-accent-border)]/30 hover:bg-[var(--ff-card-hover)]'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={
            active
              ? 'font-bold text-[var(--ff-accent-text)]'
              : 'font-bold text-[var(--ff-text)]'
          }
        >
          {title}
        </span>

        <span className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-card)] px-2 py-1 text-[11px] font-bold text-[var(--ff-muted-2)]">
          {count}
        </span>
      </div>
    </button>
  )
}

function DetailMiniCard({ icon: Icon, title, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
      <div className="flex items-center gap-2">
        <div
          className={
            accent
              ? 'flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]'
              : 'flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--ff-surface)] text-[var(--ff-muted)]'
          }
        >
          <Icon size={16} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ff-muted-2)]">
          {title}
        </p>
      </div>

      <p className={accent ? 'mt-3 text-sm font-bold text-[var(--ff-accent-text)]' : 'mt-3 text-sm font-bold text-[var(--ff-text)]'}>
        {value}
      </p>
    </div>
  )
}

function HelperTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  helper,
  examples = [],
}) {
  return (
    <div>
      <Textarea
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
      />

      <div className="mt-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3">
        <div className="flex items-start gap-2">
          <HelpCircle
            size={16}
            className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]"
          />

          <div>
            <p className="text-xs leading-relaxed text-[var(--ff-muted)]">
              {helper}
            </p>

            {examples.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {examples.map((example) => (
                  <span
                    key={example}
                    className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ff-muted)]"
                  >
                    {example}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MediaUploader({
  mediaUrl,
  uploadedFileName,
  onUrlChange,
  onFileChange,
  onClear,
}) {
  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-semibold text-[var(--ff-text-soft)]">
        Imagem ou GIF do exercício
      </label>

      <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
          <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-white">
            {mediaUrl ? (
              <img
                src={mediaUrl}
                alt="Preview do exercício"
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="text-center text-zinc-900">
                <FileImage size={34} className="mx-auto" />

                <p className="mt-2 text-xs font-bold">
                  Preview
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--ff-accent-border)]/40 bg-[var(--ff-accent-soft)]/10 p-5 text-center transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-accent-soft)]/20">
              <Upload size={24} className="text-[var(--ff-accent-text)]" />

              <span className="mt-2 text-sm font-bold text-[var(--ff-text)]">
                Enviar imagem ou GIF
              </span>

              <span className="mt-1 text-xs leading-relaxed text-[var(--ff-muted-2)]">
                Use PNG, JPG, WEBP ou GIF para deixar o card mais visual.
              </span>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onFileChange}
                className="hidden"
              />
            </label>

            {uploadedFileName && (
              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-3">
                <p className="text-xs text-[var(--ff-muted-2)]">
                  Arquivo selecionado
                </p>

                <p className="mt-1 truncate text-sm font-bold text-[var(--ff-accent-text)]">
                  {uploadedFileName}
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--ff-muted-2)]">
                <LinkIcon size={14} />
                Ou use uma URL
              </div>

              <Input
                placeholder="Cole o link da imagem ou GIF"
                value={mediaUrl}
                onChange={onUrlChange}
              />
            </div>

            {mediaUrl && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
              >
                <X size={16} />
                Remover mídia
              </button>
            )}

            <p className="text-xs leading-relaxed text-[var(--ff-muted-2)]">
              Dica: prefira imagens leves para manter a biblioteca rápida e fluida.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


export {
  DetailMiniCard,
  FilterListButton,
  HelperTextarea,
  MediaUploader,
  StatCard,
}
