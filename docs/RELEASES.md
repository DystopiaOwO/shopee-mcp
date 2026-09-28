# Releases and versioning

This repository is a fork of `bintangtimurlangit/shopee-mcp`.

The upstream project publishes the npm package `@bintangtimurlangit/shopee-mcp`. **That npm package does not include this fork's cart tools.** Until this fork intentionally publishes its own package/release, install and run it from source as documented in the root README.

## Versioning

The project follows Semantic Versioning principles:

`MAJOR.MINOR.PATCH`

- **MAJOR** — breaking tool/configuration behavior;
- **MINOR** — backward-compatible tools or optional configuration;
- **PATCH** — bug fixes and safe corrections.

Commit messages should follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), for example:

```text
feat(cart): add buyer cart tools
fix(cart): support Taiwan cart DOM
docs: add Traditional Chinese documentation
```

## Fork release policy

For this fork:

1. Keep `CHANGELOG.md` updated under `[Unreleased]` while features are being stabilized.
2. Run the full CI checks before merging/releasing:

   ```bash
   npm run lint
   npm run format:check
   npm run typecheck
   npm run build
   npm run test:unit
   ```

3. For browser/cart changes, also run a live regional smoke test.
4. Do not reuse the upstream npm package name unless ownership/publishing rights explicitly allow it.
5. If this fork is published later, use a distinct package identity and update `package.json`, README install instructions, release workflow, and changelog links together.

## Upstream releases

The upstream project uses SemVer, git tags such as `v0.2.0`, and automated npm publishing. Refer to the upstream repository for its authoritative npm release process.

## Tags

If this fork starts producing releases, use standard tags:

- stable: `vX.Y.Z`
- prerelease: `vX.Y.Z-beta.N`

Do not tag a fork release until documentation, package identity, release automation, and live cart behavior have all been reviewed.
