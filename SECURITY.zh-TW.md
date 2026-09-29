# 安全性說明

[English](./SECURITY.md) · **繁體中文**

## 安全問題回報

未公開的安全漏洞請不要直接開 public GitHub Issue。

若 repository 有啟用 GitHub Private Vulnerability Reporting，請優先使用；否則透過維護者提供的私下聯絡方式回報。

建議包含：

- 問題簡述與影響
- 安全的重現步驟
- 受影響版本 / dependency

## Browser profile 等同帳號憑證

這是一個在本機執行的 MCP Server，會操作已登入 Shopee 的 persistent browser profile。

預設位置：

```text
~/.shopee-mcp/chrome-profile
```

這個資料夾可能包含有效登入 session，請把它視為密碼 / token 等級的憑證。

不要 commit、上傳、公開或貼到 Issue：

- browser profile
- Cookie / session token
- localStorage / sessionStorage
- storage-state
- HAR / trace
- authenticated API raw response
- 真實購物車 / 訂單 dump
- 地址、電話
- 付款資訊
- 含帳號個資的 screenshot

## 未登入與登入後的差異

### 未登入

Server 只提供公開資料查詢工具；大多數需要 session 的功能會要求先登入。

### 已登入

預設 `SHOPEE_ACCOUNT_TOOLS=auto` 時，會額外提供 experimental account tools。

帳號讀取包括：

- orders
- cart
- vouchers
- coins
- notifications

帳號寫入包括：

- add / update / remove cart items
- like / unlike product
- follow / unfollow shop
- claim shop voucher

如果不希望任何帳號工具出現，設定：

```env
SHOPEE_ACCOUNT_TOOLS=off
```

## 明確不提供的能力

專案不提供：

- checkout / 結帳
- 建立訂單
- 付款
- 修改地址
- 修改付款方式
- 修改密碼
- 聊天

`get_order_detail` 也會省略收件地址與電話。

## AI Client 安全

只把這個 MCP 連接到你信任的 AI client。

寫入工具會用 MCP annotation 標示為非 read-only，但最終是否在操作前提示仍取決於 client 行為，因此：

- 不需要帳號操作時使用 `SHOPEE_ACCOUNT_TOOLS=off`
- 多規格商品加入購物車前先取得精確 `modelId`
- 不讓 AI 自行猜測規格
- 寫入後使用對應讀取工具驗證狀態
- `claim_shop_voucher` 成功後通常無法復原，應視為不可逆操作

## Log / Debug

Debug log 不應輸出：

- Cookie
- Authorization / session token
- browser storage
- 完整登入後帳號 response
- 地址 / 電話
- 付款資訊

測試 fixture 應使用 synthetic data，不要把真實帳號資料保存到 repository。

## 公開 GitHub repository

程式碼可以公開，只要 runtime 登入資料完全留在本機。

Push 前建議檢查：

```bash
git status
git diff --cached
```

確認沒有誤加入：

- `.env`
- browser profile
- HAR / log / trace
- screenshot
- cart / order JSON
- authenticated response dump
- 任何帳號個資

## 第三方問題

若問題實際來自 Shopee、CloakBrowser、Playwright、`@modelcontextprotocol/sdk` 或其他 dependency，應視情況回報對應專案。
