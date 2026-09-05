import type { ShopContent } from "./types";
import { bazenContent } from "./bazen";
import { vreckeContent } from "./vrecke";

export type { ShopContent, ProductCard, UtilCard, ArtKey } from "./types";

/**
 * Storefront content per shop key — must cover every key in SHOPS.
 *
 * One entry, matching the registry. See the note on SHOPS in
 * src/tenants/index.ts for why the network narrowed to masazni-bazen.si.
 */
export const CONTENT: Record<string, ShopContent> = {
  bazen: bazenContent,
  vrecke: vreckeContent,
};
