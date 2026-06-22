# ForgeFlow Share V12

## Correções
- Corrigido pinch zoom de figurinha com segundo dedo fora da figurinha: a camada transparente do preview agora recebe toques em área vazia quando a edição de figurinhas está ativa.
- Corrigido caso em que tocar uma segunda figurinha durante um gesto poderia trocar a seleção e quebrar o pinch: durante gesto ativo, o sticker selecionado continua sendo o alvo.
- Corrigido possível erro/tela preta ao adicionar figurinhas novas quando o treino não tem melhor série/carga registrada: `formatSetShort` agora aceita `null` com segurança.
- Mantidas as figurinhas extras da V11: Melhor série, Reps totais e Local/data.

## Arquivos alterados
- src/components/workout/WorkoutShareStudio.jsx
- src/styles/mobile-page-polish.css
