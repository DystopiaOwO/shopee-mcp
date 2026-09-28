# Security

[English](./SECURITY.md) · [繁體中文](./SECURITY.zh-TW.md)

## Supported versions

Security fixes are applied to the latest code on the actively maintained branch when practical.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for undisclosed security problems. Use GitHub private vulnerability reporting when available, or contact the maintainer privately.

Include a short description, impact, safe reproduction steps, and affected versions/dependencies when known.

## Credential and account-data handling

This is a **local MCP server** that drives a logged-in Shopee browser profile. Treat that profile as a credential:

- The authenticated browser session lives on the user's machine under `~/.shopee-mcp/chrome-profile` by default, configurable with `SHOPEE_PROFILE_DIR`.
- Never commit, upload, attach, or publish browser profiles, cookies, local/session storage dumps, storage-state files, HAR files, or raw authenticated Shopee responses.
- Never commit addresses, phone numbers, payment details, order data, real cart dumps, or screenshots containing personal account information.
- `.env`, browser/storage state, HAR files, logs, screenshots, traces, cart JSON dumps, and similar debug artifacts are gitignored, but developers must still review changes before pushing.
- Debug logging must not print cookies, authorization headers, session tokens, browser storage, addresses, payment information, or complete authenticated account responses.
- Tests and fixtures must use synthetic data rather than a real user's account/cart data.

## Cart-write scope

The upstream project is discovery-only. This fork adds optional buyer-cart features:

- `get_product_variants` reads purchasable models/options.
- `get_cart` reads the current cart.
- `add_to_cart` can modify the cart only when the local operator explicitly sets `SHOPEE_CART_WRITE_ENABLED=true`.
- Cart writes are performed through Shopee's own logged-in product-page UI and verified against the resulting cart API response.
- Products with multiple variants require an exact `modelId`; the tool refuses to guess.

This project intentionally does **not** implement:

- checkout;
- order placement;
- delivery-address changes;
- payment-method changes;
- payment submission.

Because `add_to_cart` changes account state, only connect this MCP server to AI clients you trust and keep the write flag disabled when it is not needed.

## Public-repository safety

The source repository can be public without exposing the operator's Shopee account as long as authenticated runtime data stays local. Before every push, verify that no debug capture, profile directory, `.env`, screenshots, cart exports, or account-response dumps have been staged.

## Upstream/dependency issues

Issues in Shopee's services, CloakBrowser, or dependencies such as `@modelcontextprotocol/sdk` and Playwright should be reported to those projects when appropriate.
