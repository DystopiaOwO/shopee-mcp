# Buyer cart tools

This fork adds buyer-side cart support while keeping checkout and payment out of scope.

## Tools

- `get_product_variants` lists Shopee model IDs, option labels, stock, and price. Use it before adding a multi-variant product.
- `get_cart` reads the logged-in cart without modifying it.
- `add_to_cart` adds the exact selected model and quantity through Shopee's own product-page UI.

## Write guard

Cart writes are disabled by default. Enable them only in the local `.env`:

```env
SHOPEE_CART_WRITE_ENABLED=true
```

Restart the MCP server after changing the setting.

## Safe AI flow

1. Search or open the requested product.
2. Call `get_product_variants` when variants exist.
3. Require an exact `modelId` when more than one model is available.
4. Call `add_to_cart` with the exact model and quantity.
5. Call `get_cart` to verify the cart state.

`add_to_cart` intentionally does not implement checkout, order placement, address changes, payment-method changes, or payment submission.

## Taiwan

For Taiwan Shopee, set:

```env
SHOPEE_DOMAIN=shopee.tw
```

The browser then defaults to `zh-TW` and `Asia/Taipei` unless explicitly overridden.
