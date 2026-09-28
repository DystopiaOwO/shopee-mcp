# 安全性說明

[English](./SECURITY.md) · [繁體中文](./SECURITY.zh-TW.md)

## 安全問題回報

未公開的安全漏洞請不要直接開 public GitHub Issue。若 repository 有啟用 GitHub Private Vulnerability Reporting，請優先使用；否則請透過私下管道聯絡維護者。

回報內容建議包含：

- 問題簡述
- 可能影響
- 安全的重現方式
- 受影響版本 / dependency

## Browser profile 等同登入憑證

這個 MCP 會操作已登入蝦皮的 persistent browser profile。

預設位置：

```text
~/.shopee-mcp/chrome-profile
```

裡面可能包含有效登入 session，因此應視同密碼 / token 管理。

以下資料不得 commit、上傳、公開或貼到 GitHub Issue：

- browser profile
- Cookie
- localStorage / sessionStorage
- storage-state
- HAR
- authenticated API raw response
- 真實購物車 dump
- 地址
- 電話
- 訂單資料
- 付款資料
- 含帳號個資的截圖

`.gitignore` 已排除常見檔案，但不能取代 push 前的人工作業檢查。

## Log / Debug

Debug log 不得輸出：

- Cookie
- Authorization header
- session token
- browser storage
- 完整登入後帳號 response
- 地址 / 電話
- 付款資訊

測試 fixture 必須使用假資料 / synthetic data，不要把真實購物車資料存進 repository。

## 購物車寫入權限

上游專案原本為商品 discovery-only；這個 fork 新增：

- `get_product_variants`：讀取商品規格 / model
- `get_cart`：唯讀目前購物車
- `add_to_cart`：可選擇性修改購物車

`add_to_cart` 預設停用：

```env
SHOPEE_CART_WRITE_ENABLED=false
```

只有本機 operator 明確改成：

```env
SHOPEE_CART_WRITE_ENABLED=true
```

後，才允許 AI 加入購物車。

如果商品有多個規格，必須提供精確 `modelId`；工具不得自行猜測規格。

## 明確不提供的功能

本 fork 刻意不實作：

- checkout
- 建立訂單
- 修改收件地址
- 修改付款方式
- 付款

因此即使 `SHOPEE_CART_WRITE_ENABLED=true`，工具的寫入範圍仍只限購物車。

## AI Client 安全

因為 `add_to_cart` 會修改帳號狀態：

- 只連接你信任的 MCP / AI client
- 不需要修改購物車時保持 write flag 關閉
- AI 加購物車前先取得精確規格 / `modelId`
- 加入後再用 `get_cart` 驗證
- 不要把瀏覽器 profile 放到雲端共享環境

## 公開 GitHub repository 是否安全

程式碼 repository 可以公開，只要**登入後的 runtime 資料完全留在本機**。

每次 push 前至少確認：

```bash
git status
git diff --cached
```

確認沒有誤加入：

- `.env`
- browser profile
- HAR / log
- screenshot
- cart JSON
- API dump
- 任何帳號個資

## 第三方 / 上游問題

如果問題實際來自 Shopee、CloakBrowser、Playwright 或 `@modelcontextprotocol/sdk`，應視情況回報對應專案。
