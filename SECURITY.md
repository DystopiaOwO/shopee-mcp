# Security

## Supported versions

Security fixes are applied to the latest code on the default branch when practical.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for undisclosed security problems. Use GitHub private vulnerability reporting when available, or contact the maintainer privately.

Include a short description, impact, safe reproduction steps, and affected versions/dependencies when known.

## Credential and account-data handling

This is a **local MCP server** that drives a logged-in Shopee browser profile. Treat that profile as a credential:

- The authenticated browser session lives only on the user's machine under `~/.shopee-mcp/chrome-profile` by default (configurable with `SHOPEE_PROFILE_DIR`).
- Never commit, upload, attach, or publish the browser profile, cookies, storage state, HAR files, screenshots containing account data, or raw authenticated Shopee responses.
- `.env`, browser/storage state, HAR files, logs, screenshots, traces, cart JSON dumps, and similar debug artifacts are gitignored.
- Debug logging must not print cookies, authorization headers, session tokens, browser storage, addresses, payment information, or complete authenticated account responses.
- Tests and fixtures must use synthetic data rather than a real user's cart/account data.

## Cart-write scope

The upstream project is discovery-only. This fork adds optional buyer-cart features:

- `get_cart` reads the current cart.
- `add_to_cart` can add an item only when the local operator explicitly sets `SHOPEE_CART_WRITE_ENABLED=true`.
- Cart writes are performed through Shopee's own logged-in product-page UI and verified against the resulting cart API response.
- This project intentionally does **not** implement checkout, order placement, address changes, payment-method changes, or payment submission.

Because `add_to_cart` changes account state, only connect this MCP server to AI clients you trust and keep the write flag disabled when it is not needed.

## Upstream/dependency issues

Issues in Shopee's services, CloakBrowser, or dependencies such as `@modelcontextprotocol/sdk` and Playwright should be reported to those projects when appropriate.
