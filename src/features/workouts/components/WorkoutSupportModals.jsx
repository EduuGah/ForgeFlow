import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Textarea from '../../../components/ui/Textarea'

export function WorkoutFolderModal({
    folderName,
    onChangeFolderName,
    onClose,
    onCreateFolder,
}) {
    return (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/80 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:items-center sm:px-4">
            <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] sm:rounded-3xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-[var(--ff-accent-text)]">
                            Nova pasta
                        </p>

                        <h2 className="mt-1 text-2xl font-black">Criar pasta</h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            Organize seus treinos por categoria.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                    >
                        ×
                    </button>
                </div>

                <div className="mt-5">
                    <Input
                        placeholder="Nome da pasta"
                        value={folderName}
                        onChange={(event) => onChangeFolderName(event.target.value)}
                    />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button onClick={onCreateFolder} className="w-full">
                        Criar
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function WorkoutSetModelModal({
    setModelName,
    setModelLines,
    onChangeSetModelName,
    onChangeSetModelLines,
    onClose,
    onCreateSetModel,
}) {
    return (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/80 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:items-center sm:px-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] sm:rounded-3xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-[var(--ff-accent-text)]">
                            Novo modelo
                        </p>

                        <h2 className="mt-1 text-2xl font-black">
                            Modelo de séries
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            Crie um padrão para aplicar automaticamente nos exercícios adicionados.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                    >
                        ×
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    <Input
                        label="Nome do modelo"
                        placeholder="Ex: Peito pesado"
                        value={setModelName}
                        onChange={(event) => onChangeSetModelName(event.target.value)}
                    />

                    <Textarea
                        label="Séries"
                        placeholder={`Uma série por linha. Ex:\nAquecimento\n12 Rep\n10-12 Rep\n8 Rep`}
                        rows={6}
                        value={setModelLines}
                        onChange={(event) => onChangeSetModelLines(event.target.value)}
                    />

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-xs font-bold text-zinc-400">Exemplo</p>

                        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                            Cada linha vira uma série. Você pode escrever: “12 Rep”, “8-10 Rep”, “Falha”, “Aquecimento”, etc.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                        type="button"
                        onClick={onCreateSetModel}
                        className="w-full"
                    >
                        Criar modelo
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    )
}
