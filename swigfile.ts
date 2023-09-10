// @ts-ignore
import { copyNewEnvValues, overwriteEnvFile } from '@mikeyt23/node-cli-utils'
import 'dotenv/config'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { parallel, series } from 'swig-cli'
import { efAddMigration, efMigrationsList, efMigrationsUpdate, efRemoveLastMigration } from './moveToNodeCliDbMigrator.ts'
import { StringKeyedDictionary, configureDotnetDevCerts, copyDirectoryContents, copyModifiedEnv, createTarball, deleteEnvIfExists, dotnetBuild, dotnetPublish, emptyDirectory, ensureDirectory, getConfirmation, installOrUpdateDotnetEfTool, log, spawnAsync, spawnDockerCompose } from './moveToNodeCliGeneral.ts'
import { winInstallCert as doWinInstallCert, winUninstallCert as doWinUninstallCert, generateCertWithOpenSsl, linuxInstallCert as doLinuxInstallCert } from './moveToNodeCliCertUtils.ts'

const projectName = process.env.PROJECT_NAME || 'drs' // Need a placeholder before first time syncEnvFiles task runs
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
const preDeployHttpsPort = '3000'
const preDeployHttpPort = '3001'
const dbMigratorPath = 'server/src/DbMigrator/'
const mainDbContextName = 'MainDbContext'
const testDbContextName = 'TestDbContext'
const directoriesWithEnv = [dockerPath, serverPath, serverTestPath, dbMigratorPath, clientPath, buildDir]

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

export const bashIntoDb = series(syncEnvFiles, bashIntoPostgresContainer)

export {
  installOrUpdateDotnetEfTool,
  configureDotnetDevCerts
}

export async function deleteBuildAndRelease() {
  const dirs = ['./build', './release']
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      await fsp.rm(dir, { recursive: true })
    }
  }
}

export async function syncEnvFiles() {
  const rootEnvPath = './.env'
  if (process.argv[3] && process.argv[3] === 'clean') {
    log(`syncEnvFiles called with 'clean' arg, deleting .env copies in ${directoriesWithEnv.join(', ')}`)
    await deleteEnvCopies()
  }
  await copyNewEnvValues(`${rootEnvPath}.template`, rootEnvPath)
  await ensureDirectory(buildWwwrootDir)
  for (const dir of directoriesWithEnv) {
    await overwriteEnvFile(rootEnvPath, path.join(dir, '.env'))
  }
  await copyModifiedEnv(
    rootEnvPath,
    `${serverTestPath}/.env`,
    ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
    { 'DB_NAME': `test_${process.env.DB_NAME || 'DB_NAME_MISSING_FROM_PROCESS_ENV'}` }
  )
}

export async function deleteEnvCopies() {
  for (const dir of directoriesWithEnv) {
    const envPath = path.join(dir, '.env')
    if (fs.existsSync(envPath)) {
      log('deleting .env file at path', envPath)
      await deleteEnvIfExists(envPath)
    }
  }
}

export async function generateCert() {
  const url = getRequireAdditionalParam('Missing param to be used for cert url. Example: swig generateCert local.acme.com')
  await generateCertWithOpenSsl(url)
}

export async function winInstallCert() {
  const url = getRequireAdditionalParam('Missing param to be used for cert url. Example: swig winInstallCert local.acme.com')
  const certPath = path.join('./cert/', `${url}.pfx`)
  if (fs.existsSync(certPath)) {
    log(`Cert already exists at path ${certPath}`)
  } else {
    log(`Cert does not exist at path ${certPath}, generating...`)
    await generateCertWithOpenSsl(url)
  }
  log(`attempting to install cert for url ${url}`)
  await doWinInstallCert(url)
}

export async function winUninstallCert() {
  const certSubject = getRequireAdditionalParam('Missing param to be used for cert url. Example: swig winUninstallCert local.acme.com')
  await doWinUninstallCert(certSubject)
}

export async function linuxInstallCert() {
  doLinuxInstallCert() // This doesn't actually install anything - it just dumps out instructions for how to do it manually...
}

//*********************************************

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
  await deleteEnvIfExists(envPath)
}

async function ensureReleaseDir() {
  await ensureDirectory(releaseDir)
}

async function doBuildDbMigrator() {
  const publishDir = path.join(dbMigratorPath, 'publish')
  await dotnetPublish(dbMigratorPath, 'Release', publishDir)
  const envPath = path.join(publishDir, '.env')
  await deleteEnvIfExists(envPath)
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

async function doDockerCompose(upOrDown: 'up' | 'down', attached = false) {
  await spawnDockerCompose(dockerComposePath, upOrDown, { attached })
}

async function bashIntoPostgresContainer() {
  await spawnDockerCompose(dockerComposePath, 'exec', { args: ['-it', 'postgresql', 'bash'], attached: true })
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

function getRequireAdditionalParam(errorWithExample: string) {
  const additionalParam = process.argv[3]
  if (!additionalParam) {
    throw new Error(errorWithExample)
  }
  return additionalParam
}
