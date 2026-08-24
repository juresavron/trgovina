import type { ShopContent } from "./types";
import { savnaContent } from "./savna";
import { kadContent } from "./kad";
import { bazenContent } from "./bazen";
import { foteljContent } from "./fotelj";
import { kopalnaContent } from "./kopalna";
import { biljardContent } from "./biljard";

export type { ShopContent, ProductCard, UtilCard, ArtKey } from "./types";

/** Storefront content per shop key — must cover every key in SHOPS. */
export const CONTENT: Record<string, ShopContent> = {
  savna: savnaContent,
  kad: kadContent,
  bazen: bazenContent,
  fotelj: foteljContent,
  kopalna: kopalnaContent,
  biljard: biljardContent,
};
