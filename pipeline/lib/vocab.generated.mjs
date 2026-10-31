// MÁY SINH từ pipeline/mappings.yaml — sửa sổ rồi chạy node pipeline/vocab.mjs --write
// Sổ từ vựng một nguồn (PL6) — hằng cho pipeline/ và scripts/.

export const VOCAB = Object.freeze({
  kind: Object.freeze(["sale", "rent_lt"]),
  property_type: Object.freeze(["apartment", "house", "land", "room", "commercial", "unknown"]),
  confidence: Object.freeze(["high", "medium", "low"]),
  price_tier: Object.freeze(["P0", "P1", "P2"]),
  enrich_field: Object.freeze(["property_type", "bedrooms", "bathrooms", "street_raw", "block_raw"]),
  assertion_field: Object.freeze(["property_type", "bedrooms", "bathrooms", "street_raw", "block_raw", "offer_status", "street_number", "unit_number", "frontage_length", "lot_size_dimensions", "stories", "latitude", "longitude"]),
  evidence_tier: Object.freeze(["fact", "observed", "inferred"]),
  assertion_method: Object.freeze(["hitl", "source_field", "parser", "e1_rule", "e2_llm", "legacy"]),
  registry_status: Object.freeze(["active", "merged", "split", "retired"]),
  alias_kind: Object.freeze(["tai_khoan_nguon", "sdt_bam", "ten", "sdt"]),
  registry_event_kind: Object.freeze(["gop", "tach", "nghi"]),
  party_role: Object.freeze(["nguoi_dang"]),
  listing_intent: Object.freeze(["offer", "inquiry", "not_listing", "unknown"]),
  offer_status: Object.freeze(["active", "active_under_contract", "closed", "withdrawn", "unknown"]),
  change_type: Object.freeze(["new_listing", "price_change", "withdrawn", "back_on_market", "active_under_contract", "closed"]),
  data_level: Object.freeze(["B0", "B1", "B2", "B3", "B4", "B5"]),
  capability_level: Object.freeze(["N0", "N1", "N2", "N3", "N4"]),
});

export const KIND = Object.freeze({ sale: "sale", rent_lt: "rent_lt" });
export const PROPERTY_TYPE = Object.freeze({ apartment: "apartment", house: "house", land: "land", room: "room", commercial: "commercial", unknown: "unknown" });
export const CONFIDENCE = Object.freeze({ high: "high", medium: "medium", low: "low" });
export const PRICE_TIER = Object.freeze({ P0: "P0", P1: "P1", P2: "P2" });
export const ENRICH_FIELD = Object.freeze({ property_type: "property_type", bedrooms: "bedrooms", bathrooms: "bathrooms", street_raw: "street_raw", block_raw: "block_raw" });
export const ASSERTION_FIELD = Object.freeze({ property_type: "property_type", bedrooms: "bedrooms", bathrooms: "bathrooms", street_raw: "street_raw", block_raw: "block_raw", offer_status: "offer_status", street_number: "street_number", unit_number: "unit_number", frontage_length: "frontage_length", lot_size_dimensions: "lot_size_dimensions", stories: "stories", latitude: "latitude", longitude: "longitude" });
export const EVIDENCE_TIER = Object.freeze({ fact: "fact", observed: "observed", inferred: "inferred" });
export const ASSERTION_METHOD = Object.freeze({ hitl: "hitl", source_field: "source_field", parser: "parser", e1_rule: "e1_rule", e2_llm: "e2_llm", legacy: "legacy" });
export const REGISTRY_STATUS = Object.freeze({ active: "active", merged: "merged", split: "split", retired: "retired" });
export const ALIAS_KIND = Object.freeze({ tai_khoan_nguon: "tai_khoan_nguon", sdt_bam: "sdt_bam", ten: "ten", sdt: "sdt" });
export const REGISTRY_EVENT_KIND = Object.freeze({ gop: "gop", tach: "tach", nghi: "nghi" });
export const PARTY_ROLE = Object.freeze({ nguoi_dang: "nguoi_dang" });
export const LISTING_INTENT = Object.freeze({ offer: "offer", inquiry: "inquiry", not_listing: "not_listing", unknown: "unknown" });
export const OFFER_STATUS = Object.freeze({ active: "active", active_under_contract: "active_under_contract", closed: "closed", withdrawn: "withdrawn", unknown: "unknown" });
export const CHANGE_TYPE = Object.freeze({ new_listing: "new_listing", price_change: "price_change", withdrawn: "withdrawn", back_on_market: "back_on_market", active_under_contract: "active_under_contract", closed: "closed" });
export const DATA_LEVEL = Object.freeze({ B0: "B0", B1: "B1", B2: "B2", B3: "B3", B4: "B4", B5: "B5" });
export const CAPABILITY_LEVEL = Object.freeze({ N0: "N0", N1: "N1", N2: "N2", N3: "N3", N4: "N4" });

export const CANONICAL_FIELDS = Object.freeze(["offer_id", "source", "kind", "price_vnd", "area_m2", "price_perm2", "bedrooms", "phuong_raw", "district_raw", "confidence", "first_seen", "last_seen", "n_reposts", "post_ids", "price_tier", "seller_name", "seller_phone", "seller_phone_hash", "seller_ref", "bait_gap_pct", "listing_url", "property_type", "street_raw", "block_raw", "floor_raw", "bathrooms", "street_number", "unit_number", "frontage_length", "lot_size_dimensions", "stories", "latitude", "longitude"]);

/** Danh sách code nối bằng `|` — cho chuỗi enum trong prompt LLM. */
export function promptEnum(axis) {
  return VOCAB[axis].join("|");
}
