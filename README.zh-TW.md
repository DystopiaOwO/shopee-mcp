# shopee-mcp

[English](./README.md) · **繁體中文**

`shopee-mcp` 是一個用來操作 **Shopee 蝦皮** 的 Model Context Protocol（MCP）Server，可讓 Claude、Codex、Cursor 或其他支援 MCP 的 AI client 搜尋商品、查看價格、規格、評價、賣場與限時特賣。

本專案是**非官方工具**，與 Shopee／Sea Limited 無隸屬、授權、維護或合作關係。

> **需要登入瀏覽器 session。** 蝦皮會阻擋匿名請求，因此這個 MCP 透過你自己的 CloakBrowser persistent profile 存取網站。未登入時只提供公開資料查詢；登入後會另外出現實驗性的帳號工具，可讀取並修改你自己的購物車、按讚、追蹤與商店優惠券等狀態。

完整文件：[繁中文件首頁](./docs/README.zh-TW.md) · [英文文件](./docs/README.md) · [CHANGELOG](./CHANGELOG.md)

## 公開資料工具

| Tool                   | 功能                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `search_products`      | 商品搜尋、排序、價格區間、最低評分、賣家地區、Shopee Mall 篩選與分頁               |
| `get_product_detail`   | 商品價格、折扣、評分、銷量、庫存、分類、規格、運費、免運門檻、預估到貨與賣家摘要   |
| `get_product_variants` | 商品所有規格、精確 `modelId`、各規格價格與可用狀態；可用 `includeStock` 查精確庫存 |
| `get_product_reviews`  | 星等統計與買家評論，可依星等、文字或圖片篩選                                       |
| `get_shop_info`        | 賣場資訊、徽章、評分、商品數、粉絲、回覆率、加入時間、最後上線等                   |
| `get_shop_products`    | 指定賣場商品列表，可依熱門、新品、銷量、價格排序                                   |
| `get_flash_sale`       | 目前限時特賣時段、後續時段與特價商品                                               |
| `check_login_status`   | 檢查目前 persistent browser session 是否已登入                                     |

這些預設工具都是唯讀操作。

## 帳號模式（Experimental）

當保存的瀏覽器 session **已登入**時，Server 會額外提供你自己的帳號工具，並通知 MCP client 更新工具清單。若未登入，這些工具不會出現。

如果希望即使已登入也維持純唯讀模式，可設定：

```env
SHOPEE_ACCOUNT_TOOLS=off
```

預設值為 `auto`。

### 帳號唯讀工具

| Tool                | 功能                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| `get_orders`        | 依全部、待出貨、待收貨、已完成、已取消等頁籤查看訂單                               |
| `get_order_detail`  | 訂單商品、付款金額、付款管道、時間軸、物流商、追蹤號碼與物流事件；不回傳地址或電話 |
| `get_my_vouchers`   | 目前帳號優惠券、適用範圍、低消、到期時間與代碼                                     |
| `get_coins`         | 蝦幣餘額與近期紀錄                                                                 |
| `get_notifications` | 訂單、促銷與蝦皮通知                                                               |
| `get_cart`          | 依賣場分組的購物車商品、規格、數量、價格與 `modelId`                               |
| `get_shop_vouchers` | 指定賣場可領優惠券與已領取狀態                                                     |

### 會修改帳號狀態的工具

| Tool                 | 功能                                             |
| -------------------- | ------------------------------------------------ |
| `add_to_cart`        | 將指定商品與精確 `modelId` 加入購物車，數量 1–20 |
| `update_cart_item`   | 修改購物車數量；`quantity: 0` 代表移除           |
| `like_product`       | 商品按讚／取消按讚                               |
| `follow_shop`        | 追蹤／取消追蹤賣場                               |
| `claim_shop_voucher` | 領取商店優惠券；成功領取後通常無法復原           |

### 帳號工具的安全邊界

- **沒有結帳、付款、建立訂單、修改地址、修改付款方式、修改密碼或聊天功能。**
- 訂單詳細資料會省略收件地址與電話。
- 寫入工具操作蝦皮真正頁面上的 UI，並只回報蝦皮確認成功的結果，而不是自行偽造私有 API 請求。
- 會先確認目前狀態，例如已按讚的商品再次要求按讚時不會重複操作。
- 多規格商品必須提供精確 `modelId`；工具不應猜測規格。
- `add_to_cart` 不會退回使用「立即購買」。

這些功能會受到蝦皮頁面改版影響，因此目前仍屬 experimental。

## 為什麼需要瀏覽器

蝦皮的 `/api/v4/*` 等 endpoint 會要求由蝦皮前端 SDK 產生的 anti-fraud signature。直接使用 `fetch`、一般 headless Chromium 或自行組裝請求都可能被拒絕。

這個 MCP 的做法是：

1. 使用 [CloakBrowser](https://github.com/CloakHQ/cloakbrowser) 與 persistent profile。
2. 由你手動登入一次蝦皮。
3. 導航到真正的蝦皮頁面。
4. 攔截蝦皮自己前端發出的合法 signed response。

通常需要 **headed** 瀏覽器；Linux server 沒有桌面環境時可搭配 `xvfb`。

## 安裝

### 使用 npm（上游推薦）

```bash
npm install -g @bintangtimurlangit/shopee-mcp
```

安裝後會有：

- `shopee-mcp`：啟動 MCP Server
- `shopee-mcp-login`：進行一次性登入

也可以直接：

```bash
npx -y @bintangtimurlangit/shopee-mcp
```

### 從本 fork 原始碼執行

```bash
git clone https://github.com/DystopiaOwO/shopee-mcp.git
cd shopee-mcp
npm install
npm run build
```

這個 fork 的程式核心會盡量跟上游同步，主要額外維護繁體中文文件。

## 第一次登入

全域 npm 安裝：

```bash
shopee-mcp-login
```

從 source checkout：

```bash
npm run login
```

瀏覽器會開啟，請自行登入。預設 session 保存位置：

```text
~/.shopee-mcp/chrome-profile
```

**請把這個資料夾視為密碼／token 等級的憑證，絕對不要 commit、上傳或分享。**

## 台灣蝦皮設定

台灣站建議：

```env
SHOPEE_DOMAIN=shopee.tw
SHOPEE_ACCOUNT_TOOLS=auto
SHOPEE_HEADLESS=false
```

當網域為 `.tw` 時會自動使用：

- locale：`zh-TW`
- timezone：`Asia/Taipei`
- currency：`TWD`

如有需要可另外設定 `SHOPEE_LOCALE` 與 `SHOPEE_TIMEZONE` 覆寫。

如果只想讓 AI 查資料、不允許任何帳號修改：

```env
SHOPEE_ACCOUNT_TOOLS=off
```

## MCP Client 設定

從 source build 後，Windows 桌面環境可設定：

```json
{
  "mcpServers": {
    "shopee": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\shopee-mcp\\build\\index.js"],
      "env": {
        "SHOPEE_DOMAIN": "shopee.tw"
      }
    }
  }
}
```

Windows 桌面不需要 `xvfb`。

Linux server 沒有 display 時，可使用：

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

## 主要環境變數

| 變數                   | 預設值                         | 說明                                      |
| ---------------------- | ------------------------------ | ----------------------------------------- |
| `SHOPEE_DOMAIN`        | `shopee.co.id`                 | 區域網域；台灣使用 `shopee.tw`            |
| `SHOPEE_LOCALE`        | 依網域自動判斷                 | Browser locale                            |
| `SHOPEE_TIMEZONE`      | 依網域自動判斷                 | Browser timezone                          |
| `SHOPEE_PROFILE_DIR`   | `~/.shopee-mcp/chrome-profile` | Persistent 登入 profile                   |
| `SHOPEE_HEADLESS`      | `false`                        | 建議維持 `false`                          |
| `SHOPEE_ACCOUNT_TOOLS` | `auto`                         | `auto`：登入後開帳號工具；`off`：永遠唯讀 |
| `CACHE_TTL_MS`         | `30000`                        | 記憶體快取 TTL                            |
| `DEBUG`                | `false`                        | 啟動／除錯 log                            |

詳細設定與 timeout 請看 [設定指南](./docs/CONFIGURATION.zh-TW.md)。

## AI 購物流程建議

例如要讓 AI 幫你把指定電子材料加入購物車：

1. `search_products` 搜尋商品。
2. `get_product_detail` 確認商品。
3. 有多規格時先執行 `get_product_variants`。
4. 明確選定正確的 `modelId`。
5. `add_to_cart` 加入指定數量。
6. 再執行 `get_cart` 驗證結果。

如果規格不明確，不要讓 AI 自行猜測。

## 安全與隱私

不要 commit、上傳或貼到公開 Issue：

- Cookie / session token
- browser profile
- localStorage / sessionStorage
- HAR / trace / storage-state
- 登入後完整 API response
- 真實訂單或購物車 dump
- 地址、電話、付款資訊
- 含個資的 screenshot

只把 MCP 連到你信任的 AI client。若暫時不需要任何帳號動作，使用：

```env
SHOPEE_ACCOUNT_TOOLS=off
```

詳細內容請看 [安全性說明](./SECURITY.zh-TW.md)。

## 開發

```bash
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run test:unit
```

Live smoke test：

```bash
npm test
```

需要已登入 session 與圖形顯示環境。

## 注意事項

- Indonesia 是目前測試最多的區域；Malaysia、Singapore、Taiwan 會自動使用對應 locale、timezone 與 currency。
- Shopee anti-bot、DOM 與私有 endpoint 都可能變更，功能可能因網站更新而失效。
- 請以合理頻率使用，並遵守 Shopee 服務條款與適用法律。

## 授權

本專案使用 [MIT License](./LICENSE)。
