# Indexing audit — havocboxinggear.com (2026-10-02)

## Store state
- 196 active products (all published to Online Store, none with seo.hidden)
- 278 archived + 26 draft products (old URLs Google already knew)
- 15 collections, 9 pages; robots.txt.liquid and meta robots checked: no accidental noindex/disallow on products or collections

## Fixed
- 25 new 301 redirects for dead product URLs that returned 404 with no redirect
  (incl. old Cleto Reyes handles left behind by renames)
- 27 redirects repointed: 6 pointed at 404 pages, 21 chained through a second redirect
- /collections/frontpage (theme "Home page" collection, 1 product) set to noindex (seo.hidden)
- Result: 422 redirects, 0 broken targets, 0 chains

## Left as 404 on purpose
test-product-diagnostic, rfd, bb, v-c, gfd — junk drafts, never real pages.

## Not fixable via API (live theme is write-protected)
- snippets/hvc-seo-global.liquid: MerchantReturnPolicy applicableCountry is "AU"; should match real markets (US, GB, CA, EU) and returnFees must match the real refund policy.

## Round 2 — after Search Console screenshot (1,223 x 404)
- Root cause: de/es/fr storefront languages are published, so every old product URL also 404'd at /de/, /es/, /fr/ (~304 x 4).
- Imported 1,688 locale-prefixed redirects (/de, /es, /fr, /it) mirroring all 422 base redirects -> total 2,110 redirects.
- Fixed 2 blog articles linking through redirects (lace-up vs hook & loop; what size gloves) and corrected the size range to 6oz-18oz.
- Open: ~155 products have OUTDATED fr/de/es translations (old titles, 8-16oz, links to old collection handles). Likely a main driver of "Crawled - currently not indexed" (778).
