# dotnet-react-sandbox

It's an app! A sandbox app!

This is a combination of a playground for trying new ideas as well as a reference implementation for a particular set of tech. I also use this space to create new functionality that will later get pulled out into separate packages. For example, this project is where I initially developed the projects listed below.

| Package Repo | Package | GitHub |
|--------------|---------|--------|
| NuGet | [MikeyT.EnvironmentSettings](https://www.nuget.org/packages/MikeyT.EnvironmentSettings) | [mikey-t/environment-settings-dotnet](https://github.com/mikey-t/environment-settings-dotnet) |
| NuGet | [MikeyT.DbMigrations](https://www.nuget.org/packages/MikeyT.DbMigrations/) | [mikey-t/db-migrations-dotnet](https://github.com/mikey-t/db-migrations-dotnet) |
| Npm | [@mikeyt23/node-cli-utils](https://www.npmjs.com/package/@mikeyt23/node-cli-utils) | [mikey-t/node-cli-utils](https://github.com/mikey-t/node-cli-utils) |
| Npm | [swig-cli](https://www.npmjs.com/package/swig-cli) | [mikey-t/swig](https://github.com/mikey-t/swig) |
| Npm | [dotnet-react-generator](https://www.npmjs.com/package/dotnet-react-generator) | [mikey-t/dotnet-react-generator](https://github.com/mikey-t/dotnet-react-generator) |

## Available CLI Tasks

This project uses [swig](https://github.com/mikey-t/swig) for automating dev tasks and generally for gluing things together. It works similarly to gulp. Check out the [./swigfile.ts](./swigfile.ts) for the details on how exactly this project's CLI commands work.

If you've just cloned the project, first install npm dependencies in the root as well as the client app by running:

```
npm run npmInstall
```

Get a list of all the available tasks by running:

```
npx swig list
```

Run commands with:

```
npx swig <taskName>
```

For help running tasks:

```
npx swig help
```

## Run Locally

For first time setup, first follow the instructions under [Initial Development Setup](#initial-development-setup) below, and then come back here.

Once you're setup, starting your project using these steps will provide full hot-reload functionality for both the client and server application for a nice fast development loop. The web server requires you to press "a" in the terminal on the first "rude" edit in .net 6 after the initial startup, but after that will automatically reload on any change.

Ensure you've started docker and then run:

```
npx swig dockerUp
```

Then start the server and the client in 2 separate terminal windows:

```
npx swig server
```

```
npx swig client
```

Then navigate to https://local.drs.mikeyt.net:3000 (or whatever url you've changed it to during your initial setup - see below).

## Initial Development Setup

Pre-requisites:
- Node.js version >= 18.x
- .NET 6 SDK
- Docker
- Openssl
  - Windows: install via chocolatey in admin shell
  - Linux: probably already installed (if not, google it)
  - Mac: install via brew (the pre-installed LibreSSL version will NOT work)
- PgAdmin or VSCode PostgreSQL extension (optional DB management tool)

Optionally, try this experimental automated project generator script: [dotnet-react-generator](https://github.com/mikey-t/dotnet-react-generator)

Manual setup:
- Clone repo
- Run `npm run npmInstall` (runs npm install in project directory and in `./client`)
- Run `npx swig installOrUpdateDotnetEfTool`
- Run `npx swig syncEnvFiles` (or manually copy `.env.template` to `.env`)
- Edit `.env` file with appropriate values for your local environment, especially paying attention to:
  - PROJECT_NAME
  - SITE_URL
  - JWT_ISSUER - match to your SITE_URL
  - DEV_CERT_NAME - match to your SITE_URL
  - COMPOSE_PROJECT_NAME - this affects the names of your docker containers, has restrictions in what characters can be used, so try just using lowercase alphanumeric with underscores
  - DB_USER, DB_NAME - I usually set these to the same value for my local environment
  - SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD - this account will get seeded so you can login immediately after the site comes up on your local machine
- Ensure docker is running on your machine and then run `npx swig dockerUp`
- Wait ~15 seconds for the PostgreSQL instance running in it's docker container to do first time initialization
- Run `npx swig dbInitialCreate`
- Run `npx swig dbMigrate both`
- Create hosts entry (`C:\Windows\System32\drivers\etc\hosts` on windows) mapping `127.0.0.1` to `local.drs.mikeyt.net` (or whatever url you've set in `.env`)
- Generate local self-signed ssl certificate (replace url with your own and be sure it matches your SITE_URL in your `.env` - recommend prefixing URL with "`local.`"): `npx swig generateCert local.drs.mikeyt.net`
- Add cert to local trusted cert store (see [Certificate Install](#certificate-install) section below)
- In 2 separate terminals, run
  - `npx swig server`
  - `npx swig client`
- Navigate to https://local.drs.mikeyt.net:3000 (replace with whatever URL you've chosen and added to your `.env`)

Optional:
- Login with your super admin - use the credentials from your `.env`
- Setup a connection to your locally running database with PgAdmin or a VSCode extension by using `localhost` as the host and credentials from `DB_ROOT_USER` and `DB_ROOT_PASSWORD` from your `.env`
- Run server unit tests: `npx swig testServer`

Note that social logins (login with google and microsoft), google analytics and user registration using AWS SES won't work without additional setup. For setting up social logins, see [./docs/SocialLogins.md](./docs/SocialLogins.md).

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

Use the provided npm command: `npx swig winInstallCert local.your-site.com`. If you ran the [dotnet-react-generator](https://github.com/mikey-t/dotnet-react-generator) script then it was installed automatically for you. The powershell command used is `Import-PfxCertificate`.

If you didn't generate a cert already, you'll ned to generate one first with something like this:

`npx swig generateCert local.your-site.com`

## Database Migrations

For more info on using db migrations, see [db-migrations-dotnet](https://github.com/mikey-t/db-migrations-dotnet#common-developer-db-related-tasks).

This project has some convenient wrapper commands to `dotnet ef` to help you manage DB migrations. Below are some example commands. Each Entity Framework command will require specifying a DbContext (because there's more than one: MainDbContext, TestDbContext). I've setup the wrapper commands so you can just pass `main`, `test` or `both` (defaults to `main` if you don't specify one).

### Examples DB Migration Wrapper Commands

List migrations:
```
npx swig dbListMigrations
```

Add new migration (creates files in `./server/src/DbMigrator/):
```
npx swig dbAddMigration YourMigrationName
```

Run migrations (update database) to latest:
```
npx swig dbMigrate
```

Run Migrations (update database) to specific Migration (Up or Down):
```
npx swig dbMigrate YourMigrationName
```

Remove most recent migration (works if it hasn't been applied yet):
```
npx swig dbRemoveMigration
```

All the commands above omitted which DbContext to use, which means it default to using `main`. You can also do any of the commands above to a specific DB (`main` or `test` or `both`):

```
npx swig dbListMigrations both
npx swig dbRemoveMigration test
npx swig dbAddMigration both YourMigrationName
npx swig dbMigrate main SomeMigrationName
... etc
```

### Example DB Development Loop

- Step 1: design table or other objects in PgAdmin
- Step 2: use PgAdmin to output sql for creation instead of actually applying the changes directly
- Step 3: run `npx swig dbAddMigration both MyNewTable`, which generates C# migration files and empty sql script files to add your sql to
- Step 4: add generated sql to auto-generated sql script at `./server/src/DbMigrator/Scripts/MyNewTable.sql`
- Step 5: add necessary sql for the `Down` migration in auto-generated script at `./server/src/DbMigrator/Scripts/MyNewTable_Down.sql`
- Step 6: migrate just the `test` database using `npx swig dbMigrate test`
- Step 7: write some data access code in `./server/src/WebServer/Data`
- Step 8: write some unit tests to exercise the new data access code in `./server/src/WebServer.Test/`
- Step 9: If changes are needed to the schema, repeat variations of the following until you're happy with the changes:
  -  Back out the migration with `npx swig dbMigrate test NameOfMigrationJustBeforeNewOne` (you can find the list of migration names by looking at the C# files or by running `npx swig dbListMigrations test`)
    - Adjust the sql in the Up script and re-run the migration with `npx swig dbMigrate test`
    - Adjust data access code and/or tests as needed
- Step 10: Once you're happy with the code, apply it to the main database with `npx swig dbMigrate main` (or `both` if you haven't already applied it to `test`)
- Step 11: Apply any other desired changes to the repository before committing your code, and then commit it
- Step 12: Other developers can then checkout the latest code and run `npx swig dbMigrate both` to also get the latest DB changes for their local DB instances

## Npm vs Yarn

Yarn sometimes had issues handling the SIGINT signal from ctrl-c and crashed the shell (among other issues), so I'm sticking with npm, which seems to work very well these days.

## React Client App

Instead of create-react-app, I'm going with [vite](https://github.com/vitejs/vite). Create react app is convenient but ULTRA slow (HMR is kind of slow and production builds are just ridiculous). Vite has extremely fast HMR and production builds are sometimes 4 times faster than CRA. Vite is now very popular and has very good community support and a vast user base and a very nice plugin architecture for configuration and extensibility. You can build the entire app with `npx createRelease` in under 15 seconds 🚀. That's server, DbMigrator, vite react client - packaged up into a tarball ready for production. It used to take a few minutes because of create-react-app, so it's unlikely I'll ever switch back to CRA.

## Deployment

From this project in a terminal, run `npm run createRelease`

Setting up the server and deploying files is out of scope for this project, but the essentials you need on the server are:
- Nginx setup and configured, including ssl and a virtual host pointing to where you copy and extract your app files
- Postgres DB setup and available (including initial role and schema creation)
- Service definition, including appropriate access to production environment variables (such as a service definition file that references a .env file in a secure location on the server)

I happen to have my own automated script that does the following (you could create one of your own or an actual CI/CD setup):
- Stop app service 
- Copy DbMigrator tarball to server, unpack and run with dbMigrate option (EF now has a built-in command `dotnet ef migrations bundle`, so I'll probably be moving to that in the near future)
- Copy <your-tarball-name> app files to the server, unpack to app directory
- Start app service 

## Swagger

Access swagger UI at http://localhost:5001/api or the json at http://localhost:5001/swagger/v1/swagger.json (replace 5001 with your port if you changed it).

## Other Docs

Social login documentation: [Social Logins documentation](./docs/SocialLogins.md)

## Local Postgres Upgrade Process

For teams using the same project you'd want extra steps like checking out latest, manually downgrading the docker-compose postgresl version back to what it was so that dockerUp will work, then follow the instructions below.

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

## Changelog

### 2023-09-18 Merged branch `new-directory-structure`

- Completely new directory structure to further separate client and server source code and to allow easily creating separate VSCode workspaces for the client and server development
- Ripped out gulp and replaced it with swig
- Using new slightly altered commands for DB related actions using sub-commands to specify which db(s) and to pass migration names (see docs above)
- Referenced a new beta version of NodeCliUtils (utilized in swigfile.ts)
- Changed how docker-compose get's the project name (using env var COMPOSE_PROJECT_NAME instead of passing CLI param every time)
- Removed root project dependencies that are no longer needed
- Added eslint to client project and attempted to fix as many of the warnings as I could

## TODO

- Update dotnet-react-generator so it works with new project structure
- Document new preference for using VSCode
- Document new project structure (and working in separate VSCode workspaces for client and server development)
- Add in vitest for client unit testing
- More client code cleanup
  - More permanent fixes for eslint warnings in the client project
  - Research upgrading of social login dependencies to latest versions (some breaking changes there)
  - Need a better client API accessor strategy (it was a good first attempt, but I think I can do a lot better)
- Email/registration stuff:
  - Documentation on how to set up registration with real email verification
  - Functionality to enable/disable email verification functionality
  - Alternate non-email functionality for registration for those that don't want to set that up for a small hobby project
- Docker config/plumbing to generate a deployable image
- More docs on how to do various things:
  - How to create a new controller
  - Dependency injection notes
  - How to use main and test DB locally to easily write data access related unit tests without destroying test data that you've generated while using your site locally.
- Rip out custom account schema in favor of built-in .NET Identity (maybe)
- Consolidate DB migrations into 2 (empty initial and one with everything else)
