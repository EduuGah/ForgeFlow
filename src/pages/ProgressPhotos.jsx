import { useEffect, useMemo, useState } from 'react'
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
    createdAt: photo.createdAt || rawDate || '',
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

  return new Date(`${String(dateString).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatLongDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(`${String(dateString).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getDateKey(dateString) {
  return String(dateString || '').slice(0, 10) || 'sem-data'
}

function getDateGroupTitle(dateString) {
  if (!dateString || dateString === 'sem-data') return 'Sem data'

  const date = new Date(`${dateString}T12:00:00`)
  const today = new Date()
  const yesterday = new Date()

  yesterday.setDate(today.getDate() - 1)

  const key = date.toISOString().slice(0, 10)
  const todayKey = today.toISOString().slice(0, 10)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)

  if (key === todayKey) return 'Hoje'
  if (key === yesterdayKey) return 'Ontem'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return null

  const start = new Date(`${String(startDate).slice(0, 10)}T12:00:00`)
  const end = new Date(`${String(endDate).slice(0, 10)}T12:00:00`)
  const diff = Math.round((end - start) / 86400000)

  return Number.isFinite(diff) ? diff : null
}

function sortPhotosByDateDesc(a, b) {
  const dateA = new Date(a.date || a.createdAt || 0)
  const dateB = new Date(b.date || b.createdAt || 0)

  return dateB - dateA
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
  const [compareMode, setCompareMode] = useState(false)
  const [selectedCompareIds, setSelectedCompareIds] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)

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
          ? photosFromApi.map(normalizeProgressPhotoFromApi).sort(sortPhotosByDateDesc)
          : []

        setPhotos(normalizedPhotos)
        saveUserStorageData(user, 'progress-photos', normalizedPhotos)
        setSource('database')
      } catch (error) {
        console.error(error)

        setPhotos(Array.isArray(cachedPhotos) ? cachedPhotos.sort(sortPhotosByDateDesc) : [])
        setSource('local')
      } finally {
        setLoading(false)
      }
    }

    loadPhotos()
  }, [user])

  useEffect(() => {
    if (!compareMode) {
      setSelectedCompareIds([])
    }
  }, [compareMode])

  function showToast(type, title, message = '') {
    setToast({ type, title, message })

    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const filteredPhotos = useMemo(() => {
    const term = search.toLowerCase().trim()

    return photos
      .filter((photo) => {
        const matchesSearch = term
          ? `${photo.note || ''} ${getAngleLabel(photo.angle)} ${photo.date} ${formatDate(photo.date)} ${photo.weight || ''}`
              .toLowerCase()
              .includes(term)
          : true

        const matchesAngle = angleFilter ? photo.angle === angleFilter : true

        return matchesSearch && matchesAngle
      })
      .sort(sortPhotosByDateDesc)
  }, [photos, search, angleFilter])

  const photosGroupedByDate = useMemo(() => {
    const groups = new Map()

    filteredPhotos.forEach((photo) => {
      const key = getDateKey(photo.date)

      if (!groups.has(key)) {
        groups.set(key, [])
      }

      groups.get(key).push(photo)
    })

    return Array.from(groups.entries()).map(([dateKey, items]) => ({
      dateKey,
      title: getDateGroupTitle(dateKey),
      photos: items,
    }))
  }, [filteredPhotos])

  const comparePhotos = useMemo(() => {
    return selectedCompareIds
      .map((id) => photos.find((photo) => photo.id === id))
      .filter(Boolean)
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
  }, [photos, selectedCompareIds])

  const comparisonSummary = useMemo(() => {
    if (comparePhotos.length !== 2) return null

    const [before, after] = comparePhotos
    const days = getDaysBetween(before.date, after.date)

    const beforeWeight = Number(before.weight)
    const afterWeight = Number(after.weight)
    const hasWeights = Number.isFinite(beforeWeight) && Number.isFinite(afterWeight)
    const weightDiff = hasWeights ? afterWeight - beforeWeight : null

    return {
      before,
      after,
      days,
      weightDiff,
      hasWeights,
    }
  }, [comparePhotos])

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
      const updatedPhotos = [createdPhoto, ...photos].sort(sortPhotosByDateDesc)

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
          setSelectedCompareIds((ids) => ids.filter((id) => id !== photoId))

          if (selectedPhoto?.id === photoId) {
            setSelectedPhoto(null)
          }

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

  function toggleComparePhoto(photoId) {
    setSelectedCompareIds((currentIds) => {
      if (currentIds.includes(photoId)) {
        return currentIds.filter((id) => id !== photoId)
      }

      if (currentIds.length >= 2) {
        return [currentIds[1], photoId]
      }

      return [...currentIds, photoId]
    })
  }

  function openPreviousPhoto() {
    if (!selectedPhoto) return

    const index = filteredPhotos.findIndex((photo) => photo.id === selectedPhoto.id)

    if (index === -1) return

    const previousPhoto = filteredPhotos[index - 1] || filteredPhotos[filteredPhotos.length - 1]

    setSelectedPhoto(previousPhoto)
  }

  function openNextPhoto() {
    if (!selectedPhoto) return

    const index = filteredPhotos.findIndex((photo) => photo.id === selectedPhoto.id)

    if (index === -1) return

    const nextPhoto = filteredPhotos[index + 1] || filteredPhotos[0]

    setSelectedPhoto(nextPhoto)
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

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                <Columns2 size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black text-[var(--ff-text)]">
                  Comparação rápida
                </h2>

                <p className="text-sm text-[var(--ff-muted)]">
                  Selecione duas fotos na galeria.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant={compareMode ? 'primary' : 'secondary'}
              onClick={() => setCompareMode(!compareMode)}
              className="mt-5 w-full"
            >
              <Columns2 size={17} />
              {compareMode ? 'Comparação ativa' : 'Comparar fotos'}
            </Button>

            <div className="mt-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                Selecionadas
              </p>

              <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                {selectedCompareIds.length}/2 fotos
              </p>

              <p className="mt-2 text-xs leading-relaxed text-[var(--ff-muted)]">
                Ative a comparação e clique em duas fotos. Nada pesado: o app só mostra as duas imagens lado a lado.
              </p>
            </div>
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
                  Fotos agrupadas por dia para facilitar a comparação visual.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
                <div className="flex h-12 items-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-3 text-[var(--ff-muted)] shadow-sm">
                  <Search size={17} />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar nota, data, peso..."
                    className="w-full bg-transparent text-sm font-medium text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
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

            {compareMode && (
              <div className="mt-5 rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-black text-[var(--ff-text)]">
                      Modo comparação ativado
                    </p>

                    <p className="mt-1 text-xs text-[var(--ff-muted)]">
                      Clique em duas fotos para montar uma comparação lado a lado.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedCompareIds([])}
                    disabled={selectedCompareIds.length === 0}
                  >
                    Limpar seleção
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {comparisonSummary && (
            <Card>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">
                    Comparação
                  </h2>

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
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)]"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--ff-border)] p-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-muted)]">
                          {index === 0 ? 'Antes' : 'Depois'}
                        </p>

                        <p className="text-sm font-black text-[var(--ff-text)]">
                          {formatDate(photo.date)}
                        </p>
                      </div>

                      <Badge variant="purple">
                        {getAngleLabel(photo.angle)}
                      </Badge>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(photo)}
                      className="block aspect-[4/5] w-full overflow-hidden bg-[var(--ff-card)]"
                    >
                      <img
                        src={photo.imageUrl}
                        alt={`Foto de comparação ${index + 1}`}
                        className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                      />
                    </button>

                    <div className="p-3 text-sm text-[var(--ff-muted)]">
                      {photo.weight !== '' && photo.weight !== null && (
                        <p className="font-bold text-[var(--ff-text)]">
                          {photo.weight} kg
                        </p>
                      )}

                      {photo.note && (
                        <p className="mt-1 line-clamp-2">
                          {photo.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

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
                      <h3 className="text-lg font-black text-[var(--ff-text)]">
                        {group.title}
                      </h3>

                      <p className="text-sm text-[var(--ff-muted)]">
                        {formatDate(group.dateKey)} • {group.photos.length} foto(s)
                      </p>
                    </div>

                    <Badge>
                      {group.photos.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {group.photos.map((photo) => {
                      const isSelectedForCompare = selectedCompareIds.includes(photo.id)

                      return (
                        <Card
                          key={photo.id}
                          className={[
                            'overflow-hidden p-0 transition',
                            isSelectedForCompare
                              ? 'border-[var(--ff-accent-border)] shadow-[0_0_24px_var(--ff-accent-shadow)]'
                              : '',
                          ].join(' ')}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              compareMode
                                ? toggleComparePhoto(photo.id)
                                : setSelectedPhoto(photo)
                            }
                            className="group relative block aspect-[4/5] w-full overflow-hidden bg-[var(--ff-surface-2)]"
                          >
                            <img
                              src={photo.imageUrl}
                              alt={`Foto de evolução - ${getAngleLabel(photo.angle)}`}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            />

                            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                              <Badge variant="purple">
                                {getAngleLabel(photo.angle)}
                              </Badge>

                              {compareMode && (
                                <span
                                  className={[
                                    'rounded-full border px-2.5 py-1 text-[11px] font-black',
                                    isSelectedForCompare
                                      ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent)] text-white'
                                      : 'border-white/30 bg-black/45 text-white backdrop-blur',
                                  ].join(' ')}
                                >
                                  {isSelectedForCompare ? 'Selecionada' : 'Comparar'}
                                </span>
                              )}
                            </div>

                            {!compareMode && (
                              <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-black/45 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                                <Maximize2 size={17} />
                              </div>
                            )}
                          </button>

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="flex items-center gap-2 text-sm font-bold text-[var(--ff-text)]">
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
                              <p className="mt-3 line-clamp-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm leading-relaxed text-[var(--ff-muted)]">
                                {photo.note}
                              </p>
                            )}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setSelectedPhoto(null)}
            aria-label="Fechar foto"
          />

          <div className="relative grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[var(--ff-card)] shadow-2xl lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="relative flex min-h-[380px] items-center justify-center bg-black">
              <img
                src={selectedPhoto.imageUrl}
                alt={`Foto de evolução - ${getAngleLabel(selectedPhoto.angle)}`}
                className="max-h-[92vh] w-full object-contain"
              />

              {filteredPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={openPreviousPhoto}
                    className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={openNextPhoto}
                    className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            <aside className="relative overflow-y-auto p-5">
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]"
                aria-label="Fechar popup"
              >
                <X size={18} />
              </button>

              <div className="pr-12">
                <Badge variant="purple">
                  {getAngleLabel(selectedPhoto.angle)}
                </Badge>

                <h2 className="mt-4 text-2xl font-black text-[var(--ff-text)]">
                  {formatLongDate(selectedPhoto.date)}
                </h2>

                <p className="mt-1 text-sm text-[var(--ff-muted)]">
                  Registro detalhado da foto.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                    Data
                  </p>

                  <p className="mt-1 font-black text-[var(--ff-text)]">
                    {formatLongDate(selectedPhoto.date)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                    Ângulo
                  </p>

                  <p className="mt-1 font-black text-[var(--ff-text)]">
                    {getAngleLabel(selectedPhoto.angle)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                    Peso no dia
                  </p>

                  <p className="mt-1 font-black text-[var(--ff-text)]">
                    {selectedPhoto.weight !== '' && selectedPhoto.weight !== null
                      ? `${selectedPhoto.weight} kg`
                      : 'Não informado'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                    Observação
                  </p>

                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[var(--ff-text)]">
                    {selectedPhoto.note || 'Nenhuma observação adicionada.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setCompareMode(true)
                    toggleComparePhoto(selectedPhoto.id)
                    setSelectedPhoto(null)
                  }}
                  className="flex-1"
                >
                  <Columns2 size={17} />
                  Comparar
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    handleDeletePhoto(selectedPhoto.id)
                    setSelectedPhoto(null)
                  }}
                  className="flex-1"
                >
                  <Trash2 size={17} />
                  Excluir
                </Button>
              </div>
            </aside>
          </div>
        </div>
      )}

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
