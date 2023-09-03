// @ts-ignore
import { copyNewEnvValues, overwriteEnvFile } from '@mikeyt23/node-cli-utils'
import { series, parallel } from 'swig-cli'
import path from 'node:path'
import fs from 'node:fs'
import { SpawnOptions, spawn } from 'node:child_process'

const projectName = process.env.PROJECT_NAME || 'drs' // Need a placeholder before first syncEnvFile task runs

const buildDir = './build'
const buildWwwrootDir = './build/wwwroot'
const clientAppPath = './src/client'
const serverAppPath = './src/WebServer'
const serverCsproj = `${serverAppPath}/WebServer.csproj`
const tarballName = `${projectName}.tar.gz`
const dockerPath = './docker'
const dockerProjectName = projectName
const dockerDbContainerName = `${projectName}_postgres`
const preDeployHttpPort = '3001'
const preDeployHttpsPort = '3000'

const dbMigratorPath = 'src/DbMigrator/'
const mainDbContextName = 'MainDbContext'
const testDbContextName = 'TestDbContext'

function log(message?: unknown, ...optionalParams: unknown[]) {
  console.log(message, ...optionalParams)
}

interface SpawnResult {
  code: number
  stdout: string
  stderr: string
  cwd?: string
}

async function spawnAsync(command: string, args: string[], options: SpawnOptions, liveOutput = false): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const result: SpawnResult = {
      stdout: '',
      stderr: '',
      code: 99,
      cwd: options.cwd?.toString()
    }

    const proc = spawn(command, args, options)


    proc.stdout?.on('data', (data) => {
      result.stdout += data
      if (liveOutput) {
        log(data.toString())
      }
    })

    proc.stderr?.on('data', (data) => {
      result.stderr += data
      if (liveOutput) {
        console.error(data.toString())
      }
    })

    proc.on('error', (error) => {
      reject(`Spawned process encountered an error: ${error}`)
    })

    proc.on('close', (code) => {
      if (code === null) {
        reject(`Spawned process returned a null result code: ${command}`)
      } else {
        result.code = code
        resolve(result)
      }
    })
  })
}

export async function syncEnvFiles() {
  const envName = '.env'

  const rootEnv = './.env'
  const rootEnvTemplate = rootEnv + '.template'

  // Copy root .env.[category].template to .env
  await copyNewEnvValues(rootEnvTemplate, rootEnv)

  // Copy root .env.[category] to subdirectory .env files
  await overwriteEnvFile(rootEnv, path.join(serverAppPath, envName))
  await overwriteEnvFile(rootEnv, path.join(dockerPath, envName))
  await overwriteEnvFile(rootEnv, path.join(dbMigratorPath, envName))
  await overwriteEnvFile(rootEnv, path.join(clientAppPath, envName))
  await writeServerTestEnv()

  await ensureBuildDir()
  await overwriteEnvFile(rootEnv, path.join('./build/', envName))
}

async function writeServerTestEnv() {
  const envPath = '.env'
  const testEnvPath = 'src/WebServer.Test/.env'
  const originalEnvString = fs.readFileSync(envPath, 'utf-8')

  let keepKeys = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']

  let newTestEnvString = ''

  for (let line of originalEnvString.split('\n')) {
    if (!line || line.indexOf('=') === -1) {
      continue
    }

    const key = line.substring(0, line.indexOf('='))

    if (!keepKeys.includes(key)) {
      continue
    }

    if (key === 'DB_NAME') {
      const modifiedLine = line.replace('=', '=test_')
      newTestEnvString += `${modifiedLine}\n`
    } else {
      newTestEnvString += `${line}\n`
    }
  }

  fs.writeFileSync(testEnvPath, newTestEnvString)
}

async function ensureBuildDir() {
  fs.mkdirSync(buildWwwrootDir, { recursive: true })
}

async function startServer() {
  const command = 'dotnet'
  const args = ['watch', '--project', serverCsproj]
  await spawnAsync(command, args, { stdio: 'inherit' }, true)
}

async function startClient() {
  const command = 'npm'
  const args = ['run', 'dev']
  await spawnAsync(command, args, { stdio: 'inherit', cwd: clientAppPath }, true)
}

export const server = series(syncEnvFiles, startServer)
export const client = series(syncEnvFiles, startClient)
