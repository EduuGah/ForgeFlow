import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

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
  const [mediaUrl, setMediaUrl] = useState('')
  const [execution, setExecution] = useState('')
  const [commonMistakes, setCommonMistakes] = useState('')
  const [variations, setVariations] = useState('')

  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [selectedGroupView, setSelectedGroupView] = useState('')

  const [expandedExerciseId, setExpandedExerciseId] = useState(null)
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

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const text = `
        ${exercise.name}
        ${exercise.muscleGroup}
        ${exercise.equipment}
        ${exercise.description || ''}
        ${exercise.originalName || ''}
      `.toLowerCase()

      const matchesSearch = text.includes(search.toLowerCase())

      const matchesGroup = groupFilter
        ? exercise.muscleGroup === groupFilter
        : true

      const matchesEquipment = equipmentFilter
        ? exercise.equipment === equipmentFilter
        : true

      const matchesGroupView = selectedGroupView
        ? exercise.muscleGroup === selectedGroupView
        : true

      return matchesSearch && matchesGroup && matchesEquipment && matchesGroupView
    })
  }, [exercises, search, groupFilter, equipmentFilter, selectedGroupView])

  const groupStats = useMemo(() => {
    return muscleGroups
      .map((group) => ({
        name: group,
        count: exercises.filter((exercise) => exercise.muscleGroup === group).length,
      }))
      .filter((group) => group.count > 0)
  }, [exercises])

  const equipmentStats = useMemo(() => {
    return equipmentList.map((item) => ({
      name: item,
      count: exercises.filter((exercise) => exercise.equipment === item).length,
    }))
  }, [exercises])

  function textToList(text) {
    return text
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function listToText(list) {
    if (Array.isArray(list)) {
      return list.join('\n')
    }

    return list || ''
  }

  function resetForm() {
    setName('')
    setMuscleGroup('')
    setEquipment('')
    setDescription('')
    setMediaUrl('')
    setExecution('')
    setCommonMistakes('')
    setVariations('')
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
                mediaUrl,
                execution: textToList(execution),
                commonMistakes: textToList(commonMistakes),
                variations: textToList(variations),
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
      mediaUrl,
      execution: textToList(execution),
      commonMistakes: textToList(commonMistakes),
      variations: textToList(variations),
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
    setMediaUrl(exercise.mediaUrl || '')
    setExecution(listToText(exercise.execution))
    setCommonMistakes(listToText(exercise.commonMistakes))
    setVariations(listToText(exercise.variations))

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function handleDelete(id) {
    const confirmDelete = window.confirm(
      'Tem certeza que deseja excluir este exercício?'
    )

    if (!confirmDelete) return

    setExercises(exercises.filter((exercise) => exercise.id !== id))

    if (editingId === id) {
      resetForm()
    }
  }

  function handleToggleExercise(id) {
    setExpandedExerciseId(expandedExerciseId === id ? null : id)
  }

  function clearFilters() {
    setSearch('')
    setGroupFilter('')
    setEquipmentFilter('')
    setSelectedGroupView('')
  }

  return (
    <>
      <PageHeader
        title="Biblioteca de Exercícios"
        description="Organize sua base de exercícios por grupo muscular, equipamento, mídia e dicas de execução."
        action={
          <Badge variant="purple">
            {exercises.length} exercícios
          </Badge>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <Card>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">
                    {editingId ? 'Editar exercício' : 'Novo exercício'}
                  </h2>

                  {editingId && (
                    <Badge variant="purple">
                      Editando
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-zinc-400 mt-1">
                  {editingId
                    ? 'Atualize as informações do exercício.'
                    : 'Adicione um exercício à sua biblioteca.'}
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nome"
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
                  label="Observações"
                  placeholder="Ex: foco em progressão de carga..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                />

                <Input
                  label="URL da imagem / GIF"
                  placeholder="https://..."
                  value={mediaUrl}
                  onChange={(event) => setMediaUrl(event.target.value)}
                />

                <Textarea
                  label="Execução correta"
                  placeholder="Uma dica por linha"
                  value={execution}
                  onChange={(event) => setExecution(event.target.value)}
                  rows={4}
                />

                <Textarea
                  label="Erros comuns"
                  placeholder="Um erro por linha"
                  value={commonMistakes}
                  onChange={(event) => setCommonMistakes(event.target.value)}
                  rows={4}
                />

                <Textarea
                  label="Variações"
                  placeholder="Uma variação por linha"
                  value={variations}
                  onChange={(event) => setVariations(event.target.value)}
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

          <Card>
            <h3 className="font-bold">
              Equipamentos
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {equipmentStats.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                >
                  <p className="text-sm font-semibold">
                    {item.name}
                  </p>

                  <p className="text-xs text-zinc-500 mt-1">
                    {item.count} exercícios
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-zinc-500">
                Total
              </p>

              <h3 className="text-2xl font-bold mt-1">
                {exercises.length}
              </h3>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-zinc-500">
                Grupos ativos
              </p>

              <h3 className="text-2xl font-bold mt-1">
                {groupStats.length}
              </h3>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-zinc-500">
                Exibindo
              </p>

              <h3 className="text-2xl font-bold mt-1 text-violet-400">
                {filteredExercises.length}
              </h3>
            </Card>
          </div>

          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Grupos musculares
                </h2>

                <p className="text-sm text-zinc-500 mt-1">
                  Clique em um grupo para focar a biblioteca.
                </p>
              </div>

              {selectedGroupView && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedGroupView('')}
                  className="py-2 text-sm"
                >
                  Ver todos
                </Button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {groupStats.map((group) => {
                const isSelected = selectedGroupView === group.name

                return (
                  <button
                    key={group.name}
                    type="button"
                    onClick={() =>
                      setSelectedGroupView(isSelected ? '' : group.name)
                    }
                    className={
                      isSelected
                        ? 'rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4 text-left transition'
                        : 'rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left transition hover:border-violet-500/30 hover:bg-zinc-900'
                    }
                  >
                    <p className={isSelected ? 'font-bold text-violet-300' : 'font-bold text-white'}>
                      {group.name}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      {group.count} exercícios
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Exercícios cadastrados
                </h2>

                <p className="text-xs text-zinc-500 mt-1">
                  Total: {exercises.length} • Exibindo: {filteredExercises.length}
                </p>
              </div>

              {(search || groupFilter || equipmentFilter || selectedGroupView) && (
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
                placeholder="Buscar por nome, grupo ou observação..."
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

            <div className="mt-5 max-h-[620px] overflow-y-auto pr-2">
              {filteredExercises.length === 0 && (
                <EmptyState
                  title="Nenhum exercício encontrado"
                  description="Tente limpar os filtros ou buscar por outro termo."
                />
              )}

              {filteredExercises.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {filteredExercises.map((exercise) => {
                    const isExpanded = expandedExerciseId === exercise.id

                    return (
                      <div
                        key={exercise.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950/80 transition hover:border-violet-500/30 hover:bg-zinc-950"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleExercise(exercise.id)}
                          className="w-full p-4 text-left"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="font-bold text-white truncate">
                                {exercise.name}
                              </h3>

                              {exercise.originalName && exercise.originalName !== exercise.name && (
                                <p className="text-xs text-zinc-500 mt-1">
                                  {exercise.originalName}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="purple">
                                  {exercise.muscleGroup}
                                </Badge>

                                <Badge>
                                  {exercise.equipment}
                                </Badge>

                                {exercise.mediaUrl && (
                                  <Badge variant="green">
                                    Com mídia
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <span className="text-xl text-zinc-500">
                              {isExpanded ? '−' : '+'}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-zinc-800 px-4 pb-4">
                            {exercise.description ? (
                              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                                <p className="text-xs text-zinc-500">
                                  Observações
                                </p>

                                <p className="mt-1 text-sm text-zinc-300">
                                  {exercise.description}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-4 text-sm text-zinc-500">
                                Sem observações cadastradas.
                              </p>
                            )}

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <Link to={`/exercises/${exercise.id}`}>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  className="w-full"
                                >
                                  Ver detalhes
                                </Button>
                              </Link>

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
          </Card>
        </div>
      </section>
    </>
  )
}

export default Exercises