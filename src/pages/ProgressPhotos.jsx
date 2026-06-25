import { useEffect, useMemo, useRef, useState } from 'react'

import AppPageIntro from '../components/app/AppPageIntro'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { apiFetch, apiFormData } from '../services/api'
import { generateSmartNotifications } from '../utils/notificationUtils'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import {
  buildPhotoInsights,
  calculateMeasurementDiff,
  compressProgressImage,
  createEmptyMeasurements,
  getDaysBetween,
  getPhotoStats,
  groupPhotosByDate,
  mergeRemoteAndLocalPhotos,
  normalizeMeasurements,
  normalizeProgressPhoto,
  normalizeProgressPhotoFromApi,
  sortPhotosByDateDesc,
} from '../features/progressPhotos/progressPhotosUtils'
import {
  ProgressMeasurementsOverview,
  ProgressPhotoAddSheet,
  ProgressPhotoEditSheet,
  ProgressPhotoLightbox,
  ProgressPhotosCompare,
  ProgressPhotosInsights,
  ProgressPhotosPrivacyCard,
  ProgressPhotosStats,
  ProgressPhotosTimeline,
} from '../features/progressPhotos/components/ProgressPhotosSections'

const STORAGE_KEY = 'progress-photos'

function createInitialDraft() {
  return {
    date: new Date().toISOString().slice(0, 10),
    angle: 'front',
    note: '',
    bodyWeight: '',
    measurements: createEmptyMeasurements(),
  }
}

function buildFormData(imageState, draft) {
  const formData = new FormData()
  const measurements = normalizeMeasurements(draft.measurements)

  formData.append('photo', imageState.file)
  formData.append('date', draft.date)
  formData.append('angle', draft.angle)
  formData.append('weight', draft.bodyWeight)
  formData.append('bodyWeight', draft.bodyWeight)
  formData.append('note', draft.note)
  formData.append('measurements', JSON.stringify(measurements))
  formData.append('privacyMode', 'private')

  return formData
}

function createLocalPhoto(imageState, draft) {
  const bodyWeight = draft.bodyWeight === '' ? '' : Number(String(draft.bodyWeight).replace(',', '.'))

  return normalizeProgressPhoto({
    id: `local-${Date.now()}`,
    imageUrl: imageState.dataUrl,
    imageData: imageState.dataUrl,
    date: draft.date,
    angle: draft.angle,
    note: draft.note,
    weight: Number.isFinite(bodyWeight) ? bodyWeight : '',
    bodyWeight: Number.isFinite(bodyWeight) ? bodyWeight : '',
    measurements: normalizeMeasurements(draft.measurements),
    storage: 'local',
    isPrivate: true,
    privacyMode: 'private',
    createdAt: new Date().toISOString(),
  })
}

function buildPhotoPayload(draft) {
  const bodyWeight = draft.bodyWeight === '' ? null : Number(String(draft.bodyWeight).replace(',', '.'))

  return {
    date: draft.date,
    angle: draft.angle,
    weight: Number.isFinite(bodyWeight) ? bodyWeight : null,
    bodyWeight: Number.isFinite(bodyWeight) ? bodyWeight : null,
    note: draft.note,
    measurements: normalizeMeasurements(draft.measurements),
    privacyMode: 'private',
  }
}

function ProgressPhotos() {
  const { user } = useAuth()
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('local')
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [draft, setDraft] = useState(createInitialDraft)
  const [editDraft, setEditDraft] = useState(createInitialDraft)
  const [editingPhoto, setEditingPhoto] = useState(null)
  const [imageState, setImageState] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imageError, setImageError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [beforeId, setBeforeId] = useState('')
  const [afterId, setAfterId] = useState('')
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadPhotos() {
      setLoading(true)
      const cachedPhotos = getUserStorageData(user, STORAGE_KEY, [])

      try {
        const photosFromApi = await apiFetch('/progress-photos')
        const normalizedRemotePhotos = Array.isArray(photosFromApi)
          ? photosFromApi.map(normalizeProgressPhotoFromApi)
          : []
        const mergedPhotos = mergeRemoteAndLocalPhotos(normalizedRemotePhotos, cachedPhotos)

        if (!isMounted) return

        setPhotos(mergedPhotos)
        saveUserStorageData(user, STORAGE_KEY, mergedPhotos)
        setSource('database')
      } catch (error) {
        console.error(error)

        if (!isMounted) return

        setPhotos(Array.isArray(cachedPhotos) ? cachedPhotos.map(normalizeProgressPhoto).sort(sortPhotosByDateDesc) : [])
        setSource('local')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPhotos()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    const hasOverlay = addSheetOpen || editSheetOpen || selectedPhoto

    if (!hasOverlay || typeof document === 'undefined') return undefined

    document.body.classList.add('ff-modal-open')

    return () => {
      document.body.classList.remove('ff-modal-open')
    }
  }, [addSheetOpen, editSheetOpen, selectedPhoto])

  const sortedPhotos = useMemo(() => photos.slice().sort(sortPhotosByDateDesc), [photos])
  const stats = useMemo(() => getPhotoStats(sortedPhotos), [sortedPhotos])
  const groupedPhotos = useMemo(() => groupPhotosByDate(sortedPhotos), [sortedPhotos])
  const insights = useMemo(() => buildPhotoInsights(sortedPhotos), [sortedPhotos])

  const comparisonSummary = useMemo(() => {
    const before = sortedPhotos.find((photo) => photo.id === beforeId) || null
    const after = sortedPhotos.find((photo) => photo.id === afterId) || null

    if (!before || !after || before.id === after.id) return null

    const beforeWeight = Number(before.bodyWeight ?? before.weight)
    const afterWeight = Number(after.bodyWeight ?? after.weight)
    const hasWeights = Number.isFinite(beforeWeight) && Number.isFinite(afterWeight)

    return {
      before,
      after,
      days: getDaysBetween(before.date, after.date),
      weightDiff: hasWeights ? afterWeight - beforeWeight : null,
      measurementDiffs: calculateMeasurementDiff(before, after),
    }
  }, [beforeId, afterId, sortedPhotos])

  const latestPhotoWithMeasurements = useMemo(() => {
    return sortedPhotos.find((photo) => {
      const hasWeight = photo.bodyWeight !== '' && photo.bodyWeight !== null && photo.bodyWeight !== undefined
      return hasWeight || Object.keys(photo.measurements || {}).length > 0
    }) || null
  }, [sortedPhotos])

  function showToast(type, title, message = '') {
    setToast({ type, title, message })
    window.setTimeout(() => setToast(null), 3200)
  }

  function updateDraft(key, value) {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }))
  }

  function updateEditDraft(key, value) {
    setEditDraft((currentDraft) => ({ ...currentDraft, [key]: value }))
  }

  function updateDraftMeasurement(key, value) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      measurements: {
        ...currentDraft.measurements,
        [key]: value,
      },
    }))
  }

  function updateEditDraftMeasurement(key, value) {
    setEditDraft((currentDraft) => ({
      ...currentDraft,
      measurements: {
        ...currentDraft.measurements,
        [key]: value,
      },
    }))
  }

  function resetAddFlow() {
    setDraft(createInitialDraft())
    setImageState(null)
    setImageError('')
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  function closeAddSheet() {
    setAddSheetOpen(false)
    setProcessing(false)
    setSaving(false)
    setImageError('')
  }

  async function handleFileSelected(file) {
    if (!file) return

    setProcessing(true)
    setImageError('')

    try {
      const compressedImage = await compressProgressImage(file)
      setImageState(compressedImage)
    } catch (error) {
      console.error(error)
      setImageState(null)
      setImageError(error.message || 'Não foi possível carregar a imagem escolhida.')
    } finally {
      setProcessing(false)
    }
  }

  function persistPhotos(nextPhotos) {
    const normalizedPhotos = nextPhotos.map(normalizeProgressPhoto).sort(sortPhotosByDateDesc)

    setPhotos(normalizedPhotos)
    saveUserStorageData(user, STORAGE_KEY, normalizedPhotos)

    return normalizedPhotos
  }

  async function handleAddPhoto(event) {
    event.preventDefault()

    if (!imageState?.file) {
      showToast('error', 'Imagem obrigatória', 'Escolha uma foto da câmera ou galeria.')
      return
    }

    setSaving(true)

    try {
      const createdPhotoFromApi = await apiFormData('/progress-photos', buildFormData(imageState, draft), {
        timeoutMs: 20000,
      })
      const createdPhoto = normalizeProgressPhotoFromApi(createdPhotoFromApi)
      const updatedPhotos = persistPhotos([createdPhoto, ...photos])

      setSource('database')
      setBeforeId((current) => current || updatedPhotos.at(-1)?.id || '')
      setAfterId(createdPhoto.id)
      resetAddFlow()
      closeAddSheet()
      showToast('success', 'Foto salva', 'Sua foto de progresso foi sincronizada.')

      generateSmartNotifications({
        user,
        reason: 'progress-photo-created',
        force: true,
      }).catch((error) => console.error(error))
    } catch (error) {
      console.error(error)

      try {
        const localPhoto = createLocalPhoto(imageState, draft)
        const updatedPhotos = persistPhotos([localPhoto, ...photos])

        setSource('local')
        setBeforeId((current) => current || updatedPhotos.at(-1)?.id || '')
        setAfterId(localPhoto.id)
        resetAddFlow()
        closeAddSheet()
        showToast('success', 'Foto salva localmente', 'A sincronização falhou, então a foto ficou salva neste dispositivo/app.')
      } catch (storageError) {
        console.error(storageError)
        showToast('error', 'Não foi possível salvar a foto', 'Tente novamente ou escolha uma imagem menor.')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleDeletePhoto(photoId) {
    const photo = photos.find((item) => item.id === photoId)

    setConfirmModal({
      title: 'Excluir foto?',
      description: 'Essa ação remove a foto do histórico de progresso.',
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (photo && photo.storage !== 'local' && !String(photo.id).startsWith('local-')) {
            await apiFetch(`/progress-photos/${photoId}`, { method: 'DELETE' })
          }
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao excluir no servidor', 'A foto foi removida do app local, mas pode sincronizar novamente.')
        } finally {
          const updatedPhotos = persistPhotos(photos.filter((item) => item.id !== photoId))

          setBeforeId((current) => (current === photoId ? updatedPhotos[0]?.id || '' : current))
          setAfterId((current) => (current === photoId ? updatedPhotos[1]?.id || '' : current))

          if (selectedPhoto?.id === photoId) setSelectedPhoto(null)
          setConfirmModal(null)
          showToast('success', 'Foto excluída', 'A foto foi removida do histórico.')
        }
      },
    })
  }

  function startCompareFromPhoto(photo) {
    const sameAngle = sortedPhotos.find((item) => item.id !== photo.id && item.angle === photo.angle)
    const fallback = sortedPhotos.find((item) => item.id !== photo.id)
    const pair = sameAngle || fallback

    if (!pair) {
      showToast('error', 'Comparação indisponível', 'Adicione pelo menos duas fotos para comparar.')
      return
    }

    const first = new Date(pair.date) < new Date(photo.date) ? pair : photo
    const second = first.id === photo.id ? pair : photo

    setBeforeId(first.id)
    setAfterId(second.id)
    setSelectedPhoto(null)
  }

  function openEditPhoto(photo) {
    setEditingPhoto(photo)
    setEditDraft({
      date: photo.date || new Date().toISOString().slice(0, 10),
      angle: photo.angle || 'front',
      note: photo.note || '',
      bodyWeight: photo.bodyWeight ?? photo.weight ?? '',
      measurements: {
        ...createEmptyMeasurements(),
        ...(photo.measurements || {}),
      },
    })
    setEditSheetOpen(true)
  }

  async function handleEditPhoto(event) {
    event.preventDefault()

    if (!editingPhoto) return

    const payload = buildPhotoPayload(editDraft)
    const localUpdatedPhoto = normalizeProgressPhoto({
      ...editingPhoto,
      ...payload,
      weight: payload.weight,
      updatedAt: new Date().toISOString(),
    })

    try {
      if (editingPhoto.storage !== 'local' && !String(editingPhoto.id).startsWith('local-')) {
        const updatedFromApi = await apiFetch(`/progress-photos/${editingPhoto.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        const updatedPhoto = normalizeProgressPhotoFromApi(updatedFromApi)
        persistPhotos(photos.map((photo) => (photo.id === editingPhoto.id ? updatedPhoto : photo)))
      } else {
        persistPhotos(photos.map((photo) => (photo.id === editingPhoto.id ? localUpdatedPhoto : photo)))
      }

      setEditSheetOpen(false)
      setEditingPhoto(null)
      showToast('success', 'Foto atualizada', 'As informações foram salvas.')
    } catch (error) {
      console.error(error)
      persistPhotos(photos.map((photo) => (photo.id === editingPhoto.id ? localUpdatedPhoto : photo)))
      setEditSheetOpen(false)
      setEditingPhoto(null)
      showToast('success', 'Alterações salvas localmente', 'Não foi possível sincronizar agora, mas o app preservou a edição.')
    }
  }

  function openPreviousPhoto() {
    if (!selectedPhoto || sortedPhotos.length < 2) return

    const index = sortedPhotos.findIndex((photo) => photo.id === selectedPhoto.id)
    const previousPhoto = sortedPhotos[index - 1] || sortedPhotos[sortedPhotos.length - 1]

    setSelectedPhoto(previousPhoto)
  }

  function openNextPhoto() {
    if (!selectedPhoto || sortedPhotos.length < 2) return

    const index = sortedPhotos.findIndex((photo) => photo.id === selectedPhoto.id)
    const nextPhoto = sortedPhotos[index + 1] || sortedPhotos[0]

    setSelectedPhoto(nextPhoto)
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-progressphotos photos-page">
      <AppPageIntro
        eyebrow="Fotos"
        title="Evolução visual"
        description="Acompanhe sua evolução com fotos privadas, comparação antes/depois e medidas opcionais."
        metrics={[
          { label: 'Fotos', value: stats.total },
          { label: 'Última', value: stats.lastDate ? stats.lastDate.slice(5).split('-').reverse().join('/') : '--' },
          { label: 'Ângulos', value: stats.angles },
        ]}
      />

      <div className="ff-progress-photos-body ff-page-mobile-main-grid">
        <ProgressPhotosStats
          stats={stats}
          source={source}
          loading={loading}
          onAddPhoto={() => setAddSheetOpen(true)}
        />

        <div className="ff-progress-main-layout">
          <div className="ff-progress-main-layout__content">
            <ProgressPhotosCompare
              photos={sortedPhotos}
              beforeId={beforeId}
              afterId={afterId}
              comparisonSummary={comparisonSummary}
              onBeforeChange={setBeforeId}
              onAfterChange={setAfterId}
              onSelectPhoto={setSelectedPhoto}
            />

            <ProgressPhotosTimeline
              groupedPhotos={groupedPhotos}
              loading={loading}
              hasPhotos={sortedPhotos.length > 0}
              onSelectPhoto={setSelectedPhoto}
              onStartCompare={startCompareFromPhoto}
              onEditPhoto={openEditPhoto}
              onDeletePhoto={handleDeletePhoto}
              onAddPhoto={() => setAddSheetOpen(true)}
            />
          </div>

          <aside className="ff-progress-main-layout__side">
            <ProgressPhotosInsights insights={insights} />
            <ProgressMeasurementsOverview latestPhoto={latestPhotoWithMeasurements} />
            <ProgressPhotosPrivacyCard source={source} />
          </aside>
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          handleFileSelected(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        className="hidden"
        onChange={(event) => {
          handleFileSelected(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <ProgressPhotoAddSheet
        open={addSheetOpen}
        draft={draft}
        imageState={imageState}
        processing={processing}
        saving={saving}
        error={imageError}
        onClose={closeAddSheet}
        onPickCamera={() => cameraInputRef.current?.click()}
        onPickGallery={() => galleryInputRef.current?.click()}
        onDraftChange={updateDraft}
        onMeasurementChange={updateDraftMeasurement}
        onSubmit={handleAddPhoto}
      />

      <ProgressPhotoEditSheet
        open={editSheetOpen}
        draft={editDraft}
        onClose={() => {
          setEditSheetOpen(false)
          setEditingPhoto(null)
        }}
        onDraftChange={updateEditDraft}
        onMeasurementChange={updateEditDraftMeasurement}
        onSubmit={handleEditPhoto}
      />

      <ProgressPhotoLightbox
        photo={selectedPhoto}
        photosCount={sortedPhotos.length}
        onClose={() => setSelectedPhoto(null)}
        onPrevious={openPreviousPhoto}
        onNext={openNextPhoto}
        onStartCompare={startCompareFromPhoto}
        onDeletePhoto={handleDeletePhoto}
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
  )
}

export default ProgressPhotos
