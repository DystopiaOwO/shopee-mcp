# 開發指南

[English](./DEVELOPMENT.md) · **繁體中文**

## 常用指令

| 指令                   | 說明                                             |
| ---------------------- | ------------------------------------------------ |
| `npm install`          | 安裝依賴，並下載 CloakBrowser binary             |
| `npm run login`        | 開啟瀏覽器並使用 persistent profile 登入 Shopee  |
| `npm run build`        | 將 TypeScript 編譯到 `build/`                    |
| `npm run dev`          | `tsx watch src/index.ts` 開發模式                |
| `npm run start`        | 啟動已編譯 Server：`node build/index.js`         |
| `npm run lint`         | ESLint                                           |
| `npm run format`       | Prettier 格式化                                  |
| `npm run format:check` | 檢查格式、不修改檔案                             |
| `npm run typecheck`    | `tsc --noEmit` strict typecheck                  |
| `npm run test:unit`    | 離線單元測試，不需要登入與顯示器                 |
| `npm test`             | Live smoke test，需要登入 session 與圖形顯示環境 |

CI 會在 Node.js 20、22、24 上執行 lint、Prettier、typecheck、build 與 offline unit tests。

## 目前工具模組

v0.3.0 的 `src/tools/` 主要包含：

```text
src/tools/
  account.ts     # 訂單、優惠券、蝦幣、通知等帳號讀取工具
  actions.ts     # like / follow / claim voucher 等帳號動作
  cart.ts        # get_cart / add_to_cart / update_cart_item
  flashsale.ts   # get_flash_sale
  product.ts     # get_product_detail
  reviews.ts     # get_product_reviews
  search.ts      # search_products
  shop.ts        # get_shop_info / get_shop_products
  status.ts      # check_login_status
  variants.ts    # get_product_variants
```

另外：

```text
src/
  index.ts          # MCP Server 入口與工具註冊
  login.ts          # 一次性互動登入
  api/              # Shopee response capture / types
  browser/          # CloakBrowser persistent session
  utils/            # cache、errors、price 等共用工具

test/
  unit.ts           # offline unit tests
  smoke.ts          # live browser smoke test
```

## 為什麼透過瀏覽器

Shopee 的 `/api/v4/*` 等 endpoint 會驗證前端 SDK 產生的 anti-fraud signature。普通 `fetch`、一般 headless Chromium，甚至自行從頁面執行請求都可能被拒絕。

因此專案採用：

1. 使用已登入的 CloakBrowser persistent profile。
2. 導航到真正的 Shopee 頁面。
3. 讓 Shopee 自己的 frontend 產生合法 signed request。
4. 攔截對應 response。

Account action 也應優先操作真正 UI 並驗證 Shopee 回傳的結果，而不是自行偽造 private API request。

## 帳號模式

登入後，Server 會依 `SHOPEE_ACCOUNT_TOOLS` 決定是否暴露 account tools。

```env
SHOPEE_ACCOUNT_TOOLS=auto
```

代表已登入時提供帳號工具。

```env
SHOPEE_ACCOUNT_TOOLS=off
```

代表即使登入也保持 read-only。

帳號工具包含兩類：

- Reads：orders、vouchers、coins、notifications、cart 等
- Actions：add/update cart、like、follow、claim voucher

專案不應新增 checkout、payment、address、password 或 chat 自動化。

## 商品規格與購物車

### `get_product_variants`

用來取得：

- 精確 `modelId`
- 規格名稱
- 價格
- 可用狀態
- 選用 `includeStock` 時的精確庫存

精確庫存可能需要逐 variant round trip，因此相對耗時。

### `add_to_cart`

多規格商品必須有明確 `modelId`，不得猜測。

執行流程應確認：

1. 商品與 model 正確。
2. UI 上數量與需求一致。
3. 點擊「加入購物車」，不使用「立即購買」作為 fallback。
4. 只回報 Shopee 真正確認成功的結果。

### `update_cart_item`

可以更新購物車數量，`quantity: 0` 代表移除。

## 修改後驗證

程式碼修改後至少執行：

```bash
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run test:unit
```

涉及瀏覽器、selector、account mode、cart action 時，再執行：

```bash
npm test
```

Live smoke test 前必須確認使用的是測試者有權控制的帳號與操作。

## 台灣站 smoke test

設定：

```env
SHOPEE_DOMAIN=shopee.tw
```

建議確認：

- `check_login_status`
- `search_products`
- `get_product_detail`
- `get_product_variants`
- TWD / NT$ 價格正常
- locale `zh-TW`
- timezone `Asia/Taipei`
- 登入後 `get_cart` 正常
- 寫入測試時規格與 `modelId` 明確

如果只要驗證公開資料，可設定：

```env
SHOPEE_ACCOUNT_TOOLS=off
```

## 安全開發規則

絕對不要 commit：

- Cookie / token
- browser profile
- localStorage / sessionStorage dump
- storage-state / HAR / trace
- 真實 authenticated response dump
- 真實訂單或購物車 dump
- 地址、電話、付款資料
- 含個資 screenshot

測試 fixture 應使用 synthetic data。

詳見 [SECURITY.zh-TW.md](../SECURITY.zh-TW.md)。

## 技術堆疊

- TypeScript strict mode
- Zod
- `@modelcontextprotocol/sdk`（stdio）
- CloakBrowser
- Playwright
