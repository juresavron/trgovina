-- ============================================================================
-- finishes_public_read — the read path the deploy's colour generator needs
-- ============================================================================
-- ⚠️ NOT APPLIED YET. Run this in the Supabase SQL editor (or via a migration)
-- and then redeploy. Until it runs, every deploy ships an EMPTY colour list.
--
-- WHAT WENT WRONG. The colour list is baked into the Worker at deploy time by
-- scripts/sync-finishes.mjs, because the configurator renders inside a
-- synchronous, env-free handleRequest and cannot query per request. That
-- generator reads with the PUBLISHABLE key, exactly as the media and review
-- generators do — and products, product_media and reviews each got an anon
-- read policy plus a column grant in schema.sql for precisely that reason.
--
-- `finishes` never did. It was created after schema.sql was applied, RLS is on,
-- and no policy names anon. PostgREST answers such a request with 200 and an
-- EMPTY ARRAY rather than an error, so the generator saw "this shop has no
-- colours", wrote an empty list, and the deploy went green — while every
-- product page fell back to the transcribed supplier chart. Six uploaded
-- swatches, a green build, and the old ten colours on the site.
--
-- ⚠️ THE COLUMN GRANT IS THE HALF THAT MAKES IT SAFE, same as products above.
-- RLS filters rows, grants filter columns. anon gets the four the generator
-- selects plus shop_id, which its filter needs — and not `id`, which is the
-- handle the panel's rename and delete routes address a row by.
--
-- Additive only: it adds read access and changes nothing else. The RLS enable
-- state is deliberately left alone, because turning RLS on or off here would
-- change who may WRITE, and the panel's own inserts and updates depend on that.
--
-- Nothing private is exposed. Every column below is already printed beside a
-- swatch on the public product pages.
-- ============================================================================

create policy finishes_public_read on public.finishes
  for select to anon using (true);

revoke select on public.finishes from anon;
grant select (shop_id, kind, name, slug, position) on public.finishes to anon;
