# 設定指南

[English](./CONFIGURATION.md) · **繁體中文**

快速使用請先看 [繁中 README](../README.zh-TW.md)。

> **需要登入。** Shopee 會阻擋多數匿名請求，因此這個 MCP 主要使用已登入的 persistent browser profile。第一次使用前請執行 `shopee-mcp-login`，或從 source 執行 `npm run login`。

## 環境變數

可寫在 source checkout 的 `.env`，也可由 MCP client 的 `env` 傳入。

| 變數                   | 預設值                         | 說明                                        |
| ---------------------- | ------------------------------ | ------------------------------------------- |
| `SHOPEE_DOMAIN`        | `shopee.co.id`                 | Shopee 區域網域；台灣使用 `shopee.tw`       |
| `SHOPEE_LOCALE`        | 依網域自動判斷                 | Browser locale override                     |
| `SHOPEE_TIMEZONE`      | 依網域自動判斷                 | Browser timezone override                   |
| `SHOPEE_PROFILE_DIR`   | `~/.shopee-mcp/chrome-profile` | 保存登入 session 的 persistent profile      |
| `SHOPEE_HEADLESS`      | `false`                        | 建議維持 `false`；Shopee 可能偵測 headless  |
| `SHOPEE_ACCOUNT_TOOLS` | `auto`                         | `auto`：登入後提供帳號工具；`off`：永遠唯讀 |
| `CACHE_TTL_MS`         | `30000`                        | 記憶體快取 TTL（毫秒）                      |
| `DEBUG`                | `false`                        | 啟動／除錯 log                              |

## 區域、語系、時區與貨幣

Shopee 會依地區調整前端，因此 browser locale / timezone 應與網域一致。專案會依 `SHOPEE_DOMAIN` 自動選擇：

| 網域後綴 | Locale  | Timezone            | Currency |
| -------- | ------- | ------------------- | -------- |
| `.id`    | `id-ID` | `Asia/Jakarta`      | `IDR`    |
| `.my`    | `en-MY` | `Asia/Kuala_Lumpur` | `MYR`    |
| `.sg`    | `en-SG` | `Asia/Singapore`    | `SGD`    |
| `.tw`    | `zh-TW` | `Asia/Taipei`       | `TWD`    |
| 其他     | `id-ID` | `Asia/Jakarta`      | `IDR`    |

台灣站建議：

```env
SHOPEE_DOMAIN=shopee.tw
SHOPEE_ACCOUNT_TOOLS=auto
SHOPEE_HEADLESS=false
```

若只需要搜尋與查詢，不希望 AI 有任何帳號寫入能力：

```env
SHOPEE_ACCOUNT_TOOLS=off
```

修改環境變數後請重新啟動 MCP Server。

## Browser profile

預設位置：

```text
~/.shopee-mcp/chrome-profile
```

這個資料夾可能包含有效 Cookie / session，請視為帳號憑證：

- 不要 commit
- 不要上傳 GitHub
- 不要貼到公開 Issue
- 不要直接分享給 AI 或第三方

如需自訂位置：

```env
SHOPEE_PROFILE_DIR=/path/to/private/shopee-profile
```

## 工具執行時間與 timeout

每次呼叫通常都會操作真正瀏覽器，因此明顯比一般 MCP tool 慢。

上游在 2026 年 9 月量測的典型時間：

| Tool                                    | 典型時間   | 備註                             |
| --------------------------------------- | ---------- | -------------------------------- |
| `check_login_status`                    | 約 1–2 秒  | Cookie check，不導航頁面         |
| `search_products`                       | 約 5–30 秒 | 部分區域搜尋 request 會延遲      |
| `get_product_detail`                    | 約 4 秒    | 一次頁面載入                     |
| `get_product_variants`                  | 約 4 秒    | 一次頁面載入                     |
| `get_product_variants` + `includeStock` | 約 50 秒   | 每個 variant 可能額外 round trip |
| `get_product_reviews`                   | 約 6–12 秒 | 需要捲動與切換篩選               |
| `get_shop_info` / `get_shop_products`   | 約 2–5 秒  | 一次頁面載入                     |
| `get_flash_sale`                        | 約 3–30 秒 | 依載入商品數而定                 |
| 帳號讀取工具                            | 約 2–10 秒 | 依頁面與捲動需求而定             |
| 帳號動作工具                            | 約 4–14 秒 | 導航後逐步確認 UI 操作結果       |

`get_product_variants(includeStock=true)` 會逐規格查精確庫存，可能接近 MCP client 常見的 60 秒 timeout。若需要完整掃描大量 variant，建議將 client timeout 提高到約 70 秒以上。

## Windows MCP 設定

從 source 執行時先 build：

```powershell
npm run build
```

Windows 桌面環境：

```json
{
  "mcpServers": {
    "shopee": {
      "command": "node",
      "args": ["C:\\Users\\you\\source\\shopee-mcp\\build\\index.js"],
      "env": {
        "SHOPEE_DOMAIN": "shopee.tw",
        "SHOPEE_ACCOUNT_TOOLS": "auto"
      }
    }
  }
}
```

Windows 桌面通常不需要 `xvfb`。

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

使用 `xvfb-run`：

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

## npm 全域安裝

```bash
npm install -g @bintangtimurlangit/shopee-mcp
shopee-mcp-login
```

MCP client 可直接啟動：

```text
shopee-mcp
```

或使用：

```bash
npx -y @bintangtimurlangit/shopee-mcp
```

## 帳號模式安全設定

預設：

```env
SHOPEE_ACCOUNT_TOOLS=auto
```

登入時會提供帳號讀取與動作工具，包括購物車、按讚、追蹤與領取優惠券。

若希望完整唯讀：

```env
SHOPEE_ACCOUNT_TOOLS=off
```

即使登入，帳號工具也會隱藏。

專案**不提供**：

- checkout / 結帳
- 建立訂單
- 修改收件地址
- 修改付款方式
- 付款
- 修改密碼
- 聊天

## 台灣站檢查重點

使用：

```env
SHOPEE_DOMAIN=shopee.tw
```

時建議確認：

- URL 為 `shopee.tw`
- locale 為 `zh-TW`
- timezone 為 `Asia/Taipei`
- 價格以 TWD / NT$ 正常顯示
- `check_login_status` 能辨識 session
- `search_products`、`get_product_detail`、`get_product_variants` 正常
- 若開啟帳號工具，`get_cart` 與寫入工具能正確辨識繁中 UI
