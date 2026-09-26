import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Locator, Page } from 'playwright';
import { z } from 'zod';
import { shopeeCapture, shopeeUrl } from '../api/client.js';
import type { PdpItem, PdpProductPrice } from '../api/types.js';
import { BASE_URL, withPage } from '../browser/session.js';
import { withErrorHandling } from '../utils/errors.js';
import { parseProductUrl } from './product.js';

interface TierOption {
  option?: string;
  name?: string;
}

interface TierVariation {
  name?: string;
  options?: Array<TierOption | string>;
}

interface ProductModel {
  modelid?: number;
  model_id?: number;
  name?: string;
  stock?: number | null;
  price?: number | null;
  price_before_discount?: number | null;
  tier_index?: number[];
  extinfo?: {
    tier_index?: number[];
  };
  status?: number;
}

interface PdpItemWithVariants extends PdpItem {
  models?: ProductModel[];
  tier_variations?: TierVariation[];
}

interface VariantPdpResponse {
  error?: number;
  error_msg?: string;
  data?: {
    item: PdpItemWithVariants;
    product_price: PdpProductPrice;
  };
}

interface CartMutationResponse {
  error?: number;
  error_msg?: string;
  error_message?: string;
}

interface CartDomItem {
  name: string;
  href: string;
  quantity: number | null;
  visibleText: string;
}

const CART_WRITE_ENABLED = process.env.SHOPEE_CART_WRITE_ENABLED === 'true';

function modelId(model: ProductModel): number | undefined {
  return model.modelid ?? model.model_id;
}

function modelTierIndexes(model: ProductModel): number[] {
  return model.extinfo?.tier_index ?? model.tier_index ?? [];
}

function optionLabel(option: TierOption | string | undefined): string | undefined {
  if (typeof option === 'string') return option;
  return option?.option ?? option?.name;
}

function formatPrice(raw: number | null | undefined, currency: string): string {
  if (raw === undefined || raw === null) return 'N/A';
  const amount = raw / 100000;
  if (currency === 'TWD') return `NT$${Math.round(amount).toLocaleString('zh-TW')}`;
  if (currency === 'IDR') return `Rp${Math.round(amount).toLocaleString('id-ID')}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function resolveProduct(
  shopId?: string,
  itemId?: string,
  url?: string,
): { shopId: string; itemId: string } | null {
  if (shopId && itemId) return { shopId, itemId };
  if (url) return parseProductUrl(url);
  return null;
}

function variantSummary(item: PdpItemWithVariants): string {
  const models = item.models ?? [];
  const tiers = item.tier_variations ?? [];
  const currency = item.currency || 'TWD';

  if (models.length === 0) return 'No explicit variant models were returned for this product.';

  const tierLines = tiers
    .map((tier, tierIndex) => {
      const options = (tier.options ?? [])
        .map((option) => optionLabel(option))
        .filter((label): label is string => Boolean(label));
      return options.length
        ? `  ${tierIndex + 1}. ${tier.name || 'Option'}: ${options.join(' / ')}`
        : '';
    })
    .filter(Boolean);

  const modelLines = models.map((model) => {
    const id = modelId(model);
    const stock = model.stock ?? 'unknown';
    const indexes = modelTierIndexes(model);
    const chosen = indexes
      .map((optionIndex, tierIndex) => optionLabel(tiers[tierIndex]?.options?.[optionIndex]))
      .filter((label): label is string => Boolean(label));
    const label = chosen.length ? chosen.join(' / ') : model.name || 'Default';
    return `  • modelId=${id ?? 'unknown'} | ${label} | stock=${stock} | ${formatPrice(model.price, currency)}`;
  });

  return [
    tierLines.length ? '**Variant groups**' : '',
    ...tierLines,
    '',
    '**Purchasable models**',
    ...modelLines,
  ]
    .filter((line, index, all) => line !== '' || (index > 0 && all[index - 1] !== ''))
    .join('\n');
}

async function setQuantitySafely(page: Page, quantity: number): Promise<void> {
  if (quantity === 1) return;

  const preferred = page.locator(
    '.shopee-input-quantity input, input[type="number"], input[class*="quantity" i]',
  );
  const preferredCount = await preferred.count();
  for (let i = 0; i < preferredCount; i += 1) {
    const input = preferred.nth(i);
    if (!(await input.isVisible())) continue;
    await input.fill(String(quantity));
    await input.dispatchEvent('change');
    return;
  }

  // Shopee occasionally obfuscates the quantity input's classes. A numeric input
  // whose current value is exactly 1 is a safer fallback than guessing by position.
  const inputs = page.locator('input');
  const count = await inputs.count();
  for (let i = 0; i < count; i += 1) {
    const input = inputs.nth(i);
    if (!(await input.isVisible())) continue;
    const value = await input.inputValue().catch(() => '');
    if (value !== '1') continue;
    await input.fill(String(quantity));
    await input.dispatchEvent('change');
    return;
  }

  throw new Error(
    'Could not identify the product quantity control safely, so the item was not added. Retry with quantity=1 or update the selector for the current Shopee UI.',
  );
}

async function selectModelOptions(
  page: Page,
  item: PdpItemWithVariants,
  model: ProductModel,
): Promise<void> {
  const tiers = item.tier_variations ?? [];
  const indexes = modelTierIndexes(model);
  if (indexes.length === 0) return;

  for (let tierIndex = 0; tierIndex < indexes.length; tierIndex += 1) {
    const label = optionLabel(tiers[tierIndex]?.options?.[indexes[tierIndex]]);
    if (!label) {
      throw new Error(`Could not resolve variant option ${tierIndex + 1} for model ${modelId(model)}.`);
    }

    // Shopee commonly exposes variant names as the button's aria-label. Prefer
    // the accessible name because it survives many CSS-class changes.
    const accessibleButton = page.getByRole('button', { name: label, exact: true }).first();
    if ((await accessibleButton.count()) > 0 && (await accessibleButton.isVisible())) {
      await accessibleButton.click();
      continue;
    }

    const productVariation = page.locator('button.product-variation').filter({ hasText: label }).first();
    if ((await productVariation.count()) > 0 && (await productVariation.isVisible())) {
      await productVariation.click();
      continue;
    }

    const exactText = page.getByText(label, { exact: true }).first();
    if ((await exactText.count()) > 0 && (await exactText.isVisible())) {
      await exactText.click();
      continue;
    }

    throw new Error(`Could not find the visible Shopee variant control for “${label}”.`);
  }
}

async function findAddToCartButton(page: Page): Promise<Locator> {
  const labeled = page
    .getByRole('button', {
      name: /加入購物車|加入购物车|add to cart|masukkan keranjang|thêm vào giỏ hàng/i,
    })
    .first();
  if ((await labeled.count()) > 0 && (await labeled.isVisible())) return labeled;

  // Historically Shopee's add-to-cart button uses the tinted style while the
  // immediate-buy button uses the solid-primary style. Do not fall back to the
  // solid button because that could unintentionally enter checkout.
  const tinted = page.locator('button.btn-tinted, button[class*="btn-tinted"]').first();
  if ((await tinted.count()) > 0 && (await tinted.isVisible())) return tinted;

  throw new Error('Could not find the Add to Cart button safely on the current Shopee product page.');
}

export function registerCartTools(server: McpServer): void {
  server.tool(
    'get_product_variants',
    'List purchasable Shopee variants/models with model IDs, option labels, stock, and price. Use this before add_to_cart when a product has multiple variants.',
    {
      shopId: z.string().optional().describe('Numeric Shopee shop ID'),
      itemId: z.string().optional().describe('Numeric Shopee item/product ID'),
      url: z.string().url().optional().describe('Full Shopee product URL'),
    },
    async ({ shopId, itemId, url }) =>
      withErrorHandling(async () => {
        const resolved = resolveProduct(shopId, itemId, url);
        if (!resolved) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ Please provide both `shopId` and `itemId`, or a full product `url`.',
              },
            ],
          };
        }

        const productUrl = shopeeUrl(`/product/${resolved.shopId}/${resolved.itemId}`);
        const data = await shopeeCapture<VariantPdpResponse>(productUrl, 'pdp/get_pc');
        const item = data.data?.item;
        if (!item) {
          return { content: [{ type: 'text', text: '❌ Could not read product variant data.' }] };
        }

        const text = [`📦 **${item.title}**`, '', variantSummary(item), '', `🔗 ${productUrl}`].join(
          '\n',
        );
        return { content: [{ type: 'text', text }] };
      }),
  );

  server.tool(
    'get_cart',
    'Read the currently logged-in Shopee shopping cart. Returns product names, product URLs, quantities, and the visible cart-row text. Does not modify the cart.',
    {},
    async () =>
      withErrorHandling(async () => {
        const items = await withPage(async (page) => {
          await page.goto(`${BASE_URL}/cart`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(2500);

          return page.evaluate<CartDomItem[]>(() => {
            const links = Array.from(
              document.querySelectorAll<HTMLAnchorElement>('a[href*="/product/"], a[href*="-i."]'),
            );
            const seen = new Set<string>();
            const out: CartDomItem[] = [];

            for (const link of links) {
              const href = link.href;
              if (!href || seen.has(href)) continue;

              const name = (link.textContent || '').replace(/\s+/g, ' ').trim();
              if (!name || name.length < 2) continue;

              let node: HTMLElement | null = link;
              let row: HTMLElement | null = null;
              for (let depth = 0; depth < 8 && node; depth += 1) {
                const numericInput = Array.from(node.querySelectorAll<HTMLInputElement>('input')).find(
                  (input) => /^\d+$/.test(input.value),
                );
                if (numericInput) {
                  row = node;
                  break;
                }
                node = node.parentElement;
              }
              if (!row) continue;

              const quantityInput = Array.from(row.querySelectorAll<HTMLInputElement>('input')).find(
                (input) => /^\d+$/.test(input.value),
              );
              const visibleText = (row.innerText || row.textContent || '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 700);

              seen.add(href);
              out.push({
                name,
                href,
                quantity: quantityInput ? Number(quantityInput.value) : null,
                visibleText,
              });
            }

            return out;
          });
        });

        if (items.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: '🛒 No cart rows were detected. The cart may be empty, the session may need login, or Shopee may have changed its cart DOM.',
              },
            ],
          };
        }

        const lines = ['🛒 **Shopee Cart**', ''];
        items.forEach((item, index) => {
          lines.push(
            `${index + 1}. **${item.name}**`,
            `   Quantity: ${item.quantity ?? 'unknown'}`,
            `   ${item.href}`,
            `   ${item.visibleText}`,
            '',
          );
        });
        return { content: [{ type: 'text', text: lines.join('\n').trim() }] };
      }),
  );

  server.tool(
    'add_to_cart',
    'Add a specific Shopee product/model to the logged-in shopping cart by using Shopee’s own product-page UI. This never checks out or places an order. Requires SHOPEE_CART_WRITE_ENABLED=true.',
    {
      shopId: z.string().optional().describe('Numeric Shopee shop ID'),
      itemId: z.string().optional().describe('Numeric Shopee item/product ID'),
      url: z.string().url().optional().describe('Full Shopee product URL'),
      modelId: z
        .string()
        .optional()
        .describe('Exact model ID from get_product_variants. Required when multiple models exist.'),
      quantity: z.number().int().min(1).max(999).default(1).describe('Quantity to add'),
    },
    async ({ shopId, itemId, url, modelId: requestedModelId, quantity }) =>
      withErrorHandling(async () => {
        if (!CART_WRITE_ENABLED) {
          return {
            content: [
              {
                type: 'text',
                text: '🔒 Cart writes are disabled. Set `SHOPEE_CART_WRITE_ENABLED=true` in your local `.env`, restart the MCP server, and retry.',
              },
            ],
          };
        }

        const resolved = resolveProduct(shopId, itemId, url);
        if (!resolved) {
          return {
            content: [
              {
                type: 'text',
                text: '❌ Please provide both `shopId` and `itemId`, or a full product `url`.',
              },
            ],
          };
        }

        const productUrl = shopeeUrl(`/product/${resolved.shopId}/${resolved.itemId}`);
        const data = await shopeeCapture<VariantPdpResponse>(productUrl, 'pdp/get_pc');
        const item = data.data?.item;
        if (!item) {
          return { content: [{ type: 'text', text: '❌ Could not read product data.' }] };
        }

        const models = item.models ?? [];
        let selectedModel: ProductModel | undefined;
        if (models.length > 1 && !requestedModelId) {
          return {
            content: [
              {
                type: 'text',
                text:
                  `❌ This product has multiple purchasable models. Call \`get_product_variants\` first and pass the exact \`modelId\`.\n\n` +
                  variantSummary(item),
              },
            ],
          };
        }

        if (requestedModelId) {
          selectedModel = models.find((model) => String(modelId(model)) === requestedModelId);
          if (!selectedModel) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ modelId ${requestedModelId} is not present in the current product data.\n\n${variantSummary(item)}`,
                },
              ],
            };
          }
        } else if (models.length === 1) {
          selectedModel = models[0];
        }

        const availableStock = selectedModel?.stock ?? item.stock ?? item.normal_stock ?? undefined;
        if (availableStock !== undefined && availableStock !== null && availableStock < quantity) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Requested quantity ${quantity} exceeds available stock ${availableStock}. Nothing was added.`,
              },
            ],
          };
        }

        const mutation = await withPage(async (page) => {
          await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(1500);

          if (selectedModel) await selectModelOptions(page, item, selectedModel);
          await setQuantitySafely(page, quantity);

          const button = await findAddToCartButton(page);
          const responsePromise = page.waitForResponse(
            (response) =>
              response.url().includes('/api/v4/cart/add_to_cart') &&
              response.request().method().toUpperCase() === 'POST',
            { timeout: 15000 },
          );

          await button.click();
          const response = await responsePromise;
          return (await response.json()) as CartMutationResponse;
        });

        if (mutation.error !== undefined && mutation.error !== null && mutation.error !== 0) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Shopee rejected the cart update: ${mutation.error_msg || mutation.error_message || `error ${mutation.error}`}`,
              },
            ],
          };
        }

        const selectedId = selectedModel ? modelId(selectedModel) : undefined;
        return {
          content: [
            {
              type: 'text',
              text: [
                '✅ Added to Shopee cart.',
                `Product: ${item.title}`,
                selectedId !== undefined ? `modelId: ${selectedId}` : '',
                `Quantity: ${quantity}`,
                productUrl,
                '',
                'No checkout or payment action was performed.',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
        };
      }),
  );
}
