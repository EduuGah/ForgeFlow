import { Star, Wrench, Layers3, Target, Filter } from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import { FilterListButton } from './ExerciseLibraryUi'

function ExerciseFiltersSidebar({
  groupSearch,
  setGroupSearch,
  filteredGroupStats,
  groupFilter,
  setGroupFilter,
  subgroupSearch,
  setSubgroupSearch,
  filteredSubgroupStats,
  subgroupFilter,
  setSubgroupFilter,
  search,
  setSearch,
  showOnlyFavorites,
  setShowOnlyFavorites,
  stats,
  equipmentFilter,
  setEquipmentFilter,
  hasActiveFilters,
  clearFilters,
}) {
  return (
    <aside className="order-2 space-y-6 xl:order-1">
      <Card className="overflow-visible border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
        <div className="border-b border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
              <Layers3 size={22} />
            </div>

            <div>
              <h2 className="text-lg font-black">
                Grupos musculares
              </h2>

              <p className="text-sm text-zinc-500">
                Filtre pelas categorias principais.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Input
              type="text"
              placeholder="Buscar grupo..."
              value={groupSearch}
              onChange={(event) => setGroupSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto overscroll-contain p-4 pt-4">
          {filteredGroupStats.map((group) => (
            <FilterListButton
              key={group.name}
              title={group.name}
              count={group.count}
              active={groupFilter === group.name}
              onClick={() =>
                setGroupFilter(groupFilter === group.name ? '' : group.name)
              }
            />
          ))}

          {filteredGroupStats.length === 0 && (
            <p className="text-sm text-zinc-500">
              Nenhum grupo encontrado.
            </p>
          )}
        </div>
      </Card>

      <Card className="overflow-visible border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
        <div className="border-b border-zinc-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
              <Target size={22} />
            </div>

            <div>
              <h2 className="text-lg font-black">
                Subgrupos
              </h2>

              <p className="text-sm text-zinc-500">
                Ex.: Trapézio, Dorsal, Oblíquos.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Input
              type="text"
              placeholder="Buscar subgrupo..."
              value={subgroupSearch}
              onChange={(event) => setSubgroupSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto overscroll-contain p-4 pt-4">
          {filteredSubgroupStats.map((subgroup) => (
            <FilterListButton
              key={subgroup.name}
              title={subgroup.name}
              count={subgroup.count}
              active={subgroupFilter === subgroup.name}
              onClick={() =>
                setSubgroupFilter(
                  subgroupFilter === subgroup.name ? '' : subgroup.name
                )
              }
            />
          ))}

          {filteredSubgroupStats.length === 0 && (
            <p className="text-sm text-zinc-500">
              Nenhum subgrupo encontrado.
            </p>
          )}
        </div>
      </Card>

      <Card className="border border-zinc-800 bg-gradient-to-b from-[#17171b] to-[#121216]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
            <Filter size={22} />
          </div>

          <div>
            <h2 className="text-lg font-black">
              Filtros rápidos
            </h2>

            <p className="text-sm text-zinc-500">
              Refine a biblioteca rapidamente.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Input
            type="search"
            placeholder="Buscar por nome, grupo, equipamento..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowOnlyFavorites((current) => !current)}
            className={
              showOnlyFavorites
                ? 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-sm font-bold text-yellow-300 transition hover:bg-yellow-500/20'
                : 'flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 text-sm font-bold text-zinc-300 transition hover:border-yellow-500/30 hover:text-yellow-300'
            }
          >
            <Star
              size={17}
              fill={showOnlyFavorites ? 'currentColor' : 'none'}
            />
            Somente favoritos
          </button>

          <Select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
          >
            <option value="">Todos os grupos</option>

            {stats.muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </Select>

          <Select
            value={subgroupFilter}
            onChange={(event) => setSubgroupFilter(event.target.value)}
          >
            <option value="">Todos os subgrupos</option>

            {stats.subgroupList.map((subgroup) => (
              <option key={subgroup} value={subgroup}>
                {subgroup}
              </option>
            ))}
          </Select>

          <Select
            value={equipmentFilter}
            onChange={(event) => setEquipmentFilter(event.target.value)}
          >
            <option value="">Todos os equipamentos</option>

            {stats.equipmentList.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>

          {hasActiveFilters && (
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

      <Card className="hidden border border-zinc-800 bg-[#151518] xl:block">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
            <Wrench size={18} />
          </div>

          <div>
            <h2 className="text-base font-black">
              Equipamentos
            </h2>
          </div>
        </div>

        <div className="mt-4 grid max-h-[150px] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {stats.equipmentStats.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() =>
                setEquipmentFilter(
                  equipmentFilter === item.name ? '' : item.name
                )
              }
              className={
                equipmentFilter === item.name
                  ? 'rounded-xl border border-[var(--ff-accent-border)]/40 bg-[var(--ff-accent-soft)]/10 p-2.5 text-left shadow-[0_0_14px_var(--ff-accent-shadow)]/10'
                  : 'rounded-xl border border-zinc-800 bg-[#18181b] p-2.5 text-left transition hover:border-[var(--ff-accent-border)]/30'
              }
            >
              <p className="line-clamp-1 text-xs font-semibold">
                {item.name}
              </p>

              <p className="mt-1 text-[11px] text-zinc-500">
                {item.count} ex.
              </p>
            </button>
          ))}
        </div>
      </Card>
    </aside>
  )
}

export default ExerciseFiltersSidebar
