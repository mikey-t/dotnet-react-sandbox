# dotnet-react-sandbox

It's an app! A sandbox app! Project root package.json script commands and gulpfile.js tasks contain all the automated operations available for the project.

## Run Locally

(for first time setup, follow the instructions under "Initial Development Setup")

- First run `npm run dockerUp`

Then in 2 terminals:

- `npm run server`
- `npm run client`

Then navigate to https://local.drs.mikeyt.net:3000.

## Initial Development Setup

Pre-requisite steps:
- Node (version >= 16.x)
- .NET 6 SDK
- Docker
- Openssl
  - Windows: install via chocolatey in admin shell.
  - Linux: probably already installed. If not, google it.
  - Mac: install via brew.
- PgAdmin (optional DB management tool)

Setup steps:
- Clone repo
- Run `npm run npmInstall` (runs npm install in root and in src/client)
- Run `npm run installDotnetEfTool` (or to update it: `npm run updateDotnetEfTool`)
- Run `npm run syncEnvFiles`
- Edit env file with appropriate values for your local environment:
  - `./env/.env.server`
- Run `npm run dockerUp`
- Run `npm run dbInitialCreate`
- Run `npm run bothMigrate`
- Create hosts entry (`C:\Windows\System32\drivers\etc\hosts` on windows) mapping `127.0.0.1` to `local.drs.mikeyt.net`
- Generate local self-signed ssl certificate with `npm run opensslGenCert -- --url=local.drs.mikeyt.net`
- Add cert to local trusted cert store
  - Windows: `npm run winInstallCert -- --name=local.drs.mikeyt.net.pfx`
  - Mac: (?? - manually from ./cert/local.drs.mikeyt.net.pfx)
  - Linux: (?? - manually from ./cert/local.drs.mikeyt.net.pfx)
- In 2 separate terminals, run
  - `npm run server`
  - `npm run client`
- Navigate to https://local.drs.mikeyt.net:3000 (in chrome, click advanced and proceed to ignore https warning)
- (optional) Login with your super admin (use the credentials you entered in `./env/.env.server` for `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`)
- (optional) Open PgAdmin and add new host using `localhost` and credentials from `./env/.env.server` (`DB_ROOT_USER` and `DB_ROOT_PASSWORD`)

Note that login with google and microsoft won't work without the necessary API credentials in `.env.server`.

## Database Migrations

For more info on using db migrations, see [db-migrations-dotnet](https://github.com/mikey-t/db-migrations-dotnet#common-developer-db-related-tasks).

## Npm vs Yarn

Yarn sometimes had issues handling the SIGINT signal from ctrl-c and crashed the shell (among other issues), so I'm sticking with npm.

## React Client App

Instead of create-react-app, I'm going with [vite](https://github.com/vitejs/vite). Create react app is convenient but ULTRA slow (HMR is kind of slow and production builds are just ridiculous). Vite has extremely fast HMR and production builds are sometimes 4 times faster than CRA. There are some caveats, but vite has massive community support due to it being the go-to toolbox for Vue now.

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

## TODO

- Add in vuetest for client unit testing.
- More client code cleanup.
- Functionality to enable/disable social logins so fresh projects don't have console errors and broken social login buttons before setting up Google/Microsoft application credentials.
- Functionality to enable/disable email verification functionality so you can register new accounts without setting up email sending.
- Docker config/plumbing to generate a deployable image.
- Move out boilerplate gulpfile commands to something like CRA's react-scripts.
- Generator scripts:
  - Script that sets up dependencies (ensure windows/mac/linux support)
  - Script that takes in things like project name and local url and completely sets up a new project
- More docs on how to do various things:
  - How to create a new controller
  - Dependency injection notes
  - Use of main and test DB to easily write data based unit tests without altering main DB data and with the ability to safely run destructive data unit tests without breaking anything.

## Maybe TODO
- Rip out custom account schema in favor of built-in .NET Identity.
