# Deploying trgovina (Cloudflare Workers)

One Worker (`trgovina`) serves every shop; the shop resolves per-request from
the Host header. All four shops are **pre-live**: real domains would serve
503 + noindex, and no domains are routed yet. The QA surface is
**https://trgovina.worldfans.workers.dev** — permanently noindexed, with a
dev-only switcher bar (`?shop=savna|kad|bazen|fotelj`, `?theme=zarja|lednik|salon`).

## First deploy (~2 minutes)

Everything is wired; one secret is needed:

1. GitHub → `juresavron/trgovina` → Settings → Secrets and variables →
   Actions → **New repository secret**:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: the same "Edit Cloudflare Workers" token the fans-network /
     ocenagor-landing workflows use (or create one: Cloudflare dashboard →
     My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"
     template). The account ID is already in the workflow (public
     identifier, account `a92371cf…` — verified via the Cloudflare
     connector, which sees `fans-network` and `ocenagor-landing`).
2. Actions tab → **Deploy trgovina** → Run workflow.

The workflow typechecks, runs the 31 tests, deploys, then smoke-tests the
QA host (200, keyword content, noindex header, closed robots.txt).

Local alternative, from a machine with the token:

```bash
npm ci
export CLOUDFLARE_API_TOKEN=...  CLOUDFLARE_ACCOUNT_ID=a92371cf91375ec80a58c86db49c4cdb
npx wrangler deploy
```

## What is live after deploy

- `/` — the keyword landing page per shop (server-rendered, theme from the
  shop's `ShopConfig`)
- `/<product-slug>/<flagship>` — flagship PDP with Product/Offer JSON-LD
  (deliberately **no** review schema while reviews are placeholders)
- every other route — styled placeholder, noindexed
- `robots.txt` closed until a shop is live; `sitemap.xml` 404 until live

## Attaching a real domain (per shop)

Follow the numbered steps in `wrangler.jsonc` — fresh registration only,
zone Active in THIS account before routing (error 10082 fails the whole
network's deploy), www + apex both routed, redirect rule at the zone.
Go-live is `live: true` in `src/tenants/<shop>.ts` + `is_live` row + deploy,
then Search Console + Bing + sitemap (docs/SEO.md §7).
