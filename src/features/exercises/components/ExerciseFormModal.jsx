import { X } from 'lucide-react'

import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import { muscleGroupOrder } from '../exerciseLibraryUtils'
import { HelperTextarea, MediaUploader } from './ExerciseLibraryUi'

function ExerciseFormModal({
  editingId,
  closeModal,
  handleSubmit,
  name,
  setName,
  mediaUrl,
  uploadedFileName,
  setMediaUrl,
  setUploadedFileName,
  handleMediaUpload,
  handleClearMedia,
  muscleGroup,
  setMuscleGroup,
  targetMuscle,
  setTargetMuscle,
  equipment,
  setEquipment,
  equipmentList,
  secondaryMusclesText,
  setSecondaryMusclesText,
  description,
  setDescription,
  execution,
  setExecution,
  commonMistakes,
  setCommonMistakes,
  variations,
  setVariations,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-[#121212] shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)]">
        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-[#121212]/95 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--ff-accent-text)]">
                {editingId ? 'Editar exercício' : 'Novo exercício'}
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {editingId ? 'Atualizar exercício' : 'Cadastrar exercício'}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Adicione grupo, subgrupo, músculos secundários, mídia e instruções.
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
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-120px)] overflow-y-auto p-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nome"
              type="text"
              placeholder="Ex: Supino reto"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <MediaUploader
              mediaUrl={mediaUrl}
              uploadedFileName={uploadedFileName}
              onUrlChange={(event) => {
                setMediaUrl(event.target.value)
                setUploadedFileName('')
              }}
              onFileChange={handleMediaUpload}
              onClear={handleClearMedia}
            />

            <Select
              label="Grupo muscular"
              value={muscleGroup}
              onChange={(event) => setMuscleGroup(event.target.value)}
            >
              <option value="">Selecione</option>

              {muscleGroupOrder.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </Select>

            <Input
              label="Subgrupo / músculo alvo"
              placeholder="Ex: Trapézio, Dorsal, Oblíquos..."
              value={targetMuscle}
              onChange={(event) => setTargetMuscle(event.target.value)}
            />

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
            <HelperTextarea
              label="Músculos secundários"
              placeholder={`Exemplo:
Tríceps
Ombros
Core`}
              value={secondaryMusclesText}
              onChange={(event) => setSecondaryMusclesText(event.target.value)}
              rows={4}
              helper="Escreva um item em cada linha. Cada linha vira um item separado na tela de detalhes."
              examples={['Tríceps', 'Ombros', 'Core']}
            />

            <Textarea
              label="Observações"
              placeholder="Ex: bom exercício para progressão de carga, ideal para iniciar o treino de peito..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />

            <HelperTextarea
              label="Execução correta"
              placeholder={`Exemplo:
Deite no banco com os pés firmes no chão.
Segure a barra um pouco mais aberta que os ombros.
Desça a barra com controle até próximo ao peito.
Empurre a barra para cima sem tirar o quadril do banco.`}
              value={execution}
              onChange={(event) => setExecution(event.target.value)}
              rows={5}
              helper="Escreva o passo a passo da execução. Separe cada etapa em uma nova linha para o app organizar em lista."
              examples={['1 etapa por linha', 'passo a passo', 'execução guiada']}
            />

            <HelperTextarea
              label="Erros comuns"
              placeholder={`Exemplo:
Quicar a barra no peito.
Abrir demais os cotovelos.
Tirar o quadril do banco.`}
              value={commonMistakes}
              onChange={(event) => setCommonMistakes(event.target.value)}
              rows={4}
              helper="Liste os erros que a pessoa deve evitar. Cada erro em uma linha."
              examples={['erro por linha', 'evitar', 'alertas']}
            />

            <HelperTextarea
              label="Dicas"
              placeholder={`Exemplo:
Mantenha as escápulas retraídas.
Controle a descida.
Mantenha os pés firmes no chão.`}
              value={variations}
              onChange={(event) => setVariations(event.target.value)}
              rows={4}
              helper="Use este campo para dicas rápidas de melhoria, segurança ou foco muscular. Cada dica em uma linha."
              examples={['dica por linha', 'segurança', 'foco muscular']}
            />
          </div>
        </form>

        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-zinc-800 bg-[#121212]/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:absolute">
          <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-3">
            <Button type="submit" onClick={handleSubmit} className="w-full">
              {editingId ? 'Salvar' : 'Cadastrar'}
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
        </div>
      </div>
    </div>
  )
}

export default ExerciseFormModal
