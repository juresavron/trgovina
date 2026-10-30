import { describe, expect, it, vi } from 'vitest';
import { optimizedSitePhoto } from './optimized-site-photo';
const content = 'smaller photograph';
const assets = () => ({ fetch: vi.fn(async (_request: Request) => new Response(content, { headers: { 'content-type': 'image/webp' } })) });
const original = () => new Response('original', { headers: { etag: '"10a94c74e94f858df2308c84cb2cf555"' } });

describe('smaller encodings of the current site photographs', () => {
  it.each([
    ['site/hero.webp', '10a94c74e94f858df2308c84cb2cf555'],
    ['site/kategorija-masazni-bazeni.webp', '3efecd8cd14eef31410967c6888c2737'],
    ['site/kategorija-swim-spa.webp', 'd16cc433a4645355034c4b2c43084312'],
  ])('substitutes only the captured original for %s', async (key, etag) => {
    const origin = new Response('original', { headers: { etag: `"${etag}"` } });
    const binding = assets();
    const result = await optimizedSitePhoto(key!, origin, binding);
    expect(result.headers.get('content-type')).toBe('image/webp');
    expect(await result.text()).toBe(content);
    const request = binding.fetch.mock.calls[0]?.[0] as Request | undefined;
    expect(request?.url).toMatch(/^https:\/\/assets.invalid\/img\/optimized-site\//);
  });
  it('keeps later admin replacements, including their headers and body', async () => {
    const origin = new Response('new photograph', { headers: { etag: '"new-upload"', 'content-type': 'image/jpeg' } });
    const binding = assets();
    const result = await optimizedSitePhoto('site/hero.webp', origin, binding);
    expect(result).toBe(origin);
    expect(await result.text()).toBe('new photograph');
    expect(binding.fetch).not.toHaveBeenCalled();
  });
  it.each(['site/other.webp', '__proto__', 'constructor'])('does not substitute unrelated key %s', async key => {
    const origin = original();
    expect(await optimizedSitePhoto(key, origin, assets())).toBe(origin);
  });
  it('keeps sources whose content identity is unknown', async () => {
    const origin = new Response('no etag');
    expect(await optimizedSitePhoto('site/hero.webp', origin, assets())).toBe(origin);
  });
  it('retains the original if asset delivery is unavailable', async () => {
    const origin = original();
    expect(await optimizedSitePhoto('site/hero.webp', origin)).toBe(origin);
    expect(await optimizedSitePhoto('site/hero.webp', origin, { fetch: async () => new Response('', { status: 404 }) })).toBe(origin);
    expect(await optimizedSitePhoto('site/hero.webp', origin, { fetch: async () => { throw new Error('unavailable'); } })).toBe(origin);
    expect(await origin.text()).toBe('original');
  });
});
