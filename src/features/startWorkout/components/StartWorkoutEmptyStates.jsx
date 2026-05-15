import { Link } from 'react-router-dom'

import PageHeader from '../../../components/ui/PageHeader'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'

export function InvalidSessionState({ onClear }) {
  return (
    <>
      <PageHeader
        title="Executar treino"
        description="Encontramos uma sessão ativa incompleta ou corrompida."
      />

      <EmptyState
        title="Sessão de treino inválida"
        description="Isso pode acontecer após mudanças no formato dos dados. Limpe a sessão ativa e inicie o treino novamente."
        action={
          <Button
            type="button"
            variant="danger"
            onClick={onClear}
          >
            Limpar sessão ativa
          </Button>
        }
      />
    </>
  )
}


export function NoActiveSessionState() {
  return (
    <>
      <PageHeader
        title="Executar treino"
        description="Nenhum treino está em andamento no momento."
      />

      <EmptyState
        title="Nenhum treino ativo"
        description="Vá até a página de Treinos e inicie uma rotina salva."
        action={
          <Link to="/workouts">
            <Button>
              Ir para treinos
            </Button>
          </Link>
        }
      />
    </>
  )
}
