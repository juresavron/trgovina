// These are smaller encodings of the exact existing photographs, with the
// same dimensions and crop. Replacements made in the admin must win: only
// substitute when Storage still identifies the original bytes by their ETag.
const photos: Record<string, { etag: string; path: string }> = {
  'site/hero.webp': { etag: '10a94c74e94f858df2308c84cb2cf555', path: '/img/optimized-site/hero-c597fc3aa6ee.webp' },
  'site/kategorija-masazni-bazeni.webp': { etag: '3efecd8cd14eef31410967c6888c2737', path: '/img/optimized-site/kategorija-masazni-bazeni-ef79fe2d7223.webp' },
  'site/kategorija-swim-spa.webp': { etag: 'd16cc433a4645355034c4b2c43084312', path: '/img/optimized-site/kategorija-swim-spa-5567b7bf3f23.webp' },
};

type Assets = { fetch(request: Request): Promise<Response> };
export async function optimizedSitePhoto(key: string, origin: Response, assets?: Assets): Promise<Response> {
  const photo = Object.hasOwn(photos, key) ? photos[key] : undefined;
  const etag = origin.headers.get('etag')?.replace(/^W\//, '').replace(/^"|"$/g, '').toLowerCase();
  if (!origin.ok || !assets || !photo || etag !== photo.etag) return origin;
  try {
    const optimized = await assets.fetch(new Request('https://assets.invalid' + photo.path));
    if (!optimized.ok) return origin;
    await origin.body?.cancel().catch(() => {});
    return optimized;
  } catch {
    return origin;
  }
}
