import { useEffect, useState } from 'react'

import defaultExercises from '../data/defaultExercises'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

function Exercises() {
    const [exercises, setExercises] = useState([])

    const [name, setName] = useState('')
    const [muscleGroup, setMuscleGroup] = useState('')
    const [equipment, setEquipment] = useState('')
    const [description, setDescription] = useState('')

    const [search, setSearch] = useState('')
    const [groupFilter, setGroupFilter] = useState('')
    const [equipmentFilter, setEquipmentFilter] = useState('')

    const [expandedExerciseId, setExpandedExerciseId] = useState(null)
    const [openedGroups, setOpenedGroups] = useState({})
    const [editingId, setEditingId] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    const muscleGroups = [
        'Peito',
        'Costas',
        'Ombros',
        'Bíceps',
        'Tríceps',
        'Antebraço',
        'Trapézio',
        'Abdômen',
        'Lombar',
        'Glúteos',
        'Quadríceps',
        'Posterior de Coxa',
        'Panturrilhas',
        'Adutores',
        'Abdutores',
        'Cardio',
        'Mobilidade',
        'Alongamento',
        'Corpo Inteiro',
    ]

    const equipmentList = [
        'Barra',
        'Halter',
        'Máquina',
        'Mobilidade',
    ]

    useEffect(() => {
        const savedExercises = localStorage.getItem('forgeflow:exercises')

        if (savedExercises) {
            const parsedExercises = JSON.parse(savedExercises)

            if (parsedExercises.length > 0) {
                setExercises(parsedExercises)
                setIsLoaded(true)
                return
            }
        }

        const exercisesWithIds = defaultExercises.map((exercise) => ({
            id: crypto.randomUUID(),
            ...exercise,
            createdAt: new Date().toISOString(),
        }))

        setExercises(exercisesWithIds)
        localStorage.setItem('forgeflow:exercises', JSON.stringify(exercisesWithIds))
        setIsLoaded(true)
    }, [])

    useEffect(() => {
        if (!isLoaded) return

        localStorage.setItem('forgeflow:exercises', JSON.stringify(exercises))
    }, [exercises, isLoaded])

    const filteredExercises = exercises.filter((exercise) => {
        const text = `${exercise.name} ${exercise.muscleGroup} ${exercise.equipment} ${exercise.description || ''}`.toLowerCase()

        const matchesSearch = text.includes(search.toLowerCase())
        const matchesGroup = groupFilter ? exercise.muscleGroup === groupFilter : true
        const matchesEquipment = equipmentFilter ? exercise.equipment === equipmentFilter : true

        return matchesSearch && matchesGroup && matchesEquipment
    })

    const groupedExercises = filteredExercises.reduce((groups, exercise) => {
        const group = exercise.muscleGroup || 'Outros'

        if (!groups[group]) {
            groups[group] = []
        }

        groups[group].push(exercise)

        return groups
    }, {})

    function resetForm() {
        setName('')
        setMuscleGroup('')
        setEquipment('')
        setDescription('')
        setEditingId(null)
    }

    function handleSubmit(event) {
        event.preventDefault()

        if (!name.trim() || !muscleGroup || !equipment) {
            alert('Preencha nome, grupo muscular e equipamento.')
            return
        }

        if (editingId) {
            setExercises(
                exercises.map((exercise) =>
                    exercise.id === editingId
                        ? {
                            ...exercise,
                            name,
                            muscleGroup,
                            equipment,
                            description,
                            updatedAt: new Date().toISOString(),
                        }
                        : exercise
                )
            )

            resetForm()
            return
        }

        const newExercise = {
            id: crypto.randomUUID(),
            name,
            muscleGroup,
            equipment,
            description,
            createdAt: new Date().toISOString(),
        }

        setExercises([newExercise, ...exercises])
        resetForm()
    }

    function handleEdit(exercise) {
        setEditingId(exercise.id)
        setName(exercise.name)
        setMuscleGroup(exercise.muscleGroup)
        setEquipment(exercise.equipment)
        setDescription(exercise.description || '')

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    function handleDelete(id) {
        setExercises(exercises.filter((exercise) => exercise.id !== id))

        if (editingId === id) {
            resetForm()
        }
    }

    function handleToggleExercise(id) {
        setExpandedExerciseId(expandedExerciseId === id ? null : id)
    }

    function handleToggleGroup(group) {
        setOpenedGroups((prev) => {
            const isCurrentlyOpen = prev[group] ?? true

            return {
                ...prev,
                [group]: !isCurrentlyOpen,
            }
        })
    }
    function clearFilters() {
        setSearch('')
        setGroupFilter('')
        setEquipmentFilter('')
    }

    return (
        <>
            <PageHeader
                title="Exercícios"
                description="Cadastre, edite e organize os exercícios usados nos seus treinos."
                action={
                    <Badge variant="purple">
                        {exercises.length} exercícios
                    </Badge>
                }
            />

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="h-fit">
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {editingId ? 'Editar exercício' : 'Novo exercício'}
                                </h2>

                                <p className="text-sm text-zinc-400 mt-1">
                                    {editingId
                                        ? 'Altere os dados e salve novamente.'
                                        : 'Adicione exercícios para montar seus treinos.'}
                                </p>
                            </div>

                            {editingId && (
                                <Badge variant="purple">
                                    Editando
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Nome do exercício"
                                type="text"
                                placeholder="Ex: Supino reto"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />

                            <Select
                                label="Grupo muscular"
                                value={muscleGroup}
                                onChange={(event) => setMuscleGroup(event.target.value)}
                            >
                                <option value="">Selecione</option>

                                {muscleGroups.map((group) => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </Select>

                            <Select
                                label="Equipamento"
                                value={equipment}
                                onChange={(event) => setEquipment(event.target.value)}
                            >
                                <option value="">Selecione</option>

                                {equipmentList.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </Select>

                            <Textarea
                                label="Descrição / Observações"
                                placeholder="Ex: foco em progressão de carga, drop set na última série..."
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                rows={4}
                            />

                            <Button type="submit" className="w-full">
                                {editingId ? 'Salvar alterações' : 'Cadastrar exercício'}
                            </Button>

                            {editingId && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={resetForm}
                                    className="w-full"
                                >
                                    Cancelar edição
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                <Card className="xl:col-span-2">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-xl font-bold">
                                Biblioteca de exercícios
                            </h2>

                            <p className="text-xs text-zinc-500 mt-1">
                                Total: {exercises.length} • Exibindo: {filteredExercises.length}
                            </p>
                        </div>

                        {(search || groupFilter || equipmentFilter) && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={clearFilters}
                                className="py-2 text-sm"
                            >
                                Limpar filtros
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                        <Input
                            type="text"
                            placeholder="Buscar exercício..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <Select
                            value={groupFilter}
                            onChange={(event) => setGroupFilter(event.target.value)}
                        >
                            <option value="">Todos os grupos</option>

                            {muscleGroups.map((group) => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))}
                        </Select>

                        <Select
                            value={equipmentFilter}
                            onChange={(event) => setEquipmentFilter(event.target.value)}
                        >
                            <option value="">Todos equipamentos</option>

                            {equipmentList.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="mt-5 max-h-[660px] overflow-y-auto pr-2 space-y-3">
                        {filteredExercises.length === 0 && (
                            <EmptyState
                                title="Nenhum exercício encontrado"
                                description="Tente limpar os filtros ou buscar por outro nome."
                            />
                        )}

                        {Object.entries(groupedExercises).map(([group, groupExercises]) => {
                            const isGroupOpen = openedGroups[group] ?? true

                            return (
                                <div
                                    key={group}
                                    className="rounded-2xl border border-zinc-800 bg-zinc-950/70 overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleToggleGroup(group)}
                                        className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-zinc-900 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">
                                                {isGroupOpen ? '▾' : '▸'}
                                            </span>

                                            <div className="text-left">
                                                <h3 className="font-bold text-white">
                                                    {group}
                                                </h3>

                                                <p className="text-xs text-zinc-500">
                                                    {groupExercises.length} exercícios
                                                </p>
                                            </div>
                                        </div>

                                        <Badge variant="purple">
                                            {groupExercises.length}
                                        </Badge>
                                    </button>

                                    {isGroupOpen && (
                                        <div className="border-t border-zinc-800 divide-y divide-zinc-800">
                                            {groupExercises.map((exercise) => {
                                                const isExpanded = expandedExerciseId === exercise.id

                                                return (
                                                    <div key={exercise.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleExercise(exercise.id)}
                                                            className="w-full text-left px-4 py-3 hover:bg-zinc-900 transition"
                                                        >
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div>
                                                                    <h4 className="font-semibold text-white">
                                                                        {exercise.name}
                                                                    </h4>

                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                        <Badge>
                                                                            {exercise.equipment}
                                                                        </Badge>

                                                                        {exercise.description && (
                                                                            <Badge variant="purple">
                                                                                Com observação
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <span className="text-zinc-500 text-xl">
                                                                    {isExpanded ? '−' : '+'}
                                                                </span>
                                                            </div>
                                                        </button>

                                                        {isExpanded && (
                                                            <div className="px-4 pb-4">
                                                                {exercise.description && (
                                                                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                                                        <p className="text-xs text-zinc-500">
                                                                            Observações
                                                                        </p>

                                                                        <p className="text-sm text-zinc-300 mt-1">
                                                                            {exercise.description}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        onClick={() => handleEdit(exercise)}
                                                                        className="w-full"
                                                                    >
                                                                        Editar
                                                                    </Button>

                                                                    <Button
                                                                        type="button"
                                                                        variant="danger"
                                                                        onClick={() => handleDelete(exercise.id)}
                                                                        className="w-full"
                                                                    >
                                                                        Excluir
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </Card>
            </section>
        </>
    )
}

export default Exercises