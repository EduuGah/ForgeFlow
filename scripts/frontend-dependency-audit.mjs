import fs from 'node:fs'

const requiredFiles = ['package.json', 'vite.config.js', 'index.html', 'src/main.jsx']
const missing = requiredFiles.filter((file) => !fs.existsSync(file))

if (missing.length) {
  console.error(`[ForgeFlow] Arquivos obrigatórios ausentes: ${missing.join(', ')}`)
  process.exit(1)
}

console.log('[ForgeFlow] Auditoria rápida de dependências concluída.')
