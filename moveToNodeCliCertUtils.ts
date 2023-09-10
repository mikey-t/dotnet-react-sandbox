import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { ensureDirectory, getSimpleSpawnResultSync, isPlatformLinux, isPlatformMac, isPlatformWindows, log, requireString, requireValidPath, spawnAsync, whichSync } from './moveToNodeCliGeneral.ts'

const requiresAdminMessage = `➡️ Important: Requires admin permissions`

export async function generateCertWithOpenSsl(url: string, outputDirectory: string = './cert') {
  requireString('url', url)
  throwIfMaybeBadUrlChars(url)
  const isMac = isPlatformMac()
  const spawnArgs = { cwd: outputDirectory }

  log('- checking if openssl is installed')
  let brewOpenSslPath: string = ''
  if (isPlatformWindows() || isPlatformLinux()) {
    const openSslPath = whichSync('openssl').location
    if (!openSslPath) {
      throw Error('openssl is required but was not found')
    }
    log(`- using openssl at: ${openSslPath}`)
  } else if (isMac) {
    const brewOpenSslDirectory = getBrewOpensslPath()
    if (!brewOpenSslDirectory) {
      throw Error('openssl (brew version) is required but was not found')
    }
    brewOpenSslPath = `${getBrewOpensslPath()}/bin/openssl`
    if (!fs.existsSync(brewOpenSslPath)) {
      throw Error(`openssl (brew version) is required but was not found at: ${brewOpenSslPath}`)
    } else {
      log(`- using openssl at: ${brewOpenSslPath}`)
    }
  }

  ensureDirectory(outputDirectory)
  const keyName = url + '.key'
  const crtName = url + '.crt'
  const pfxName = url + '.pfx'
  const pfxPath = path.join(outputDirectory, pfxName)
  if (fs.existsSync(pfxPath)) {
    throw Error(`File ${pfxPath} already exists. Delete or rename this file if you want to generate a new cert.`)
  }

  log('- writing san.cnf file for use with openssl command')
  const sanCnfContents = getSanCnfFileContents(url)
  const sanCnfPath = path.join(outputDirectory, 'san.cnf')
  await fsp.writeFile(sanCnfPath, sanCnfContents)

  log(`- attempting to generate cert ${pfxName}`)
  const genKeyAndCrtArgs = `req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes -keyout ${keyName} -out ${crtName} -subj /CN=${url} -config san.cnf`.split(' ')
  const command = isMac ? brewOpenSslPath : 'openssl'
  let result = await spawnAsync(command, genKeyAndCrtArgs, spawnArgs)
  if (result.code !== 0) {
    throw Error(`openssl command to generate key and crt files failed with exit code ${result.code}`)
  }

  log('- converting key and crt to pfx')
  const convertToPfxArgs = `pkcs12 -certpbe AES-256-CBC -export -out ${pfxName} -aes256 -inkey ${keyName} -in ${crtName} -password pass:`.split(' ')
  result = await spawnAsync(command, convertToPfxArgs, spawnArgs)
  if (result.code !== 0) {
    throw Error(`openssl command to convert key and crt files to a pfx failed with exit code ${result.code}`)
  }
}

export async function winInstallCert(urlOrCertFilename: string, certDirectory = './cert') {
  requireString('urlOrCertFilename', urlOrCertFilename)
  requireValidPath('certDirectory', certDirectory)
  throwIfMaybeBadUrlChars(urlOrCertFilename, 'urlOrCertFilename')

  if (!isPlatformWindows()) {
    throw Error('This method is only supported on Windows')
  }

  log(requiresAdminMessage)

  let certName = urlOrCertFilename.endsWith('.pfx') ? urlOrCertFilename : urlOrCertFilename + '.pfx'

  const certPath = path.join(certDirectory, certName)

  if (!fs.existsSync(certPath)) {
    throw Error(`File ${certPath} does not exist. Generate this first if you want to install it.`)
  }

  const psCommand = `$env:PSModulePath = [Environment]::GetEnvironmentVariable('PSModulePath', 'Machine'); Import-PfxCertificate -FilePath '${certPath}' -CertStoreLocation Cert:\\LocalMachine\\Root`

  await spawnAsync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand])
}

export async function winUninstallCert(urlOrSubject: string) {
  requireString('urlOrSubject', urlOrSubject)

  log(requiresAdminMessage)

  const psCommand = `$env:PSModulePath = [Environment]::GetEnvironmentVariable('PSModulePath', 'Machine'); Get-ChildItem Cert:\\LocalMachine\\Root | Where-Object { $_.Subject -match '${urlOrSubject}' } | Remove-Item`

  const result = await spawnAsync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand])

  if (result.code !== 0) {
    throw Error(`powershell command to uninstall cert failed with exit code ${result.code}`)
  }
}

export function linuxInstallCert() {
  const instructions = `Automated linux cert install not supported (chrome does not use system certs without significant extra configuration).
Manual Instructions:
- In Chrome, go to chrome://settings/certificates
- Select Authorities -> import
- Select your generated .crt file (in the ./cert/ directory by default - if you haven't generated it, see the generateCertWithOpenSsl method)
- Check box for "Trust certificate for identifying websites"
- Click OK
- Reload site`
  console.log(instructions)
}

function throwIfMaybeBadUrlChars(url: string, varName = 'url') {
  if (url.includes(' ')) {
    throw Error(`${varName} should not contain spaces`)
  }
  if (url.includes('/')) {
    throw Error(`${varName} should not contain forward slashes`)
  }
  if (url.includes('\\')) {
    throw Error(`${varName} should not contain backslashes`)
  }
}

function getBrewOpensslPath(): string {
  const brewResult = getSimpleSpawnResultSync('brew', ['--prefix', 'openssl'])
  if (brewResult.error) {
    throw Error('error attempting to find openssl installed by brew')
  }
  if (brewResult.stdoutLines.length === 0 || brewResult.stdoutLines.length > 1) {
    throw new Error(`unexpected output from brew command 'brew --prefix openssl': ${brewResult.stdout}`)
  }
  return brewResult.stdoutLines[0]
}

function getSanCnfFileContents(url: string) {
  return sanCnfTemplate.replace(/{{url}}/g, url)
}

const sanCnfTemplate = `[req]
distinguished_name=req
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = {{url}}

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = {{url}}
IP.1 = 127.0.0.1

`
