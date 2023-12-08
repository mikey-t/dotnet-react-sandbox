# dotnet-react-sandbox

It's an app! A sandbox app!

This is a combination of a playground for trying new ideas as well as a reference implementation for a particular set of tech. I also use this space to create new functionality that will later get pulled out into separate packages. For example, this project is where I initially developed the projects listed below.

| Package Repo | Package | GitHub |
|--------------|---------|--------|
| NuGet | [MikeyT.EnvironmentSettings](https://www.nuget.org/packages/MikeyT.EnvironmentSettings) | [mikey-t/environment-settings-dotnet](https://github.com/mikey-t/environment-settings-dotnet) |
| NuGet | [MikeyT.DbMigrations](https://www.nuget.org/packages/MikeyT.DbMigrations/) | [mikey-t/db-migrations-dotnet](https://github.com/mikey-t/db-migrations-dotnet) |
| Npm | [@mikeyt23/node-cli-utils](https://www.npmjs.com/package/@mikeyt23/node-cli-utils) | [mikey-t/node-cli-utils](https://github.com/mikey-t/node-cli-utils) |
| Npm | [swig-cli](https://www.npmjs.com/package/swig-cli) | [mikey-t/swig](https://github.com/mikey-t/swig) |
| Npm | [swig-cli-modules](https://www.npmjs.com/package/swig-cli-modules) | [mikey-t/swig-cli-modules](https://github.com/mikey-t/swig-cli-modules) |
| Npm | [dotnet-react-generator](https://www.npmjs.com/package/dotnet-react-generator) | [mikey-t/dotnet-react-generator](https://github.com/mikey-t/dotnet-react-generator) |

## Solution Features

- Dotnet core backend API
- React client app using [vite](https://vitejs.dev/) for tooling and written in Typescript
- Cross platform development*
- Lightning fast startup and full hot reload for local development for both server and client
- Postgres database running in Docker with fully automated management via swig tasks
- Local trusted https support* (especially important when working on social login functionality locally)
- Role based user authentication/authorization
- Segregated test database, perfect for running potentially destructive unit tests that access the database - without disturbing your local application data
- Manage primary and test databases on a dev machine simultaneously with simply centralized shell commands
- VSCode workspaces for separate client and server work (optional)
- Dapper for data access (EF is only used for database migrations)
- XUnit test project for the backend API
- Misc react client starter code and features:
  - Material UI
  - React router
  - Dark mode
  - Login and registration components/pages
  - Social logins functionality (Microsoft, Google)
  - Email registration (WIP)
  - Basic routing setup
  - Basic admin site template with auth-aware routing
  - Eslint setup
- Automated, centralized dev tasks:
  - Project setup and teardown
    - Cert generation and installation*
    - Hosts entry
    - Database setup
  - Build (client and server)
  - Test (client and server)
  - Lint
  - Create and run a production configuration of the app locally with the server and client bundled together
  - Package app for deployment
  - Simple wrapper commands for managing the database with docker compose
- Simple but very powerful and flexible database migrations functionality using plain SQL files with Microsoft's EntityFramework Core managing migration tracking (via [db-migrations-dotnet](https://github.com/mikey-t/db-migrations-dotnet))
  - Wrapper commands around Microsoft EntityFramework Core migrations tool ([dotnet-ef](https://www.nuget.org/packages/dotnet-ef))
  - Manage a primary and test database simultaneously with simple centralized commands
  - Automated creation of deployable executable to migrate a production database

- Generator script for quickly generating new projects based on this one: [dotnet-react-generator](https://github.com/mikey-t/dotnet-react-generator)

> \* Automated setup and teardown functionality is only currently supported on Windows.

## Setup Requirements

- Node.js >= 20
- .NET 6 SDK
- Docker
- OpenSSL
  - Windows: install via chocolatey in an admin shell
  - Linux: probably already installed (if not, google it)
  - Mac: install OpenSSL via brew (the pre-installed LibreSSL version will not work)
- PgAdmin or VSCode PostgreSQL extension (optional DB management tool)

## Quick Start

This is an example of how to quickly create a new solution based on this project. For more detailed instructions, see [Initial Development Setup](#initial-development-setup).

> For Linux and Mac you will need to install certificates manually - see [Certificate Install](#certificate-install) for more info.

We will create a project named "acme" with a local URL of "local.acme.com".

- Ensure you have [setup requirements](#setup-requirements) installed first
- Install npm package `swig-cli` globally:
  ```
  npm i -g swig-cli@latest
  ```
- Navigate to the directory where you want to create your project
- Use the npm package `dotnet-react-generator` to create your new project (see the [dotnet-react-generator readme](https://github.com/mikey-t/dotnet-react-generator) for more info):
  ```
  npx -y dotnet-react-generator@latest -o acme -u local.acme.com -d acme
  ```
- Navigate into the newly created directory and run: `npm run npmInstall`
- Run `swig ensureDotnetEfToolInstalled`
- Run: `swig syncEnvFiles`
- Optional: customize values in your project root `.env`
- Open an admin terminal, navigate to your new solution and run: `swig setup`
- In 2 separate terminals (admin not required):
  - `swig server`
  - `swig client`
- Open a browser and navigate to your new site: https://local.acme.com:3000/
- Login with username `admin@test.com` and password `Abc1234!` (this user was populated from values in your `.env`)

## Available CLI Tasks

This project uses [swig](https://github.com/mikey-t/swig) for automating dev tasks and generally for gluing things together. It works similarly to gulp. Swig functionality normally goes directly in  the `swigfile.ts` file, but commands for this project happen to be encapsulated in a "swig module" called `DotnetReactSandbox` (repo: https://github.com/mikey-t/swig-cli-modules).

If you've just cloned the project, first install npm dependencies in the root as well as the client app by running:

```
npm run npmInstall
```

Then install `swig-cli` as a global npm package if you haven't already (if you don't, you'll have to prefix each command with `npx`):

```
npm i -g swig-cli@latest
```

Get a list of all the available tasks by running:

```
swig
```

Run tasks with:

```
swig <taskName>
```

You can also filter tasks. For example, display all tasks with "db" in their name (case insensitive):

```
> swig filter db
[ Command: filter ][ Swigfile: swigfile.ts ][ Version: 0.0.16 ]
Available tasks:
  bashIntoDb
  dbAddMigration
  dbBootstrapDbContext
  dbBootstrapMigrationsProject
  dbCreateRelease
  dbListMigrations
  dbMigrate
  dbRemoveMigration
  dbSetup
  dbShowConfig
  dbTeardown
[ Result: success ][ Total duration: 182 ms ]
```

## Initial Development Setup

First ensure you have all the [Setup Requirements](#setup-requirements) setup requirements - see above.

> Note: the repository cloning and initial customization can be done automatically using the npm script [dotnet-react-generator](https://github.com/mikey-t/dotnet-react-generator). The generator will clone the repo, delete the git dir, name the project, customize various files in the project that reference the project name and set `.env` values for you based on params passed.

- In a shell, navigate to the directory you want your project to go in
- Clone this repository, for example: `git clone git@github.com:mikey-t/dotnet-react-sandbox.git`
- Rename the directory to your new desired project name and delete the new project's `.git` directory
- Change directory into your new project
- Run `npm run npmInstall` (runs npm install in project directory root and in `./client`)
- Run `swig ensureDotnetEfToolInstalled` (ensures the Microsoft EntityFramework Core migrations tool is install: [dotnet-ef](https://www.nuget.org/packages/dotnet-ef))
- Run `swig configureDotnetDevCerts` (only required if you haven't run `dotnet dev-certs` recently - see https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-dev-certs)
- Run `swig syncEnvFiles` (or manually copy `.env.template` to `.env`)
- Edit `.env` file with appropriate values for your local environment, especially paying attention to:
  - PROJECT_NAME - the same value you used to name your new project root directory, for example
  - SITE_URL - the development URL, for example `local.your-project.com`
  - JWT_ISSUER - match to your SITE_URL
  - COMPOSE_PROJECT_NAME - this affects the names of your docker containers and has character restrictions, so only use lowercase alphanumeric with underscores
  - DB_USER, DB_NAME - I usually set these to the same value for my local environment
  - DB_NAME_TEST - this should be exactly the same as the DB_NAME but with prefixed with "test_" (this restriction will be lifted in the future)
  - SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD - this account will get seeded so you can login immediately after the site comes up on your local machine
- Ensure docker is running on your machine and then run `swig dockerUp`
- Wait ~15 seconds for the PostgreSQL instance running in it's docker container to do first time initialization
- Run `swig dbSetup`
- Run `swig dbMigrate`
- Create hosts entry (`C:\Windows\System32\drivers\etc\hosts` on windows) mapping `127.0.0.1` to `local.drs.mikeyt.net` (or whatever url you've set in `.env`)
- Generate local self-signed ssl certificate (replace url with your own and be sure it matches your SITE_URL in your `.env` - recommend prefixing URL with "`local.`"): `swig generateCert local.drs.mikeyt.net`
- Add cert to local trusted cert store (see [Certificate Install](#certificate-install) section below)

Verify your new project setup:

- In 2 separate terminals, run
  - `swig server`
  - `swig client`
- Navigate to https://local.drs.mikeyt.net:3000 (replace with whatever URL you've chosen and added to your `.env`)
- Login with your super admin user - use the credentials you set in your `.env` (defaults to `admin@test.com`/`Abc1234!`)
- Setup a connection to your locally running database with PgAdmin or a VSCode extension by using `localhost` as the host and credentials from `DB_ROOT_USER` and `DB_ROOT_PASSWORD` from your `.env`

Note that social logins (login with google and microsoft), google analytics and user registration using AWS SES won't work without additional setup. For setting up social logins, see [./SocialLogins.md](./SocialLogins.md).

## Remove Project

### Manual Removal

These are the steps to take if you'd like to revert changes made to your system for one of these projects:

- Bring docker containers down (run in a shell in the project directory): `swig dockerDown`
- Remove hosts entry
- Uninstall certificate

### Automatic Removal

Run in an elevated terminal in your project directory:

```
swig teardown
```

## Run Locally

For first time setup, follow the instructions under [Quick Start](#quick-start) or [Initial Development Setup](#initial-development-setup), and then come back here.

Ensure you've started docker and then run:

```
swig dockerUp
```

Then start the server and the client in 2 separate terminal windows:

```
swig server
```

```
swig client
```

Then navigate to https://local.drs.mikeyt.net:3000 (or whatever url you've changed it to during your initial setup).

## Certificate Install

### Windows Cert Install

If you didn't generate a cert already, you'll ned to first generate one with something like this:

`swig generateCert local.your-site.com`

Use the provided swig command: `swig winInstallCert local.your-site.com`. If you ran the [dotnet-react-generator](https://github.com/mikey-t/dotnet-react-generator) script then it was installed automatically for you. The powershell command used is `Import-PfxCertificate`.

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

Another macOS certificate note: newer versions of macOS require that self-signed certificates contain ext data with domain/IP info, and yet the version of openssl installed by default (LibreSSL 2.8.3) does not support the `-addext` option. On top of this, newer versions of macOS prevent scripted installation of any certificate to the trusted store without also modifying system security policy files (different depending on what macOS version and for whatever reason root permission is not the only requirement).

## Database Migrations

For more info on using db migrations, see [db-migrations-dotnet](https://github.com/mikey-t/db-migrations-dotnet#common-developer-db-related-tasks).

The DB swig commands in this project come from the swig module `EntityFramework`. When you run `swig`, these should be in the list of available tasks:

```
...
dbAddMigration
dbBootstrapDbContext
dbBootstrapMigrationsProject
dbCreateRelease
dbListMigrations
dbMigrate
dbRemoveMigration
dbSetup
dbShowConfig
dbTeardown
...
```

The commands you'll use the most during development:

```
dbListMigrations
dbAddMigration
dbRemoveMigration
dbMigrate
```

### Examples DB Migration Wrapper Commands

List migrations:
```
swig dbListMigrations
```

Add new migration (creates files in `./server/src/DbMigrations/):
```
swig dbAddMigration YourMigrationName
```

Run migrations (update database) to latest:
```
swig dbMigrate
```

Run Migrations (update database) to specific Migration (Up or Down):
```
swig dbMigrate YourMigrationName
```

Remove most recent migration (this only works if the last migration hasn't been applied yet - use `swig dbMigrate MigrationBeforeLast` to run the `Down` operation for the last migration):
```
swig dbRemoveMigration
```

All the commands above omitted which DbContext to use, which means it defaults to using both `main` and `test` (source code for that configuration: swig-cli-modules [DotnetReactSandboxConfig.ts](https://github.com/mikey-t/swig-cli-modules/blob/main/src/config/DotnetReactSandboxConfig.ts)). You can also run any of the commands above against a specific DB (`main` or `test` or `all`):

```
swig dbListMigrations all
swig dbRemoveMigration test
swig dbAddMigration all YourMigrationName
swig dbMigrate main SomeMigrationName
... etc
```

### Example DB Development Loop

- Step 1: design table or other objects in PgAdmin
- Step 2: use PgAdmin to output sql for creation instead of actually applying the changes directly
- Step 3: run `swig dbAddMigration MyNewTable`, which generates C# migration files and empty sql script files to add your sql to
- Step 4: add generated sql to auto-generated sql script at `./server/src/DbMigrations/Scripts/MyNewTable.sql`
- Step 5: add necessary sql for the `Down` migration in auto-generated script at `./server/src/DbMigrations/Scripts/MyNewTable_Down.sql`
- Step 6: migrate just the `test` database using `swig dbMigrate test`
- Step 7: write some data access code in `./server/src/WebServer/Data`
- Step 8: write some unit tests to exercise the new data access code in `./server/src/WebServer.Test/`
- Step 9: If changes are needed to the schema, repeat variations of the following until you're happy with the changes:
  -  Back out the migration with `swig dbMigrate test NameOfMigrationJustBeforeNewOne` (you can find the list of migration names by looking at the C# files in the `Migrations` directory or by running `swig dbListMigrations test`)
    - Adjust the sql in the Up script and re-run the migration with `swig dbMigrate test`
    - Adjust data access code and/or tests as needed
- Step 10: Once you're happy with the code, apply it to the main database with `swig dbMigrate main` (or `all` if you haven't already applied it to `test`)
- Step 11: Apply any other desired changes to the repository before committing your code, and then commit it
- Step 12: Other developers can then checkout the latest code and run `swig dbMigrate` to get your DB changes for their local DB instances

## Npm vs Yarn

Yarn sometimes had issues handling the SIGINT signal from ctrl-c and crashed the shell (among other issues), so I'm sticking with npm, which seems to work just fine these days.

Also, I think some people use yarn because it's faster, but for most of my dev automation, I'm side-stepping npm completely. Because of this, the `swig` commands in this project are significantly faster than if I used npm or yarn for task execution.

## React Client App

Instead of create-react-app, I'm going with [vite](https://vitejs.dev/). Create react app is convenient but ULTRA slow (HMR is kind of slow and production builds are just ridiculous). Vite has extremely fast HMR and production builds are sometimes 4 times faster than CRA. Vite is now very popular and has very good community support and a vast user base and a very nice plugin architecture for configuration and extensibility. You can build the entire app with `npx createRelease` in under 15 seconds 🚀. That's server, DbMigrations, vite react client - packaged up into a tarball ready for production. It used to take a few minutes because of create-react-app, so it's unlikely I'll ever switch back to CRA.

Vite also has excellent proxy support, which is vital to this project's setup. See config in `./client/vite.config.ts`.

## Deployment

From this project in a terminal, run:

```
swig createRelease
```

Setting up the server and deploying files is out of scope for this project, but the example essentials you need on a linux server are:
- Nginx setup and configured, including ssl and a virtual host pointing to where you copy and extract your app files
- Postgres DB setup and available (including initial role and schema creation)
- Linux service definition setup and enabled, including appropriate access to production environment variables (such as a service definition file that references a .env file in a secure location on the server)

I happen to have my own automated script that does the following (you could create one of your own or an actual CI/CD setup):
- Stop app service 
- Copy EF bundle `./release/MigrateMainDbContext-linux-x64.exe` (this is a self-contained executable that will migrate your DB to latest) to your server (or any machine that has access to the database), make it executable with `chmod u+x MigrateMainDbContext-linux-x64.exe` and then run it
- Copy `./release/<your-tarball-name>` to the server, unpack to app directory
- Start app service

## Swagger

Access swagger UI at http://localhost:5001/api or the json at http://localhost:5001/swagger/v1/swagger.json (replace 5001 with your port if you changed it).

## Other Docs

Social login documentation: [Social Logins documentation](./SocialLogins.md)

## Local Postgres Upgrade Process

> Note that these instructions were for an older version when I was using a bind mount instead of a docker volume, but the concept is still relevant.

For teams using the same project you'd want extra steps like checking out latest, manually downgrading the docker-compose postgres version back to what it was so that dockerUp will work, then follow the instructions below.

- navigate to project in shell
- `swig dockerUp`
- `docker exec -it drs_postgres pg_dump -U postgres -Fc -b -f /tmp/drs.dump drs`
- `docker cp drs_postgres:/tmp/drs.dump ./drs.dump`
- `swig dockerDown`
- copy (not move) ./docker to ./docker_backup
- update docker-compose to use new image version (for example, postgres:15.3)
- delete ./docker/pg
- `swig dockerUp`
- pause for a moment to let postgres initialize for the first time (~15 seconds)
- `swig dbSetup`
- `docker cp ./drs.dump drs_postgres:/tmp/drs.dump`
- `docker exec -it drs_postgres pg_restore -U postgres -d drs /tmp/drs.dump`
- test (spin up site and/or login via pgAdmin)
- delete ./docker_backup
- delete ./drs.dump

## How to Customize

### License

If you decide you like this project enough to use it as a template for your own project, please keep the original license file (rename it to something like ORIGINAL_LICENSE or DOTNET_REACT_SANDBOX_LICENSE), then create your own license file. Perhaps also call out in your readme that it's a template of this project and document which parts are customized and under your new license if it's different.

### Client App Copyright

To update the copyright text at the bottom of rendered web pages, update `.client/src/components/Copyright.tsx`.

### Project Name

The project name is used for the following:

- The name of the release tarball (i.e. `your-project-name.tar.gz`)
- The name of the dotnet `.sln` file
- The name of the vscode client and server workspace files

 You can change the project name manually by following these steps:

- Change your root directory name
- Change value in your `.env` file for key: `PROJECT_NAME`
- Change your dotnet solution file name: `./server/your-project-name.sln`
  - Also change the name within the contents of the dotnet solution file - replace "`dotnet-react-sandbox.sln`" (it might be different if you used the project generator script or have renamed it already) with "`your-project-name.sln`"
- Rename `./server/drs-server.code-workspace`
  - Also update the contents - change the `"dotnet.defaultSolution"` settings to the new name of your dotnet `.sln` file
- Rename `./client/drs-client.code-workspace`

### Docker Container Prefixes

I'm using the environment variable `COMPOSE_PROJECT_NAME` to inform docker-compose commands what prefix to use with the containers it starts. If you used the generator script to create the project, then it will be set to whatever you specified for the project name. You can change this at any time, but be sure to first bring your containers down before renaming the value of `COMPOSE_PROJECT_NAME` in your `.env` file.

Note that docker-compose requires a strict subset of characters for this value. From the [docs](https://docs.docker.com/compose/environment-variables/envvars/#:~:text=Project%20names%20must%20contain%20only,lowercase%20letter%20or%20decimal%20digit.):

"Project names (`COMPOSE_PROJECT_NAME`) must contain only lowercase letters, decimal digits, dashes, and underscores, and must begin with a lowercase letter or decimal digit."

### Change Local Database Name or Credentials

- Make sure your DB is up and running: `swig dockerUp`
- Login to a shell in your running DB instance: `swig bashIntoDb` (gives you a bash shell as root)
- Run `psql -U postgres`
- Run any desired commands such as changing DB name or password (you'll have to do some research to find the exact commands to run)
  - Be sure to change both databases (main and test)
- Exit psql and the bash session
- Bring docker down by running: `swig dockerDown`
- Update `.env` values if necessary
- Bring docker back up by running: `swig dockerUp`

### Change Local Dev URL

There are swig commands to change each thing related to the URL manually, but the easiest way is to use the `setup` and `teardown` tasks:

- Run `swig teardown nodb` or just `swig teardown` and answer **"no"** when it asks if you want to delete your database
- Update `.env` values:
  - `SITE_URL`
  - `JWT_ISSUER`
- Run `swig setup nodb` or `swig dockerDown && swig setup`

## IDE - VSCode

I previously preferred JetBrains IDEs (still do actually), but I also like staying with the herd, which I think is primarily using VSCode, so I've decided to switch over. Below are some misc notes on VSCode use.

VSCode settings I've customized for this project in:

- `./.vscode/settings.json`
- `./client/.vscode/settings.json`

I'm using a `.editorconfig` file and the matching VSCode extension.

This project is organized to take advantage of VSCodes workspaces so you can edit the server app and client app in separate VSCode instances in addition to opening and editing the entire project in one VSCode instance if that's preferred. Workspace specific settings can be found in:

- `./server/drs-server.code-workspace`
- `./client/drs-client.code-workspace`

To take full advantage of these you need to open them as a workspace (`File` -> `open Workspace from file...`).
