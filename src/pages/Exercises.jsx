import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  X,
  Dumbbell,
  ImageIcon,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(80)

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

  useEffect(() => {
    setVisibleCount(80)
    setExpandedExerciseId(null)
  }, [search, groupFilter, equipmentFilter, selectedGroupView])

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

  const displayedExercises = useMemo(() => {
    return filteredExercises.slice(0, visibleCount)
  }, [filteredExercises, visibleCount])

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

  function openCreateModal() {
    resetForm()
    setIsModalOpen(true)
  }

  function closeModal() {
    resetForm()
    setIsModalOpen(false)
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

      closeModal()
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
    closeModal()
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
    setIsModalOpen(true)
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
        title="Exercícios"
        description="Biblioteca de exercícios com grupos musculares, equipamentos, mídia e dicas de execução."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition hover:bg-violet-500 hover:shadow-[0_0_26px_rgba(139,92,246,0.55)]"
          >
            <Plus size={18} />
            Adicionar
          </button>
        }
      />

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Total
          </p>

          <h3 className="text-3xl font-bold mt-2">
            {exercises.length}
          </h3>

          <p className="text-xs text-violet-400 mt-2">
            Biblioteca ativa
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Grupos ativos
          </p>

          <h3 className="text-3xl font-bold mt-2">
            {groupStats.length}
          </h3>

          <p className="text-xs text-violet-400 mt-2">
            Categorias musculares
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Exibindo
          </p>

          <h3 className="text-3xl font-bold mt-2 text-violet-400">
            {filteredExercises.length}
          </h3>

          <p className="text-xs text-violet-400 mt-2">
            Resultado atual
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-zinc-500">
            Com mídia
          </p>

          <h3 className="text-3xl font-bold mt-2">
            {exercises.filter((exercise) => exercise.mediaUrl).length}
          </h3>

          <p className="text-xs text-violet-400 mt-2">
            Imagem ou GIF
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6 mt-6">
        <div className="xl:col-span-1 space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                <Search size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Filtros
                </h2>

                <p className="text-sm text-zinc-500">
                  Encontre exercícios rapidamente.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Input
                type="text"
                placeholder="Procurar exercícios..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <Select
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
              >
                <option value="">Todos os músculos</option>

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
                <option value="">Todos os equipamentos</option>

                {equipmentList.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>

              {(search || groupFilter || equipmentFilter || selectedGroupView) && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Grupos musculares
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              Toque em um grupo para filtrar.
            </p>

            <div className="mt-5 space-y-2 max-h-[420px] overflow-y-auto pr-2">
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
                        ? 'w-full rounded-2xl border border-violet-500/40 bg-violet-500/10 p-3 text-left shadow-[0_0_14px_rgba(139,92,246,0.25)]'
                        : 'w-full rounded-2xl border border-zinc-800 bg-[#18181b] p-3 text-left transition hover:border-violet-500/30 hover:bg-[#1f1f23]'
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={isSelected ? 'font-bold text-violet-300' : 'font-bold text-white'}>
                        {group.name}
                      </span>

                      <span className="text-xs text-zinc-500">
                        {group.count}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Equipamentos
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {equipmentStats.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() =>
                    setEquipmentFilter(equipmentFilter === item.name ? '' : item.name)
                  }
                  className={
                    equipmentFilter === item.name
                      ? 'rounded-2xl border border-violet-500/40 bg-violet-500/10 p-3 text-left'
                      : 'rounded-2xl border border-zinc-800 bg-[#18181b] p-3 text-left transition hover:border-violet-500/30'
                  }
                >
                  <p className="text-sm font-semibold">
                    {item.name}
                  </p>

                  <p className="text-xs text-zinc-500 mt-1">
                    {item.count}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-3">
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  Biblioteca
                </h2>

                <p className="text-sm text-zinc-500 mt-1">
                  {filteredExercises.length} exercícios encontrados • exibindo {displayedExercises.length}
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition hover:bg-violet-500 hover:shadow-[0_0_26px_rgba(139,92,246,0.55)]"
              >
                <Plus size={18} />
                Adicionar
              </button>
            </div>

            <div className="mt-6 max-h-[760px] overflow-y-auto pr-2">
              {filteredExercises.length === 0 && (
                <EmptyState
                  title="Nenhum exercício encontrado"
                  description="Tente limpar os filtros ou buscar por outro termo."
                />
              )}

              {displayedExercises.length > 0 && (
                <div className="space-y-2">
                  {displayedExercises.map((exercise) => {
                    const isExpanded = expandedExerciseId === exercise.id

                    return (
                      <div
                        key={exercise.id}
                        className="rounded-2xl border border-zinc-800 bg-[#18181b] transition hover:border-violet-500/40 hover:bg-[#1f1f23]"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleExercise(exercise.id)}
                          className="w-full p-4 text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-white">
                              {exercise.mediaUrl ? (
                                <img
                                  src={exercise.mediaUrl}
                                  alt={exercise.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Dumbbell size={28} className="text-zinc-900" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="truncate font-bold text-white">
                                {exercise.name}
                              </h3>

                              <p className="text-sm text-zinc-500 mt-0.5">
                                {exercise.muscleGroup}
                              </p>

                              {exercise.originalName && exercise.originalName !== exercise.name && (
                                <p className="truncate text-xs text-zinc-600 mt-0.5">
                                  {exercise.originalName}
                                </p>
                              )}
                            </div>

                            <div className="hidden md:flex items-center gap-2">
                              <Badge variant="purple">
                                {exercise.equipment}
                              </Badge>

                              {exercise.mediaUrl ? (
                                <Badge variant="green">
                                  <ImageIcon size={13} />
                                  Mídia
                                </Badge>
                              ) : (
                                <Badge>
                                  Sem mídia
                                </Badge>
                              )}
                            </div>

                            <ChevronDown
                              size={22}
                              className={
                                isExpanded
                                  ? 'shrink-0 rotate-180 text-violet-400 transition'
                                  : 'shrink-0 text-zinc-500 transition'
                              }
                            />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-zinc-800 px-4 pb-4">
                            {exercise.description ? (
                              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                  Observações
                                </p>

                                <p className="mt-2 text-sm text-zinc-300">
                                  {exercise.description}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-4 text-sm text-zinc-500">
                                Sem observações cadastradas.
                              </p>
                            )}

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <Link
                                to={`/exercises/${exercise.id}`}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 text-sm font-bold text-white transition hover:border-violet-500/40 hover:bg-zinc-800"
                              >
                                <ExternalLink size={17} />
                                Detalhes
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleEdit(exercise)}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 text-sm font-bold text-violet-300 transition hover:border-violet-400 hover:bg-violet-500/20 hover:shadow-[0_0_18px_rgba(139,92,246,0.25)]"
                              >
                                <Edit3 size={17} />
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(exercise.id)}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20"
                              >
                                <Trash2 size={17} />
                                Excluir
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {visibleCount < filteredExercises.length && (
                    <div className="pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setVisibleCount((current) => current + 80)}
                        className="w-full"
                      >
                        Carregar mais exercícios
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-violet-950/30">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-violet-400">
                  {editingId ? 'Editar exercício' : 'Novo exercício'}
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {editingId ? 'Atualizar exercício' : 'Cadastrar exercício'}
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Adicione mídia, instruções e informações úteis para a biblioteca.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome"
                  type="text"
                  placeholder="Ex: Supino reto"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />

                <Input
                  label="URL da imagem / GIF"
                  placeholder="https://..."
                  value={mediaUrl}
                  onChange={(event) => setMediaUrl(event.target.value)}
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
              </div>

              <div className="mt-4 space-y-4">
                <Textarea
                  label="Observações"
                  placeholder="Ex: foco em progressão de carga..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
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
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button type="submit" className="w-full">
                  {editingId ? 'Salvar alterações' : 'Cadastrar exercício'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Exercises