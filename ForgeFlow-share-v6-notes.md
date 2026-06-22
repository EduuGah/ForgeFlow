# ForgeFlow Share Studio V6

## Alterado

- `src/components/workout/WorkoutShareStudio.jsx`
- `src/styles/mobile-page-polish.css`

## Preservado sem alteração

- `src/utils/shareNativeBridge.js`
- `native/android/ForgeFlowMediaPlugin.java`
- `android/app/src/main/java/com/edugah3/forgeflow/ForgeFlowMediaPlugin.java`
- `android/app/src/main/java/com/edugah3/forgeflow/MainActivity.java`
- `android/app/src/main/AndroidManifest.xml`

## Principais mudanças

- Foto própria agora usa estado dedicado `backgroundMode`, `userPhoto` e `photoTransform`.
- A foto é lida como Data URL, pré-carregada com `Image`, aguarda `onload/decode` e usa a mesma origem no preview e na exportação.
- Pointer Events nativos no canvas: arrastar com 1 dedo/mouse e pinça com 2 dedos.
- Botões: Resetar foto, Preencher, Ajustar e Remover.
- Templates premium: Photo Story, Hero PR, Performance, Editorial Minimal e Dark Glass.
- Formatos separados: Story 9:16 e Feed 1:1.
- Fundos offline gerados por canvas: Forge Red, Obsidian, Carbon Grid, Ember, Neon Flow, Night PR, Topo Lines, Steel, Aurora, Black Marble, Red Smoke e Gym Light.
- Helpers anti-overflow: `truncateText`, `drawWrappedText`, `drawMetricChip`, `drawGlassPanel`, `drawBadge`.
- APK continua usando JPG 0.88 via bridge nativa para evitar base64 gigante.

## Validação feita

- `npm install --ignore-scripts`
- `npx eslint src/components/workout/WorkoutShareStudio.jsx`
- `npm run build`

Observação: `npm run lint:frontend` completo falhou porque o script procura a pasta `public`, que não existe no ZIP recebido. O componente alterado passou no ESLint individual.
