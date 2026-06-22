import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const configPath = path.join(root, 'capacitor.config.json')
const sourcePluginPath = path.join(root, 'native', 'android', 'ForgeFlowMediaPlugin.java')
const androidRoot = path.join(root, 'android')
const manifestPath = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml')

function fail(message) {
  console.error(`\n[ForgeFlowMedia] ${message}\n`)
  process.exit(1)
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    fail(`Não consegui ler ${path.relative(root, filePath)}: ${error.message}`)
  }
}

function findMainActivity(packageDir) {
  const directPath = path.join(packageDir, 'MainActivity.java')
  if (fs.existsSync(directPath)) return directPath

  const javaRoot = path.join(androidRoot, 'app', 'src', 'main', 'java')
  const candidates = []

  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const entry = path.join(dir, item.name)
      if (item.isDirectory()) walk(entry)
      if (item.isFile() && item.name === 'MainActivity.java') candidates.push(entry)
    }
  }

  walk(javaRoot)
  return candidates[0] || directPath
}

function patchMainActivity(mainActivityPath) {
  if (!fs.existsSync(mainActivityPath)) {
    const packageName = getPackageName()
    fs.mkdirSync(path.dirname(mainActivityPath), { recursive: true })
    fs.writeFileSync(mainActivityPath, `package ${packageName};\n\nimport android.os.Bundle;\n\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        registerPlugin(ForgeFlowMediaPlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n}\n`, 'utf8')
    return 'created'
  }

  let content = fs.readFileSync(mainActivityPath, 'utf8')
  if (content.includes('registerPlugin(ForgeFlowMediaPlugin.class)')) return 'already-registered'

  if (!content.includes('import android.os.Bundle;')) {
    content = content.replace(/(package\s+[^;]+;\s*)/, '$1\nimport android.os.Bundle;\n')
  }

  const onCreateRegex = /public\s+void\s+onCreate\s*\(\s*Bundle\s+savedInstanceState\s*\)\s*\{/m
  if (onCreateRegex.test(content)) {
    content = content.replace(onCreateRegex, (match) => `${match}\n        registerPlugin(ForgeFlowMediaPlugin.class);`)
  } else {
    content = content.replace(/}\s*$/m, `\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        registerPlugin(ForgeFlowMediaPlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n}\n`)
  }

  fs.writeFileSync(mainActivityPath, content, 'utf8')
  return 'patched'
}

function patchManifest() {
  if (!fs.existsSync(manifestPath)) return 'missing'

  let manifest = fs.readFileSync(manifestPath, 'utf8')
  let changed = false

  const permissions = [
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />',
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  ]

  for (const permission of permissions) {
    const name = permission.match(/android:name="([^"]+)"/)?.[1]
    if (name && !manifest.includes(`android:name="${name}"`)) {
      manifest = manifest.replace(/<application\b/, `${permission}\n\n    <application`)
      changed = true
    }
  }

  if (!manifest.includes('com.instagram.android')) {
    const queriesBlock = `\n    <queries>\n        <package android:name="com.instagram.android" />\n        <intent>\n            <action android:name="com.instagram.share.ADD_TO_STORY" />\n        </intent>\n    </queries>\n`
    manifest = manifest.replace(/<application\b/, `${queriesBlock}\n    <application`)
    changed = true
  }

  if (changed) fs.writeFileSync(manifestPath, manifest, 'utf8')
  return changed ? 'patched' : 'already-ok'
}

function getPackageName() {
  const config = readJson(configPath)
  const appId = String(config.appId || '').trim()
  if (!appId) fail('capacitor.config.json está sem appId.')
  return appId
}

function run() {
  const packageName = getPackageName()

  if (!fs.existsSync(androidRoot)) {
    fail('A pasta android não existe. Rode primeiro: npx cap add android')
  }

  if (!fs.existsSync(sourcePluginPath)) {
    fail('Arquivo native/android/ForgeFlowMediaPlugin.java não encontrado.')
  }

  const packageDir = path.join(androidRoot, 'app', 'src', 'main', 'java', ...packageName.split('.'))
  const targetPluginPath = path.join(packageDir, 'ForgeFlowMediaPlugin.java')
  fs.mkdirSync(packageDir, { recursive: true })

  let pluginSource = fs.readFileSync(sourcePluginPath, 'utf8')
  pluginSource = pluginSource.replace(/^package\s+[^;]+;/m, `package ${packageName};`)
  fs.writeFileSync(targetPluginPath, pluginSource, 'utf8')

  const mainActivityPath = findMainActivity(packageDir)
  const mainActivityResult = patchMainActivity(mainActivityPath)
  const manifestResult = patchManifest()

  console.log('[ForgeFlowMedia] Plugin copiado para:', path.relative(root, targetPluginPath))
  console.log('[ForgeFlowMedia] MainActivity:', mainActivityResult, '-', path.relative(root, mainActivityPath))
  console.log('[ForgeFlowMedia] AndroidManifest:', manifestResult)
  console.log('[ForgeFlowMedia] Pronto. Agora gere o APK novamente.')
}

run()
