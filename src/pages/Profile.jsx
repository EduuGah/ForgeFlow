import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Dumbbell, Medal, Pencil, Ruler, Target, UserRound, Weight } from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import Toast from '../components/ui/Toast'
import BodyWeightChart from '../components/progress/BodyWeightChart'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { getUserStorageData, saveUserStorageData } from '../utils/userStorage'
import { getCompletedSets, getExercisePRs, getHeaviestExercise, getMostTrainedExercise, getSessionDuration } from '../utils/analyticsUtils'
import { formatDuration } from '../utils/chartUtils'

function normalizeApiArray(data, key) { return Array.isArray(data) ? data : Array.isArray(data?.[key]) ? data[key] : [] }
function todayKey() { return new Date().toISOString().slice(0, 10) }
function formatDate(value) { if (!value) return '—'; return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) }
function normalizeWeight(item) { const date = item.date || item.createdAt; return { ...item, id: item.id || item._id || `${date}-${item.weight}`, label: date ? formatDate(date) : '—', date, weight: Number(item.weight || 0), note: item.note || '' } }

function Profile() {
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState(() => user || {})
  const [weights, setWeights] = useState([])
  const [history, setHistory] = useState([])
  const [weightInput, setWeightInput] = useState('')
  const [dateInput, setDateInput] = useState(todayKey())
  const [toast, setToast] = useState(null)
  const dateInputRef = useRef(null)

  useEffect(() => { setProfile(user || {}) }, [user])

  useEffect(() => {
    if (!user) return undefined
    let mounted = true
    const cachedWeights = getUserStorageData(user, 'bodyWeight', [])
    const cachedHistory = getUserStorageData(user, 'workoutHistory', [])
    setWeights(Array.isArray(cachedWeights) ? cachedWeights : [])
    setHistory(Array.isArray(cachedHistory) ? cachedHistory : [])
    async function load() {
      const [weightsData, historyData] = await Promise.allSettled([apiFetch('/body-weight'), apiFetch('/workout-history')])
      if (!mounted) return
      if (weightsData.status === 'fulfilled') { const value = normalizeApiArray(weightsData.value, 'weights'); setWeights(value); saveUserStorageData(user, 'bodyWeight', value) }
      if (historyData.status === 'fulfilled') { const value = normalizeApiArray(historyData.value, 'history'); setHistory(value); saveUserStorageData(user, 'workoutHistory', value) }
    }
    load().catch((error) => console.error(error))
    return () => { mounted = false }
  }, [user])

  const completedSets = useMemo(() => getCompletedSets(history), [history])
  const prs = useMemo(() => getExercisePRs(completedSets), [completedSets])
  const weightData = useMemo(() => weights.map(normalizeWeight).filter((item) => item.weight > 0), [weights])
  const currentWeight = weightData.at(-1)?.weight || profile.weight || null
  const firstWeight = weightData[0]?.weight || null
  const weightDifference = currentWeight && firstWeight ? Number(currentWeight - firstWeight).toFixed(1) : null
  const mostTrainedExercise = getMostTrainedExercise(completedSets)
  const heaviestExercise = getHeaviestExercise(completedSets)
  const totalDuration = history.reduce((total, session) => total + getSessionDuration(session), 0)

  async function handleAddWeight(event) {
    event.preventDefault()
    const weight = Number(weightInput)
    if (!weight || weight <= 0) { setToast({ type: 'error', title: 'Peso inválido', message: 'Informe um peso maior que zero.' }); return }
    const record = { id: crypto.randomUUID(), weight, date: dateInput || todayKey() }
    const next = [...weights, record]
    setWeights(next)
    saveUserStorageData(user, 'bodyWeight', next)
    setWeightInput('')
    setToast({ type: 'success', title: 'Peso salvo', message: 'Registro adicionado ao seu perfil.' })
    try {
      const saved = await apiFetch('/body-weight', { method: 'POST', body: JSON.stringify(record) })
      const normalized = [...weights, saved]
      setWeights(normalized)
      saveUserStorageData(user, 'bodyWeight', normalized)
    } catch (error) { console.error(error) }
  }

  async function handleQuickProfileSave() {
    const updated = { ...profile }
    setUser?.(updated)
    setToast({ type: 'success', title: 'Perfil atualizado', message: 'Informações salvas localmente.' })
    try { const data = await apiFetch('/me/profile', { method: 'PATCH', body: JSON.stringify(updated) }); setUser?.(data); setProfile(data) } catch (error) { console.error(error) }
  }

  return <>
    <PageHeader title="Perfil" description="Dados pessoais, peso corporal e resumo da sua evolução." action={<Button onClick={handleQuickProfileSave}><Pencil size={16} />Salvar perfil</Button>} />
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5"><Card><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">{profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name || 'Usuário'} className="h-full w-full object-cover" /> : <UserRound size={34} />}</div><div><Badge variant="purple">Atleta ForgeFlow</Badge><h1 className="mt-3 text-2xl font-black text-[var(--ff-text)]">{profile.name || user?.name || 'Atleta ForgeFlow'}</h1><p className="mt-1 text-sm text-[var(--ff-muted)]">{profile.email || user?.email || 'Sem e-mail'}</p></div></div></div><div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"><Input label="Nome" value={profile.name || ''} onChange={(e) => setProfile((current) => ({ ...current, name: e.target.value }))} /><Input label="Objetivo" value={profile.goal || ''} onChange={(e) => setProfile((current) => ({ ...current, goal: e.target.value }))} /><Input label="Altura (cm)" type="number" value={profile.height || ''} onChange={(e) => setProfile((current) => ({ ...current, height: e.target.value }))} /><Input label="Nível" value={profile.experience || ''} onChange={(e) => setProfile((current) => ({ ...current, experience: e.target.value }))} /></div></Card><BodyWeightChart data={weightData} /></div>
      <aside className="space-y-5"><Card><h2 className="text-xl font-black text-[var(--ff-text)]">Registrar peso</h2><form onSubmit={handleAddWeight} className="mt-4 space-y-3"><Input label="Peso" type="number" step="0.1" inputMode="decimal" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="Ex: 82.5" /><Input ref={dateInputRef} label="Data" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} /><Button type="submit" className="w-full"><Weight size={16} />Salvar peso</Button></form></Card><Card><h2 className="text-xl font-black text-[var(--ff-text)]">Resumo</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><Weight size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 font-black text-[var(--ff-text)]">{currentWeight ? `${currentWeight}kg` : '—'}</p><p className="text-xs text-[var(--ff-muted)]">peso atual</p></div><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><Dumbbell size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 font-black text-[var(--ff-text)]">{history.length}</p><p className="text-xs text-[var(--ff-muted)]">treinos</p></div><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><Medal size={18} className="text-yellow-300" /><p className="mt-2 font-black text-[var(--ff-text)]">{prs.length}</p><p className="text-xs text-[var(--ff-muted)]">PRs</p></div><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><Activity size={18} className="text-emerald-300" /><p className="mt-2 font-black text-[var(--ff-text)]">{formatDuration(totalDuration)}</p><p className="text-xs text-[var(--ff-muted)]">tempo</p></div></div></Card><Card><h2 className="text-xl font-black text-[var(--ff-text)]">Destaques</h2><div className="mt-4 space-y-3"><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><Target size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 text-xs text-[var(--ff-muted)]">Objetivo</p><p className="font-black text-[var(--ff-text)]">{profile.goal || 'Não definido'}</p></div><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><Ruler size={18} className="text-[var(--ff-accent-text)]" /><p className="mt-2 text-xs text-[var(--ff-muted)]">Altura</p><p className="font-black text-[var(--ff-text)]">{profile.height ? `${profile.height}cm` : 'Não definida'}</p></div><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><p className="text-xs text-[var(--ff-muted)]">Exercício mais treinado</p><p className="mt-1 font-black text-[var(--ff-text)]">{mostTrainedExercise?.exerciseName || 'Sem dados'}</p></div><div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><p className="text-xs text-[var(--ff-muted)]">Maior carga</p><p className="mt-1 font-black text-[var(--ff-text)]">{heaviestExercise ? `${heaviestExercise.exerciseName} • ${heaviestExercise.weight}kg` : 'Sem dados'}</p></div>{weightDifference && <div className="rounded-2xl bg-[var(--ff-surface-2)] p-3"><p className="text-xs text-[var(--ff-muted)]">Variação de peso</p><p className="mt-1 font-black text-[var(--ff-text)]">{weightDifference}kg</p></div>}</div></Card></aside>
    </section>
    <Toast show={Boolean(toast)} type={toast?.type} title={toast?.title} message={toast?.message} onClose={() => setToast(null)} />
  </>
}
export default Profile
