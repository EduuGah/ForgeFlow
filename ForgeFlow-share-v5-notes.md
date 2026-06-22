# ForgeFlow Share V5 — correção APK galeria + layout Foco PR/Volume

## Problemas corrigidos

### 1. APK não salvava na galeria

A versão anterior dependia do plugin nativo estar registrado manualmente no Android. Agora o projeto inclui um instalador automático:

```bash
npm run android:install-media-plugin
```

Também atualizei os scripts:

```bash
npm run android:sync
npm run android:apk
npm run android:run
```

Agora eles executam o instalador do plugin depois do `npx cap sync android`.

### 2. Imagem grande demais passando pela bridge nativa

No APK, a imagem agora é enviada para o plugin como **JPG 0.88** em vez de PNG. Isso reduz muito o tamanho do base64 e evita falhas silenciosas no WebView/bridge do Capacitor, principalmente em cards com foto de fundo.

No web/desktop, o download continua usando PNG.

### 3. Plugin Android mais robusto

O `ForgeFlowMediaPlugin.java` agora:

- aceita PNG, JPG/JPEG e WebP;
- salva com extensão correta;
- adiciona datas no MediaStore;
- faz `notifyChange` após salvar;
- tenta `VOLUME_EXTERNAL_PRIMARY` e tem fallback para `EXTERNAL_CONTENT_URI`;
- adiciona `ClipData`, `EXTRA_STREAM` e permissão de leitura para o Instagram.

### 4. Foco PR e Volume com texto bugado

Corrigi o layout do canvas para os templates **Foco PR** e **Volume**:

- footer não sobrepõe mais os cards de métricas;
- legenda não invade a grade;
- título do treino fica limitado com segurança;
- grade de métricas é posicionada com cálculo real de altura;
- textos longos são truncados/limitados de forma segura.

## Arquivos alterados

```txt
src/components/workout/WorkoutShareStudio.jsx
src/utils/shareNativeBridge.js
native/android/ForgeFlowMediaPlugin.java
native/android/README-INSTALAR-PLUGIN.md
scripts/install-android-media-plugin.mjs
package.json
```

## Como gerar o APK

No Windows PowerShell:

```powershell
npm install
npm run android:apk
```

Se você preferir passo a passo:

```powershell
npm run build
npx cap sync android
npm run android:install-media-plugin
cd android
.\gradlew assembleDebug
```

## Testes obrigatórios

- Abrir o compartilhar no APK.
- Escolher Foco PR.
- Escolher Volume.
- Usar frase curta.
- Usar frase longa.
- Clicar em Salvar imagem.
- Confirmar se apareceu em Galeria/Fotos > Álbuns > ForgeFlow.
- Clicar em Instagram/Story.
- Confirmar se o Instagram abre com a imagem anexada ou, no mínimo, se a imagem ficou salva no álbum ForgeFlow.
