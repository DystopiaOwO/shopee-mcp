# shopee-mcp 繁體中文文件

[English](./README.md) · **繁體中文**

這個 fork 的程式核心會盡量跟隨上游 `bintangtimurlangit/shopee-mcp`，主要額外維護繁體中文文件與台灣站使用說明。

## 文件

| 文件 | 說明 |
| --- | --- |
| [繁中 README](../README.zh-TW.md) | 功能總覽、安裝、帳號模式、台灣站設定與安全邊界 |
| [設定指南](./CONFIGURATION.zh-TW.md) | `.env`、區域 / locale / timezone、timeout、Windows / Linux MCP 設定 |
| [開發指南](./DEVELOPMENT.zh-TW.md) | 專案結構、測試、CI、account tools、台灣站 smoke test |
| [安全性說明](../SECURITY.zh-TW.md) | browser profile、帳號工具、個資與公開 repo 安全原則 |
| [Changelog](../CHANGELOG.md) | 上游版本與功能變更紀錄 |
| [Releases](./RELEASES.md) | SemVer、tag 與 npm release 流程（英文） |

## v0.3.0 主要能力

### 公開資料

- 商品搜尋與篩選
- 商品詳細資訊
- 商品規格 / `modelId`
- 商品評論
- 賣場資訊與商品列表
- Flash Sale
- 登入狀態確認

### 登入後 Account mode

唯讀：

- 訂單與訂單詳細資料
- 優惠券
- 蝦幣
- 通知
- 購物車
- 商店優惠券

會修改帳號狀態：

- 加入購物車
- 更新 / 移除購物車商品
- 商品按讚 / 取消按讚
- 追蹤 / 取消追蹤賣場
- 領取商店優惠券

不包含：

- 結帳
- 建立訂單
- 付款
- 修改地址
- 修改付款方式
- 修改密碼
- 聊天

若只需要唯讀模式：

```env
SHOPEE_ACCOUNT_TOOLS=off
```

台灣站：

```env
SHOPEE_DOMAIN=shopee.tw
```

會自動對應 `zh-TW`、`Asia/Taipei` 與 `TWD`。
