import { ImageUp, Save, Trash2, UserRound } from 'lucide-react'

import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'


function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

async function compressAvatarImage(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem válido.')
  }

  if (file.size > 6 * 1024 * 1024) {
    throw new Error('A imagem precisa ter no máximo 6 MB.')
  }

  const dataUrl = await readFileAsDataUrl(file)
  const image = new Image()

  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = () => reject(new Error('Não foi possível processar a imagem.'))
    image.src = dataUrl
  })

  const maxSize = 512
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', 0.82)
}

export default function ProfileEditModal({
  open,
  profile,
  onClose,
  onSave,
  onUpdateField,
}) {
  async function handleAvatarFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      const compressedAvatar = await compressAvatarImage(file)
      onUpdateField('avatarUrl', compressedAvatar)
    } catch (error) {
      window.alert(error.message || 'Não foi possível carregar a foto.')
    } finally {
      event.target.value = ''
    }
  }

  if (!open) return null

  return (
    <div className="ff-profile-edit-modal fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 px-4 pb-4 backdrop-blur-sm sm:items-center sm:py-6">
      <div className="ff-profile-edit-modal__panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-zinc-800 bg-[#121212] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--ff-accent-text)]">
              Editar perfil
            </p>

            <h2 className="mt-1 text-2xl font-black">Dados do atleta</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Essas informações ficam salvas na sua conta.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xl font-bold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name || 'Foto de perfil'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <UserRound size={34} />
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-zinc-200">Foto de perfil</p>

                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Selecione uma imagem do seu celular ou computador. O ForgeFlow comprime a foto antes de salvar para carregar rápido no app.
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 text-sm font-black text-[var(--ff-accent-text)] transition hover:bg-[var(--ff-card-hover)]">
                    <ImageUp size={17} />
                    Selecionar foto
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={handleAvatarFileChange}
                    />
                  </label>

                  {profile.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => onUpdateField('avatarUrl', '')}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                    >
                      <Trash2 size={16} />
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Input
            label="Nome"
            placeholder="Seu nome"
            value={profile.name}
            onChange={(event) => onUpdateField('name', event.target.value)}
          />

          <div>
            <Input
              label="Altura em cm"
              inputMode="numeric"
              placeholder="Ex: 175"
              value={profile.height}
              onChange={(event) => {
                const value = event.target.value.replace(/[^\d]/g, '')
                onUpdateField('height', value)
              }}
            />

            <p className="mt-2 text-xs text-zinc-500">
              Use centímetros. Exemplo: 1,75m = 175.
            </p>
          </div>

          <div>
            <Input
              label="Peso atual em kg"
              placeholder="Ex: 72,5"
              value={profile.currentWeight}
              onChange={(event) => {
                const value = event.target.value.replace(/[^\d,.]/g, '')
                onUpdateField('currentWeight', value)
              }}
            />

            <p className="mt-2 text-xs text-zinc-500">
              Esse é o peso atual do perfil. Para alimentar o gráfico, use o card “Registrar peso”.
            </p>
          </div>

          <Select
            label="Objetivo"
            value={profile.goal}
            onChange={(event) => onUpdateField('goal', event.target.value)}
          >
            <option value="">Selecione</option>
            <option value="Bulking">Bulking</option>
            <option value="Cutting">Cutting</option>
            <option value="Recomposição">Recomposição</option>
            <option value="Força">Força</option>
            <option value="Hipertrofia">Hipertrofia</option>
            <option value="Emagrecimento">Emagrecimento</option>
            <option value="Condicionamento">Condicionamento</option>
          </Select>

          <Select
            label="Nível"
            value={profile.experience}
            onChange={(event) => onUpdateField('experience', event.target.value)}
          >
            <option value="">Selecione</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
          </Select>

          <Select
            label="Meta semanal"
            value={profile.weeklyTarget}
            onChange={(event) => onUpdateField('weeklyTarget', event.target.value)}
          >
            <option value="">Selecione</option>
            <option value="2 treinos">2 treinos</option>
            <option value="3 treinos">3 treinos</option>
            <option value="4 treinos">4 treinos</option>
            <option value="5 treinos">5 treinos</option>
            <option value="6 treinos">6 treinos</option>
          </Select>

          <Input
            label="Divisão preferida"
            placeholder="Ex: Push Pull Legs"
            value={profile.preferredSplit}
            onChange={(event) => onUpdateField('preferredSplit', event.target.value)}
          />
        </div>

        <div className="mt-4">
          <Textarea
            label="Notas pessoais"
            placeholder="Ex: foco em força no supino, melhorar cardio, evitar dor no ombro..."
            rows={4}
            value={profile.notes}
            onChange={(event) => onUpdateField('notes', event.target.value)}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button type="button" onClick={onSave} className="w-full">
            <Save size={17} />
            Salvar alterações
          </Button>

          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
