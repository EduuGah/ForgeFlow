import { ESLint } from 'eslint'
import { spawnSync } from 'node:child_process'

async function runLint() {
  const eslint = new ESLint()
  const results = await eslint.lintFiles(['src', 'public', 'scripts'])
  const formatter = await eslint.loadFormatter('stylish')
  const output = formatter.format(results)

  if (output) {
    console.log(output)
  }

  const errorCount = results.reduce((total, result) => total + result.errorCount, 0)
  const warningCount = results.reduce((total, result) => total + result.warningCount, 0)

  if (errorCount > 0 || warningCount > 0) {
    console.error(`Lint encontrou ${errorCount} erro(s) e ${warningCount} aviso(s).`)
    process.exit(1)
  }
}

function runNodeScript(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

await runLint()
runNodeScript('server/scripts/sanity-check.mjs')
runNodeScript('server/scripts/workout-validation.test.mjs')

process.exit(0)
