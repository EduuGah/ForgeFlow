import { useEffect, useState } from 'react'
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

async function compressAvatarImage(file) {
    if (!file?.type?.startsWith('image/')) {
        throw new Error('Selecione um arquivo de imagem valido.')
    }

    if (file.size > 6 * 1024 * 1024) {
        throw new Error('A imagem precisa ter no maximo 6 MB.')
    }

    const dataUrl = await readFileAsDataUrl(file)
    const image = new Image()

    await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = () => reject(new Error('Nao foi possivel processar a imagem.'))
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

function CompleteProfile() {
    const navigate = useNavigate()
    const { setUser } = useAuth()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [name, setName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [height, setHeight] = useState('')
    const [currentWeight, setCurrentWeight] = useState('')
    const [mainGoal, setMainGoal] = useState('')
    const [trainingLevel, setTrainingLevel] = useState('')
    const [trainingFrequency, setTrainingFrequency] = useState('')
    const [preferredSplit, setPreferredSplit] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        unlockGlobalScroll()

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

        return () => unlockGlobalScroll()
    }, [navigate, setUser])

    async function handleSubmit(event) {
        event.preventDefault()

        setError('')

        if (!height || !currentWeight || !mainGoal || !trainingLevel) {
            setError('Preencha altura, peso atual, objetivo e nível de treino.')
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
            const compressedAvatar = await compressAvatarImage(file)
            setAvatarUrl(compressedAvatar)
        } catch (err) {
            setError(err.message || 'Nao foi possivel carregar a foto.')
        } finally {
            event.target.value = ''
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
                <div className="rounded-3xl border border-zinc-800 bg-[#121216] p-8 text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-[var(--ff-accent)]" />

                    <p className="mt-4 text-sm font-semibold text-zinc-400">
                        Carregando perfil...
                    </p>
                </div>
            </div>
        )
    }

    return (
    <main className="ff-hevy-page ff-hevy-page-completeprofile ff-auth-route text-white">

        <section className="ff-auth-route__shell">
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

                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    Essas informações ajudam o ForgeFlow a personalizar seus treinos, metas e evolução.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
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
                                <p className="text-sm font-bold text-zinc-200">Foto de perfil</p>
                                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                                    Opcional, mas ajuda o app a ficar com cara de conta real desde o primeiro acesso.
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
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
                            Nome
                        </label>

                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Seu nome"
                            className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
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
                                className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 pr-12 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                            />

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                                cm
                            </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                            Coloque sua altura completa em centímetros. Exemplo: se você tem 1,75m, digite <span className="font-bold text-zinc-300">175</span>.
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
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
                                className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 pr-12 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                            />

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                                kg
                            </span>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                            Pode usar vírgula ou ponto. Exemplo: <span className="font-bold text-zinc-300">72,5</span> ou <span className="font-bold text-zinc-300">72.5</span>.
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
                            Objetivo principal
                        </label>

                        <select
                            value={mainGoal}
                            onChange={(event) => setMainGoal(event.target.value)}
                            className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
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
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
                            Nível de treino
                        </label>

                        <select
                            value={trainingLevel}
                            onChange={(event) => setTrainingLevel(event.target.value)}
                            className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        >
                            <option value="">Selecione</option>
                            <option value="Iniciante">Iniciante</option>
                            <option value="Intermediário">Intermediário</option>
                            <option value="Avançado">Avançado</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
                            Treinos por semana
                        </label>

                        <input
                            type="number"
                            min="1"
                            max="7"
                            value={trainingFrequency}
                            onChange={(event) => setTrainingFrequency(event.target.value)}
                            placeholder="Ex: 5"
                            className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
                            Divisão preferida
                        </label>

                        <input
                            value={preferredSplit}
                            onChange={(event) => setPreferredSplit(event.target.value)}
                            placeholder="Ex: Push Pull Legs"
                            className="h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-bold text-zinc-300">
                            Notas pessoais
                        </label>

                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Ex: foco em hipertrofia, melhorar cardio, evitar dor no ombro..."
                            rows={4}
                            className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-[var(--ff-accent-border)]"
                        />
                    </div>

                    {error && (
                        <div className="md:col-span-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-semibold text-red-300">
                            {error}
                        </div>
                    )}

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

                            <p className="text-xs leading-relaxed text-zinc-400">
                                Para considerar seu perfil completo, precisamos pelo menos de altura, peso atual, objetivo principal e nível de treino.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    
    </main>
  )
}

export default CompleteProfile
