import { Capacitor, registerPlugin } from '@capacitor/core'

const ForgeFlowMedia = registerPlugin('ForgeFlowMedia')

function isNativeRuntime() {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

function dataUrlToBase64(dataUrl = '') {
  const [, base64 = ''] = String(dataUrl).split(',')
  return base64
}

export function canUseNativeMediaBridge() {
  return isNativeRuntime()
}

export async function saveImageToGalleryNative({ dataUrl, filename }) {
  if (!canUseNativeMediaBridge()) return null

  const base64 = dataUrlToBase64(dataUrl)
  if (!base64) throw new Error('Imagem sem conteúdo base64.')

  return ForgeFlowMedia.saveImageToGallery({
    base64,
    fileName: filename,
    mimeType: 'image/png',
    album: 'ForgeFlow',
  })
}

export async function shareImageToInstagramStoryNative({ dataUrl, filename, shareText }) {
  if (!canUseNativeMediaBridge()) return null

  const base64 = dataUrlToBase64(dataUrl)
  if (!base64) throw new Error('Imagem sem conteúdo base64.')

  return ForgeFlowMedia.shareImageToInstagramStory({
    base64,
    fileName: filename,
    mimeType: 'image/png',
    album: 'ForgeFlow',
    caption: shareText || '',
    sourceApplication: import.meta.env.VITE_INSTAGRAM_SOURCE_APP_ID || '',
  })
}
