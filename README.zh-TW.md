# shopee-mcp — 購物車功能 fork

[English](./README.md) · [繁體中文](./README.zh-TW.md)

這個 repository 是 [`bintangtimurlangit/shopee-mcp`](https://github.com/bintangtimurlangit/shopee-mcp) 的 fork。保留原本透過登入後瀏覽器讀取蝦皮商品資料的功能，並新增：

- 商品規格 / variant 查詢
- 讀取目前購物車
- AI 可選擇性加入購物車

本專案為**非官方工具**，與 Shopee／Sea Limited 無隸屬、授權或合作關係。

> 目前這個 fork 建議直接從原始碼執行。上游 npm 套件 **不包含** 本 fork 新增的購物車功能。

## 可用工具

| Tool | 功能 | 是否修改帳號狀態 |
| --- | --- | --- |
| `search_products` | 搜尋蝦皮商品 | 否 |
| `get_product_detail` | 讀取商品詳細資料 | 否 |
| `get_product_variants` | 讀取精確規格、modelId、庫存與價格 | 否 |
| `get_cart` | 讀取目前登入帳號的購物車 | 否 |
| `add_to_cart` | 加入指定商品 / 規格到購物車 | **是，需明確開啟** |
| `check_login_status` | 確認目前瀏覽器 session 是否已登入蝦皮 | 否 |

`add_to_cart` 僅允許修改購物車。本專案刻意**不實作**：

- 結帳
- 建立訂單
- 修改收件地址
- 修改付款方式
- 執行付款

## 驗證狀態

CI 會在 Node.js 20、22、24 上執行：

- ESLint
- Prettier
- TypeScript typecheck
- build
- offline unit tests

蝦皮網頁與防機器人機制可能隨時改版，因此涉及購物車與商品規格的瀏覽器自動化，仍建議在蝦皮重大 UI 更新後重新做一次本機 smoke test。

## 為什麼一定要開瀏覽器

蝦皮買家端 API 會使用由蝦皮前端產生的反詐騙 / 防機器人簽章。這個 MCP 不自行偽造簽章，而是：

1. 啟動使用者登入過的 CloakBrowser / Chromium persistent profile。
2. 開啟真正的蝦皮網頁。
3. 讓蝦皮自己的前端產生合法請求。
4. 攔截並讀取前端取得的 response。

`add_to_cart` 也是操作真正商品頁上的「加入購物車」按鈕，並等待 `/api/v4/cart/add_to_cart` response，而不是自行組裝私有 API 請求。

瀏覽器通常需要以 **headed** 模式執行，因為蝦皮可能偵測 headless 自動化。

## 快速安裝

```bash
git clone https://github.com/DystopiaOwO/shopee-mcp.git
cd shopee-mcp
git checkout feat/cart-tools
npm ci
npm run build
```

## 台灣蝦皮設定

將 `.env.example` 複製成 `.env`：

```env
SHOPEE_DOMAIN=shopee.tw
SHOPEE_HEADLESS=false
SHOPEE_CART_WRITE_ENABLED=false
DEBUG=false
```

當 `SHOPEE_DOMAIN=shopee.tw` 時，預設會使用：

- locale：`zh-TW`
- timezone：`Asia/Taipei`

如有需要，也可以使用 `SHOPEE_LOCALE` 與 `SHOPEE_TIMEZONE` 覆寫。

## 第一次登入

執行：

```bash
npm run login
```

瀏覽器會開啟，請自行登入要給 MCP 使用的蝦皮帳號，並依終端機提示完成。

預設登入狀態會儲存在：

```text
~/.shopee-mcp/chrome-profile
```

**這個資料夾等同帳號憑證，絕對不要上傳或 commit 到 GitHub。**

## MCP Client 設定

先執行：

```bash
npm run build
```

接著讓 MCP client 指向本 fork 產生的 `build/index.js`。

Windows 範例：

```json
{
  "mcpServers": {
    "shopee": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\shopee-mcp\\build\\index.js"]
    }
  }
}
```

macOS / Linux 桌面環境同樣使用 `node` + `build/index.js` 的絕對路徑。

Linux 無桌面環境時，可用 `xvfb-run -a` 提供虛擬顯示器。

## 開啟 AI 加入購物車

預設情況：

```env
SHOPEE_CART_WRITE_ENABLED=false
```

因此 AI 就算呼叫 `add_to_cart` 也不會修改購物車。

建議先確認以下功能正常：

1. `check_login_status`
2. `search_products`
3. `get_product_detail`
4. `get_product_variants`
5. `get_cart`

確認後，如果確實需要 AI 幫忙加入購物車，再改成：

```env
SHOPEE_CART_WRITE_ENABLED=true
```

修改後需要重新啟動 MCP Server。

## 建議的 AI 購物流程

商品如果有規格：

1. 使用 `search_products`，或直接提供商品 URL。
2. 執行 `get_product_variants`。
3. 找到符合需求的**精確 `modelId`**。
4. 執行 `add_to_cart` 並指定該 `modelId` 與數量。
5. 再執行 `get_cart` 驗證購物車結果。

如果商品有多個 model，但沒有提供精確 `modelId`，`add_to_cart` 會拒絕猜測，以避免 AI 選錯規格。

## 安全與隱私

以下資料必須永遠只留在本機：

- Cookie
- browser profile
- localStorage / sessionStorage
- storage-state
- HAR
- 登入後完整 API response
- 真實購物車 dump
- 地址
- 電話
- 訂單資料
- 付款資料
- 含個資的截圖

即使 `.gitignore` 已排除常見檔案，也應在 push 前檢查 staged changes。

不需要 AI 修改購物車時，建議保持：

```env
SHOPEE_CART_WRITE_ENABLED=false
```

並只將這個 MCP 連接到你信任的 AI client。

詳細內容請看 [SECURITY.zh-TW.md](./SECURITY.zh-TW.md)。

## 文件

### 繁體中文

- [文件首頁](./docs/README.zh-TW.md)
- [設定指南](./docs/CONFIGURATION.zh-TW.md)
- [開發指南](./docs/DEVELOPMENT.zh-TW.md)
- [安全性說明](./SECURITY.zh-TW.md)

### English

- [Documentation index](./docs/README.md)
- [Configuration](./docs/CONFIGURATION.md)
- [Development](./docs/DEVELOPMENT.md)
- [Releases](./docs/RELEASES.md)

## 開發檢查

修改程式後至少執行：

```bash
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run test:unit
```

登入後的 live smoke test：

```bash
npm test
```

## 上游專案與授權

原始專案：[`bintangtimurlangit/shopee-mcp`](https://github.com/bintangtimurlangit/shopee-mcp)

本 fork 保留原專案的 MIT License 與 copyright notice，詳見 [`LICENSE`](./LICENSE)。

## 注意事項

蝦皮的頁面 DOM、selector、反機器人機制與私有買家端 API 都可能隨時變更。若蝦皮改版，購物車自動化功能可能需要同步調整。

請只操作你有權控制的帳號與購物行為，避免大量自動化請求，並遵守適用的服務條款與法律。
