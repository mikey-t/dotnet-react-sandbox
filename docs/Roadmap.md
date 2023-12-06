# Dotnet React Sandbox Roadmap

## General TODO

- Certs - test cert generation on mac/linux, and attempt to automate it
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

## Ideas

- Deployment
  - Would be cool to have some basic starter infrastructure-as-code for a simple AWS setup
  - Could possibly weave in some of the stand-alone Ubuntu management scripts from my `devops-lite` project for budget/hobby solutions
