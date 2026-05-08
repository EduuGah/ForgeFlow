import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Camera,
  ImagePlus,
  Search,
  Trash2,
  Weight,
  X,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Toast from '../components/ui/Toast'
import ConfirmModal from '../components/ui/ConfirmModal'

import { useAuth } from '../context/AuthContext'
import { apiFetch, apiFormData } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

function normalizeProgressPhotoFromApi(photo) {
  const rawDate = photo.date || photo.createdAt

  return {
    ...photo,
    id: photo._id || photo.id,
    imageUrl: photo.imageUrl || '',
    publicId: photo.publicId || '',
    date: rawDate ? String(rawDate).slice(0, 10) : '',
    angle: photo.angle || 'front',
    weight: photo.weight ?? '',
    note: photo.note || '',
  }
}

function getAngleLabel(angle) {
  const labels = {
    front: 'Frente',
    side: 'Lado',
    back: 'Costas',
    other: 'Outro',
  }

  return labels[angle] || 'Outro'
}

function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function ProgressPhotos() {
  const { user } = useAuth()

  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('local')

  const [file, setFile] = useState(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [angle, setAngle] = useState('front')
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')

  const [search, setSearch] = useState('')
  const [angleFilter, setAngleFilter] = useState('')

  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!user) return

    async function loadPhotos() {
      setLoading(true)

      const cachedPhotos = getUserStorageData(user, 'progress-photos', [])

      try {
        const photosFromApi = await apiFetch('/progress-photos')

        const normalizedPhotos = Array.isArray(photosFromApi)
          ? photosFromApi.map(normalizeProgressPhotoFromApi)
          : []

        setPhotos(normalizedPhotos)
        saveUserStorageData(user, 'progress-photos', normalizedPhotos)
        setSource('database')
      } catch (error) {
        console.error(error)

        setPhotos(cachedPhotos)
        setSource('local')
      } finally {
        setLoading(false)
      }
    }

    loadPhotos()
  }, [user])

  function showToast(type, title, message = '') {
    setToast({ type, title, message })

    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const filteredPhotos = useMemo(() => {
    const term = search.toLowerCase().trim()

    return photos.filter((photo) => {
      const matchesSearch = term
        ? `${photo.note || ''} ${getAngleLabel(photo.angle)} ${photo.date}`
            .toLowerCase()
            .includes(term)
        : true

      const matchesAngle = angleFilter ? photo.angle === angleFilter : true

      return matchesSearch && matchesAngle
    })
  }, [photos, search, angleFilter])

  const stats = useMemo(() => {
    const angles = new Set(photos.map((photo) => photo.angle))
    const lastPhoto = photos[0]

    return {
      total: photos.length,
      angles: angles.size,
      lastDate: lastPhoto?.date || '',
    }
  }, [photos])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!file) {
      showToast('error', 'Imagem obrigatória', 'Selecione uma foto para enviar.')
      return
    }

    const formData = new FormData()

    formData.append('photo', file)
    formData.append('date', date)
    formData.append('angle', angle)
    formData.append('weight', weight)
    formData.append('note', note)

    setUploading(true)

    try {
      const createdPhotoFromApi = await apiFormData('/progress-photos', formData)
      const createdPhoto = normalizeProgressPhotoFromApi(createdPhotoFromApi)
      const updatedPhotos = [createdPhoto, ...photos]

      setPhotos(updatedPhotos)
      saveUserStorageData(user, 'progress-photos', updatedPhotos)

      setFile(null)
      setDate(new Date().toISOString().slice(0, 10))
      setAngle('front')
      setWeight('')
      setNote('')
      event.target.reset()

      showToast('success', 'Foto enviada', 'Sua foto de evolução foi salva.')
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao enviar',
        error.message || 'Não foi possível enviar a foto.'
      )
    } finally {
      setUploading(false)
    }
  }

  function handleDeletePhoto(photoId) {
    const photo = photos.find((item) => item.id === photoId)

    setConfirmModal({
      title: 'Excluir foto?',
      description: `A foto de ${getAngleLabel(photo?.angle)} será removida permanentemente.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch(`/progress-photos/${photoId}`, {
            method: 'DELETE',
          })

          const updatedPhotos = photos.filter((item) => item.id !== photoId)

          setPhotos(updatedPhotos)
          saveUserStorageData(user, 'progress-photos', updatedPhotos)
          setConfirmModal(null)

          showToast('success', 'Foto excluída', 'A foto foi removida.')
        } catch (error) {
          console.error(error)

          showToast(
            'error',
            'Erro ao excluir',
            error.message || 'Não foi possível excluir a foto.'
          )
        }
      },
    })
  }

  function clearFilters() {
    setSearch('')
    setAngleFilter('')
  }

  return (
    <>
      <PageHeader
        title="Fotos de evolução"
        description="Registre sua evolução corporal com fotos, peso, data e observações."
        action={
          <Badge variant={source === 'database' ? 'purple' : 'default'}>
            {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Local'}
          </Badge>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ff-muted)]">Fotos</p>
            <Camera size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">
            {stats.total}
          </h2>

          <p className="mt-2 text-xs text-[var(--ff-muted)]">
            registros salvos
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ff-muted)]">Ângulos</p>
            <ImagePlus size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-3xl font-black text-[var(--ff-text)]">
            {stats.angles}
          </h2>

          <p className="mt-2 text-xs text-[var(--ff-muted)]">
            tipos registrados
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--ff-muted)]">Última foto</p>
            <CalendarDays size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-[var(--ff-text)]">
            {stats.lastDate ? formatDate(stats.lastDate) : '—'}
          </h2>

          <p className="mt-2 text-xs text-[var(--ff-muted)]">
            registro mais recente
          </p>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                <ImagePlus size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black text-[var(--ff-text)]">
                  Nova foto
                </h2>

                <p className="text-sm text-[var(--ff-muted)]">
                  Envie JPG, PNG ou WEBP até 5MB.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-5 text-center transition hover:border-[var(--ff-accent)]">
                <Camera size={28} className="text-[var(--ff-accent-text)]" />

                <span className="mt-2 text-sm font-black text-[var(--ff-text)]">
                  {file ? file.name : 'Selecionar foto'}
                </span>

                <span className="mt-1 text-xs text-[var(--ff-muted)]">
                  Clique para escolher uma imagem
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <Input
                label="Data"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />

              <Select
                label="Ângulo"
                value={angle}
                onChange={(event) => setAngle(event.target.value)}
              >
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
                onChange={(event) => setWeight(event.target.value)}
                placeholder="Ex: 72.5"
              />

              <Textarea
                label="Observação"
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ex: início do cutting, foto em jejum..."
              />

              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? 'Enviando...' : 'Salvar foto'}
              </Button>
            </form>
          </Card>
        </aside>

        <div className="space-y-6">
          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-[var(--ff-text)]">
                  Galeria
                </h2>

                <p className="mt-1 text-sm text-[var(--ff-muted)]">
                  Compare suas fotos por data e ângulo.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
                <div className="flex h-11 items-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-[var(--ff-muted)]">
                  <Search size={17} />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nota ou data..."
                    className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="transition hover:text-[var(--ff-text)]"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <Select
                  value={angleFilter}
                  onChange={(event) => setAngleFilter(event.target.value)}
                >
                  <option value="">Todos os ângulos</option>
                  <option value="front">Frente</option>
                  <option value="side">Lado</option>
                  <option value="back">Costas</option>
                  <option value="other">Outro</option>
                </Select>

                {(search || angleFilter) && (
                  <Button type="button" variant="secondary" onClick={clearFilters}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </Card>

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
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden p-0">
                  <div className="aspect-[4/5] overflow-hidden bg-[var(--ff-surface-2)]">
                    <img
                      src={photo.imageUrl}
                      alt={`Foto de evolução - ${getAngleLabel(photo.angle)}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge variant="purple">
                          {getAngleLabel(photo.angle)}
                        </Badge>

                        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-[var(--ff-text)]">
                          <CalendarDays size={16} />
                          {formatDate(photo.date)}
                        </p>

                        {photo.weight !== '' && photo.weight !== null && (
                          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--ff-muted)]">
                            <Weight size={16} />
                            {photo.weight} kg
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-[var(--ff-danger-text)] transition hover:bg-red-500/15"
                        aria-label="Excluir foto"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    {photo.note && (
                      <p className="mt-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                        {photo.note}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </>
  )
}

export default ProgressPhotos
