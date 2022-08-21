# dotnet-react-sandbox

It's an app! A sandbox app!

## Run Locally

(for first time setup, follow the instructions under "Initial Development Setup")

- First run `npm run dockerUp`

Then in 2 terminals:

- `npm run server`
- `npm run client`

Then navigate to https://local.drs.mikeyt.net:3000.

## Initial Development Setup

Pre-requisite steps:
- Install node (version >= 16.x)
- Install .NET 6 SDK
- Install Docker
- Install PgAdmin (optional DB management tool)

Setup steps:
- Clone repo
- Run `npm run npmInstall`
- Run `npm run installDotnetEfTool`
- Run `npm run syncEnvFiles`
- Edit env files with appropriate values for your local environment:
  - `./env/.env.client`
  - `./env/.env.server`
- Run `npm run dockerUp`
- Run `npm run dbInitialCreate`
- Run `npm run dbMigrate` and `npm run testDbMigrate`
- Create hosts entry (`C:\Windows\System32\drivers\etc\hosts` on windows) mapping `127.0.0.1` to `local.drs.mikeyt.net`
- In 2 separate terminals, run
  - `npm run server`
  - `npm run client`
- Navigate to https://local.drs.mikeyt.net:3000 (in chrome, click advanced and proceed to ignore https warning)
- (optional) Login with your super admin (use the credentials you entered in `./env/.env.server` for `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD`)
- (optional) Open PgAdmin and add new host using `localhost` and credentials from `./env/.env.server` (`DB_ROOT_USER` and `DB_ROOT_PASSWORD`)

Note that login with google and microsoft won't work without the necessary API credentials in `.env.server`.

## Database Migrations

Create a new migration:

- `npm run dbAddMigration --name YourMigrationName`
- Add sql up and down scripts to `src/DbMigrator/Scripts/`
- Reference sql scripts in `src/DbMigrator/Migrations/Main/[timestamp]_YourMigrationName.cs` (see existing migrations for examples of using the extension method `RunScript`)
- `npm run dbMigrate`

List migrations:

- `npm run dbMigrationsList`

Roll back a migration (assuming you've provided a `down` script):

- Find the migration just before the one you want to rollback: `npm run dbMigrationsList`
- Using just the name (no `[timestamp]_` or `.cs`), run `npm run dbMigrate --name PreviousMigrationName`

Migrate database to latest schema:

- `npm run dbMigrate`

Run DB migrations against the test database:

- All the same commands above, but prefixed with `testDb` instead of `db`

## Npm vs Yarn

We were using yarn, but it sometimes had issues handling the SIGINT signal from ctrl-c and crashed the shell, so we've switched back to npm.

Some npm commands:

`npm i package-name`
`npm i -D package-name`
`npm uninstall package-name`


## Deployment

From this project in terminal, run `npm run createRelease`

Setting up the server and deploying files is out of scope for this project, but the essentials you need on the server are:
- Nginx setup and configured, including ssl and a virtual host pointing to where you copy and extract your app files
- Postgres DB setup and available
- Service definition, including production environment variables

I have an automated script that does the following (you could create one for your own use):
- Stop app service 
- Copy DbMigrator tarball to server, unpack and run with dbMigrate option
- Copy <your-tarball-name> app files to the server, unpack to app directory
- Start app service 
