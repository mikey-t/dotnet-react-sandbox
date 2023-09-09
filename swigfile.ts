/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { copyNewEnvValues, overwriteEnvFile } from '@mikeyt23/node-cli-utils'
import { series, parallel } from 'swig-cli'
import path from 'node:path'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import { copyDirectoryContents, createTarball, dotnetPublish, emptyDirectory, isDockerRunning as doIsDockerRunning, log, spawnDockerCompose, DockerComposeCommand, askQuestion, getConfirmation, StringKeyedDictionary, dotnetBuild } from './swigHelpers.ts'
import { spawnAsync, whichSync } from './swigHelpers.ts'
import { efAddMigration, efMigrationsList, efMigrationsUpdate, efRemoveLastMigration } from './swigDbMigratorHelpers.ts'
import 'dotenv/config'

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

const directoriesWithEnv = [dockerPath, serverPath, clientPath, dbMigratorPath, buildDir]

export async function syncEnvFiles() {
  const rootEnvPath = './.env'

  if (process.argv[3] && process.argv[3] === 'clean') {
    await deleteEnvCopies()
  }

  // Copy root .env.[category].template to .env
  await copyNewEnvValues(rootEnvPath + '.template', rootEnvPath)

  await ensureBuildDir()

  for (const dir of directoriesWithEnv) {
    await overwriteEnvFile(rootEnvPath, path.join(dir, '.env'))
  }

  await writeServerTestEnv()
}

export async function deleteEnvCopies() {
  log('deleting existing .env copies before syncing')
  for (const dir of directoriesWithEnv) {
    const envPath = path.join(dir, '.env')
    if (fs.existsSync(envPath)) {
      log('deleting .env file at path', envPath)
      await fsp.unlink(envPath)
    }
  }
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
  await spawnAsync(command, args, {}, true)
}

async function runClient() {
  const command = 'node'
  const args = ['./node_modules/vite/bin/vite.js', 'dev']
  await spawnAsync(command, args, { cwd: clientPath }, true)
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

async function doDockerCompose(upOrDown: 'up' | 'down', attached = false) {
  await spawnDockerCompose(dockerComposePath, upOrDown, { attached })
}

async function bashIntoPostgresContainer() {
  await spawnDockerCompose(dockerComposePath, 'exec', { args: ['-it', 'postgresql', 'bash'], attached: true })
}

async function getConfirmationExample() {
  if (await getConfirmation('Do you even?')) {
    log('you do even')
  } else {
    log('you do not even')
  }
}

async function dbMigratorCliCommand(command: string) {
  if (command === 'dbDropAll' && !await getConfirmation('Are you sure you want to drop main and test databases and database user?')) {
    return
  }
  if (command === 'dbDropAndRecreate') {
    if (!await getConfirmation('Are you sure you want to drop main and test databases and database user?')) {
      return
    } else {
      await spawnAsync('dotnet', ['run', '--project', dbMigratorPath, 'dbDropAll'])
      await spawnAsync('dotnet', ['run', '--project', dbMigratorPath, 'dbInitialCreate'])
      return
    }
  }
  throw new Error(`Unknown DbMigrator command: ${command}`)
}

const dbContextOptions = ['main', 'test', 'both']

const dbContexts: StringKeyedDictionary = {
  main: mainDbContextName,
  test: testDbContextName
}

function getDbContextArg() {
  const additionalArg = process.argv[3]
  return additionalArg && dbContextOptions.includes(additionalArg) ? additionalArg : 'main'
}

function getMigrationNameArg() {
  const migrationName = process.argv[4] || process.argv[3]
  return migrationName && !dbContextOptions.includes(migrationName) ? migrationName : undefined
}

function logDbCommandMessage(prefix: string) {
  log(`${prefix} using project path 📁${dbMigratorPath} and db context arg ⚙️${getDbContextArg()} (options: ${dbContextOptions.join('|')})`)
}

async function executeEfAction(action: 'list' | 'update' | 'add' | 'remove') {
  const dbContextArg = getDbContextArg()
  const migrationName = getMigrationNameArg()

  log(`dbContextArg: ${dbContextArg}`)
  log(`migrationName: ${migrationName}`)

  if (action === 'add' && !migrationName) {
    throw new Error('Missing migration name')
  }

  // Build once explicitly so that all commands can use the noBuild option.
  // This will speed up operations that require multiple 'dotnet ef' commands.
  await dotnetBuild(dbMigratorPath)

  for (const key of Object.keys(dbContexts)) {
    if (dbContextArg === key || dbContextArg === 'both') {
      const dbContextName = dbContexts[key]
      switch (action) {
        case 'list':
          await efMigrationsList(dbMigratorPath, dbContextName)
          break
        case 'update':
          log(migrationName ? `Updating ➡️${dbContextName} to migration name: ${migrationName}` : `Updating ➡️${dbContextName} to latest migration`)
          await efMigrationsUpdate(dbMigratorPath, dbContextName, migrationName)
          break
        case 'add':
          log(`Adding migration ➡️${migrationName} to ➡️${dbContextName}`)
          await efAddMigration(dbMigratorPath, dbContextName, migrationName!, true)
          break
        case 'remove':
          log(`Removing last migration from ➡️${dbContextName}`)
          await efRemoveLastMigration(dbMigratorPath, dbContextName)
          break
      }
    }
  }
}

async function doListMigrations() {
  logDbCommandMessage('Listing migrations')
  await executeEfAction('list')
}

async function doDbMigrate() {
  logDbCommandMessage('Updating database')
  await executeEfAction('update')
}

async function doDbAddMigration() {
  logDbCommandMessage('Adding migration')
  await executeEfAction('add')
}

async function doDbRemoveMigration() {
  logDbCommandMessage('Removing last migration')
  await executeEfAction('remove')
}

async function doRunBuilt() {
  const buildEnvPath = path.join(buildDir, '.env')
  await fsp.writeFile(buildEnvPath, '\nASPNETCORE_ENVIRONMENT=Production', { flag: 'a' })
  await fsp.writeFile(buildEnvPath, `\nPRE_DEPLOY_HTTP_PORT=${preDeployHttpPort}`, { flag: 'a' })
  await fsp.writeFile(buildEnvPath, `\nPRE_DEPLOY_HTTPS_PORT=${preDeployHttpsPort}`, { flag: 'a' })
  const devCertName = process.env.DEV_CERT_NAME
  if (!devCertName) {
    throw new Error('Missing DEV_CERT_NAME env var')
  }
  const certSourcePath = path.join('./cert/', devCertName)
  const certDestinationPath = path.join(buildDir, devCertName)
  await fsp.copyFile(certSourcePath, certDestinationPath)
  await spawnAsync('dotnet', ['WebServer.dll', '--launch-profile', '"PreDeploy"'], { cwd: './build/' }, true)
}

export async function installOrUpdateDotnetEfTool() {
  const installed = whichSync('dotnet-ef').location
  if (installed) {
    log('dotnet-ef tool already installed, updating...')
  } else {
    log('dotnet-ef tool not installed, installing...')
  }
  const args = ['tool', installed ? 'update' : 'install', '--global', 'dotnet-ef']
  await spawnAsync('dotnet', args)
}

export const server = series(syncEnvFiles, runServer)
export const client = series(syncEnvFiles, runClient)

export const testServer = series(syncEnvFiles, doTestServer)

export const buildClient = series(syncEnvFiles, doBuildClient)
export const copyClientBuildOnly = doCopyClientBuild
export const buildServer = series(syncEnvFiles, doBuildServer)
export const createDbMigratorRelease = series(parallel(syncEnvFiles, ensureReleaseDir), doCreateDbMigratorRelease)
export const buildAll = series(parallel(syncEnvFiles, ensureReleaseDir), parallel(doBuildClient, doBuildServer), doCopyClientBuild)

export const runBuilt = series(syncEnvFiles, doRunBuilt)

export const createRelease = parallel(series(buildAll, createReleaseTarball), doCreateDbMigratorRelease)
export const createReleaseTarballOnly = createReleaseTarball

export const dockerUp = series(syncEnvFiles, ['dockerUp', async () => doDockerCompose('up')])
export const dockerUpAttached = series(syncEnvFiles, ['dockerDown', async () => doDockerCompose('down')], ['dockerUpAttached', async () => doDockerCompose('up', true)])
export const dockerDown = series(syncEnvFiles, ['dockerUp', async () => doDockerCompose('down')])

export const dbInitialCreate = series(syncEnvFiles, ['dbInitialCreate', async () => dbMigratorCliCommand('dbInitialCreate')])
export const dbDropAll = series(syncEnvFiles, ['dbDropAll', async () => dbMigratorCliCommand('dbDropAll')])
export const dbDropAndRecreate = series(syncEnvFiles, ['dbDropAndRecreate', async () => dbMigratorCliCommand('dbDropAndRecreate')])

export const dbListMigrations = series(syncEnvFiles, doListMigrations)
export const dbMigrate = series(syncEnvFiles, doDbMigrate)
export const dbAddMigration = series(syncEnvFiles, doDbAddMigration)
export const dbRemoveMigration = series(syncEnvFiles, doDbRemoveMigration)

export const generateCert = series(syncEnvFiles)
export const winInstallCert = series(syncEnvFiles)
export const winUninstallCert = series(syncEnvFiles)
export const linuxInstallCert = series(syncEnvFiles)

export const bashIntoDb = series(syncEnvFiles, bashIntoPostgresContainer)

export const ask = getConfirmationExample
export const which = doWhich
export const isDockerRunning = async () => log(`docker is running: ${await doIsDockerRunning()}`)

export async function deleteBuildAndRelease() {
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
