import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, ImageUp, Save, Trash2, UserRound, X } from 'lucide-react'

import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import { validateProfileFields } from '../profileUtils'

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
    throw new Error('Selecione uma imagem válida.')
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('A imagem precisa ter no máximo 8 MB.')
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
  const context = canvas.getContext('2d')

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', 0.82)
}

function AvatarPreview({ profile }) {
  const initial = String(profile.name || profile.username || 'F').slice(0, 1).toUpperCase()

  return (
    <div className="ff-profile-edit-avatar">
      {profile.avatarUrl ? (
        <img src={profile.avatarUrl} alt={profile.name || 'Foto de perfil'} loading="lazy" decoding="async" />
      ) : (
        <span>{initial || <UserRound size={32} />}</span>
      )}
    </div>
  )
}

export default function ProfileEditModal({ open, profile, saving = false, onClose, onSave, onUpdateField, onToast }) {
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const [errors, setErrors] = useState({})
  const [processingAvatar, setProcessingAvatar] = useState(false)

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    document.body.classList.add('ff-modal-open')

    return () => {
      document.body.classList.remove('ff-modal-open')
    }
  }, [open])

  async function handleAvatarFile(file) {
    if (!file) return

    setProcessingAvatar(true)
    onToast?.('info', 'Preparando imagem...', 'A foto será comprimida antes de salvar.')

    try {
      const compressedAvatar = await compressAvatarImage(file)
      onUpdateField('avatarUrl', compressedAvatar)
      onToast?.('success', 'Foto preparada', 'Agora salve o perfil para concluir.')
    } catch (error) {
      onToast?.('error', 'Não foi possível carregar a imagem', error.message || 'Escolha outra foto ou tente novamente.')
    } finally {
      setProcessingAvatar(false)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validation = validateProfileFields(profile)
    setErrors(validation.errors)

    if (!validation.ok) {
      onToast?.('error', 'Revise o perfil', 'Alguns campos precisam de ajuste antes de salvar.')
      return
    }

    await onSave()
  }

  if (!open || typeof document === 'undefined') return null

  const modal = (
    <div className="ff-profile-edit-modal" role="dialog" aria-modal="true">
      <button type="button" className="ff-profile-edit-modal__backdrop" aria-label="Fechar edição de perfil" onClick={onClose} />

      <form className="ff-profile-edit-modal__panel" onSubmit={handleSubmit}>
        <header className="ff-profile-edit-modal__header">
          <div>
            <span>Editar perfil</span>
            <h2>Dados do atleta</h2>
            <p>Informações opcionais para personalizar sua experiência no ForgeFlow.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar edição">
            <X size={20} />
          </button>
        </header>

        <div className="ff-profile-edit-modal__body">
          <section className="ff-profile-edit-photo-card">
            <AvatarPreview profile={profile} />

            <div className="min-w-0 flex-1">
              <strong>Foto de perfil</strong>
              <p>Use câmera ou galeria. A imagem é reduzida para ficar leve no APK.</p>

              <div className="ff-profile-edit-photo-card__actions">
                <Button type="button" variant="secondary" onClick={() => cameraInputRef.current?.click()} disabled={processingAvatar}>
                  <Camera size={16} />
                  Tirar foto
                </Button>
                <Button type="button" variant="secondary" onClick={() => galleryInputRef.current?.click()} disabled={processingAvatar}>
                  <ImageUp size={16} />
                  Galeria
                </Button>
                {profile.avatarUrl && (
                  <Button type="button" variant="danger" onClick={() => onUpdateField('avatarUrl', '')}>
                    <Trash2 size={16} />
                    Remover
                  </Button>
                )}
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                capture="environment"
                className="sr-only"
                onChange={(event) => handleAvatarFile(event.target.files?.[0])}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => handleAvatarFile(event.target.files?.[0])}
              />
            </div>
          </section>

          <div className="ff-profile-edit-grid">
            <Input
              label="Nome"
              placeholder="Seu nome"
              value={profile.name || ''}
              onChange={(event) => onUpdateField('name', event.target.value)}
            />
            <Input
              label="Usuário/apelido"
              placeholder="@usuario"
              value={profile.username || ''}
              onChange={(event) => onUpdateField('username', event.target.value)}
            />
            <Input
              label="Altura em cm"
              inputMode="numeric"
              placeholder="Ex: 175"
              value={profile.height || ''}
              error={errors.height}
              onChange={(event) => onUpdateField('height', event.target.value.replace(/[^\d]/g, ''))}
            />
            <Input
              label="Peso em kg"
              inputMode="decimal"
              placeholder="Ex: 72,5"
              value={profile.weight || ''}
              error={errors.weight}
              onChange={(event) => onUpdateField('weight', event.target.value.replace(/[^\d,.]/g, ''))}
            />
            <Select
              label="Objetivo"
              value={profile.goal || ''}
              onChange={(event) => onUpdateField('goal', event.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Ganhar massa">Ganhar massa</option>
              <option value="Perder gordura">Perder gordura</option>
              <option value="Manter forma">Manter forma</option>
              <option value="Força">Força</option>
              <option value="Condicionamento">Condicionamento</option>
              <option value="Saúde">Saúde</option>
              <option value="Outro">Outro</option>
            </Select>
            <Select
              label="Nível de treino"
              value={profile.trainingLevel || ''}
              onChange={(event) => onUpdateField('trainingLevel', event.target.value)}
            >
              <option value="">Selecione</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </Select>
            <Select
              label="Meta semanal"
              value={profile.weeklyTarget || ''}
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
              value={profile.preferredSplit || ''}
              onChange={(event) => onUpdateField('preferredSplit', event.target.value)}
            />
          </div>

          <Textarea
            label="Notas pessoais"
            placeholder="Ex: foco em força no supino, melhorar cardio, evitar dor no ombro..."
            rows={3}
            value={profile.notes || ''}
            onChange={(event) => onUpdateField('notes', event.target.value)}
          />
        </div>

        <footer className="ff-profile-edit-modal__footer">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">
            Fechar
          </Button>
          <Button type="submit" className="w-full" disabled={saving || processingAvatar}>
            <Save size={17} />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </footer>
      </form>
    </div>
  )

  return createPortal(modal, document.body)
}
