import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Target, UserRound } from 'lucide-react'

import { apiFetch, getCurrentUser } from '../services/api'
import { useAuth } from '../context/AuthContext'

import AppPageIntro from '../components/app/AppPageIntro'

function CompleteProfile() {
    const navigate = useNavigate()
    const { setUser } = useAuth()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [name, setName] = useState('')
    const [height, setHeight] = useState('')
    const [currentWeight, setCurrentWeight] = useState('')
    const [mainGoal, setMainGoal] = useState('')
    const [trainingLevel, setTrainingLevel] = useState('')
    const [trainingFrequency, setTrainingFrequency] = useState('')
    const [preferredSplit, setPreferredSplit] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        async function loadUser() {
            try {
                const user = await getCurrentUser()

                setUser(user)

                setName(user.name || '')
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
            navigate('/', { replace: true })
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
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
    <div className="ff-hevy-page ff-hevy-page-completeprofile">

      <AppPageIntro eyebrow="Onboarding" title="Complete seu perfil" description="Ajuste os dados iniciais para personalizar a experiência do ForgeFlow." />

        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10 text-white">
            <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-[#121216] p-8 shadow-2xl">
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
        </div>
    
    </div>
  )
}

export default CompleteProfile