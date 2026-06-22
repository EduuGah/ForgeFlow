# ForgeFlow Share V15

## Correções principais
- Exportação agora usa um canvas fora da tela, sem alterar o canvas visível do preview ao salvar/compartilhar.
- Isso evita a prévia trocar para a imagem já exportada e reduz divergência/duplicação com as figurinhas HTML.
- Preview de cada figurinha continua vindo do mesmo motor Canvas usado na exportação.

## Editor de figurinhas
- Novos botões de alinhamento manual:
  - esquerda
  - centro X
  - direita
  - topo
  - meio Y
  - base
  - alinhar com esquerda da figurinha mais próxima
  - alinhar com centro da figurinha mais próxima
  - alinhar com base da figurinha mais próxima
- Novos presets visuais de figurinha:
  - Glass
  - Clean
  - Bold Red
  - Minimal
  - Transparente
- Opção de aplicar tema Glass em todas as figurinhas.

## Salvamento
- O fluxo de salvar agora gera a arte final em canvas separado e preserva a área editável intacta.
- Mensagem de status atualizada para indicar que a imagem está sendo gerada exatamente como o preview.

## Arquivos alterados
- src/components/workout/WorkoutShareStudio.jsx
- src/styles/mobile-page-polish.css
