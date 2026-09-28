# 設定指南

[English](./CONFIGURATION.md) · [繁體中文](./CONFIGURATION.zh-TW.md)

快速安裝請先看 [README.zh-TW.md](../README.zh-TW.md#快速安裝)。

> **需要登入。** 蝦皮會阻擋匿名請求，因此這個 MCP 使用已登入的瀏覽器 session。第一次使用前請執行 `npm run login`。本專案沒有使用 Shopee API Key，登入狀態保存在本機 persistent browser profile。

## 環境變數

從 source checkout 開發時可寫在 `.env`；也可以由 MCP client 的環境設定傳入。

| 變數                        | 預設值                         | 說明                                                |
| --------------------------- | ------------------------------ | --------------------------------------------------- |
| `SHOPEE_DOMAIN`             | `shopee.co.id`                 | 蝦皮區域網域；台灣請設為 `shopee.tw`                |
| `SHOPEE_LOCALE`             | 依區域自動判斷                 | 瀏覽器 locale；台灣預設 `zh-TW`                     |
| `SHOPEE_TIMEZONE`           | 依區域自動判斷                 | 瀏覽器 timezone；台灣預設 `Asia/Taipei`             |
| `SHOPEE_PROFILE_DIR`        | `~/.shopee-mcp/chrome-profile` | 登入後 persistent browser profile，應視為帳號憑證   |
| `SHOPEE_HEADLESS`           | `false`                        | 建議維持 `false`，蝦皮可能偵測 headless 自動化      |
| `SHOPEE_CART_WRITE_ENABLED` | `false`                        | 只有明確設成 `true` 才允許 `add_to_cart` 修改購物車 |
| `CACHE_TTL_MS`              | `30000`                        | 記憶體快取時間，單位毫秒                            |
| `DEBUG`                     | `false`                        | 除錯輸出；不得包含帳號憑證或私人帳號資料            |

## 台灣站建議設定

`.env`：

```env
SHOPEE_DOMAIN=shopee.tw
SHOPEE_HEADLESS=false
SHOPEE_CART_WRITE_ENABLED=false
DEBUG=false
```

建議一開始保持購物車寫入關閉，先測試：

1. `check_login_status`
2. `search_products`
3. `get_product_detail`
4. `get_product_variants`
5. `get_cart`

全部正常且確實需要 AI 加入購物車後，才改成：

```env
SHOPEE_CART_WRITE_ENABLED=true
```

修改環境變數後請重新啟動 MCP Server。

## Browser profile

預設登入狀態位於：

```text
~/.shopee-mcp/chrome-profile
```

裡面可能包含有效登入 Cookie / session，因此：

- 不要 commit
- 不要上傳 GitHub
- 不要貼到 Issue
- 不要交給不信任的第三方
- 不要直接把內容貼給 AI

如有需要可自訂位置：

```env
SHOPEE_PROFILE_DIR=/path/to/private/shopee-profile
```

## Windows MCP 設定

先 build：

```powershell
npm run build
```

再讓 MCP client 指向實際的 `build/index.js` 絕對路徑：

```json
{
  "mcpServers": {
    "shopee": {
      "command": "node",
      "args": ["C:\\Users\\you\\source\\shopee-mcp\\build\\index.js"]
    }
  }
}
```

Windows 桌面不需要 `xvfb`。

## macOS / Linux 桌面

```json
{
  "mcpServers": {
    "shopee": {
      "command": "node",
      "args": ["/absolute/path/to/shopee-mcp/build/index.js"]
    }
  }
}
```

## Linux 無桌面環境

可以用 `xvfb-run` 提供虛擬顯示器：

```json
{
  "mcpServers": {
    "shopee": {
      "command": "xvfb-run",
      "args": ["-a", "node", "/absolute/path/to/shopee-mcp/build/index.js"]
    }
  }
}
```

## MCP Client

Codex、Claude Code、Claude Desktop、Cursor、Zed、Windsurf 與其他支援 stdio MCP 的 client，核心設定都一樣：

```text
node + 本 fork 的 build/index.js 絕對路徑
```

每次重新 build 或修改 `.env` 後，如 client 沒有自動重載 MCP，請重新啟動 / reload。

## 購物車寫入安全邊界

`get_cart` 是唯讀工具。

`add_to_cart` 會改變登入帳號的購物車，因此必須：

```env
SHOPEE_CART_WRITE_ENABLED=true
```

才會啟用。

本專案不提供：

- checkout
- 建立訂單
- 修改地址
- 修改付款方式
- 付款
