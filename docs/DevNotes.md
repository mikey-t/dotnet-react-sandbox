# Dotnet React Sandbox Dev Notes

## Pnpm

I'm evaluating use of pnpm, so replace any commands below using "npm" with "pnpm". If I don't run into any issues with pnpm, I'll update this doc.

## Swig

When working on swigfile changes within the new `swig-cli-modules` project, sometimes `npm link` doesn't work well. Another simple option is to link directly to the directory instead:

- `npm rm swig-cli-modules`
- `npm i -D ../swig-cli-modules`
- In swig-cli-modules: `npm run watch`

And to undo this just remove and re-add the dependency:

- `npm rm swig-cli-modules`
- `npm i -D swig-cli-modules`

Also make sure that the version number matches exactly before running `npm link swg-cli-modules`.

## Vite, WSL and ESBuild

If switching between Ubuntu/WSL and Powershell, keep in mind that the client app's use of Vite and it's underlying ESBuild tooling will cause issues unless you re-run `npm install` each time you switch.

## Updating JS Dependencies

Check what dependencies have new versions available:

```
npm outdated
```

Update to latest semver:

```
npm update --save
```

Don't forget to update root dependencies in addition to client project dependencies.

Updating past semver should probably be done one at a time to test for breaking changes for each dependency separately.

Note that dependencies with a major version of 0 will never be updated by `npm update --save`, so you'll have to manually run `npm i -D name-of-package@latest` to get the latest version.

## Running and Debugging with VSCode

There is an entry in `./vscode/launch.json` (and in the server workspace at `./server/.vscode/launch.json`) that should start up the API in debug mode - simply hit F5 (or use the command palette). It will first run the `build-solution` task from `tasks.json`. The build task just assumes you have exactly one solution file at `./server/` and that it has the correct project references.

Attaching to an already running instance of the API:

- In VSCode, open command palette and type "attach". The relevant option is probably something like "Debug: Attach to a .NET 5+ or .NET Core process"
- When it prompts you to select a process, find it by the executable name "WebServer.exe"

Debugging the client app:

- Start the API normally in the shell with `swig server`
- Instead of starting the client with `swig client` (or `npm run dev` from client dir), use the launch configuration by hitting F5.
  - If in the root solution, you may have to click into the "Run and Debug" left-pane and select the chrome launch task instead of the API launch task

## Client Organization Strategy

For now I'm going with a hybrid approach between these:

- One folder for pages and one for components
- Feature folders with sub-folders for pages and components

By "pages" I just mean components that are associated with routes that go into the `<Outlet />` in a layout.

Reasoning:

- Things in feature folders shouldn't reference any components or CSS outside of them - this will allow me to move things into a component library
- I think that attempting to create feature folders for every little thing will cause more harm than good for small to medium sized projects, so I'm going to lump everything else together for now
- If individual features start to become complex or are candidates for migration into another library, I'll create feature folders at that point

## External Login Notes

### Microsoft login

Package name: @azure/msal-browser

Npm: https://www.npmjs.com/package/@azure/msal-browser

Github: https://github.com/AzureAD/microsoft-authentication-library-for-js

"The Microsoft Authentication Library for JavaScript enables both client-side and server-side JavaScript applications to authenticate users using Azure AD for work and school accounts (AAD), Microsoft personal accounts (MSA), and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through Azure AD B2C service. It also enables your app to get tokens to access Microsoft Cloud services such as Microsoft Graph."

Also see https://learn.microsoft.com/en-us/entra/identity-platform/scenario-spa-overview

The specific thing I'm using:

```typescript
import { PublicClientApplication } from '@azure/msal-browser'

const msalConfig: Configuration = {
  auth: {
    clientId: SiteSettings.MICROSOFT_CLIENT_ID
  }
}
const msalInstance = new PublicClientApplication(msalConfig)

// This is in a useEffect. Placeholder button is shown until it finishes.
await msalInstance.initialize()
```

## Primary Key from Number to Guid

I switched `account.id` from a number to a guid. It's a performance hit (probably not super relevant, but worth mentioning), but provides better security by removing a potential attacker's ability to guess other IDs. Rather than changing this with a new DB migration, I opted for the simpler solution of updating the existing migration since this is just a template project and not a live production site. For a real site, I would need to either create "v2" versions of tables, migrate the data to the new schema, then use another migration to rename to originals. Or another option for the DB migration would be to add a `new_id` guid field, then systematically add extra columns, indexes and constraints referencing the new guid, then remove the old columns, indexes and constraints.
