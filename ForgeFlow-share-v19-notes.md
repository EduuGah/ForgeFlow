# ForgeFlow Share V19

## Foco desta versão
- Evolução do editor contextual das figurinhas.
- Mais controle visual sem voltar a poluir a tela.
- Melhor consistência entre preview e exportação ao mexer na ordem das figurinhas.

## Melhorias
- Suporte a ordem de camada por figurinha (`zIndex`).
- Renderização das figurinhas agora respeita a ordem tanto no preview quanto na exportação.
- Novo controle de camadas no popover contextual:
  - Para trás
  - -1 camada
  - +1 camada
  - Para frente
- Novos presets de layout prontos:
  - Base
  - Compacto
  - Hero
  - Analytics
- Ao ativar uma figurinha novamente, ela volta já em destaque na frente.
- Defaults de borda e aparência padronizados no estado das figurinhas.
- Inspector contextual mais completo, com presets rápidos e opção de ocultar a figurinha selecionada.

## Arquivos alterados
- src/components/workout/WorkoutShareStudio.jsx
