# 開發指南

[English](./DEVELOPMENT.md) · [繁體中文](./DEVELOPMENT.zh-TW.md)

## 常用指令

| 指令 | 說明 |
| --- | --- |
| `npm ci` | 依 lockfile 安裝固定版本依賴 |
| `npm run login` | 開啟瀏覽器並使用 persistent profile 登入蝦皮 |
| `npm run build` | 將 TypeScript 編譯到 `build/` |
| `npm run dev` | `tsx watch src/index.ts` 開發模式 |
| `npm run start` | 啟動已編譯的 MCP Server |
| `npm run lint` | ESLint |
| `npm run format` | 用 Prettier 格式化 |
| `npm run format:check` | 只檢查 Prettier 格式、不修改檔案 |
| `npm run typecheck` | TypeScript strict typecheck，不輸出檔案 |
| `npm run test:unit` | 離線單元測試，不需要登入或顯示器 |
| `npm test` | Live smoke test，需要登入與圖形顯示環境 |

CI 會在 Node.js 20、22、24 上執行 lint、Prettier、typecheck、build 與 offline unit tests。

## 專案結構

```text
src/
  index.ts          # MCP Server 入口與 tools 註冊
  login.ts          # persistent profile 互動式登入
  api/
    client.ts       # 頁面導覽與 Shopee response capture
    types.ts        # 共用 response types
  browser/
    session.ts      # CloakBrowser persistent session 與 page lock
  tools/
    search.ts       # search_products
    product.ts      # get_product_detail 與商品 URL parsing
    status.ts       # check_login_status
    cart.ts         # get_product_variants / get_cart / add_to_cart
  utils/
    cache.ts        # 記憶體 TTL cache
    errors.ts       # MCP 友善錯誤處理
test/
  unit.ts           # offline unit tests
  smoke.ts          # live browser smoke test
```

## 為什麼使用瀏覽器而不是直接打 API

蝦皮買家端 endpoint 會驗證由蝦皮前端產生的 anti-fraud signature。

因此本專案不自行偽造 private API request，而是：

1. 使用已登入的 persistent CloakBrowser / Chromium profile。
2. 開啟真正的蝦皮頁面。
3. 讓蝦皮自己的 JavaScript 產生 signed request。
4. 讀取對應 response。

`add_to_cart` 同樣透過真正商品頁 UI 點擊「加入購物車」，並觀察 `/api/v4/cart/add_to_cart` response。

## Cart tools 設計

### `get_product_variants`

用來取得：

- 精確 `modelId`
- 規格名稱
- 庫存
- 價格

目前同時支援：

```text
models[].extinfo.tier_index
```

以及舊格式：

```text
models[].tier_index
```

### `get_cart`

讀取目前登入帳號的購物車，包含可辨識的：

- 商品名稱
- 商品 URL
- 數量
- 購物車 row 可用文字資訊

蝦皮 DOM 可能改版，因此 selector 優先使用：

- 穩定 URL 結構
- accessible role / name
- aria / data attribute
- DOM 結構關係

盡量不要依賴容易變動或混淆的 CSS class。

### `add_to_cart`

預設停用，只有：

```env
SHOPEE_CART_WRITE_ENABLED=true
```

才允許修改購物車。

如果商品存在多個 model，而 caller 沒提供精確 `modelId`，工具必須拒絕猜測。

不實作 checkout / order / payment。

## 修改後驗證流程

程式碼有異動後至少跑：

```bash
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run test:unit
```

涉及瀏覽器 / 商品規格 / 購物車時，再進行 live smoke test。

建議順序：

1. `SHOPEE_CART_WRITE_ENABLED=false`
2. `check_login_status`
3. `search_products`
4. `get_product_detail`
5. 在多規格商品測 `get_product_variants`
6. 在非空購物車測 `get_cart`
7. 真的需要測寫入時才開 `SHOPEE_CART_WRITE_ENABLED=true`
8. 使用便宜、規格明確的商品，quantity 固定 `1`
9. 明確指定 `modelId`
10. 執行 `add_to_cart`
11. 再執行 `get_cart` 驗證結果

測試過程不要碰結帳、訂單、地址或付款。

## 台灣站檢查重點

當：

```env
SHOPEE_DOMAIN=shopee.tw
```

時請確認：

- locale 為 `zh-TW`
- timezone 為 `Asia/Taipei`
- 商品 URL 為 `shopee.tw`
- TWD / NT$ 顯示正常，不被當成 IDR
- 能辨識繁體中文「加入購物車」
- 台灣站目前購物車 DOM 仍可正常抽取

## 安全開發規則

絕對不要 commit / 上傳：

- Cookie
- browser profile
- localStorage / sessionStorage dump
- storage-state
- HAR
- 真實登入 API response
- 真實購物車 dump
- 地址 / 電話
- 訂單 / 付款資料
- 含個資截圖

單元測試與 fixture 應使用 synthetic data。

詳見 [SECURITY.zh-TW.md](../SECURITY.zh-TW.md)。

## 技術堆疊

- TypeScript strict mode
- Zod
- `@modelcontextprotocol/sdk` / stdio
- CloakBrowser
- Playwright
