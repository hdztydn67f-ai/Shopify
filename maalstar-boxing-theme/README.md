# Maalstar Boxing — Custom Shopify Theme

A hand-built, conversion-focused Online Store 2.0 theme for a premium boxing
equipment store. Dark, high-contrast, gold-on-black "built for the fight"
aesthetic with an Ajax cart drawer, age verification, cookie consent and
SEO-hardened markup.

---

## Build progress

| Step | Scope | Status |
| --- | --- | --- |
| **1** | `theme.liquid`, global CSS variables, `header.liquid` (+ top bar), cart drawer, age gate, cookie banner | ✅ Done |
| **2** | Hero banner, tabbed product grid, `product-card.liquid`, quick view, quick add, wishlist | ✅ Done |
| **3** | Secondary split banner, newsletter section | ✅ Done |
| **4** | Footer section, policies, payment icons | ✅ Done |

| **5** | Product page: gallery, variant picker, Ajax add to cart, related products | ✅ Done |
| **6** | Collection page: faceted filtering, sorting, pagination, SEO blocks; collections index | ✅ Done |
| **7** | Search (predictive dropdown + results page), cart page, blog, article, page, 404 | ✅ Done |

**Every template is now built.** No placeholders remain — the theme can be
uploaded and taken through a full purchase journey.

---

## Folder structure

```
maalstar-boxing-theme/
├── assets/
│   ├── base.css              # Design system: layout, buttons, fields, header, drawer, modals
│   ├── components.css        # Hero, tabs, product grid/card, price, quick view modal
│   └── theme.js              # Ajax cart, drawer, age gate, cookie banner, header, tabs,
│                             # quick add, quick view, wishlist
├── config/
│   ├── settings_schema.json  # Theme editor settings (colors, type, cart, age gate, SEO)
│   └── settings_data.json    # Default values for a fresh install
├── layout/
│   └── theme.liquid          # HTML shell, SEO/meta/JSON-LD, CSS tokens, cart drawer, modals
├── locales/
│   └── en.default.json       # All UI strings (translatable)
├── sections/
│   ├── header.liquid         # Top bar + sticky header + mobile nav
│   ├── hero-banner.liquid    # Full-bleed image/video hero, carries the H1
│   ├── tabbed-products.liquid# "Trending Now" tabs — no reload, no refetch
│   ├── split-banner.liquid   # "HANDMADE GEAR. FIGHTER APPROVED."
│   ├── newsletter.liquid     # "LET'S GET IN TOUCH" — Shopify customer form
│   ├── footer.liquid         # Multi-column: brand, links, policies, contact
│   ├── main-product.liquid   # Block-driven product page
│   ├── related-products.liquid # Recommendations API, loaded after paint
│   ├── main-collection.liquid  # Facets, sorting, grid, pagination, SEO blocks
│   ├── main-list-collections.liquid # The /collections index
│   ├── main-search.liquid    # Search results with the same facets as a collection
│   ├── predictive-search.liquid # Fragment for the header dropdown
│   ├── main-cart.liquid      # Full cart page
│   ├── main-blog.liquid / main-article.liquid / main-page.liquid
│   ├── main-404.liquid       # 404 with search and a route back in
│   ├── header-group.json     # Section group rendered by {% sections 'header-group' %}
│   └── footer-group.json     # Footer group, pre-populated with four columns
├── snippets/
│   ├── icon-sprite.liquid    # One inline SVG sprite for every icon
│   ├── icon.liquid           # {% render 'icon', name: 'cart' %}
│   ├── product-card.liquid   # Badges, hover image, wishlist, quick view, quick add
│   ├── price.liquid          # Compare-at + unit pricing
│   ├── quick-view.liquid     # Quick view body with variant picker
│   ├── social-links.liquid   # Social icons from the global settings
│   ├── breadcrumbs.liquid    # Visual breadcrumbs (JSON-LD lives in theme.liquid)
│   ├── product-media-gallery.liquid
│   ├── product-variant-picker.liquid
│   ├── facets.liquid         # Filter + sort form (works without JS)
│   ├── pagination.liquid     # Numbered pagination with real links
│   ├── cart-drawer-item.liquid
│   └── free-shipping-bar.liquid
└── templates/
    ├── index.json            # Hero + Trending Now wired up
    ├── product.quick-view.liquid  # Bare fragment fetched by the quick view modal
    ├── *.json                # Remaining placeholders — filled in Steps 3–4
    └── robots.txt.liquid
```

---

## Running it locally with Shopify CLI

```bash
# 1. Install the CLI (macOS/Linux via Homebrew, or npm anywhere)
npm install -g @shopify/cli@latest

# 2. Log in to your store
shopify auth logout
shopify theme dev --store your-store.myshopify.com --path ./maalstar-boxing-theme
```

`shopify theme dev` gives you a hot-reloading preview URL. Other useful commands:

```bash
shopify theme check  --path ./maalstar-boxing-theme   # Lint Liquid + schema
shopify theme push   --path ./maalstar-boxing-theme --unpublished   # Upload as a draft theme
shopify theme pull   --path ./maalstar-boxing-theme   # Pull editor changes back down
```

### Starting from an empty theme instead

```bash
shopify theme init maalstar-boxing-theme --clone-url https://github.com/Shopify/dawn
# or scaffold the bare directories yourself:
mkdir -p my-theme/{assets,config,layout,locales,sections,snippets,templates/customers}
```

Shopify requires at minimum `layout/theme.liquid`, `config/settings_schema.json`
and `templates/index.json` for a theme to upload.

---

## First-run setup in the admin

1. **Online Store → Navigation** — create a `main-menu` with: Home, Boxing
   Gloves, Boxing Sets, Winning, Contact.
2. **Theme editor → Header** — pick the menu, upload the logo, toggle the
   country/language selectors.
3. **Settings → Markets** — add the countries you sell to so the currency
   dropdown has more than one entry (it hides itself otherwise).
4. **Theme settings → SEO** — set the homepage tagline, meta description and
   business phone/email (these feed the Organization schema).
5. **Theme settings → Cart** — set the free-shipping threshold in store currency.

---

## SEO built into Step 1

- Page-type-aware `<title>` and meta description with sane fallbacks
- Canonical URL, `rel=prev/next` pagination hints, `noindex` on search/cart/account
- `max-image-preview:large` robots directive for bigger SERP thumbnails
- Open Graph + Twitter Card tags, including `product:price` on product pages
- JSON-LD: `Organization`, `WebSite` + `SearchAction` (sitelinks search box),
  `Product` with per-variant offers, `BlogPosting`, `BreadcrumbList`,
  `SiteNavigationElement`
- `<h1>` reserved for the logo on the homepage only, so section headings keep a
  clean hierarchy on every other template
- `preconnect`/`dns-prefetch` to the Shopify CDN, `font-display: swap`,
  deferred JS, `fetchpriority="high"` on the logo — all Core Web Vitals inputs
- `rel="nofollow"` on account/wishlist links to keep crawl budget on products
- Editable `robots.txt.liquid` for later crawl-budget tuning

hreflang tags are intentionally *not* hand-written — Shopify emits them inside
`content_for_header` for every published market/language, and duplicating them
causes conflicting signals.

---

## Merchandising hooks (Step 2)

- **Custom ribbon** — tag a product `badge:Fighter Approved` and that text
  renders as a gold ribbon on its card. Any tag starting with `badge:` works.
- **Low stock urgency** — cards automatically show "Only N left" when a
  variant tracks inventory, denies overselling, and has 5 or fewer units.
- **Sale badge** — "Flat N% off" is calculated from compare-at price; set a
  compare-at price on the variant and the badge appears with the crossed-out
  price.
- **Quick add vs. choose options** — single-variant products add straight to
  the cart via Ajax; multi-variant products open the quick view so the
  customer picks a size/colour without leaving the grid.
- **Wishlist** — stored per browser in `localStorage` under `msb:wishlist`.
  Point the header wishlist icon at a page in **Theme settings → Header**.

---

## Footer + newsletter notes (Steps 3–4)

- **Policies are live, not hardcoded.** The Policies column reads
  `shop.privacy_policy`, `refund_policy`, `shipping_policy`,
  `terms_of_service` and `subscription_policy` straight from
  **Settings → Policies**. Write them there and they appear; leave one blank
  and no dead link is published.
- **Payment icons** come from `shop.enabled_payment_types`, so they always
  match what checkout actually accepts.
- **Newsletter** posts through Shopify's `customer` form and tags the
  subscriber `newsletter` with `accepts_marketing` set. They land in
  **Customers**, and any email platform synced to Shopify picks them up. To
  deliver the 10% code, create an automation in Shopify Email (or Klaviyo)
  triggered on that tag — the theme captures the subscriber, the automation
  sends the code.
- **Business address** lives in **Theme settings → SEO → Business address**.
  One entry feeds both the footer contact column and the `Organization`
  structured data, so your name/address/phone stays consistent — which is
  exactly what local search rewards. The footer contact block can override it
  per-column if you have a second location.

---


## Product page notes

- **Block-driven.** Vendor, title, rating, price, inventory, variant picker,
  quantity, buy buttons, trust badges, description, accordion rows, text and
  share are all blocks — reorder or remove any of them in the theme editor
  without touching code. `@app` blocks are supported, so review and upsell
  apps drop straight in.
- **Dead combinations are marked, not hidden.** Picking a size that does not
  exist (or is sold out) with the current colour shows it struck through
  rather than removing it, so customers can still see you make that size —
  they just cannot add it and hit an error at checkout.
- **The URL tracks the variant.** Selecting an option rewrites
  `?variant=` via `history.replaceState`, so a customer sharing the link
  shares the exact glove they were looking at.
- **Related products load after paint.** The section renders empty and
  `theme.js` fetches the Recommendations API, so recommendations never delay
  the product page's own LCP. Switch between related and complementary
  products in the editor (complementary needs the Search & Discovery app).
- **Add to cart is Ajax** and opens the drawer — the customer never leaves
  the product page, which is where the upsells are.

---

## Collection page notes

- **Filtering is Ajax but the URL is real.** Changing a filter re-renders the
  grid through the Section Rendering API and pushes the new URL with
  `history.pushState`. Back/forward work, the filtered view is shareable, and
  Google can still crawl it. If the fetch ever fails the page falls back to a
  normal navigation rather than showing a stale grid.
- **It works with JavaScript off.** The facets are a real GET form with a
  submit button; JS only intercepts it. Same for pagination — numbered `<a>`
  links, not buttons, so crawlers can walk the whole collection.
- **Desktop and mobile differ deliberately.** On desktop, filter groups are
  dropdowns that apply on change. On mobile they are a drawer where changes
  commit on Apply, so a customer on a phone is not firing a request per tap.
- **Filters come from Search & Discovery.** Install Shopify's free Search &
  Discovery app and configure filters there; the theme renders whatever you
  define, including price range.
- **SEO blocks sit below the grid.** Add "SEO text" and "FAQ" blocks per
  collection: products stay above the fold, and the FAQ blocks emit `FAQPage`
  structured data, which is what earns expandable rows in search results.

---

## Search notes

- **Predictive dropdown** in the header queries `/search/suggest` and renders
  `sections/predictive-search.liquid`, covering products, collections, pages
  and articles. Full keyboard support: arrow keys move through results, Enter
  opens, Escape closes, and it is wired as an ARIA combobox.
- **Results page reuses the collection facets**, so a customer who searches
  "gloves" can then filter by weight and colour. On-site searchers convert far
  better than browsers, which is why this page gets the full treatment rather
  than a flat list.
- **A zero-result search is not a dead end.** It offers the popular searches
  you configure plus a fallback collection of best sellers, so the visit has
  somewhere to go.
- **Results are cached per term** in memory for the session, so backspacing
  through a query does not re-hit the network.
