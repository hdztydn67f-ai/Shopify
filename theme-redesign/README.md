# Havoc Boxing redesign (preview theme)

Theme: "Havoc Redesign 2026-10 (preview)" — gid://shopify/OnlineStoreTheme/189310402855 (UNPUBLISHED, copy of live theme)

Preview: https://havocboxinggear.com/?preview_theme_id=189310402855

## What changed vs live theme
- New homepage (templates/index.json): 14 lean custom sections (hvx-*) replacing 24 theme sections.
  Hero (H1) → trust bar → shop by brand → Winning row → categories → shop by weight → sparring sets row →
  training guide → Cleto Reyes row → custom gear → boxing shoes row → why Havoc → guides → FAQ (+FAQPage schema).
- assets/hvx.css loaded from layout/theme.liquid; Oswald heading font self-hosted via Shopify font library.
- Product template (product.default-product.json):
  - added "Havoc buy with confidence" trust row + glove size guide under the buy box
  - disabled fake "sold in last X hours" and random "people viewing" counters
  - disabled Judge.me widget that was set to SAMPLE (fake) review data
  - replaced placeholder Shipping & Return tab with the store's real policy summary
  - removed lorem ipsum + unverifiable claims from Additional Information tab
  - disabled duplicate generic product FAQ (PayPal / 30-day claims conflicted with real policies)
  - delivery-estimate widget: removed Google Fonts, end date 4–8 days to match policy

## v2 (white, image-led homepage)
Order: ticker → hero (white, featured best seller with price tag) → trust bar → best sellers (Nike Hyperko, from real sales data;
sold-out items excluded) → shop by brand (Nike, Winning, Cleto Reyes, NBNL) → product tabs (gloves/sets/shoes/headgear/groin guards)
→ product spotlight (gallery + size select + add to cart) → categories → colorway mosaic → shop by weight → training guide →
custom gear → why Havoc → guides → FAQ.
New features: scrolling ticker, quick add-to-cart with size select on every card, CSS-only tabs and gallery (no JS needed),
hover image swap, scroll-reveal (assets/hvx.js, progressive enhancement), white image stages with multiply blending,
responsive srcset up to 1400px.
Also fixed image alt text: removed "Authentic"/"handcrafted in Japan" claims, US spelling, added missing video alt.
