# Shopify
Shopify theme development

## Shopify CLI

The Shopify CLI (which includes all `shopify theme` commands) is pinned as a dev
dependency in `package.json`.

### Install

```bash
npm install
```

Or install it globally instead:

```bash
npm install -g @shopify/cli@latest
```

Requires Node.js 20.10 or higher (`node -v`).

### Verify

```bash
npx shopify version
npx shopify theme --help
```

### Common commands

| Command | What it does |
| --- | --- |
| `npx shopify theme init` | Start a new theme from Dawn |
| `npx shopify theme pull` | Download the live theme's files locally |
| `npx shopify theme dev` | Run a local dev server with hot reload |
| `npx shopify theme push` | Upload local files to the store |
| `npx shopify theme check` | Lint the theme (Theme Check) |
| `npx shopify theme list` | List themes in the store with IDs and statuses |

`theme dev` opens a browser to log in to your store on first run. To skip the
prompt, pass the store: `npx shopify theme dev --store your-store.myshopify.com`.
