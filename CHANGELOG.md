# Changelog

All notable changes to this fork are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0/). See [docs/RELEASES.md](./docs/RELEASES.md) for fork release guidance.

## [Unreleased]

### Added

- `get_product_variants` for exact Shopee model/variant IDs, option labels, stock, and prices.
- `get_cart` for reading the logged-in buyer cart.
- `add_to_cart` for opt-in buyer cart mutation through Shopee's own logged-in product-page UI.
- `SHOPEE_CART_WRITE_ENABLED` safety gate; cart writes are disabled by default.
- Taiwan-aware browser defaults when `SHOPEE_DOMAIN=shopee.tw`: `zh-TW` locale and `Asia/Taipei` timezone.
- Support for both current `models[].extinfo.tier_index` and legacy `models[].tier_index` variant structures.
- Traditional Chinese documentation for quick start, configuration, development, and security guidance.

### Changed

- Documentation now describes this repository as a buyer-cart fork rather than discovery-only.
- Installation guidance now makes clear that the upstream npm package does not include this fork's cart tools and that this fork should currently be run from source.
- CI validates the fork on Node.js 20, 22, and 24 with lint, Prettier, typecheck, build, and offline unit tests.
- Security guidance now explicitly covers authenticated cart data, browser profiles, debug artifacts, and public-repository safety.

### Security

- Browser profiles, `.env` files, storage-state files, HAR captures, logs, screenshots, traces, and cart/account dumps are excluded from Git.
- Checkout, order placement, delivery-address changes, payment-method changes, and payment submission remain intentionally out of scope.
- Products with multiple models require an exact `modelId`; `add_to_cart` refuses to guess.

## [0.2.0] - 2026-08-12

### Added

- **New tool `check_login_status`** — reports whether the saved browser session is currently logged into Shopee, so a client can check auth state upfront instead of waiting on a slow failure inside `search_products` / `get_product_detail`.
- `test/unit.ts` — a fast, offline unit test suite (no login/display needed) covering the `real_items` search-result flattening, price formatting, product URL parsing, the TTL cache, and the new capture-retry logic. Wired into CI via `npm run test:unit`, which now runs on every push/PR alongside lint/typecheck/build.

### Fixed

- `search_products` no longer crashes on Shopee's recommendation/ads search cards, which nest their real products under `real_items` instead of the usual top-level `item_basic` (thanks [@teguholica](https://github.com/teguholica), #25).
- A timeout waiting for Shopee's API response is now retried once before being reported as "not logged in" — a slow page load or transient network blip was previously indistinguishable from the anti-bot gate silently dropping the request.

### Changed

- Bumped `@modelcontextprotocol/sdk` (1.29.0 → 1.30.0), `cloakbrowser` (0.4.12 → 0.5.5), and `playwright` (1.61.1 → 1.62.1), plus development tooling (`eslint`, `prettier`, `tsx`, `lint-staged`, `typescript-eslint`).
- The MCP server now reports its actual `package.json` version at connect time instead of a hardcoded, previously-stale string.

## [0.1.1] - 2026-07-21

### Added

- Standardized project scaffolding: `LICENSE` (MIT), `.editorconfig`, ESLint + Prettier, Conventional Commits (commitlint), Husky pre-commit hooks, CI + release workflows, issue/PR templates, and a `docs/` guide set.

### Changed

- Updated runtime and development dependencies, and standardized the npm trusted-publishing release workflow.

## [0.1.0] - 2026-07-12

### Added

- Initial release: MCP server for **exploring Shopee** over stdio, driving a logged-in CloakBrowser session to clear Shopee's anti-bot gate.
- **2 tools:** `search_products` (keyword search with sorting & pagination) and `get_product_detail` (price, discount, brand, condition, rating, review/sold counts, stock, location, description).
- In-memory read cache and a persistent browser profile under `~/.shopee-mcp/`.

[Unreleased]: https://github.com/DystopiaOwO/shopee-mcp/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/bintangtimurlangit/shopee-mcp/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/bintangtimurlangit/shopee-mcp/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/bintangtimurlangit/shopee-mcp/releases/tag/v0.1.0
