import hero from './optimized/hero.webp';
import tubs from './optimized/kategorija-masazni-bazeni.webp';
import swim from './optimized/kategorija-swim-spa.webp';

// These are smaller encodings of the exact existing photographs, with the
// same dimensions and crop. Replacements made in the admin must win: only
// substitute when Storage still identifies the original bytes by their ETag.
const photos: Record<string, { etag: string; bytes: ArrayBuffer }> = {
  'site/hero.webp': { etag: '10a94c74e94f858df2308c84cb2cf555', bytes: hero },
  'site/kategorija-masazni-bazeni.webp': { etag: '3efecd8cd14eef31410967c6888c2737', bytes: tubs },
  'site/kategorija-swim-spa.webp': { etag: 'd16cc433a4645355034c4b2c43084312', bytes: swim },
};

export async function optimizedSitePhoto(key: string, origin: Response): Promise<Response> {
  const photo = Object.hasOwn(photos, key) ? photos[key] : undefined;
  const etag = origin.headers.get('etag')?.replace(/^W\//, '').replace(/^"|"$/g, '').toLowerCase();
  if (!origin.ok || !photo || etag !== photo.etag) return origin;
  await origin.body?.cancel();
  return new Response(photo.bytes, { headers: { 'content-type': 'image/webp' } });
}
