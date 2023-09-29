import { log } from '@mikeyt23/node-cli-utils'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import DependencyChecker, { StringBoolArray, StringBoolEntry } from './DependencyChecker.js'
import chalk from 'chalk'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import * as certUtils from '@mikeyt23/node-cli-utils/certUtils'
import * as nodeCliUtils from '@mikeyt23/node-cli-utils'
import os from 'node:os'

export interface ProjectSetupOptions {
  cwd: string
  generatedCertsDir: string
}

export default class ProjectSetupUtil {
  private readonly depsChecker: DependencyChecker
  private readonly cwd: string
  private readonly generatedCertsDir: string
  private sudoerUsername: string = ''
  private populateSudoerErrorMessage: string = ''

  constructor(dependencyChecker: DependencyChecker, options?: Partial<ProjectSetupOptions>) {
    if (!dependencyChecker) {
      throw new Error('dependencyChecker is required')
    }

    const defaultOptions = { cwd: process.cwd(), generatedCertsDir: './cert/' }
    const mergedOptions = { ...defaultOptions, ...options }

    this.depsChecker = dependencyChecker
    this.cwd = mergedOptions.cwd
    this.generatedCertsDir = mergedOptions.generatedCertsDir

    if (!fs.existsSync(this.cwd) && !fs.lstatSync(this.cwd).isDirectory()) {
      throw new Error('cwd option is invalid - must be an existing directory')
    }
    if (!fs.existsSync(this.generatedCertsDir)) {
      log(`generatedCertsDir does not exist - creating it: ${this.generatedCertsDir}`)
      fs.mkdirSync(this.generatedCertsDir, { recursive: true })
    }
    if (!nodeCliUtils.isPlatformWindows()) {
      this.tryPopulateSudoerUsername()
      log(`sudoerUsername: ${this.sudoerUsername}`)
      log(`populateSudoerErrorMessage: ${this.populateSudoerErrorMessage}`)
    }
  }

  async checkDependencies() {
    const report = await this.depsChecker.getReport()
    log(this.depsChecker.getFormattedReport(report))
    const depsCheckPassed = this.depsChecker.hasAllDependencies(report)
    log(`Dependencies check passed: ${depsCheckPassed ? chalk.green('true') : chalk.red('false')}\n`,)
    if (!depsCheckPassed) {
      throw Error(chalk.red('dependencies check failed - see above'))
    }
  }

  /**
   * Requires elevated permissions. Will look for the string "127.0.0.1 <hostname>" (with exactly one space, all on the same line) and will
   * skip if it's found, otherwise will append that same line to the end of the file with a single newline character (os.EOL) before it.
   * @param url The url for the hosts entry (protocol, port and path will be stripped off the provided url)
   */
  async ensureHostsEntry(url: string): Promise<void> {
    log('ensuring hosts entry exists')
    const hostname = this.parseHostname(url)
    await this.changeHostsFile(hostname, true)
  }

  async removeHostsEntry(url: string): Promise<void> {
    log('removing hosts entry if it exists')
    const hostname = this.parseHostname(url)
    await this.changeHostsFile(hostname, false)
  }

  async ensureCertSetup(url: string) {
    log('ensuring certificate is setup')
    const hostname = this.convertUrlToHostname(url)
    await this.ensureCertFile(hostname)
    await this.installCert(hostname)
  }

  async teardownCertSetup(url: string, deleteCertFiles = true) {
    log(`uninstalling certificate${deleteCertFiles ? ' and deleting cert files' : ''}`)
    const hostname = this.convertUrlToHostname(url)
    await this.uninstallCert(hostname)
    if (deleteCertFiles) {
      const filesToDelete = [`${hostname}.pfx`, `${hostname}.crt`, `${hostname}.key`, `${hostname}.cnf`]
      filesToDelete.forEach(async f => {
        const filePath = path.join(this.generatedCertsDir, f)
        if (fs.existsSync(filePath)) {
          log(`deleting: ${filePath}`)
          fs.rmSync(filePath)
        }
      })
    }
  }

  getRequiredEnvVar(varName: string): string {
    nodeCliUtils.requireString('varName', varName)
    const val = process.env[varName]
    if (!val) {
      throw new Error(`missing required environment variable ${varName}`)
    }
    return val
  }

  async getStatusCert(url: string): Promise<StringBoolArray> {
    const hostname = this.convertUrlToHostname(url, false)
    const certPath = this.getCertPfxPath(hostname)
    const certFileExists = fs.existsSync(certPath)
    const certInstalled = await certUtils.winCertIsInstalled(hostname)
    return [{ key: 'Cert file exists', value: certFileExists }, { key: 'Cert installed', value: certInstalled }]
  }

  async getStatusHosts(url: string): Promise<StringBoolEntry> {
    const hostsEntry = this.getHostsEntry(this.convertUrlToHostname(url, false))
    const hostsEntryExists = this.hostsFileHasEntry(await this.getHostsFileString(), hostsEntry)
    return { key: 'Hosts entry exists', value: hostsEntryExists }
  }

  private getHostsPath() {
    return nodeCliUtils.isPlatformWindows() ? 'C:/Windows/System32/drivers/etc/hosts' : '/etc/hosts'
  }

  private getHostsEntry(hostname: string) {
    return `127.0.0.1 ${hostname}`
  }

  private async getHostsFileString() {
    const hostsPath = nodeCliUtils.isPlatformWindows() ? 'C:/Windows/System32/drivers/etc/hosts' : '/etc/hosts'
    return await fsp.readFile(hostsPath, { encoding: 'utf-8' })
  }

  // Check by normalizing whitespace (collapse consecutive spaces to single spaces) in entry and on each line checked
  private hostsFileHasEntry(hostsFileString: string, entry: string): boolean {
    const normalizedEntry = entry.replace(/\s+/g, ' ')
    const hostsLines = nodeCliUtils.stringToNonEmptyLines(hostsFileString).map(l => l.replace(/\s+/g, ' ')).filter(l => !l.startsWith('#'))
    const hasLine = hostsLines.includes(normalizedEntry)
    return hasLine
  }

  private async changeHostsFile(hostname: string, isAddition: boolean = true) {
    nodeCliUtils.requireString('hostname', hostname)
    const isRemoval = !isAddition
    const hostsPath = this.getHostsPath()
    const entry = this.getHostsEntry(hostname)

    log(`checking hosts file: ${hostsPath} for entry ${entry}`)
    const hostsFileString = await this.getHostsFileString()
    const hasLine = this.hostsFileHasEntry(hostsFileString, entry)

    if (isAddition && hasLine) {
      log(`there is an existing entry in the hosts file (${entry}), skipping`)
      return
    }
    if (isRemoval && !hasLine) {
      log(`there is no hosts entry to remove (${entry}), skipping`)
    }
    if (isAddition && !hasLine) {
      log('existing entry not found - appending entry to the hosts file')
      await fsp.appendFile(hostsPath, `\n${entry}`)
    }
    if (isRemoval && hasLine) {
      log(`existing entry found - removing entry`)
      const hostsWithoutEntry = this.getEolNormalizedWithoutLine(hostsFileString, entry)
      await fsp.writeFile(hostsPath, hostsWithoutEntry)
    }
  }

  /**
   * The `initialString` will have line endings normalized to use os.EOL and lines with `omitLine` will be removed.
   * Comparisons for which lines should be removed are normalizing whitespace (multiple spaces collapsed into single
   * spaces for the comparison). This is useful to remove instances of a hosts entry, for example.
   * @param initialString The string to normalize remove instances of omitLine from
   * @param omitLine All instance of this string will be omitted from the result
   * @returns A string that has instances of the omitLine removed and all line endings changed to match the os.EOL
   */
  private getEolNormalizedWithoutLine(initialString: string, omitLine: string) {
    const normalizedOmitLine = omitLine.replace(/\s+/g, ' ')
    const lines = initialString.split('\n')
      .map(l => l.replace(/\r/g, ''))
      .filter(l => l.replace(/\s+/g, ' ') !== normalizedOmitLine)
    return lines.join(os.EOL)
  }

  private convertUrlToHostname(url: string, logConversion = true) {
    nodeCliUtils.requireString('url', url)
    const hostname = this.parseHostname(url)
    if (logConversion) {
      log(`continuing with url converted to hostname: ${hostname}`)
    }
    return hostname
  }

  private async ensureCertFile(hostname: string) {
    const certPath = this.getCertPfxPath(hostname)
    if (fs.existsSync(certPath)) {
      log(`using existing cert file at path ${certPath}`)
      return
    }

    await certUtils.generateCertWithOpenSsl(hostname, { outputDirectory: this.generatedCertsDir })
  }

  private async installCert(hostname: string) {
    if (!nodeCliUtils.isPlatformWindows()) {
      log(`installing certificates is not supported on this platform yet - skipping (see docs for manual instructions)`)
      return
    }

    log('checking if cert is already installed')
    if (await certUtils.winCertIsInstalled(hostname)) {
      log('cert already installed, skipping')
      return
    }

    log('cert is not installed - attempting to install')
    await certUtils.winInstallCert(this.getCertPfxPath(hostname))
  }

  private async uninstallCert(hostname: string) {
    if (!nodeCliUtils.isPlatformWindows()) {
      log(`Uninstalling certificates is not supported on this platform yet - skipping (see docs for manual instructions)`)
      return
    }

    if (!await certUtils.winCertIsInstalled(hostname)) {
      log('cert is not installed, skipping')
      return
    }

    log('attempting to uninstall cert')
    await certUtils.winUninstallCert(hostname)
  }

  private getCertPfxPath(hostname: string) {
    return path.join(this.generatedCertsDir, `${hostname}.pfx`)
  }

  // Test this once I start implementing linux/mac functionality
  private async runAsSudoer(cmd: string, cwd?: string) {
    if (!this.sudoerUsername) {
      if (this.populateSudoerErrorMessage) {
        throw new Error(this.populateSudoerErrorMessage)
      } else {
        throw new Error('sudoer username was not populated - cannot continue')
      }
    }

    const cmdArgs = `-H -u ${this.sudoerUsername} bash -c`.split(' ')
    cmdArgs.push(`'${cmd}'`)
    await nodeCliUtils.spawnAsync('sudo', cmdArgs, { cwd: cwd || process.cwd() })
  }

  private async chown(): Promise<void> {
    const userId = process.env.SUDO_UID
    if (!userId) {
      throw Error('could not get your user id to run chown')
    }

    if (nodeCliUtils.isPlatformLinux()) {
      await nodeCliUtils.spawnAsync('sudo', ['chown', '-R', `${userId}:${userId}`, this.cwd], { throwOnNonZero: true })
    } else if (nodeCliUtils.isPlatformMac()) {
      await nodeCliUtils.spawnAsync('sudo', ['chown', '-R', `${userId}`, this.cwd], { throwOnNonZero: true })
    }
  }

  private async tryPopulateSudoerUsername() {
    const sudoerId = process.env.SUDO_UID

    if (sudoerId === undefined) {
      this.populateSudoerErrorMessage = 'cannot get sudoer username - process not started with sudo'
      return
    }

    log(`attempting to find username for sudoer id ${sudoerId}`)

    const childProcess = spawnSync('id', ['-nu', sudoerId], { encoding: 'utf8' })
    if (childProcess.error) {
      throw childProcess.error
    }

    let username = childProcess.stdout

    if (!username) {
      this.populateSudoerErrorMessage = 'unable to get sudoer username'
      return
    }

    username = username.replace('\n', '')

    log(`using sudoer username: ${username}`)

    this.sudoerUsername = username
  }

  private parseHostname(url: string | undefined) {
    if (!url) {
      throw new Error('Missing url')
    }
    try {
      const urlWithProtocol = /^https?:\/\//i.test(url) ? url : 'http://' + url
      const urlObj = new URL(urlWithProtocol)
      return urlObj.hostname
    } catch (err) {
      throw new Error(`Could not parse url: ${url}`, { cause: err })
    }
  }
}
