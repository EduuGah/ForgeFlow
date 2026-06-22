# ForgeFlow Share Studio V10

## Objetivo
Resolver a lentidão ao mover figurinhas e transformar o modo de compartilhamento em um editor de camadas separáveis, inspirado no fluxo do Hevy/Instagram Stories.

## Mudanças principais

- As figurinhas deixaram de ser redesenhadas no canvas durante o gesto.
- O preview agora usa canvas apenas para foto/fundo e usa elementos HTML/CSS para as figurinhas editáveis.
- O movimento e zoom das figurinhas são aplicados diretamente no `style` do elemento durante o gesto, sem `setState` a cada frame.
- O React só recebe o estado final quando o usuário solta o dedo.
- A exportação continua usando canvas e desenha as figurinhas no mesmo estado salvo.
- Adicionados stickers separáveis:
  - Resumo
  - Métricas
  - Lista de exercícios
  - Séries e reps
  - Pesos
  - Volume total
  - PRs
  - Frase
- Cada sticker pode ser ativado/desativado separadamente.
- Cada sticker pode ser selecionado, movido e redimensionado separadamente.
- Autoalinhamento agora considera a caixa individual do sticker.
- Guias preservadas:
  - centro horizontal
  - centro vertical
  - base segura

## Arquivos alterados

- `src/components/workout/WorkoutShareStudio.jsx`
- `src/styles/mobile-page-polish.css`

## Validação

Executado com sucesso:

```bash
npx eslint src/components/workout/WorkoutShareStudio.jsx
npm run build
```

## Observação

HEIC/HEIF continua dependendo da conversão nativa adicionada na V8 pelo plugin Android `normalizeImageToJpeg`. Para testar HEIC no celular, é necessário rodar `npx cap sync android` e gerar novo APK.
