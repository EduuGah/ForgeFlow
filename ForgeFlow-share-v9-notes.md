# ForgeFlow Share Studio V9

Data: 22/06/2026

## Foco desta versão

Esta versão melhora a edição de figurinhas do modo Compartilhar Treino:

- Drag/zoom das figurinhas mais leve.
- Redução de travadas durante o movimento.
- Snap usando a caixa real da figurinha, não apenas o centro do canvas.
- Guia de centro vertical.
- Guia de centro horizontal.
- Nova guia de base da figurinha.
- Hero PR redesenhado para evitar sobreposição.
- Preview continua exportando igual ao canvas final.

## Arquivos alterados

- `src/components/workout/WorkoutShareStudio.jsx`
- `src/styles/mobile-page-polish.css`

## Detalhes técnicos

### Performance

A V8 redesenhava o canvas completo durante o gesto. Na V9, quando o usuário edita as figurinhas, o app mantém um canvas-base em cache com foto/fundo e redesenha apenas a camada de sticker por cima.

Também foi adicionado controle contra múltiplos desenhos simultâneos durante gestos rápidos.

### Snap

O snap agora calcula a caixa real da figurinha de cada template e encaixa:

- centro X da figurinha no centro do card;
- centro Y da figurinha no centro do card;
- base da figurinha em uma linha segura inferior.

### Hero PR

O sticker Hero PR foi redesenhado com um badge grande e texto curto, reduzindo a chance de textos longos invadirem outros elementos.

## Validação

Executado com sucesso:

```bash
npx eslint src/components/workout/WorkoutShareStudio.jsx src/utils/shareNativeBridge.js
npm run build
```
