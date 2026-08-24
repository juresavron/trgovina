# trgovina

**One commerce kernel, N single-keyword shops.** One Cloudflare Worker, one
Supabase database, one Stripe pipeline, one freight engine — and one config
file per shop. Shop #1: `finskasavna.si`. Shop #2: `kriokomora.si`. Shop #11:
a `ShopConfig` and a DNS record.

**SEO is priority #1**: each shop targets position 1 in Slovenia for exactly
one commercial head term. The architecture is downstream of that goal.

## Documents

| | |
| --- | --- |
| [`docs/SEO.md`](docs/SEO.md) | The #1 priority — one-keyword architecture, technical baseline, schema stack, E-E-A-T, the anti-doorway network rule, launch sequence |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | The kernel: lineage from `onlyworld` (chassis) + `ocenagor-landing-lovable-13` (payments), commerce invariants, orders & fulfilment, deploy model |
| [`docs/DESIGN.md`](docs/DESIGN.md) | World-class at €3–15k AOV — one skeleton, two design souls (`warm`/`crisp`), component vocabulary, photography direction |

## Code (kernel, this stage)

| | |
| --- | --- |
| `src/tenants/types.ts` | `ShopConfig` — the whole multi-shop mechanism |
| `src/tenants/savna.ts`, `krio.ts` | Pilot shops (warm / crisp modes) |
| `src/tenants/index.ts` | Registry + `resolveShop(host)` — unknown host → 404 |
| `src/lib/freight.ts` | Freight pricing engine: 5 classes × zones × services, throws instead of guessing |
| `src/lib/freight.test.ts` | 15 tests pinning every lane and refusal |
| `db/schema.sql` | Shops, catalog, orders + event ledger, verified reviews, rate limits, RLS |

```bash
npm install
npm test        # freight engine
npm run typecheck
```

## Next

Chassis port (TanStack Start SSR on the Worker) → storefront → checkout →
admin → pilot content → launch gates. See ARCHITECTURE.md "Build order".
