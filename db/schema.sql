-- ============================================================================
-- TRGOVINA — multi-shop commerce schema (Supabase / Postgres)
-- ============================================================================
-- One database serves every shop; every commercial row hangs off shops.id.
-- The shops table is deliberately thin — brand, keyword, design and slugs
-- live in code (src/tenants/*.ts), exactly the onlyworld split: the DB is the
-- FK anchor and the money ledger, the repo is the identity.
--
-- Money doctrine (inherited from ocenagor STRIPE.md, kept as law):
--   * All amounts are integer cents, gross, DDV included.
--   * The browser NEVER sets a price. create-payment-intent reprices the cart
--     from product_variants.price_cents and freight from the freight engine.
--   * Only the Stripe webhook may mark an order paid.
--
-- What ocenagor deliberately did NOT have and this network MUST:
--   * an orders table. "Orders live in Stripe" works for a €69 parcel; a €6k
--     pallet needs a freight booking, a delivery slot, an installation date,
--     a withdrawal window and an event ledger.
--
-- APPLIED. This is live on the project as migration `trgovina_initial_schema`.
-- It is no longer a design document: changing a statement here changes nothing
-- in the database, and a new migration is now the only way to alter it.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Shops — FK anchor. id matches ShopConfig.key ('savna', 'kad', 'bazen', 'fotelj').
-- ---------------------------------------------------------------------------
create table public.shops (
  id text primary key,
  domain text not null unique,
  name text not null,
  is_live boolean not null default false,
  -- Per-shop order numbering prefix: SAV-1042 reads better on an invoice and
  -- in a phone call than a UUID. UNIQUE because orders.number is globally
  -- unique — two shops sharing a prefix would collide on their first order.
  order_prefix text not null unique,
  created_at timestamptz not null default now()
);

-- The order counter lives OFF the shops row: next_order_number() takes a row
-- lock that is held until the calling transaction commits, and that lock must
-- never contend with shop-config writes. Service-role only (RLS, no policies).
create table public.shop_order_seq (
  shop_id text primary key references public.shops (id),
  seq integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Catalog. Data-driven where ocenagor's store.ts/catalogue.ts were hand-written
-- files — ten shops of saunas and cryo chambers cannot live in a TS literal.
-- The display/charge split survives: the storefront renders from these rows
-- over the anon key; create-payment-intent re-reads THE SAME rows over the
-- service role and prices from them. One source of truth, two trust levels.
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id text not null references public.shops (id),
  slug text not null,
  title text not null,
  subtitle text,
  -- 'published' rows render; 'draft' rows are invisible to the anon key via RLS.
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  -- Freight class feeds src/lib/freight.ts. The client never sends this.
  freight_class text not null check (
    freight_class in ('parcel', 'pallet', 'pallet_xl', 'two_man', 'white_glove')
  ),
  -- High-AOV buyers read everything. Render as the spec table; keys are
  -- shop-curated ('moč grelca', 'vrsta lesa', 'priklop').
  specs jsonb not null default '{}'::jsonb,
  -- '230V' vs '400V' decides whether an electrician visit gates installation —
  -- surfaced on the PDP, not discovered on delivery day.
  power_requirement text,
  -- Shipping volume per unit (owner's container math and outbound freight
  -- quoting read the same figure — 1.45–4.40 m3 across the launch catalog).
  volume_m3 numeric(6, 2) check (volume_m3 > 0),
  capacity_persons integer check (capacity_persons > 0),
  lead_time_days integer not null default 14 check (lead_time_days >= 0),
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, slug),
  -- Composite anchor so reviews can prove product ∈ shop (below).
  unique (shop_id, id)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- Unique per product, not globally: ten shops can carry overlapping
  -- manufacturer catalogs without inventing artificial SKUs.
  sku text not null,
  title text not null,
  -- {'velikost': '2m × 2m', 'les': 'cedra', 'grelec': '8kW'}
  attributes jsonb not null default '{}'::jsonb,
  -- Gross cents, DDV included — the ONLY price Stripe is ever charged from.
  price_cents integer not null check (price_cents > 0),
  -- >= so a sale can end by raising price_cents up to the compare-at value
  -- in one statement; render the strikethrough only when strictly greater.
  compare_at_cents integer check (compare_at_cents >= price_cents),
  -- Stock of a made-to-order sauna is a promise, not a shelf count.
  availability text not null default 'made_to_order'
    check (availability in ('in_stock', 'made_to_order', 'discontinued')),
  stock_qty integer check (stock_qty >= 0),
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, sku),
  -- Composite anchor so product_media can prove variant ∈ product (below).
  unique (product_id, id)
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid,
  -- Composite FK: the variant must belong to THIS product — an independent
  -- FK pair would happily attach shop A's media to shop B's variant.
  foreign key (product_id, variant_id)
    references public.product_variants (product_id, id) on delete cascade,
  kind text not null default 'image' check (kind in ('image', 'video')),
  url text not null,
  -- Alt text is an SEO surface, not an afterthought; enforced non-empty.
  alt text not null check (length(alt) > 0),
  sort integer not null default 0,
  -- The width rungs written for this image, narrowest first. Empty means one
  -- natural size. ⚠️ The WIDEST rung is stored at the bare url above and the
  -- narrower ones at "<stem>-<w>.webp" — so this array has one more entry than
  -- there are suffixed objects. Deriving the object set from it by hand is
  -- what once made deleting a photograph fail; admin/routes.ts storedPaths()
  -- is the one place that knows the rule.
  widths integer[] not null default '{}',
  -- True when the 2K upscaler REDREW this image before upload.
  --
  -- Recorded, never inferred. The width ladder cannot answer it: a row reading
  -- [480,800,1200,1600,2048] is produced identically by a 2048px photograph
  -- nobody touched and by a small one Gemini redrew at 2K, because the ladder
  -- is "every rung below the source, plus the source". Only the browser that
  -- made the request knows, so only the browser says.
  --
  -- It matters beyond curiosity: an enhanced image contains pixels that were
  -- never photographed. Under UCPD Article 6 a shop should be able to say
  -- which of its product images are generative output rather than guess, and
  -- whoever edits this catalogue is entitled to the same answer.
  enhanced boolean not null default false,
  -- WHICH KIND OF PHOTOGRAPH THIS IS, so galleries can be matched across
  -- models. Six pools shot the same way by the same supplier, and every
  -- gallery opened on a different kind of picture — a top-down view on one, a
  -- close-up of a jet on the next — so a customer comparing two of them had to
  -- learn each gallery instead of comparing like with like.
  --
  -- The model that already looks at every photograph to write its description
  -- is asked the second question in the same call, and the panel sorts by the
  -- answer. src/admin/shots.ts holds the vocabulary AND the order; the order is
  -- editorial and meant to be argued with, which is why it lives in code
  -- rather than being spelled into this constraint.
  --
  -- NULL means not yet classified, which is NOT the same as 'other' (looked at,
  -- fits none of the categories). Both sort last, so a photograph nobody has
  -- classified never jumps to the front of a gallery for want of an answer.
  shot text check (shot is null or shot in
    ('top', 'side', 'lit', 'cover', 'interior', 'seat', 'jets', 'other'))
);

-- ---------------------------------------------------------------------------
-- Orders. Created at create-payment-intent time with status 'pending' — the
-- row IS the lead (ocenagor's before-the-card-step pattern, one table instead
-- of a separate potential_clients): someone who bails at the payment screen is
-- already a contactable row with their configuration attached.
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id text not null references public.shops (id),
  number text not null unique, -- 'SAV-1042', from next_order_number()

  email text not null,
  phone text not null, -- freight NEEDS a phone: crews call before arrival
  name text not null,
  shipping_address jsonb not null,
  billing_address jsonb,

  -- Fulfilment lifecycle. Payment truth lives in payment_status; this is the
  -- physical journey. Transitions are appended to order_events, never inferred.
  status text not null default 'pending' check (status in (
    'pending',      -- intent created, card not confirmed (the lead state)
    'paid',         -- webhook confirmed; awaiting scheduling
    'scheduled',    -- delivery/installation slot agreed
    'in_transit',
    'delivered',
    'installed',
    'completed',    -- withdrawal window closed, order settled
    'cancelled',
    'withdrawn',    -- 14-day EU distance-selling withdrawal exercised
    'refunded'
  )),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),

  -- The lifecycle and the money must agree AT THE CONSTRAINT LAYER — the one
  -- that survives code bugs. No fulfilment status without a settled payment;
  -- 'refunded' fulfilment requires a refunded payment.
  constraint orders_status_payment_agree check (
    (status = 'pending' and payment_status in ('pending', 'failed'))
    or (status = 'cancelled')
    or (status in ('paid', 'scheduled', 'in_transit', 'delivered',
                   'installed', 'completed', 'withdrawn')
        and payment_status = 'paid')
    or (status = 'refunded' and payment_status = 'refunded')
  ),

  stripe_payment_intent_id text unique,

  subtotal_cents integer not null check (subtotal_cents >= 0),
  freight_cents integer not null check (freight_cents >= 0),
  -- The ledger may never claim a different amount than the sum of its parts:
  -- the webhook matches the Stripe charge against this column.
  total_cents integer not null
    check (total_cents = subtotal_cents + freight_cents),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  -- VAT snapshot at sale time (OSS-ready: destination country + applied rate).
  vat_country text not null,
  vat_rate numeric(4, 2) not null check (vat_rate >= 0 and vat_rate <= 100),

  -- The full FreightQuote from src/lib/freight.ts, persisted verbatim so the
  -- charge can always be explained line by line, years later.
  freight_quote jsonb not null,

  scheduled_delivery_on date,
  -- Withdrawal clock starts at DELIVERY, not payment (EU 2011/83). Set when
  -- status moves to delivered/installed.
  withdrawal_deadline date,

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Composite anchor so reviews can prove order ∈ shop (below).
  unique (shop_id, id)
);

create index orders_shop_status_idx on public.orders (shop_id, status);
create index orders_email_idx on public.orders (email);

-- Immutable price/title snapshots — a later price change must not rewrite
-- what a customer already agreed to pay. RESTRICT on the order: financial
-- history is never deleted as a side effect (purge pending leads explicitly,
-- children first). SET NULL on the variant: catalog cleanup must never
-- touch order history — the snapshots carry everything that matters.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete set null,
  qty integer not null check (qty >= 1),
  -- >= 0: a comped line (warranty replacement, bundled accessory) is legal;
  -- what stops client-set prices is the repricing function, not this check.
  unit_price_cents integer not null check (unit_price_cents >= 0),
  title_snapshot text not null,
  attributes_snapshot jsonb not null default '{}'::jsonb
);

-- Append-only ledger: every status change, crew note, customer call. The
-- answer to "what happened with this order" is a SELECT, not archaeology.
-- RESTRICT: an "append-only ledger" that a parent-row delete can vaporize
-- is not append-only.
create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  type text not null,
  actor text not null default 'system', -- 'system' | 'webhook' | admin email
  note text,
  data jsonb,
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------------------
-- Reviews — the trust engine. At this AOV a review with a photo of the sauna
-- steaming in someone's garden outsells any banner. verified means "we matched
-- it to an order", and only verified reviews render.
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id text not null references public.shops (id),
  product_id uuid,
  order_id uuid,
  -- Composite FKs: the reviewed product and the verifying order must belong
  -- to THIS shop — independent FKs would let a savna review point at a krio
  -- product. Column-list SET NULL (PG15+) clears only the reference, never
  -- shop_id. order_number_snapshot keeps provenance if the order ever goes.
  foreign key (shop_id, product_id)
    references public.products (shop_id, id) on delete set null (product_id),
  foreign key (shop_id, order_id)
    references public.orders (shop_id, id) on delete set null (order_id),
  order_number_snapshot text,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  photo_urls text[] not null default '{}',
  verified boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Rate limiting — closes the hole STRIPE.md documented and shipped anyway
-- ("Not rate limited… worth adding before promoting the store widely").
-- create-payment-intent consumes a token per (ip, bucket) window before doing
-- any work; ten shops on one endpoint multiply the exposure ten times.
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  ip inet not null,
  bucket text not null, -- 'create-payment-intent'
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (ip, bucket, window_start)
);

-- ---------------------------------------------------------------------------
-- Analytics — page_events, the onlyworld pattern: first-party, no third-party
-- pixel needed for the funnel we care about (land → configure → cart → paid).
-- ---------------------------------------------------------------------------
create table public.page_events (
  id bigint generated always as identity primary key,
  shop_id text not null references public.shops (id),
  session_id uuid not null,
  type text not null,
  path text not null,
  referrer text,
  data jsonb,
  created_at timestamptz not null default now()
);

create index page_events_shop_time_idx on public.page_events (shop_id, created_at);

-- ---------------------------------------------------------------------------
-- Per-shop order numbers, race-safe. The counter row lives in shop_order_seq
-- so the lock (held until the caller's transaction commits) contends only
-- with sibling checkouts of the same shop, never with shop-config writes.
-- ---------------------------------------------------------------------------
create or replace function public.next_order_number(p_shop_id text)
returns text
language plpgsql
-- Empty search_path, so an unqualified name can never resolve into a schema
-- a caller controls. Every reference below is schema-qualified, which is what
-- makes this safe; adding an unqualified one will fail loudly rather than
-- silently resolve somewhere else.
set search_path = ''
as $$
declare
  v_seq integer;
  v_prefix text;
begin
  update public.shop_order_seq
  set seq = seq + 1
  where shop_id = p_shop_id
  returning seq into v_seq;
  if v_seq is null then
    raise exception 'unknown shop %', p_shop_id;
  end if;
  select order_prefix into v_prefix from public.shops where id = p_shop_id;
  return v_prefix || '-' || (1000 + v_seq)::text;
end;
$$;

-- Keep updated_at honest without relying on every code path remembering it.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security. Default posture: RLS on everywhere; no policy = no
-- access for the anon key. The service role (Edge Functions) bypasses RLS by
-- design — orders, events, rate limits and analytics writes happen only there.
-- ---------------------------------------------------------------------------
alter table public.shops enable row level security;
alter table public.shop_order_seq enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.reviews enable row level security;
alter table public.rate_limits enable row level security;
alter table public.page_events enable row level security;

-- Public storefront reads: live shops, published products only.
-- RLS filters rows; grants filter COLUMNS — without the revoke below, the
-- anon key could read order_prefix and infer nothing much, but the principle
-- is the posture: the public surface exposes exactly what the storefront
-- renders, nothing else.
revoke select on public.shops from anon, authenticated;
grant select (id, domain, name, is_live) on public.shops to anon, authenticated;

create policy shops_public_read on public.shops
  for select using (is_live);

create policy products_public_read on public.products
  for select using (
    status = 'published'
    and exists (
      select 1 from public.shops s
      where s.id = products.shop_id and s.is_live
    )
  );

create policy variants_public_read on public.product_variants
  for select using (
    exists (
      select 1
      from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_variants.product_id
        and p.status = 'published'
        and s.is_live
    )
  );

create policy media_public_read on public.product_media
  for select using (
    exists (
      select 1
      from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_media.product_id
        and p.status = 'published'
        and s.is_live
    )
  );

-- ---------------------------------------------------------------------------
-- The deploy reads the image index.
--
-- The storefront renders src/themes/studio/own-media.ts, generated from these
-- two tables, because handleRequest is synchronous and cannot query anything.
-- Regenerating that by hand meant it went stale the moment a photograph was
-- added or deleted through /admin — which shipped a deleted picture twice and
-- a broken one once, in one evening.
--
-- The two policies above are right for a STOREFRONT and useless for a BUILD:
-- they require status='published' and is_live, so a pre-live shop shows an
-- anonymous reader nothing, which is the state the index is most needed in.
--
-- ⚠️ WHAT THIS EXPOSES IS ALREADY PUBLIC — every url and alt is rendered into
-- a product page and served to visitors and to Google. The alternative was the
-- SERVICE key in CI, which bypasses every policy in this database, to read a
-- list of filenames.
--
-- ⚠️ THE COLUMN GRANT IS THE HALF THAT MAKES IT SAFE. RLS filters rows, grants
-- filter columns. Opening the rows alone would have published products.specs,
-- subtitle, power_requirement and lead_time_days — the last of which is a
-- commercial commitment nobody has made. anon sees the three columns the
-- generator selects and no others.
-- ---------------------------------------------------------------------------
create policy index_build_read on public.products
  for select to anon using (true);
create policy index_build_read on public.product_media
  for select to anon using (true);

revoke select on public.products from anon;
grant select (id, shop_id, slug) on public.products to anon;

create policy reviews_public_read on public.reviews
  for select using (
    published
    and verified
    and exists (
      select 1 from public.shops s
      where s.id = reviews.shop_id and s.is_live
    )
  );

-- ---------------------------------------------------------------------------
-- BLOG POSTS — the one piece of content read at request time.
--
-- Every other page on this site is a TypeScript module compiled into the
-- Worker, which is right for a catalogue that changes when somebody changes
-- code and wrong for a blog: publishing a post that appears at the next deploy
-- is not publishing. So posts are rows, and src/blog/routes.ts reads them on
-- the request behind the same async layer that serves /admin and /media.
--
-- body is jsonb holding {"source": "…"} — the text the operator typed, and
-- nothing else. It is parsed into the theme's block vocabulary on every
-- render (src/blog/post.ts) rather than stored as blocks or as HTML: as blocks
-- there would be two records of one post that can disagree, and as HTML a
-- taken admin account could serve script from the storefront. jsonb rather
-- than text so a later field costs no migration.
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  shop_id      text not null references public.shops(id),
  slug         text not null,
  title        text not null,
  excerpt      text not null default '',
  body         jsonb not null default '[]'::jsonb,
  cover_url    text,
  cover_alt    text not null default '',
  status       text not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (shop_id, slug)
);

create index if not exists posts_published_idx
  on public.posts (shop_id, published_at desc)
  where status = 'published';

alter table public.posts enable row level security;

-- What anyone in the world may read: a published post on a live shop.
create policy posts_public_read on public.posts
  for select using (
    status = 'published'
    and exists (select 1 from public.shops s where s.id = posts.shop_id and s.is_live)
  );

-- ⚠️ AND THE SAME AGAIN WITHOUT THE LIVE CHECK, FOR ANON ONLY, BECAUSE THE
-- SHOP IS NOT LIVE YET. The storefront's own live gate already refuses to
-- serve anything on a pre-live domain (src/worker.ts, and handlePosts applies
-- it first), so this does not publish a blog on a closed domain — it is what
-- lets the QA host show the operator what they just wrote. Drop it the day
-- shops.is_live goes true for bazen.
create policy posts_prelive_read on public.posts
  for select to anon using (status = 'published');

-- Writes are an admin's, through their own token — there is no service key in
-- the Worker. Same shape as admins_write_product_media.
create policy posts_admin_write on public.posts
  for all to authenticated using (is_admin()) with check (is_admin());

revoke select on public.posts from anon;
grant select (id, shop_id, slug, title, excerpt, body, cover_url, cover_alt,
              status, published_at, updated_at) on public.posts to anon;

-- orders / order_items / order_events / rate_limits / page_events /
-- shop_order_seq: deliberately NO anon policies. Service role only.

-- ---------------------------------------------------------------------------
-- THE PUBLISHABLE KEY MAY NOT WRITE. ANYWHERE.
--
-- ⚠️ RUN THIS LAST, AND RUN IT AGAIN AFTER ADDING A TABLE. Supabase grants anon
-- and authenticated everything on a new table in public, so a table created
-- after this block re-opens the hole this closes.
--
-- The project relied on RLS alone to refuse anonymous writes, and RLS was
-- doing it: it is enabled on every table and the only write policies are the
-- three admin ones, each `to authenticated` behind is_admin(). Nothing was
-- exploitable. It was still the wrong shape, because of what the anon key IS
-- here — public by design, in wrangler.jsonc, shipped to browsers. The default
-- grant was one mistake away from being a hole: RLS disabled to debug
-- something, or a policy written `using (true)` with no role clause, and
-- anyone at all could write. On public.admins — the allowlist that decides who
-- administers the shop — that mistake hands over the whole back office.
--
-- Two locks is the point. RLS decides which ROWS; the grant decides whether
-- the role may write AT ALL, and for a key printed in a config file the answer
-- is no. Nothing in this repository writes as anon: the storefront only reads
-- (published posts, and the index rebuild's three product columns), and every
-- admin call carries the signed-in person's token and acts as `authenticated`.
--
-- SELECT is deliberately untouched — the column grants above are doing real
-- work and the storefront depends on them.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format(
      'revoke insert, update, delete, truncate on public.%I from anon', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed the pilots (matches src/tenants/*.ts keys).
-- ---------------------------------------------------------------------------
insert into public.shops (id, domain, name, is_live, order_prefix) values
  ('savna', 'infrardeca-savna.si', 'Infrardeča Savna', false, 'SAV'),
  ('kad', 'ledena-kad.si', 'Ledena Kad', false, 'KAD'),
  ('bazen', 'masazni-bazen.si', 'Masažni Bazen', false, 'BAZ'),
  ('fotelj', 'masazni-fotelj.si', 'Masažni Fotelj', false, 'FOT'),
  ('kopalna', 'prostostojeca-kad.si', 'Prostostoječa Kad', false, 'KOP'),
  ('biljard', 'biljardna-miza.si', 'Biljardna Miza', false, 'BIL');

insert into public.shop_order_seq (shop_id) values
  ('savna'), ('kad'), ('bazen'), ('fotelj'), ('kopalna'), ('biljard');
