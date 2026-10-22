# Enrichment Agent — từ regex extract → LLM suy luận bối cảnh

Ngày: 2026-10-22 · Trạng thái: **E1-E4 ĐÃ THỰC THI** (M-3) · E5 chờ data
Phát hiện từ user: "không đơn thuần extract-text mà cần làm giàu — model
phải phán quyết được"

> Kết quả chạy thật 22/10 (backlog 735 offers P1): E1 rule-based resolve
> property_type 73% (359 apartment / 115 house / 59 land), project 49 offers
> qua tên nhóm, mã tòa sạch (LD1-3, S2.06, PR2-6 — pattern bắt IN HOA +
> gate "có chữ số hoặc có trong từ điển" loại nhiễu CHCC/NG/HOME).
> E2 LLM (Qwen 27B local, ~30s/tin) decode đúng type/bed/tòa/street,
> sanitize qua CHECK constraint 025 trước khi ghi. Fill-gap: giá trị cũ
> thắng, chỉ lấp NULL / thay 'unknown'.

## 1. VÍ DỤ USER ĐƯA — TẠI SAO REGEX KHÔNG ĐỦ

Tin Zalo trong nhóm "Căn hộ Vinhomes Grand Park":
```
2pn LBV MCP view hồ bơi giá 35tr/m²
```

**Regex extract được:**
- `2pn` → bedrooms = 2 ✓
- `35tr/m²` → price_perm2 = 35,000,000 ✓

**Regex KHÔNG THỂ extract (cần suy luận):**
- `LBV` → Lumiere Boulevard (tòa nào? cần biết abbreviation riêng của dự án)
- `MCP` → Masteri? Grand Park? (viết tắt riêng nhóm, không có trong từ điển chung)
- `view hồ bơi` → căn có view hồ (metadata ảnh hưởng giá)
- **Bối cảnh nhóm** "Căn hộ Vinhomes Grand Park" → mọi tin trong nhóm này
  có default `project = Vinhomes Grand Park`, `property_type = apartment`

**Kết quả enrichment đúng:**
```json
{
  "bedrooms": 2,
  "price_perm2": 35000000,
  "property_type": "apartment",
  "project_node": "vinhomes-grand-park",
  "building_hint": "LBV (Lumiere Boulevard?)",
  "features": ["view hồ bơi"],
  "context_source": "group:Căn hộ Vinhomes Grand Park"
}
```

## 2. PHÂN TÍCH — 3 LỚP ENRICHMENT

```
LỚP 1: REGEX (nhanh, deterministic, 0 đồng)
  → price, area, bedrooms, phone, SĐT
  → hiện đã có, coverage 35-65%

LỚP 2: CONTEXT RESOLUTION (rule-based + asset_nodes, 0 đồng)
  → group name → project (nhóm chứa tên dự án → match asset_nodes aliases)
  → mã tòa nhà (S1.03, BE02, LBV...) → building (từ asset_nodes + pattern)
  → property_type từ keywords nhóm ("căn hộ" → apartment, "đất" → land)

LỚP 3: LLM REASONING (Qwen 27B local, ~9s/tin)
  → giải mã abbreviations lạ (MCP, LBV trong bối cảnh cụ thể)
  → suy luận địa chỉ từ mô tả không chuẩn ("gần bến xe", "đối diện chung cư X")
  → tóm tắt features (view, nội thất, pháp lý: "sẵn sổ", "chính chủ")
  → confidence scoring khi tín hiệu mâu thuẫn
```

**Quan trọng**: Lớp 1 + 2 xử lý ~80% tin (nhóm có tên dự án rõ, keyword
chuẩn). Lớp 3 chỉ cần cho tin mơ hồ — tiết kiệm chi phí compute.

## 3. KIẾN TRÚC — Enrichment Agent trong onehub-ai-agent

```
agent/src/agents/enrich-text.ts
├── Input: raw text + group_context (tên nhóm Zalo/FB)
├── Knowledge base:
│   ├── asset_nodes (20 khu đô thị + aliases + buildings)
│   ├── source_groups → project mapping (tên nhóm chứa tên dự án)
│   └── VN RE abbreviation dict (tự build dần từ evidence)
├── Process:
│   1. Regex extract (lớp 1) — deterministic fields
│   2. Context match (lớp 2) — group → project, keywords → type
│   3. LLM call (lớp 3) — CHỈ khi lớp 1+2 thiếu tín hiệu
│   └── Output: structured JSON + confidence + evidence
├── Output → sale_offers (thêm fields) + review_queue (nếu unsure)
└── Trace: mọi bước ghi JSONL (audit được)
```

### Pipeline tích hợp:

```
stg_zalo_posts (text thô)
  → transform-zalo.mjs (regex hiện tại — giữ nguyên, đường chính)
  → ENRICHMENT AGENT (Lớp 2 + 3):
     → match group context → project/type/street
     → LLM decode abbreviations + address + features
     → UPDATE sale_offers SET property_type, street_raw, project_hint, features
     → confidence < threshold → INSERT review_queue (item_type='agent_output')
  → ruler + deals dùng dữ liệu ĐÃ enriched
```

## 4. QUAN HỆ asset_nodes — BỘ NHỚ DỰ ÁN

Bảng asset_nodes (migration 026) đã seed 20 khu đô thị + aliases. Cần mở
rộng thành knowledge base đầy đủ:

| Cấp | Ví dụ | Cần thêm |
|---|---|---|
| Khu đô thị | Vinhomes Grand Park | ✅ có sẵn (slug + aliases) |
| Phân khu/Tòa | Lumiere Boulevard (LBV) | Cần thêm `building` nodes + abbreviation aliases |
| Mã căn | S1.03, BE02 | Pattern match (regex: `[A-Z]\d\.\d{2}`) |

**Từ điển abbreviation** cần tự build:
1. Seed từ kiến thức sẵn (Vinhomes: LBV, SAV, HAV, RAS, TC, TL...)
2. Học từ evidence: khi LLM decode "LBV" trong nhóm Grand Park → lưu
   vào asset_nodes aliases → lần sau regex match được (không cần LLM)

## 5. LỘ TRÌNH THỰC THI

| Bước | Việc | Phụ thuộc | Trạng thái |
|---|---|---|---|
| E1 | Context resolver (Lớp 2): group name → project match qua asset_nodes aliases (match 1 node mới nhận — nhiều node là MỜ → nhường LLM); keywords → property_type; building pattern regex | asset_nodes sẵn có | ✅ `agent/src/agents/context-resolver.ts` |
| E2 | Enrichment agent (Lớp 3): prompt template + knowledge injection (asset_nodes + group context) + LLM call qua runtime A1 | A1 ✅, E1 | ✅ `agent/src/agents/enrich-text.ts` |
| E3 | Transform integration: enrich-run.ts chạy E1+E2, UPDATE sale_offers fill-gap + cascade properties qua property_offers | E2 | ✅ `agent/scripts/enrich-run.ts` |
| E4 | Building dictionary: seed building nodes + alias viết tắt dự án. Nguyên tắc: CHỈ seed mã ĐÃ xác minh (LBV — ví dụ user); mã lạ (LD1/LD2, MCP, SAV…) để LLM decode | asset_nodes | ✅ migration 032 (+ sửa bug 026: parent_id bigserial tự trỏ chính nó) |
| E5 | Feedback loop: LLM decode abbreviation mới → lưu alias vào asset_nodes → E1 regex match lần sau (tự học) | E3 chạy production | ⬜ khi có data |

## 6. ĐỐI CHIẾU A4 CŨ vs MỚI

| A4 cũ (regex fallback) | A4 mới (enrichment agent) |
|---|---|
| "Regex fail → LLM extract" | "Luôn enrich: regex + context + LLM reasoning" |
| Chỉ extract fields chung | Extract + resolve entities (project, building) + decode abbreviations |
| Không biết bối cảnh nhóm | Group context là tín hiệu THEN CHỐT (nhóm tên dự án → default project) |
| Không có knowledge base | asset_nodes làm bộ nhớ dự án + tự học abbreviations |
| Không có feedback loop | LLM decode mới → lưu alias → regex match lần sau |
