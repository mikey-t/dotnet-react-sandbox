# Dotnet React Sandbox Roadmap

## Bugs

- When developing locally, sometimes a server change (or just stopping and restarting) causes the react dev server to end up in a bad state requiring restart. If it's because the server is stopped, simply starting it back up will fix the client (it detects the `.env` changed and reloads), but it would be nice if the client was more resilient or at the very least popped up an error saying that the server is unreachable. Example of vite dev server state:
  ```
  10:36:16 AM [vite] http proxy error at /api/account/me:
  AggregateError
      at internalConnectMultiple (node:net:1114:18)
      at afterConnectMultiple (node:net:1667:5)
  ```
- The client app constantly hitting the /api/account/me endpoint is intended, but it shouldn't need to try accessing that if the user is definitely not logged in. This is also related to the issue above. If /api/account/me throws an error (or the server just isn't running), the client does not have any graceful error handling.

## General TODO

- Implement ASP.NET Identity (or create a complete custom version)
- Login/registration brute force protection
- Certs - test cert generation on mac/linux, and attempt to automate it
- Add in vitest for client unit testing
- More client code cleanup
  - More permanent fixes for eslint warnings in the client project
  - Research upgrading of social login dependencies to latest versions (some breaking changes there)
  - Need a better client API accessor strategy (it was an okay first attempt, but I think I can do a lot better)
- Email/registration stuff:
  - Documentation on how to set up registration with real email verification
  - Functionality to enable/disable email verification functionality
  - Alternate non-email functionality for registration for those that don't want to set that up for a small hobby project
- Docker config/plumbing to generate a deployable image

## Ideas

- Deployment
  - Would be cool to have some basic starter infrastructure-as-code for a simple AWS setup
  - Could possibly weave in some of the stand-alone Ubuntu management scripts from my `devops-lite` project for budget/hobby solutions
- Additional encapsulation of functionality into npm and nuget packages so derived projects can be updated more easily
