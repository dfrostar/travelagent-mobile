const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const ENVIRONMENTS = ['dev', 'staging', 'prod']
const ROOT_DIR = path.resolve(__dirname, '..')

const copyEnvFile = (environment) => {
  const sourcePath = path.join(ROOT_DIR, `.env.${environment}`)
  const targetPath = path.join(ROOT_DIR, '.env')

  if (!fs.existsSync(sourcePath)) {
    console.error(`Environment file .env.${environment} not found`)
    process.exit(1)
  }

  try {
    fs.copyFileSync(sourcePath, targetPath)
    console.log(`Successfully switched to ${environment} environment`)
  } catch (error) {
    console.error('Error copying environment file:', error)
    process.exit(1)
  }
}

const promptEnvironment = () => {
  console.log('\nAvailable environments:')
  ENVIRONMENTS.forEach((env, index) => {
    console.log(`${index + 1}. ${env}`)
  })

  rl.question('\nSelect environment (1-3): ', (answer) => {
    const selection = parseInt(answer)
    if (isNaN(selection) || selection < 1 || selection > ENVIRONMENTS.length) {
      console.error('Invalid selection')
      rl.close()
      process.exit(1)
    }

    const selectedEnv = ENVIRONMENTS[selection - 1]
    copyEnvFile(selectedEnv)
    rl.close()
  })
}

// Check if environment is passed as argument
const envArg = process.argv[2]
if (envArg) {
  if (!ENVIRONMENTS.includes(envArg)) {
    console.error(`Invalid environment. Available options: ${ENVIRONMENTS.join(', ')}`)
    process.exit(1)
  }
  copyEnvFile(envArg)
} else {
  promptEnvironment()
}
