# shopee-mcp 繁體中文文件

[English](./README.md) · [繁體中文](./README.zh-TW.md)

這個 fork 在上游 Shopee MCP 的商品搜尋 / 商品詳細資料功能上，新增買家端購物車與商品規格工具。

## 可用工具

- `search_products`
- `get_product_detail`
- `get_product_variants`
- `get_cart`
- `add_to_cart` — 需明確開啟寫入權限
- `check_login_status`

`add_to_cart` 僅能加入購物車；本專案不提供結帳、建立訂單、修改地址、修改付款方式或付款功能。

## 文件

| 文件 | 說明 |
| --- | --- |
| [繁中 README](../README.zh-TW.md) | 快速安裝、台灣站設定、工具總覽與安全邊界 |
| [設定指南](./CONFIGURATION.zh-TW.md) | `.env`、台灣預設值、MCP client 設定與購物車寫入開關 |
| [開發指南](./DEVELOPMENT.zh-TW.md) | 專案結構、測試、CI、瀏覽器架構與 live smoke test |
| [安全性說明](../SECURITY.zh-TW.md) | 登入 session、個資、購物車寫入與公開 repo 安全原則 |
| [Changelog](../CHANGELOG.md) | 版本與 fork 功能變更紀錄 |

目前上游 npm 套件不包含本 fork 的購物車功能，因此在這個 fork 自行發布套件前，請直接從 GitHub clone 原始碼執行。
