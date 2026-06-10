import { useEffect, useMemo, useState } from 'react'

import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import Toast from '../components/ui/Toast'
import ConfirmModal from '../components/ui/ConfirmModal'

import { useAuth } from '../context/AuthContext'
import { apiFetch, apiFormData } from '../services/api'
import { generateSmartNotifications } from '../utils/notificationUtils'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'
import {
  formatDate,
  getAngleLabel,
  getDateGroupTitle,
  getDateKey,
  getDaysBetween,
  normalizeProgressPhotoFromApi,
  sortPhotosByDateDesc,
} from '../features/progressPhotos/progressPhotosUtils'
import {
  ProgressPhotoLightbox,
  ProgressPhotosGallery,
  ProgressPhotosSidebar,
  ProgressPhotosStats,
} from '../features/progressPhotos/components/ProgressPhotosSections'

import AppPageIntro from '../components/app/AppPageIntro'

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
    if (!selectedPhoto) return undefined

    const previousOverflow = document.body.style.overflow
    const previousOverscroll = document.body.style.overscrollBehavior

    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'contain'

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.overscrollBehavior = previousOverscroll
    }
  }, [selectedPhoto])

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

      generateSmartNotifications({
        user,
        reason: 'progress-photo-created',
        force: true,
      }).catch((error) => {
        console.error(error)
      })

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
    <div className="ff-hevy-page ff-hevy-page-progressphotos">

      <AppPageIntro
        eyebrow="Fotos"
        title="Evolução visual"
        description="Galeria e comparação corporal em cards próprios para celular."
        metrics={[
          { label: 'Fotos', value: photos.length },
          { label: 'Ângulos', value: stats.angles },
          { label: 'Fonte', value: source === 'database' ? 'API' : 'Local' },
        ]}
      />

    <div className="ff-progress-photos-body ff-page-mobile-main-grid">
      <PageHeader
        title="Fotos de evolução"
        description="Registre sua evolução corporal com fotos, peso, data e observações."
        action={
          <Badge variant={source === 'database' ? 'purple' : 'default'}>
            {loading ? 'Carregando...' : source === 'database' ? 'Sincronizado' : 'Local'}
          </Badge>
        }
      />

      <ProgressPhotosStats stats={stats} />

      <section className="ff-page-mobile-main-grid mt-5 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ProgressPhotosSidebar
          file={file}
          date={date}
          angle={angle}
          weight={weight}
          note={note}
          uploading={uploading}
          compareMode={compareMode}
          selectedCompareIds={selectedCompareIds}
          onSubmit={handleSubmit}
          onFileChange={setFile}
          onDateChange={setDate}
          onAngleChange={setAngle}
          onWeightChange={setWeight}
          onNoteChange={setNote}
          onToggleCompareMode={() => {
            setCompareMode((current) => {
              if (current) {
                setSelectedCompareIds([])
              }

              return !current
            })
          }}
        />

        <ProgressPhotosGallery
          photos={photos}
          filteredPhotos={filteredPhotos}
          photosGroupedByDate={photosGroupedByDate}
          search={search}
          angleFilter={angleFilter}
          compareMode={compareMode}
          selectedCompareIds={selectedCompareIds}
          comparisonSummary={comparisonSummary}
          onSearchChange={setSearch}
          onAngleFilterChange={setAngleFilter}
          onClearFilters={clearFilters}
          onClearCompareSelection={() => setSelectedCompareIds([])}
          onToggleComparePhoto={toggleComparePhoto}
          onSelectPhoto={setSelectedPhoto}
          onDeletePhoto={handleDeletePhoto}
        />
      </section>

      <ProgressPhotoLightbox
        selectedPhoto={selectedPhoto}
        filteredPhotosCount={filteredPhotos.length}
        onClose={() => setSelectedPhoto(null)}
        onPrevious={openPreviousPhoto}
        onNext={openNextPhoto}
        onCompare={() => {
          setCompareMode(true)
          toggleComparePhoto(selectedPhoto.id)
          setSelectedPhoto(null)
        }}
        onDelete={() => {
          handleDeletePhoto(selectedPhoto.id)
          setSelectedPhoto(null)
        }}
      />

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
    </div>
  
    </div>
  )
}

export default ProgressPhotos
