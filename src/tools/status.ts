import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { isLoggedIn, DOMAIN } from '../browser/session.js';
import { withErrorHandling } from '../utils/errors.js';
import { accountToolsSetting, setLoggedIn } from '../account-mode.js';

export function registerStatusTools(server: McpServer): void {
  server.tool(
    'check_login_status',
    'Check whether the saved browser session is logged into Shopee. ' +
      'Useful to verify setup before calling search_products / get_product_detail, ' +
      'since those fail slowly (a full page load) when the session is signed out.',
    {},
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    async () => {
      return withErrorHandling(async () => {
        const loggedIn = await isLoggedIn();
        setLoggedIn(loggedIn);
        const mode =
          accountToolsSetting() === 'off'
            ? 'Account tools are turned off (SHOPEE_ACCOUNT_TOOLS=off) — read-only mode.'
            : 'Experimental account tools (orders, vouchers, coins, notifications, cart, likes, follows) are enabled.';
        const text = loggedIn
          ? `✅ Logged in to ${DOMAIN}. All discovery tools are ready.\n${mode}`
          : `🔒 Not logged in to ${DOMAIN} — read-only mode, account tools hidden.\n\n` +
            `Run \`npm run login\` (or \`shopee-mcp-login\`) once, ` +
            `sign in in the Chromium window that opens, then retry.`;
        return { content: [{ type: 'text', text }] };
      });
    },
  );
}
