# ForgeFlowMediaPlugin — salvar na galeria e abrir Instagram Stories

Esta versão adiciona um instalador automático para o plugin nativo Android.

## O que o plugin faz

- Salva a imagem no armazenamento compartilhado do Android usando `MediaStore`.
- Cria o álbum/pasta `Pictures/ForgeFlow`.
- Abre o Instagram Stories usando a imagem salva como asset de fundo.
- Usa JPG otimizado no APK para evitar falha de ponte nativa com base64 grande.

## Como aplicar no seu projeto

Na raiz do ForgeFlow, rode:

```powershell
npm run build
npx cap sync android
npm run android:install-media-plugin
cd android
.\gradlew assembleDebug
```

Ou use direto:

```powershell
npm run android:apk
```

O comando `android:install-media-plugin` faz automaticamente:

1. Copia `native/android/ForgeFlowMediaPlugin.java` para o pacote Android correto.
2. Registra `registerPlugin(ForgeFlowMediaPlugin.class)` no `MainActivity.java`.
3. Adiciona permissões legadas necessárias para Android antigo.
4. Adiciona `queries` para o pacote do Instagram.

## Onde a imagem aparece no celular

Depois de clicar em **Salvar imagem**, procure em:

```txt
Galeria/Fotos > Álbuns > ForgeFlow
```

ou:

```txt
Armazenamento interno > Pictures > ForgeFlow
```

## Observação sobre Instagram

O botão Instagram/Story funciona melhor no APK com o plugin registrado. O app salva a imagem primeiro e tenta abrir o Instagram Stories já com ela anexada. Caso o Instagram bloqueie a intent no aparelho, a imagem continua salva no álbum ForgeFlow para selecionar manualmente no Story.
