import { describe, expect, it, vi } from 'vitest';
vi.mock('./optimized/hero.webp', () => ({ default: new Uint8Array([1, 2, 3]).buffer }));
vi.mock('./optimized/kategorija-masazni-bazeni.webp', () => ({ default: new Uint8Array([4, 5]).buffer }));
vi.mock('./optimized/kategorija-swim-spa.webp', () => ({ default: new Uint8Array([6, 7]).buffer }));
import { optimizedSitePhoto } from './optimized-site-photo';

describe('smaller encodings of the current site photographs', () => {
  it.each([
    ['site/hero.webp', '10a94c74e94f858df2308c84cb2cf555', [1, 2, 3]],
    ['site/kategorija-masazni-bazeni.webp', '3efecd8cd14eef31410967c6888c2737', [4, 5]],
    ['site/kategorija-swim-spa.webp', 'd16cc433a4645355034c4b2c43084312', [6, 7]],
  ] as const)('substitutes only the captured original for %s', async (key, etag, bytes) => {
    const origin = new Response('original', { headers: { etag: `"${etag}"` } });
    const result = await optimizedSitePhoto(key, origin);
    expect(result.headers.get('content-type')).toBe('image/webp');
    expect([...new Uint8Array(await result.arrayBuffer())]).toEqual(bytes);
  });

  it('keeps a later admin replacement, its headers and its body', async () => {
    const origin = new Response('new photograph', { headers: { etag: '"new-upload"', 'content-type': 'image/jpeg' } });
    const result = await optimizedSitePhoto('site/hero.webp', origin);
    expect(result).toBe(origin);
    expect(await result.text()).toBe('new photograph');
  });

  it.each(['site/other.webp', '__proto__', 'constructor'])('does not substitute unrelated key %s', async key => {
    const origin = new Response('unchanged', { headers: { etag: '"10a94c74e94f858df2308c84cb2cf555"' } });
    expect(await optimizedSitePhoto(key, origin)).toBe(origin);
  });

  it('keeps sources whose content identity is unknown', async () => {
    const origin = new Response('no etag');
    expect(await optimizedSitePhoto('site/hero.webp', origin)).toBe(origin);
  });
});
