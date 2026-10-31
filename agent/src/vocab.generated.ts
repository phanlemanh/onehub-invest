// MÁY SINH từ pipeline/mappings.yaml — sửa sổ rồi chạy node pipeline/vocab.mjs --write
// Sổ từ vựng một nguồn (PL6) — hằng cho agent/.

export const VOCAB = {
  kind: ["sale", "rent_lt"],
  property_type: ["apartment", "house", "land", "room", "commercial", "unknown"],
  confidence: ["high", "medium", "low"],
  price_tier: ["P0", "P1", "P2"],
  enrich_field: ["property_type", "bedrooms", "bathrooms", "street_raw", "block_raw"],
  assertion_field: ["property_type", "bedrooms", "bathrooms", "street_raw", "block_raw", "offer_status", "street_number", "unit_number", "frontage_length", "lot_size_dimensions", "stories", "latitude", "longitude"],
  evidence_tier: ["fact", "observed", "inferred"],
  assertion_method: ["hitl", "source_field", "parser", "e1_rule", "e2_llm", "legacy"],
  registry_status: ["active", "merged", "split", "retired"],
  alias_kind: ["tai_khoan_nguon", "sdt_bam", "ten", "sdt"],
  registry_event_kind: ["gop", "tach", "nghi"],
  party_role: ["nguoi_dang"],
  listing_intent: ["offer", "inquiry", "not_listing", "unknown"],
  offer_status: ["active", "active_under_contract", "closed", "withdrawn", "unknown"],
  change_type: ["new_listing", "price_change", "withdrawn", "back_on_market", "active_under_contract", "closed"],
  data_level: ["B0", "B1", "B2", "B3", "B4", "B5"],
  capability_level: ["N0", "N1", "N2", "N3", "N4"],
} as const;

export type VocabAxis = keyof typeof VOCAB;
export type Kind = (typeof VOCAB.kind)[number];
export type PropertyType = (typeof VOCAB.property_type)[number];
export type Confidence = (typeof VOCAB.confidence)[number];
export type PriceTier = (typeof VOCAB.price_tier)[number];
export type EnrichField = (typeof VOCAB.enrich_field)[number];
export type AssertionField = (typeof VOCAB.assertion_field)[number];
export type EvidenceTier = (typeof VOCAB.evidence_tier)[number];
export type AssertionMethod = (typeof VOCAB.assertion_method)[number];
export type RegistryStatus = (typeof VOCAB.registry_status)[number];
export type AliasKind = (typeof VOCAB.alias_kind)[number];
export type RegistryEventKind = (typeof VOCAB.registry_event_kind)[number];
export type PartyRole = (typeof VOCAB.party_role)[number];
export type ListingIntent = (typeof VOCAB.listing_intent)[number];
export type OfferStatus = (typeof VOCAB.offer_status)[number];
export type ChangeType = (typeof VOCAB.change_type)[number];
export type DataLevel = (typeof VOCAB.data_level)[number];
export type CapabilityLevel = (typeof VOCAB.capability_level)[number];

export const KIND = { sale: "sale", rent_lt: "rent_lt" } as const;
export const PROPERTY_TYPE = { apartment: "apartment", house: "house", land: "land", room: "room", commercial: "commercial", unknown: "unknown" } as const;
export const CONFIDENCE = { high: "high", medium: "medium", low: "low" } as const;
export const PRICE_TIER = { P0: "P0", P1: "P1", P2: "P2" } as const;
export const ENRICH_FIELD = { property_type: "property_type", bedrooms: "bedrooms", bathrooms: "bathrooms", street_raw: "street_raw", block_raw: "block_raw" } as const;
export const ASSERTION_FIELD = { property_type: "property_type", bedrooms: "bedrooms", bathrooms: "bathrooms", street_raw: "street_raw", block_raw: "block_raw", offer_status: "offer_status", street_number: "street_number", unit_number: "unit_number", frontage_length: "frontage_length", lot_size_dimensions: "lot_size_dimensions", stories: "stories", latitude: "latitude", longitude: "longitude" } as const;
export const EVIDENCE_TIER = { fact: "fact", observed: "observed", inferred: "inferred" } as const;
export const ASSERTION_METHOD = { hitl: "hitl", source_field: "source_field", parser: "parser", e1_rule: "e1_rule", e2_llm: "e2_llm", legacy: "legacy" } as const;
export const REGISTRY_STATUS = { active: "active", merged: "merged", split: "split", retired: "retired" } as const;
export const ALIAS_KIND = { tai_khoan_nguon: "tai_khoan_nguon", sdt_bam: "sdt_bam", ten: "ten", sdt: "sdt" } as const;
export const REGISTRY_EVENT_KIND = { gop: "gop", tach: "tach", nghi: "nghi" } as const;
export const PARTY_ROLE = { nguoi_dang: "nguoi_dang" } as const;
export const LISTING_INTENT = { offer: "offer", inquiry: "inquiry", not_listing: "not_listing", unknown: "unknown" } as const;
export const OFFER_STATUS = { active: "active", active_under_contract: "active_under_contract", closed: "closed", withdrawn: "withdrawn", unknown: "unknown" } as const;
export const CHANGE_TYPE = { new_listing: "new_listing", price_change: "price_change", withdrawn: "withdrawn", back_on_market: "back_on_market", active_under_contract: "active_under_contract", closed: "closed" } as const;
export const DATA_LEVEL = { B0: "B0", B1: "B1", B2: "B2", B3: "B3", B4: "B4", B5: "B5" } as const;
export const CAPABILITY_LEVEL = { N0: "N0", N1: "N1", N2: "N2", N3: "N3", N4: "N4" } as const;

export const CANONICAL_FIELDS = ["offer_id", "source", "kind", "price_vnd", "area_m2", "price_perm2", "bedrooms", "phuong_raw", "district_raw", "confidence", "first_seen", "last_seen", "n_reposts", "post_ids", "price_tier", "seller_name", "seller_phone", "seller_phone_hash", "seller_ref", "bait_gap_pct", "listing_url", "property_type", "street_raw", "block_raw", "floor_raw", "bathrooms", "street_number", "unit_number", "frontage_length", "lot_size_dimensions", "stories", "latitude", "longitude"] as const;

/** Danh sách code nối bằng `|` — cho chuỗi enum trong prompt LLM. */
export function promptEnum(axis: VocabAxis): string {
  return VOCAB[axis].join("|");
}
