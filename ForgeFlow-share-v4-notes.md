# ForgeFlow — Compartilhar Treino V4

## O que foi alterado

### Arquivos do front

- `src/components/workout/WorkoutShareStudio.jsx`
- `src/utils/shareNativeBridge.js`
- `src/styles/mobile-page-polish.css`

### Arquivos nativos adicionados

- `native/android/ForgeFlowMediaPlugin.java`
- `native/android/README-INSTALAR-PLUGIN.md`

## Correções principais

1. O botão **Salvar na galeria** agora tenta primeiro o plugin nativo `ForgeFlowMedia.saveImageToGallery()` quando estiver no APK.
2. Se o plugin nativo ainda não estiver instalado no Android, cai para Web Share/download como fallback.
3. O botão **Instagram/Story** agora tenta primeiro `ForgeFlowMedia.shareImageToInstagramStory()` quando estiver no APK.
4. Foram adicionadas opções variadas de fundo:
   - Forge red
   - Obsidian
   - Carbon grid
   - Ember
   - Neon flow
   - Night PR
   - Topo lines
   - Foto própria
5. O canvas agora gera `dataUrl`, `Blob` e `File`, permitindo o fluxo nativo e o fallback web.
6. O campo de fundo foi separado do formato do card, então dá para usar Story/Feed/PR/Volume com fundos diferentes.

## Importante

Salvar diretamente na galeria e abrir Instagram Stories já com a imagem anexada não é garantido pelo navegador comum. Para isso funcionar de verdade no APK, é necessário copiar o plugin nativo Java para o projeto Android conforme `native/android/README-INSTALAR-PLUGIN.md`.

## Teste rápido

1. Copie o plugin para o Android.
2. Registre no `MainActivity.java`.
3. Adicione `<queries>` do Instagram no Manifest.
4. Rode:

```powershell
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
```

5. No celular, teste:
   - Salvar na galeria
   - Verificar álbum `Pictures/ForgeFlow`
   - Instagram/Story
   - Fundos diferentes
   - Foto própria como fundo
