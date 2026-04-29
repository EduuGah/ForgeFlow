import { useEffect, useMemo, useRef, useState } from 'react'

import {
    Line,
    LineChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'


import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import {
    getCompletedSets,
    getExercisePRs,
    getHeaviestExercise,
    getMostTrainedExercise,
    getStorageData,
} from '../utils/analyticsUtils'

function Profile() {
    const [isProfileLoaded, setIsProfileLoaded] = useState(false)

    const [profile, setProfile] = useState({
        name: '',
        height: '',
        goal: '',
        experience: '',
        weeklyTarget: '',
        preferredSplit: '',
        notes: '',
    })

    const [bodyWeight, setBodyWeight] = useState([])
    const [weightInput, setWeightInput] = useState('')
    const [dateInput, setDateInput] = useState('')
    const [history, setHistory] = useState([])

    const dateInputRef = useRef(null)

    useEffect(() => {
        const savedProfile = getStorageData('forgeflow:profile', {
            name: '',
            height: '',
            goal: '',
            experience: '',
            weeklyTarget: '',
            preferredSplit: '',
            notes: '',
        })

        setProfile(savedProfile)
        setBodyWeight(getStorageData('forgeflow:bodyweight', []))
        setHistory(getStorageData('forgeflow:history', []))
        setIsProfileLoaded(true)
    }, [])

    useEffect(() => {
        if (!isProfileLoaded) return

        localStorage.setItem('forgeflow:profile', JSON.stringify(profile))
    }, [profile, isProfileLoaded])

    useEffect(() => {
        if (!isProfileLoaded) return

        localStorage.setItem('forgeflow:bodyweight', JSON.stringify(bodyWeight))
    }, [bodyWeight, isProfileLoaded])

    const completedSets = useMemo(() => getCompletedSets(history), [history])

    const prs = useMemo(() => {
        return getExercisePRs(completedSets).sort((a, b) => b.weight - a.weight)
    }, [completedSets])

    const heaviestExercise = useMemo(() => {
        return getHeaviestExercise(completedSets)
    }, [completedSets])

    const mostTrainedExercise = useMemo(() => {
        return getMostTrainedExercise(completedSets)
    }, [completedSets])

    const totalSets = completedSets.length
    const totalWorkouts = history.length
    const currentWeight = bodyWeight.at(-1)?.weight || null
    const firstWeight = bodyWeight[0]?.weight || null

    const weightDifference =
        currentWeight && firstWeight
            ? (currentWeight - firstWeight).toFixed(1)
            : null

    function updateProfileField(field, value) {
        setProfile({
            ...profile,
            [field]: value,
        })
    }

    function handleAddWeight(event) {
        event.preventDefault()

        if (!weightInput || !dateInput) {
            alert('Informe o peso e a data.')
            return
        }

        const newRecord = {
            id: crypto.randomUUID(),
            weight: Number(weightInput),
            date: dateInput,
        }

        const updatedWeights = [...bodyWeight, newRecord].sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        )

        setBodyWeight(updatedWeights)
        setWeightInput('')
        setDateInput('')
    }

    function handleDeleteWeight(id) {
        const confirmDelete = window.confirm('Deseja excluir este registro de peso?')

        if (!confirmDelete) return

        setBodyWeight(bodyWeight.filter((item) => item.id !== id))
    }

    return (
        <>
            <PageHeader
                title="Perfil"
                description="Gerencie seus dados pessoais, objetivo, evolução corporal e principais marcas."
                action={
                    <Badge variant="purple">
                        {totalWorkouts} treinos concluídos
                    </Badge>
                }
            />

            <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-1 space-y-6">
                    <Card>
                        <h2 className="text-xl font-bold">
                            Perfil do atleta
                        </h2>

                        <p className="text-sm text-zinc-500 mt-1">
                            Esses dados ficam salvos no navegador.
                        </p>

                        <div className="mt-5 space-y-4">
                            <Input
                                label="Nome"
                                placeholder="Seu nome"
                                value={profile.name}
                                onChange={(event) => updateProfileField('name', event.target.value)}
                            />

                            <Input
                                label="Altura"
                                placeholder="Ex: 1.75"
                                value={profile.height}
                                onChange={(event) => updateProfileField('height', event.target.value)}
                            />

                            <Select
                                label="Objetivo"
                                value={profile.goal}
                                onChange={(event) => updateProfileField('goal', event.target.value)}
                            >
                                <option value="">Selecione</option>
                                <option value="Bulking">Bulking</option>
                                <option value="Cutting">Cutting</option>
                                <option value="Recomposição">Recomposição</option>
                                <option value="Força">Força</option>
                                <option value="Hipertrofia">Hipertrofia</option>
                            </Select>

                            <Select
                                label="Nível"
                                value={profile.experience}
                                onChange={(event) => updateProfileField('experience', event.target.value)}
                            >
                                <option value="">Selecione</option>
                                <option value="Iniciante">Iniciante</option>
                                <option value="Intermediário">Intermediário</option>
                                <option value="Avançado">Avançado</option>
                            </Select>

                            <Select
                                label="Meta semanal"
                                value={profile.weeklyTarget}
                                onChange={(event) => updateProfileField('weeklyTarget', event.target.value)}
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
                                onChange={(event) => updateProfileField('preferredSplit', event.target.value)}
                            />

                            <Textarea
                                label="Notas pessoais"
                                placeholder="Ex: foco em força no supino, melhorar cardio, evitar dor no ombro..."
                                rows={4}
                                value={profile.notes}
                                onChange={(event) => updateProfileField('notes', event.target.value)}
                            />
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold">
                            Registrar peso
                        </h2>

                        <p className="text-sm text-zinc-500 mt-1">
                            Clique no campo de data para abrir o calendário.
                        </p>

                        <form onSubmit={handleAddWeight} className="mt-5 space-y-4">
                            <Input
                                label="Peso"
                                type="number"
                                step="0.1"
                                placeholder="Ex: 72.5"
                                value={weightInput}
                                onChange={(event) => setWeightInput(event.target.value)}
                            />

                            <div>
                                <label className="text-sm font-medium text-zinc-400">
                                    Data
                                </label>

                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    value={dateInput}
                                    onClick={() => dateInputRef.current?.showPicker?.()}
                                    onFocus={() => dateInputRef.current?.showPicker?.()}
                                    onChange={(event) => setDateInput(event.target.value)}
                                    className="mt-2 w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                                />
                            </div>

                            <Button type="submit" className="w-full">
                                Adicionar peso
                            </Button>
                        </form>
                    </Card>
                </div>

                <div className="xl:col-span-3 space-y-6">
                    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <Card className="p-4">
                            <p className="text-sm text-zinc-500">
                                Peso atual
                            </p>

                            <h3 className="text-3xl font-bold mt-2 text-violet-400">
                                {currentWeight ? `${currentWeight}kg` : '--'}
                            </h3>

                            {weightDifference && (
                                <p className="text-xs text-zinc-500 mt-2">
                                    Variação: {weightDifference > 0 ? '+' : ''}
                                    {weightDifference}kg
                                </p>
                            )}
                        </Card>

                        <Card className="p-4">
                            <p className="text-sm text-zinc-500">
                                Altura
                            </p>

                            <h3 className="text-3xl font-bold mt-2">
                                {profile.height || '--'}
                            </h3>
                        </Card>

                        <Card className="p-4">
                            <p className="text-sm text-zinc-500">
                                Meta semanal
                            </p>

                            <h3 className="text-3xl font-bold mt-2">
                                {profile.weeklyTarget || '--'}
                            </h3>
                        </Card>

                        <Card className="p-4">
                            <p className="text-sm text-zinc-500">
                                PRs registrados
                            </p>

                            <h3 className="text-3xl font-bold mt-2">
                                🏆 {prs.length}
                            </h3>
                        </Card>
                    </section>

                    <Card>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-xl font-bold">
                                    Resumo pessoal
                                </h2>

                                <p className="text-sm text-zinc-500 mt-1">
                                    Informações que não aparecem no Dashboard.
                                </p>
                            </div>

                            <Badge variant="purple">
                                {profile.goal || 'Sem objetivo'}
                            </Badge>
                        </div>

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-xs text-zinc-500">
                                    Nome
                                </p>

                                <p className="font-bold mt-1">
                                    {profile.name || 'Não informado'}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-xs text-zinc-500">
                                    Nível
                                </p>

                                <p className="font-bold mt-1">
                                    {profile.experience || 'Não informado'}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-xs text-zinc-500">
                                    Divisão preferida
                                </p>

                                <p className="font-bold mt-1">
                                    {profile.preferredSplit || 'Não informado'}
                                </p>
                            </div>
                        </div>

                        {profile.notes && (
                            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-xs text-zinc-500">
                                    Notas pessoais
                                </p>

                                <p className="text-sm text-zinc-300 mt-2">
                                    {profile.notes}
                                </p>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold">
                            Evolução do peso corporal
                        </h2>

                        <p className="text-sm text-zinc-500 mt-1">
                            Gráfico baseado nos registros adicionados.
                        </p>

                        <div className="mt-5 h-72">
                            {bodyWeight.length === 0 ? (
                                <EmptyState
                                    title="Nenhum peso registrado"
                                    description="Adicione seu primeiro peso corporal para gerar o gráfico."
                                />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={bodyWeight}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                        <XAxis dataKey="date" stroke="#71717a" />
                                        <YAxis stroke="#71717a" />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#09090b',
                                                border: '1px solid #27272a',
                                                borderRadius: '12px',
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            dot
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <Card>
                            <h2 className="text-xl font-bold">
                                Destaques pessoais
                            </h2>

                            <div className="mt-5 space-y-3">
                                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                    <p className="text-xs text-zinc-500">
                                        Maior carga registrada
                                    </p>

                                    {heaviestExercise ? (
                                        <>
                                            <h3 className="text-xl font-bold mt-1">
                                                {heaviestExercise.weight}kg
                                            </h3>

                                            <p className="text-sm text-zinc-400 mt-1">
                                                {heaviestExercise.exerciseName} × {heaviestExercise.reps} reps
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-zinc-500 mt-2">
                                            Sem dados ainda.
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                    <p className="text-xs text-zinc-500">
                                        Exercício mais feito
                                    </p>

                                    {mostTrainedExercise ? (
                                        <>
                                            <h3 className="text-xl font-bold mt-1">
                                                {mostTrainedExercise.name}
                                            </h3>

                                            <p className="text-sm text-zinc-400 mt-1">
                                                {mostTrainedExercise.total} séries feitas
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-zinc-500 mt-2">
                                            Sem dados ainda.
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                    <p className="text-xs text-zinc-500">
                                        Total pessoal
                                    </p>

                                    <p className="text-sm text-zinc-400 mt-2">
                                        {totalWorkouts} treinos concluídos • {totalSets} séries concluídas
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-xl font-bold">
                                PRs por exercício
                            </h2>

                            <p className="text-sm text-zinc-500 mt-1">
                                Melhores marcas salvas no histórico.
                            </p>

                            <div className="mt-5 max-h-[360px] overflow-y-auto pr-2 space-y-3">
                                {prs.length === 0 && (
                                    <EmptyState
                                        title="Nenhum PR encontrado"
                                        description="Finalize treinos com peso e reps para gerar PRs."
                                    />
                                )}

                                {prs.map((pr) => (
                                    <div
                                        key={pr.exerciseName}
                                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-semibold">
                                                    {pr.exerciseName}
                                                </p>

                                                <p className="text-xs text-zinc-500 mt-1">
                                                    {pr.muscleGroup}
                                                </p>
                                            </div>

                                            <Badge>
                                                {pr.weight}kg × {pr.reps}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </section>

                    <Card>
                        <h2 className="text-xl font-bold">
                            Registros de peso
                        </h2>

                        <div className="mt-5 space-y-2">
                            {bodyWeight.length === 0 && (
                                <p className="text-sm text-zinc-500">
                                    Nenhum registro ainda.
                                </p>
                            )}

                            {bodyWeight.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                                >
                                    <div>
                                        <p className="font-semibold">
                                            {item.weight}kg
                                        </p>

                                        <p className="text-xs text-zinc-500">
                                            {item.date}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="danger"
                                        onClick={() => handleDeleteWeight(item.id)}
                                        className="py-2 text-sm"
                                    >
                                        Excluir
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </section>
        </>
    )
}

export default Profile