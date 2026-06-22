# ForgeFlow Share Studio V8

## Ajustes principais

- HEIC/HEIF no APK Android: adicionado método nativo `normalizeImageToJpeg` no plugin `ForgeFlowMedia` para converter imagens escolhidas em JPG antes do canvas tentar desenhar.
- Foto própria continua com fallback web para JPG/PNG/WEBP e mensagem mais clara quando HEIC não for suportado no navegador.
- Figurinhas não renderizam mais via estado React a cada `pointermove`; o preview agora usa `requestAnimationFrame` durante drag/pinch para reduzir travadas.
- Adicionado snap automático das figurinhas ao centro horizontal/vertical, com linha guia visual.
- Removida a mensagem visual “Editando figurinhas/Editando foto” que cobria a prévia.
- Preview mobile aumentado para facilitar enxergar e posicionar stickers.
- Figurinhas redesenhadas por template para serem diferentes entre si:
  - Photo Story: legenda + chips na base.
  - Hero PR: card grande de PR + cápsulas de recordes.
  - Performance: dashboard de volume/métricas.
  - Editorial Minimal: nota branca elegante.
  - Dark Glass: stack glass com badges e métricas.
- Hero PR em modo figurinha foi refeito para evitar sobreposição.

## Arquivos alterados

- `src/components/workout/WorkoutShareStudio.jsx`
- `src/styles/mobile-page-polish.css`
- `src/utils/shareNativeBridge.js`
- `native/android/ForgeFlowMediaPlugin.java`
- `android/app/src/main/java/com/edugah3/forgeflow/ForgeFlowMediaPlugin.java`

## Validação feita

- `npx eslint src/components/workout/WorkoutShareStudio.jsx src/utils/shareNativeBridge.js`
- `npm run build`

A compilação Java/Gradle não foi concluída no ambiente porque o wrapper tentou baixar o Gradle em `services.gradle.org` e a rede não resolveu o host. O código Java foi mantido simples e usa APIs Android padrão (`ImageDecoder`, `BitmapFactory`, `Bitmap.compress`).

## Teste prioritário no APK

1. Escolher uma foto HEIC/HEIF da galeria.
2. Verificar se aparece no preview.
3. Arrastar figurinhas até perto do centro e conferir linha guia.
4. Fazer pinch zoom nas figurinhas e na foto.
5. Testar Hero PR com vários PRs e confirmar que não sobrepõe.
6. Salvar na galeria e verificar `Pictures/ForgeFlow`.
