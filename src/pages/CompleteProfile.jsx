import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImageUp, Save, Target, UserRound, X } from 'lucide-react'

import { apiFetch, getCurrentUser } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { markWelcomeTutorialPending } from '../utils/tutorialUtils'
import { unlockGlobalScroll } from '../utils/scrollLockUtils'

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Nao foi possivel ler a imagem.'))
        reader.readAsDataURL(file)
    })
}

function validateAvatarFile(file) {
    if (!file?.type?.startsWith('image/')) {
        throw new Error('Selecione um arquivo de imagem válido.')
    }

    if (file.size > 6 * 1024 * 1024) {
        throw new Error('A imagem precisa ter no máximo 6 MB.')
    }
}

function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value))
}

function getPointerDistance(first, second) {
    const dx = first.clientX - second.clientX
    const dy = first.clientY - second.clientY
    return Math.hypot(dx, dy)
}

function getPointerCenter(first, second) {
    return {
        x: (first.clientX + second.clientX) / 2,
        y: (first.clientY + second.clientY) / 2,
    }
}


function clampAvatarOffset(offset, zoom, frameSize, naturalSize) {
    if (!frameSize || !naturalSize.width || !naturalSize.height) return offset

    const baseScale = Math.max(frameSize / naturalSize.width, frameSize / naturalSize.height)
    const renderedWidth = naturalSize.width * baseScale * zoom
    const renderedHeight = naturalSize.height * baseScale * zoom
    const maxX = Math.max(0, (renderedWidth - frameSize) / 2)
    const maxY = Math.max(0, (renderedHeight - frameSize) / 2)

    return {
        x: clampNumber(offset.x, -maxX, maxX),
        y: clampNumber(offset.y, -maxY, maxY),
    }
}

async function cropAvatarImage({ src, zoom, offset, frameSize, naturalSize }) {
    const image = new Image()
    image.decoding = 'async'

    await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = () => reject(new Error('Não foi possível processar a imagem.'))
        image.src = src
    })

    const outputSize = 512
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize

    const context = canvas.getContext('2d')
    context.fillStyle = '#050608'
    context.fillRect(0, 0, outputSize, outputSize)

    const safeFrameSize = Math.max(1, frameSize || 280)
    const safeNaturalSize = naturalSize?.width && naturalSize?.height
        ? naturalSize
        : { width: image.naturalWidth || image.width, height: image.naturalHeight || image.height }
    const safeZoom = clampNumber(Number(zoom) || 1, 1, 3)
    const safeOffset = clampAvatarOffset(offset || { x: 0, y: 0 }, safeZoom, safeFrameSize, safeNaturalSize)
    const baseScale = Math.max(safeFrameSize / safeNaturalSize.width, safeFrameSize / safeNaturalSize.height)
    const totalScale = baseScale * safeZoom
    const renderedWidth = safeNaturalSize.width * totalScale
    const renderedHeight = safeNaturalSize.height * totalScale
    const imageLeft = safeFrameSize / 2 + safeOffset.x - renderedWidth / 2
    const imageTop = safeFrameSize / 2 + safeOffset.y - renderedHeight / 2
    const sourceX = (0 - imageLeft) / totalScale
    const sourceY = (0 - imageTop) / totalScale
    const sourceWidth = safeFrameSize / totalScale
    const sourceHeight = safeFrameSize / totalScale

    context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputSize,
        outputSize,
    )

    return canvas.toDataURL('image/jpeg', 0.86)
}

function CompleteProfile() {
    const navigate = useNavigate()
    const { setUser } = useAuth()
    const scrollRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [name, setName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [avatarEditorSrc, setAvatarEditorSrc] = useState('')
    const [avatarEditorError, setAvatarEditorError] = useState('')
    const [avatarFileError, setAvatarFileError] = useState('')
    const [avatarZoom, setAvatarZoom] = useState(1)
    const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 })
    const [avatarNaturalSize, setAvatarNaturalSize] = useState({ width: 0, height: 0 })
    const [croppingAvatar, setCroppingAvatar] = useState(false)
    const cropFrameRef = useRef(null)
    const [cropFrameSize, setCropFrameSize] = useState(0)
    const dragStateRef = useRef(null)
    const activePointersRef = useRef(new Map())
    const [height, setHeight] = useState('')
    const [currentWeight, setCurrentWeight] = useState('')
    const [mainGoal, setMainGoal] = useState('')
    const [trainingLevel, setTrainingLevel] = useState('')
    const [trainingFrequency, setTrainingFrequency] = useState('')
    const [preferredSplit, setPreferredSplit] = useState('')
    const [notes, setNotes] = useState('')

    useLayoutEffect(() => {
        if (typeof window === 'undefined') return undefined

        const updateViewportHeight = () => {
            const visualHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight
            document.documentElement.style.setProperty('--ff-complete-profile-vh', `${Math.max(320, Math.round(visualHeight))}px`)
        }

        updateViewportHeight()
        window.addEventListener('resize', updateViewportHeight)
        window.addEventListener('orientationchange', updateViewportHeight)
        window.visualViewport?.addEventListener('resize', updateViewportHeight)
        window.visualViewport?.addEventListener('scroll', updateViewportHeight)

        return () => {
            window.removeEventListener('resize', updateViewportHeight)
            window.removeEventListener('orientationchange', updateViewportHeight)
            window.visualViewport?.removeEventListener('resize', updateViewportHeight)
            window.visualViewport?.removeEventListener('scroll', updateViewportHeight)
            document.documentElement.style.removeProperty('--ff-complete-profile-vh')
        }
    }, [])


    useLayoutEffect(() => {
        if (!avatarEditorSrc || typeof ResizeObserver === 'undefined') return undefined

        const frame = cropFrameRef.current
        if (!frame) return undefined

        const updateFrameSize = () => {
            const rect = frame.getBoundingClientRect()
            setCropFrameSize(Math.max(1, Math.round(rect.width || 280)))
        }

        updateFrameSize()
        const observer = new ResizeObserver(updateFrameSize)
        observer.observe(frame)

        return () => observer.disconnect()
    }, [avatarEditorSrc])

    useEffect(() => {
        unlockGlobalScroll()
        document.documentElement.classList.add('ff-complete-profile-scroll-fix')
        document.body.classList.add('ff-complete-profile-scroll-fix')

        async function loadUser() {
            try {
                const user = await getCurrentUser()

                setUser(user)

                setName(user.name || '')
                setAvatarUrl(user.avatarUrl || '')
                setHeight(user.profile?.height || '')
                setCurrentWeight(user.profile?.currentWeight || '')
                setMainGoal(user.profile?.mainGoal || '')
                setTrainingLevel(user.profile?.trainingLevel || '')
                setTrainingFrequency(user.profile?.trainingFrequency || '')
                setPreferredSplit(user.profile?.preferredSplit || '')
                setNotes(user.profile?.notes || '')

                if (user.profileCompleted) {
                    navigate('/', { replace: true })
                }
            } catch {
                navigate('/login', { replace: true })
            } finally {
                setLoading(false)
            }
        }

        loadUser()

        return () => {
            unlockGlobalScroll()
            document.documentElement.classList.remove('ff-complete-profile-scroll-fix')
            document.body.classList.remove('ff-complete-profile-scroll-fix')
        }
    }, [navigate, setUser])

    async function handleSubmit(event) {
        event.preventDefault()

        setError('')

        if (!height || !currentWeight || !mainGoal || !trainingLevel) {
            setError('Preencha altura, peso atual, objetivo e nível de treino.')
            window.setTimeout(() => scrollRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' }), 0)
            return
        }

        setSaving(true)

        try {
            const updatedUser = await apiFetch('/me/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    name,
                    avatarUrl,
                    height,
                    currentWeight,
                    mainGoal,
                    trainingLevel,
                    trainingFrequency,
                    preferredSplit,
                    notes,
                }),
            })

            setUser(updatedUser)
            markWelcomeTutorialPending(updatedUser)
            navigate('/', { replace: true })
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleAvatarFileChange(event) {
        const file = event.target.files?.[0]

        if (!file) return

        try {
            validateAvatarFile(file)
            const imageSrc = await readFileAsDataUrl(file)
            setError('')
            setAvatarFileError('')
            setAvatarEditorError('')
            setAvatarEditorSrc(imageSrc)
            setAvatarZoom(1)
            setAvatarOffset({ x: 0, y: 0 })
            setAvatarNaturalSize({ width: 0, height: 0 })
        } catch (err) {
            const message = err.message || 'Não foi possível carregar a foto.'
            setAvatarFileError(message)
            setError('')
            window.setTimeout(() => scrollRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' }), 0)
        } finally {
            event.target.value = ''
        }
    }

    function closeAvatarEditor() {
        if (croppingAvatar) return
        activePointersRef.current.clear()
        dragStateRef.current = null
        setAvatarEditorSrc('')
        setAvatarEditorError('')
        setAvatarZoom(1)
        setAvatarOffset({ x: 0, y: 0 })
        setAvatarNaturalSize({ width: 0, height: 0 })
    }

    function handleAvatarPreviewLoad(event) {
        const image = event.currentTarget
        setAvatarNaturalSize({
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height,
        })
        setAvatarOffset({ x: 0, y: 0 })
        const frame = cropFrameRef.current
        if (frame) {
            const rect = frame.getBoundingClientRect()
            setCropFrameSize(Math.max(1, Math.round(rect.width || 280)))
        }
    }

    function getCropFrameSize() {
        const frame = cropFrameRef.current
        return frame?.getBoundingClientRect?.().width || 280
    }

    function updateAvatarOffset(nextOffset, nextZoom = avatarZoom, nextNaturalSize = avatarNaturalSize) {
        const frameSize = getCropFrameSize()
        setAvatarOffset(clampAvatarOffset(nextOffset, nextZoom, frameSize, nextNaturalSize))
    }

    function handleAvatarZoomChange(event) {
        const nextZoom = clampNumber(Number(event.target.value) || 1, 1, 3)
        setAvatarZoom(nextZoom)
        updateAvatarOffset(avatarOffset, nextZoom)
    }

    function handleAvatarPointerDown(event) {
        if (!avatarEditorSrc) return

        event.preventDefault()
        const pointers = activePointersRef.current
        pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY })
        event.currentTarget.setPointerCapture?.(event.pointerId)

        const values = Array.from(pointers.values())
        if (values.length >= 2) {
            dragStateRef.current = {
                mode: 'pinch',
                distance: getPointerDistance(values[0], values[1]) || 1,
                center: getPointerCenter(values[0], values[1]),
                zoom: avatarZoom,
                offset: avatarOffset,
            }
            return
        }

        dragStateRef.current = {
            mode: 'drag',
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            offset: avatarOffset,
        }
    }

    function handleAvatarPointerMove(event) {
        const pointers = activePointersRef.current
        if (!pointers.has(event.pointerId)) return

        event.preventDefault()
        pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY })
        const values = Array.from(pointers.values())
        const dragState = dragStateRef.current

        if (values.length >= 2) {
            const distance = getPointerDistance(values[0], values[1]) || 1
            const center = getPointerCenter(values[0], values[1])
            const pinchState = dragState?.mode === 'pinch'
                ? dragState
                : {
                    mode: 'pinch',
                    distance,
                    center,
                    zoom: avatarZoom,
                    offset: avatarOffset,
                }

            const nextZoom = clampNumber(pinchState.zoom * (distance / Math.max(1, pinchState.distance)), 1, 3)
            const nextOffset = {
                x: pinchState.offset.x + center.x - pinchState.center.x,
                y: pinchState.offset.y + center.y - pinchState.center.y,
            }

            dragStateRef.current = pinchState
            setAvatarZoom(nextZoom)
            updateAvatarOffset(nextOffset, nextZoom)
            return
        }

        if (!dragState || dragState.mode !== 'drag' || dragState.pointerId !== event.pointerId) return

        const nextOffset = {
            x: dragState.offset.x + event.clientX - dragState.startX,
            y: dragState.offset.y + event.clientY - dragState.startY,
        }

        updateAvatarOffset(nextOffset)
    }

    function handleAvatarPointerUp(event) {
        const pointers = activePointersRef.current
        pointers.delete(event.pointerId)

        if (pointers.size === 1) {
            const [remainingPointerId, pointer] = Array.from(pointers.entries())[0]
            dragStateRef.current = {
                mode: 'drag',
                pointerId: remainingPointerId,
                startX: pointer.clientX,
                startY: pointer.clientY,
                offset: avatarOffset,
            }
            return
        }

        dragStateRef.current = null
    }


    function handleAvatarWheel(event) {
        if (!avatarEditorSrc) return
        event.preventDefault()
        const nextZoom = clampNumber(avatarZoom + (event.deltaY > 0 ? -0.08 : 0.08), 1, 3)
        setAvatarZoom(nextZoom)
        updateAvatarOffset(avatarOffset, nextZoom)
    }

    async function confirmAvatarCrop() {
        if (!avatarEditorSrc) return

        setAvatarEditorError('')
        setCroppingAvatar(true)

        try {
            const frameSize = getCropFrameSize()
            const croppedAvatar = await cropAvatarImage({
                src: avatarEditorSrc,
                zoom: avatarZoom,
                offset: avatarOffset,
                frameSize,
                naturalSize: avatarNaturalSize,
            })

            activePointersRef.current.clear()
            dragStateRef.current = null
            setAvatarUrl(croppedAvatar)
            setAvatarEditorSrc('')
            setAvatarFileError('')
        } catch (err) {
            setAvatarEditorError(err.message || 'Não foi possível enquadrar a foto.')
        } finally {
            setCroppingAvatar(false)
        }
    }

    function handleFieldFocus(event) {
        const field = event.target

        if (!field?.matches?.('input, select, textarea')) return

        window.setTimeout(() => {
            const scroller = scrollRef.current
            if (!scroller) return

            const fieldRect = field.getBoundingClientRect()
            const scrollerRect = scroller.getBoundingClientRect()
            const desiredTop = scroller.scrollTop + (fieldRect.top - scrollerRect.top) - scroller.clientHeight * 0.28

            scroller.scrollTo({
                top: Math.max(0, desiredTop),
                behavior: 'smooth',
            })
        }, 180)
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--ff-card)] text-[var(--ff-text)]">
                <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-8 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--ff-border)] border-t-[var(--ff-accent)]" />

                    <p className="mt-4 text-sm font-semibold text-[var(--ff-muted)]">
                        Carregando perfil...
                    </p>
                </div>
            </div>
        )
    }


    const safePreviewFrameSize = Math.max(1, cropFrameSize || 280)
    const safePreviewNaturalSize = avatarNaturalSize.width && avatarNaturalSize.height
        ? avatarNaturalSize
        : { width: safePreviewFrameSize, height: safePreviewFrameSize }
    const previewBaseScale = Math.max(
        safePreviewFrameSize / Math.max(1, safePreviewNaturalSize.width),
        safePreviewFrameSize / Math.max(1, safePreviewNaturalSize.height),
    )
    const avatarPreviewWidth = Math.max(1, safePreviewNaturalSize.width * previewBaseScale)
    const avatarPreviewHeight = Math.max(1, safePreviewNaturalSize.height * previewBaseScale)

    return (
    <main className="ff-hevy-page-completeprofile ff-complete-profile-screen text-[var(--ff-text)]">
        <div
            ref={scrollRef}
            className="ff-complete-profile-scroll"
            onFocusCapture={handleFieldFocus}
        >
            <section className="ff-auth-route__shell ff-complete-profile-shell">
            <div className="ff-auth-card ff-auth-card--wide">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                        <UserRound size={28} />
                    </div>

                    <div>
                        <p className="text-sm font-bold text-[var(--ff-accent-text)]">
                            ForgeFlow
                        </p>

                        <h1 className="mt-1 text-3xl font-black">
                            Complete seu perfil
                        </h1>
                    </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[var(--ff-muted)]">
                    Essas informações ajudam o ForgeFlow a personalizar seus treinos, metas e evolução.
                </p>

                {error && (
                    <div className="ff-complete-profile-top-error" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="ff-complete-profile-form mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="ff-complete-profile-avatar-card md:col-span-2 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={name || 'Foto de perfil'}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserRound size={34} />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[var(--ff-text-soft)]">Foto de perfil</p>
                                <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted-2)]">
                                    Opcional, mas ajuda o app a ficar com cara de conta real desde o primeiro acesso.
                                </p>

                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                    <label className="ff-complete-profile-avatar-button inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-4 text-sm font-black text-[var(--ff-accent-text)] transition hover:bg-[var(--ff-card-hover)]">
                                        <ImageUp size={17} />
                                        Selecionar foto
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="sr-only"
                                            onChange={handleAvatarFileChange}
                                        />
                                    </label>

                                    {avatarUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setAvatarUrl('')}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
                                        >
                                            <X size={16} />
                                            Remover
                                        </button>
                                    )}
                                </div>

                                {avatarFileError && (
                                    <p className="ff-complete-profile-avatar-error" role="alert">
                                        {avatarFileError}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
                            Nome
                        </label>

                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Seu nome"
                            className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
                            Altura
                        </label>

                        <div className="relative">
                            <input
                                type="number"
                                inputMode="numeric"
                                min="80"
                                max="250"
                                value={height}
                                onChange={(event) => setHeight(event.target.value)}
                                placeholder="Ex: 175"
                                className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 pr-12 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                            />

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--ff-muted-2)]">
                                cm
                            </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-[var(--ff-muted-2)]">
                            Coloque sua altura completa em centímetros. Exemplo: se você tem 1,75m, digite <span className="font-bold text-[var(--ff-text-soft)]">175</span>.
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
                            Peso atual
                        </label>

                        <div className="relative">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={currentWeight}
                                onChange={(event) => {
                                    const value = event.target.value.replace(/[^\d,.]/g, '')
                                    setCurrentWeight(value)
                                }}
                                placeholder="Ex: 72,5"
                                className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 pr-12 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                            />

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--ff-muted-2)]">
                                kg
                            </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-[var(--ff-muted-2)]">
                            Pode usar vírgula ou ponto. Exemplo: <span className="font-bold text-[var(--ff-text-soft)]">72,5</span> ou <span className="font-bold text-[var(--ff-text-soft)]">72.5</span>.
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
                            Objetivo principal
                        </label>

                        <select
                            value={mainGoal}
                            onChange={(event) => setMainGoal(event.target.value)}
                            className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        >
                            <option value="">Selecione</option>
                            <option value="Hipertrofia">Hipertrofia</option>
                            <option value="Força">Força</option>
                            <option value="Emagrecimento">Emagrecimento</option>
                            <option value="Recomposição corporal">Recomposição corporal</option>
                            <option value="Condicionamento">Condicionamento</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
                            Nível de treino
                        </label>

                        <select
                            value={trainingLevel}
                            onChange={(event) => setTrainingLevel(event.target.value)}
                            className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        >
                            <option value="">Selecione</option>
                            <option value="Iniciante">Iniciante</option>
                            <option value="Intermediário">Intermediário</option>
                            <option value="Avançado">Avançado</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
                            Treinos por semana
                        </label>

                        <input
                            type="number"
                            min="1"
                            max="7"
                            value={trainingFrequency}
                            onChange={(event) => setTrainingFrequency(event.target.value)}
                            placeholder="Ex: 5"
                            className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
                            Divisão preferida
                        </label>

                        <input
                            value={preferredSplit}
                            onChange={(event) => setPreferredSplit(event.target.value)}
                            placeholder="Ex: Push Pull Legs"
                            className="h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">
                            Notas pessoais
                        </label>

                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Ex: foco em hipertrofia, melhorar cardio, evitar dor no ombro..."
                            rows={4}
                            className="w-full resize-none rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        />
                    </div>


                    <button
                        type="submit"
                        disabled={saving}
                        className="md:col-span-2 mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white transition hover:bg-[var(--ff-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save size={18} />
                        {saving ? 'Salvando...' : 'Salvar e continuar'}
                    </button>

                    <div className="md:col-span-2 rounded-2xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 p-4">
                        <div className="flex items-start gap-3">
                            <Target size={18} className="mt-0.5 text-[var(--ff-accent-text)]" />

                            <p className="text-xs leading-relaxed text-[var(--ff-muted)]">
                                Para considerar seu perfil completo, precisamos pelo menos de altura, peso atual, objetivo principal e nível de treino.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
            </section>
        </div>

        {avatarEditorSrc && (
            <div className="ff-avatar-cropper-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-cropper-title">
                <div className="ff-avatar-cropper-card">
                    <div className="ff-avatar-cropper-header">
                        <div>
                            <p className="ff-avatar-cropper-kicker">Foto de perfil</p>
                            <h2 id="avatar-cropper-title">Enquadre sua foto</h2>
                            <p>Arraste com um dedo, use dois dedos para dar zoom e deixe o rosto dentro do quadrado.</p>
                        </div>

                        <button
                            type="button"
                            className="ff-avatar-cropper-close"
                            onClick={closeAvatarEditor}
                            aria-label="Fechar edição da foto"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div
                        ref={cropFrameRef}
                        className="ff-avatar-cropper-frame"
                        onPointerDown={handleAvatarPointerDown}
                        onPointerMove={handleAvatarPointerMove}
                        onPointerUp={handleAvatarPointerUp}
                        onPointerCancel={handleAvatarPointerUp}
                        onLostPointerCapture={handleAvatarPointerUp}
                        onWheel={handleAvatarWheel}
                    >
                        <img
                            src={avatarEditorSrc}
                            alt="Prévia da foto de perfil"
                            draggable="false"
                            onLoad={handleAvatarPreviewLoad}
                            style={{
                                width: `${avatarPreviewWidth}px`,
                                height: `${avatarPreviewHeight}px`,
                                transform: `translate(calc(-50% + ${avatarOffset.x}px), calc(-50% + ${avatarOffset.y}px)) scale(${avatarZoom})`,
                            }}
                        />
                        <div className="ff-avatar-cropper-grid" aria-hidden="true" />
                    </div>

                    <label className="ff-avatar-cropper-zoom">
                        <span>Zoom</span>
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.01"
                            value={avatarZoom}
                            onChange={handleAvatarZoomChange}
                        />
                    </label>

                    {avatarEditorError && (
                        <p className="ff-avatar-cropper-error">{avatarEditorError}</p>
                    )}

                    <div className="ff-avatar-cropper-actions">
                        <button type="button" className="ff-avatar-cropper-secondary" onClick={closeAvatarEditor}>
                            Cancelar
                        </button>
                        <button type="button" className="ff-avatar-cropper-primary" onClick={confirmAvatarCrop} disabled={croppingAvatar}>
                            {croppingAvatar ? 'Salvando...' : 'Usar foto'}
                        </button>
                    </div>
                </div>
            </div>
        )}

    </main>
  )
}

export default CompleteProfile
