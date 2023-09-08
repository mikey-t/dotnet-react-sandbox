/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { copyNewEnvValues, overwriteEnvFile } from '@mikeyt23/node-cli-utils'
import { series, parallel } from 'swig-cli'
import path from 'node:path'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import { copyDirectoryContents, createTarball, dotnetPublish, emptyDirectory, isDockerRunning as doIsDockerRunning, log, spawnDockerCompose, DockerComposeCommand } from './swigHelpers.ts'
import { spawnAsync, whichSync } from './swigHelpers.ts'

const projectName = process.env.PROJECT_NAME || 'drs' // Need a placeholder before first syncEnvFile task runs

const buildDir = './build'
const releaseDir = './release'
const buildWwwrootDir = `${buildDir}/wwwroot`
const clientPath = './client'
const serverPath = './server/src/WebServer'
const serverCsprojPath = `${serverPath}/WebServer.csproj`
const serverTestPath = `./server/src/WebServer.Test`
const releaseTarballName = `${projectName}.tar.gz`
const dbMigratorTarballName = 'DbMigrator.tar.gz'
const dockerPath = './docker'
const dockerComposePath = `${dockerPath}/docker-compose.yml`
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
  await overwriteEnvFile(rootEnv, path.join(serverPath, envName))
  await overwriteEnvFile(rootEnv, path.join(dockerPath, envName))
  await overwriteEnvFile(rootEnv, path.join(dbMigratorPath, envName))
  await overwriteEnvFile(rootEnv, path.join(clientPath, envName))
  await writeServerTestEnv()

  await ensureBuildDir()
  await overwriteEnvFile(rootEnv, path.join(buildDir, envName))
}

async function writeServerTestEnv() {
  const envPath = '.env'
  const testEnvPath = `${serverTestPath}/.env`
  const originalEnvString = await fsp.readFile(envPath, 'utf-8')

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

  await fsp.writeFile(testEnvPath, newTestEnvString)
}

async function ensureBuildDir() {
  await fsp.mkdir(buildWwwrootDir, { recursive: true })
}

async function runServer() {
  const command = 'dotnet'
  const args = ['watch', '--project', serverCsprojPath]
  await spawnAsync(command, args)
}

async function runClient() {
  const command = 'node'
  const args = ['./node_modules/vite/bin/vite.js', 'dev']
  await spawnAsync(command, args, { cwd: clientPath })
}

async function doTestServer() {
  await spawnAsync('dotnet', ['test'], { cwd: serverTestPath })
}

async function doBuildClient() {
  await spawnAsync('npm', ['run', 'build', '--omit=dev'], { cwd: clientPath })
}

async function doBuildServer() {
  log('emptying build directory')
  await emptyDirectory(buildDir, ['wwwroot'])
  log('building server')
  await dotnetPublish(serverCsprojPath, 'Release', buildDir)
  log('removing .env from build directory')
  const envPath = path.join(buildDir, '.env')
  if (fs.existsSync(envPath)) {
    fs.unlinkSync(envPath)
  }
}

async function ensureReleaseDir() {
  await fsp.mkdir(releaseDir, { recursive: true })
}

async function doBuildDbMigrator() {
  const publishDir = path.join(dbMigratorPath, 'publish')
  await dotnetPublish(dbMigratorPath, 'Release', publishDir)
  const envPath = path.join(publishDir, '.env')
  if (fs.existsSync(envPath)) {
    await fsp.rm(envPath)
  }
  return publishDir
}

async function doCreateDbMigratorRelease() {
  const publishDir = await doBuildDbMigrator()
  await createTarball(publishDir, path.join(releaseDir, dbMigratorTarballName))
}

async function doCopyClientBuild() {
  await copyDirectoryContents(path.join(clientPath, 'dist'), buildWwwrootDir)
}

async function createReleaseTarball() {
  await createTarball(buildDir, path.join(releaseDir, releaseTarballName))
}

async function doWhich() {
  const command = process.argv[3]
  log('doing which for command', command)
  const result = whichSync(command)
  log('which result', result)
}

async function doDockerCompose(dockerComposeCommand: DockerComposeCommand, detached = false) {
  await spawnDockerCompose(dockerComposePath, dockerComposeCommand, { projectName: dockerProjectName, detached: detached })
}

export const server = series(syncEnvFiles, runServer)
export const client = series(syncEnvFiles, runClient)
export const testServer = series(syncEnvFiles, doTestServer)
export const buildClient = series(syncEnvFiles, doBuildClient)
export const buildServer = series(syncEnvFiles, doBuildServer)
export const createDbMigratorRelease = series(parallel(syncEnvFiles, ensureReleaseDir), doCreateDbMigratorRelease)
export const buildAll = series(parallel(syncEnvFiles, ensureReleaseDir), parallel(doBuildClient, doBuildServer), doCopyClientBuild)
export const runBuilt = series(syncEnvFiles) // TODO: come back to this one
export const createRelease = parallel(series(buildAll, createReleaseTarball), doCreateDbMigratorRelease)
export const createReleaseTarballOnly = createReleaseTarball
export const dockerUp = series(syncEnvFiles, ['dockerUp', async () => doDockerCompose('up', true)])
export const dockerUpAttached = series(syncEnvFiles, ['dockerDown', async () => doDockerCompose('down')], ['dockerUpAttached', async () => doDockerCompose('up')])
export const dockerDown = series(syncEnvFiles, ['dockerUp', async () => doDockerCompose('down')])
export const dbInitialCreate = series(syncEnvFiles)
export const dbDropAll = series(syncEnvFiles)
export const dbDropAndRecreate = series(syncEnvFiles)
export const dbMigrationsList = series(syncEnvFiles)
export const dbMigrate = series(syncEnvFiles)
export const dbAddMigration = series(syncEnvFiles)
export const dbRemoveMigration = series(syncEnvFiles)
export const dbMigrateFromBuilt = series(syncEnvFiles)
export const testDbMigrationsList = series(syncEnvFiles)
export const testDbMigrate = series(syncEnvFiles)
export const testDbAddMigration = series(syncEnvFiles)
export const testDbRemoveMigration = series(syncEnvFiles)
export const bothDbMigrationsList = series(syncEnvFiles)
export const bothDbMigrate = series(syncEnvFiles)
export const bothDbAddMigration = series(syncEnvFiles)
export const bothDbRemoveMigration = series(syncEnvFiles)
export const installDotnetEfTool = series(syncEnvFiles)
export const updateDotnetEfTool = series(syncEnvFiles)
export const copyClientBuildOnly = doCopyClientBuild
export const generateCert = series(syncEnvFiles)
export const winInstallCert = series(syncEnvFiles)
export const winUninstallCert = series(syncEnvFiles)
export const linuxInstallCert = series(syncEnvFiles)

export const which = doWhich
export const isDockerRunning = async () => log(`docker is running: ${await doIsDockerRunning()}`)

export async function clean() {
  log('cleaning...')
  const dirs = [
    './build',
    './release'
  ]

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true })
    }
  }
}
