import { X } from 'lucide-react'

import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Textarea from '../../../components/ui/Textarea'
import { muscleGroupOrder } from '../exerciseLibraryUtils'
import { HelperTextarea, MediaUploader } from './ExerciseLibraryUi'

function FormSection({ eyebrow, title, description, children }) {
  return (
    <section className="ff-exercise-form-section">
      <div className="ff-exercise-form-section__head">
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>

      <div className="ff-exercise-form-section__body">
        {children}
      </div>
    </section>
  )
}

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
    <div className="ff-exercise-form-modal fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-3 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-6">
      <div className="ff-exercise-form-modal__panel flex h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-[#121212] shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] sm:h-auto sm:max-h-[92vh]">
        <div className="ff-exercise-form-modal__header shrink-0 border-b border-zinc-800 bg-[#121212]/95 p-4 backdrop-blur-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
                {editingId ? 'Editar exercício' : 'Exercício pessoal'}
              </p>

              <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                {editingId ? 'Atualizar exercício' : 'Criar exercício'}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                {editingId
                  ? 'Atualize as informações que aparecem na sua biblioteca e nos detalhes do exercício.'
                  : 'Cadastre um movimento próprio com imagem, execução, dicas e erros para evitar. Ele fica só na biblioteca deste usuário.'}
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Fechar cadastro de exercício"
            >
              <X size={22} />
            </button>
          </div>

          {!editingId && (
            <div className="ff-exercise-form-modal__privacy-note">
              <strong>Criado por você</strong>
              <span>Este exercício será marcado como pessoal e salvo apenas para este usuário.</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="ff-exercise-form-modal__form flex min-h-0 flex-1 flex-col">
          <div className="ff-exercise-form-modal__scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-4">
              <FormSection
                eyebrow="01"
                title="Identidade e mídia"
                description="Defina como o exercício aparece nos cards da biblioteca."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                    {muscleGroupOrder.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Músculo alvo"
                    placeholder="Ex: Peitoral maior, dorsal, trapézio..."
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
                </div>
              </FormSection>

              <FormSection
                eyebrow="02"
                title="Descrição rápida"
                description="Use para explicar quando usar o exercício ou qual é o foco dele."
              >
                <div className="space-y-4">
                  <Textarea
                    label="Observações"
                    placeholder="Ex: exercício principal para peito, bom para progressão de carga, melhor no início do treino..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                  />

                  <HelperTextarea
                    label="Músculos secundários"
                    placeholder={`Exemplo:\nTríceps\nOmbros\nCore`}
                    value={secondaryMusclesText}
                    onChange={(event) => setSecondaryMusclesText(event.target.value)}
                    rows={4}
                    helper="Escreva um item em cada linha para organizar os músculos envolvidos."
                    examples={['Tríceps', 'Ombros', 'Core']}
                  />
                </div>
              </FormSection>

              <FormSection
                eyebrow="03"
                title="Como fazer"
                description="Passo a passo que aparece nos detalhes do exercício."
              >
                <HelperTextarea
                  label="Execução correta"
                  placeholder={`Exemplo:\nDeite no banco com os pés firmes no chão.\nSegure a barra um pouco mais aberta que os ombros.\nDesça com controle até próximo ao peito.\nEmpurre para cima mantendo o quadril no banco.`}
                  value={execution}
                  onChange={(event) => setExecution(event.target.value)}
                  rows={6}
                  helper="Separe cada etapa em uma nova linha para virar uma lista fácil de ler."
                  examples={['1 etapa por linha', 'controle', 'amplitude']}
                />
              </FormSection>

              <FormSection
                eyebrow="04"
                title="O que evitar e dicas"
                description="Ajude o usuário a executar melhor e com mais segurança."
              >
                <div className="space-y-4">
                  <HelperTextarea
                    label="O que evitar"
                    placeholder={`Exemplo:\nQuicar a barra no peito.\nAbrir demais os cotovelos.\nTirar o quadril do banco.`}
                    value={commonMistakes}
                    onChange={(event) => setCommonMistakes(event.target.value)}
                    rows={4}
                    helper="Liste os erros mais comuns. Cada erro em uma linha."
                    examples={['erro por linha', 'postura', 'segurança']}
                  />

                  <HelperTextarea
                    label="Dicas"
                    placeholder={`Exemplo:\nMantenha as escápulas retraídas.\nControle a descida.\nUse uma carga que permita boa amplitude.`}
                    value={variations}
                    onChange={(event) => setVariations(event.target.value)}
                    rows={4}
                    helper="Use para dicas rápidas de técnica, segurança ou foco muscular."
                    examples={['dica por linha', 'foco muscular', 'progressão']}
                  />
                </div>
              </FormSection>
            </div>
          </div>

          <div className="ff-exercise-form-modal__footer shrink-0 border-t border-zinc-800 bg-[#121212]/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-6">
            <div className="grid grid-cols-2 gap-3">
              <Button type="submit" className="w-full">
                {editingId ? 'Salvar' : 'Criar exercício'}
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
        </form>
      </div>
    </div>
  )
}

export default ExerciseFormModal
