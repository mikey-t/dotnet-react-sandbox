# dotnet-react-sandbox

It's an app! A sandbox app! Project root `package.json` script commands and `gulpfile.js` tasks contain all the automated operations available for the project.

## Run Locally

For first time setup, follow the instructions under [Initial Development Setup](#initial-development-setup).

First run `npm run dockerUp`

Then in 2 terminals:

`npm run server`

`npm run client`

Then navigate to https://local.drs.mikeyt.net:3000.

## Initial Development Setup

Pre-requisites:
- Node.js version 18.x
- .NET 6 SDK
- Docker
- Openssl
  - Windows: install via chocolatey in admin shell
  - Linux: probably already installed (if not, google it)
  - Mac: install via brew (the pre-installed LibreSSL version will NOT work)
- PgAdmin (optional DB management tool)

Automatic setup (experimental generator script): [dotnet-react-generator](https://github.com/mikey-t/dotnet-react-generator)

Manual setup:
- Clone repo
- Run `npm run npmInstall` (runs npm install in root and in src/client)
- Run `npm run installDotnetEfTool` (or to update it: `npm run updateDotnetEfTool`)
- Run `npm run syncEnvFiles`
- Edit env file with appropriate values for your local environment:
  - `./env/.env.server`
- Run `npm run dockerUp`
- Run `npm run dbInitialCreate`
- Run `npm run bothDbMigrate`
- Create hosts entry (`C:\Windows\System32\drivers\etc\hosts` on windows) mapping `127.0.0.1` to `local.drs.mikeyt.net`
- Generate local self-signed ssl certificate with `npm run generateCert -- --url=local.drs.mikeyt.net`
- Add cert to local trusted cert store (see [Certificate Install](#certificate-install) section below)
- In 2 separate terminals, run
  - `npm run server`
  - `npm run client`
- Navigate to https://local.drs.mikeyt.net:3000 (in chrome, click advanced and proceed to ignore https warning)
- (optional) Login with your super admin (use the credentials you entered in `./env/.env.server` for `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`)
- (optional) Open PgAdmin and add new host using `localhost` and credentials from `./env/.env.server` (`DB_ROOT_USER` and `DB_ROOT_PASSWORD`)

Note that login with google and microsoft won't work without the necessary API credentials in `.env.server`.

## Certificate Install

### Linux Cert Install

Chrome on linux does not use the normal system certificates (the `ca-certificates` package won't affect chrome since chrome does not use /usr/local/share/ca-certificates). Although it's possible to install a few things and configure a Linux system so scripted cert install is possible, it's also pretty easy to just install it manually by following these steps:
- In Chrome, go to chrome://settings/certificates (or navigate there via settings -> Privacy and Security -> Advanced -> Manage Certificates)
- Select Authorities -> import
- Select your generated .crt file from ./cert/ (if you haven't generated it, see the opensslGenCert command)
- Check box that says "Trust certificate for identifying websites"
- Click OK

### MacOS Cert Install

One way to install a cert on newer macOS versions is the following:

- Open your new project's `./cert` directory in finder
- Open the keychain and navigate to the certificates tab
- Select `System` certificates
- Back in the `./cert` directory, double-click the generated `.crt` file - this should install it in the system certificates keychain area
- After it's imported into system certificates you still have to tell it to trust the certificate (*eye roll*), which can be done by double-clicking the certificate in the keychain window, expanding the `Trust` section and changing the dropdown `When using this certificate:` to `Always Trust`

Another macOS certificate note: newer versions of macOS require that self-signed certificates contain ext data with domain/IP info, and yet the version of openssl installed by default (LibreSSL 2.8.3) does not support the `-addext` option (**bravo** Apple! - really, just - top notch work there). On top of this, newer versions of macOS prevent scripted installation of any certificate to the trusted store without also modifying system security policy files (different depending on what macOS version and for whatever reason root permission is not the only requirement - go figure).

### Windows Cert Install

Use the provided npm command: `npm run winInstallCert -- --url=local.your-site.com`. If you ran the [dotnet-react-generator](https://github.com/mikey-t/dotnet-react-generator) script then it was installed automatically for you. The powershell command used is `Import-PfxCertificate`. If you want to use this yourself for other certificates, you can import to the trusted store in a terminal with elevated permissions by running something like this:

If you didn't generate a cert already, you'll ned to generate one first with something like this:

`npm run generateCert -- --url=local.your-site.com`

## Database Migrations

For more info on using db migrations, see [db-migrations-dotnet](https://github.com/mikey-t/db-migrations-dotnet#common-developer-db-related-tasks).

## Npm vs Yarn

Yarn sometimes had issues handling the SIGINT signal from ctrl-c and crashed the shell (among other issues), so I'm sticking with npm.

## React Client App

Instead of create-react-app, I'm going with [vite](https://github.com/vitejs/vite). Create react app is convenient but ULTRA slow (HMR is kind of slow and production builds are just ridiculous). Vite has extremely fast HMR and production builds are sometimes 4 times faster than CRA. There are some caveats, but vite has massive community support due to it now being the go-to tool for Vue.

## Deployment

From this project in a terminal, run `npm run createRelease`

Setting up the server and deploying files is out of scope for this project, but the essentials you need on the server are:
- Nginx setup and configured, including ssl and a virtual host pointing to where you copy and extract your app files
- Postgres DB setup and available
- Service definition, including production environment variables

I have an automated script that does the following (you could create one for your own use):
- Stop app service 
- Copy DbMigrator tarball to server, unpack and run with dbMigrate option
- Copy <your-tarball-name> app files to the server, unpack to app directory
- Start app service 

## Swagger

Access swagger UI at http://localhost:5001/api or the json at http://localhost:5001/swagger/v1/swagger.json (replace 5001 with your port if you changed it).

## Other Docs

Social login documentation: [Social Logins documentation](./docs/SocialLogins.md)

## Local Postgres Upgrade Process

- navigate to project in shell
- `npm run dockerUp`
- `docker exec -it drs_postgres pg_dump -U postgres -Fc -b -f /tmp/drs.dump drs`
- `docker cp drs_postgres:/tmp/drs.dump ./drs.dump`
- `npm run dockerDown`
- copy (not move) ./docker to ./docker_backup
- update docker-compose to use new image version (for example, postgres:15.3)
- delete ./docker/pg
- `npm run dockerUp`
- pause for a moment to let postgres initialize for the first time (~15 seconds)
- `npm run dbInitialCreate`
- `docker cp ./drs.dump drs_postgres:/tmp/drs.dump`
- `docker exec -it drs_postgres pg_restore -U postgres -d drs /tmp/drs.dump`
- test (spin up site and/or login via pgAdmin)
- delete ./docker_backup
- delete ./drs.dump

## TODO

- Add in vuetest for client unit testing
- More client code cleanup
- Functionality to enable/disable email verification functionality so you can register new accounts without setting up email sending
- Docker config/plumbing to generate a deployable image
- Move out boilerplate gulpfile commands to something like CRA's react-scripts, or Vue's CLI
- More docs on how to do various things:
  - How to create a new controller
  - Dependency injection notes
  - Use of main and test DB to easily write data based unit tests without altering main DB data and with the ability to safely run destructive data unit tests without breaking anything
- Rip out custom account schema in favor of built-in .NET Identity (maybe)
