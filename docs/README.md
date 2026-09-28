# shopee-mcp documentation

[English](./README.md) · [繁體中文](./README.zh-TW.md)

This fork extends the upstream Shopee MCP server with buyer-side cart support while keeping the original browser-backed product discovery flow.

## Available tools

- `search_products`
- `get_product_detail`
- `get_product_variants`
- `get_cart`
- `add_to_cart` — opt-in account mutation
- `check_login_status`

`add_to_cart` is deliberately limited to adding products to the shopping cart. Checkout, order placement, delivery-address changes, payment-method changes, and payment submission are out of scope.

## Documents

| Document                            | Description                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| [Root README](../README.md)         | Quick start, Taiwan setup, tool overview, and safety boundaries                     |
| [Configuration](./CONFIGURATION.md) | Environment variables, Taiwan defaults, MCP client configuration, cart-write switch |
| [Development](./DEVELOPMENT.md)     | Project layout, scripts, validation, browser architecture, and live testing         |
| [Releases](./RELEASES.md)           | Upstream versioning/release notes plus fork-specific publishing guidance            |
| [Security](../SECURITY.md)          | Credential handling, authenticated browser data, and cart-write scope               |
| [Changelog](../CHANGELOG.md)        | Version history and fork changes                                                    |

## Traditional Chinese

- [繁體中文 README](../README.zh-TW.md)
- [文件首頁](./README.zh-TW.md)
- [設定指南](./CONFIGURATION.zh-TW.md)
- [開發指南](./DEVELOPMENT.zh-TW.md)
- [安全性說明](../SECURITY.zh-TW.md)

The upstream npm package does not include this fork's cart tools. Until a separate fork release is published, install and run this repository from source.
