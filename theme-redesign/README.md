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

## v3 fixes (2026-10-02)
- Bug: filters chained after image_tag (e.g. `alt: x | default: y | append: ' boxing gloves'`) were applied to the
  <img> HTML, leaking "boxing gloves" text beside brand images and dropping alt fallbacks. All alts now pre-assigned.
- Images fill their frames (object-fit: cover, no padding) so grey-background product photos no longer look boxed/half size.
- Mosaic: caption sits under the photo; mobile = big tile full width + 2x2 grid. Brands: 2 columns on mobile.
- Product page extras: At-a-glance specs, accepted payment icons, trust list, WhatsApp help link (prefilled with product),
  glove size guide / shoe sizing tips, related-collection chips. Hid SKU + product type, disabled cluttered "Collection" tab.

## v4 (2026-10-02)
- Removed WhatsApp link and the "Round 1/2/3" delivery widget from product pages; disabled 4K stock video block on product pages.
- New sections/hvx-countdown.liquid in the header group: counts down to a real sale window (default Black Friday
  2026-11-23 00:00 to 2026-11-30 23:59 US Eastern), shows "starts in" 3 days before, hides itself afterwards. Does not auto-restart.
- Hextom timer bar app embed disabled in config/settings_data.json (uninstall the app to remove it fully).
- snippets/hvc-product-popup.liquid restyled (white card, red top rule, theme font), opens after 12s or 50% scroll,
  14-day snooze, no "pay full price" confirmshaming. Still uses real code HAVOC10.
- New templates/page.contact.json + sections/hvx-contact.liquid: Shopify contact form (name, email, phone, order #, topic, message).
- Header/footer copy cleaned: honest free-shipping threshold ($250, from shipping settings), removed "50% OFF flash sale",
  "24 Hour Customer Service", demo menu labels, PayPal/Bitcoin/Maestro icons; fixed tel: link.
- Homepage trimmed to 11 sections, plainer copy, no scroll animations or hover lifts.

## v5 (2026-10-02)
- Countdown text: "Black Friday: up to 40% off · starts in / ends in". It runs for the fixed Nov 23–30 window only and does not auto-restart (no fake urgency).
- Popup: replaced invalid `font:` shorthands; on phones it is a bottom sheet with a full-width 16px email field (no iOS zoom) and 54px tap targets.
- Store email set to havocboxingstore@gmail.com (footer, contact section).
- Returns are now 14 days everywhere: product tab, trust list, homepage FAQ, product FAQ schema. MerchantReturnPolicy JSON-LD: 14 days, customer pays return shipping, US/UK/CA/EU/AU.
- Mobile: 16px quick-add selects, 44px chips, hover-swap image hidden on touch devices, compact countdown on phones.
