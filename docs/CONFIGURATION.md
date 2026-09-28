# Configuration

[English](./CONFIGURATION.md) · [繁體中文](./CONFIGURATION.zh-TW.md)

For a quick start, see the [root README](../README.md#quick-start).

> **Login required.** Shopee blocks anonymous requests, so this server uses a saved browser session. Run `npm run login` once before use. There are no Shopee API keys; authentication is the persistent browser profile under `~/.shopee-mcp/chrome-profile` by default.

## Environment variables

Set these in `.env` when developing from a checkout, or in your MCP client's environment configuration.

| Variable | Default | Description |
| --- | --- | --- |
| `SHOPEE_DOMAIN` | `shopee.co.id` | Regional Shopee domain. Use `shopee.tw` for Taiwan. |
| `SHOPEE_LOCALE` | region-derived | Browser locale. Taiwan defaults to `zh-TW`. |
| `SHOPEE_TIMEZONE` | region-derived | Browser timezone. Taiwan defaults to `Asia/Taipei`. |
| `SHOPEE_PROFILE_DIR` | `~/.shopee-mcp/chrome-profile` | Persistent logged-in browser profile. Treat it like a credential. |
| `SHOPEE_HEADLESS` | `false` | Keep `false` unless experimenting; Shopee can detect headless automation. |
| `SHOPEE_CART_WRITE_ENABLED` | `false` | Enables `add_to_cart` only when explicitly set to `true`. |
| `CACHE_TTL_MS` | `30000` | In-memory cache lifetime in milliseconds. |
| `DEBUG` | `false` | Diagnostic logging. Must never contain account credentials or private account data. |

### Recommended Taiwan `.env`

```env
SHOPEE_DOMAIN=shopee.tw
SHOPEE_HEADLESS=false
SHOPEE_CART_WRITE_ENABLED=false
DEBUG=false
```

Start with cart writes disabled. After `check_login_status`, product lookup, variant lookup, and `get_cart` are working, enable Add to Cart only if needed:

```env
SHOPEE_CART_WRITE_ENABLED=true
```

Restart the MCP server after changing environment variables.

## Browser profile

The default authenticated profile is:

```text
~/.shopee-mcp/chrome-profile
```

It can contain authentication cookies and session state. Never commit, upload, sync publicly, attach to an issue, or paste its contents into an AI conversation.

You can override the location:

```env
SHOPEE_PROFILE_DIR=/path/to/private/shopee-profile
```

## MCP configuration

This server uses **stdio** and launches a **headed** browser, so the process needs access to a graphical display.

### Windows desktop

Build the project first:

```powershell
npm run build
```

Then point the MCP client at the absolute Windows path to `build/index.js`:

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

### macOS/Linux desktop

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

### Linux server with a virtual display

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

## Client notes

### Claude Code

Use a stdio MCP configuration pointing to this fork's compiled `build/index.js`. Restart or reload the MCP configuration after rebuilding.

### Claude Desktop

Typical configuration file locations:

- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### Cursor, Zed, Windsurf, Codex, and other MCP hosts

Use the same stdio pattern: `node` plus the absolute path to this fork's `build/index.js`.

## Cart-write safety

`get_cart` is read-only. `add_to_cart` changes the logged-in account's shopping cart and therefore requires `SHOPEE_CART_WRITE_ENABLED=true`.

This project intentionally does not expose checkout, order placement, address changes, payment-method changes, or payment submission.
