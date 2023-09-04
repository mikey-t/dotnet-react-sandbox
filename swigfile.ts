/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { copyNewEnvValues, overwriteEnvFile } from '@mikeyt23/node-cli-utils'
import { series, parallel } from 'swig-cli'
import path from 'node:path'
import fs from 'node:fs'
import { log } from './swigHelpers.ts'
import { spawnAsync } from './swigHelpers.ts'

const projectName = process.env.PROJECT_NAME || 'drs' // Need a placeholder before first syncEnvFile task runs

const buildDir = './build'
const buildWwwrootDir = './build/wwwroot'
const clientAppPath = './client'
const serverAppPath = './server/src/WebServer'
const serverCsprojPath = `${serverAppPath}/WebServer.csproj`
const serverTestPath = `./server/src/WebServer.Test`
const tarballName = `${projectName}.tar.gz`
const dockerPath = './docker'
const dockerProjectName = projectName
const dockerDbContainerName = `${projectName}_postgres`
const preDeployHttpPort = '3001'
const preDeployHttpsPort = '3000'

const dbMigratorPath = 'server/src/DbMigrator/'
const mainDbContextName = 'MainDbContext'
const testDbContextName = 'TestDbContext'

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
  const testEnvPath = `${serverTestPath}/.env`
  const originalEnvString = fs.readFileSync(envPath, 'utf-8')

  const keepKeys = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']

  let newTestEnvString = ''

  for (const line of originalEnvString.split('\n')) {
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
  const args = ['watch', '--project', serverCsprojPath]
  await spawnAsync(command, args)
}

async function startClient() {
  const command = 'node'
  const args = ['./node_modules/vite/bin/vite.js', 'dev']
  await spawnAsync(command, args, { cwd: clientAppPath })
}

export const server = series(syncEnvFiles, startServer)
export const client = series(syncEnvFiles, startClient)
