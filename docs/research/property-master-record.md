# Property Master Record — Bản ghi gốc căn nhà (user nguyên lý 22/10)

Ngày: 2026-10-22 · Trạng thái: **ĐỀ XUẤT chờ duyệt**
Phát hiện từ user: "1 căn nhà phải có BẢN GHI GỐC, cần XÁC THỰC để mapping
vào, và ENRICH THEO THỜI GIAN" — đây là pattern Property MDM.

## 1. VẤN ĐỀ HIỆN TẠI

`properties` hiện là **kết quả tính toán tạm** — TRUNCATE + rebuild mỗi đêm
qua `resolve-properties.mjs`. Không phải bản ghi gốc:

| Thiếu gì | Hệ quả |
|---|---|
| Không persist qua đêm | ID thay đổi mỗi lần rebuild → không tham chiếu được |
| Không có verification | 8.270 căn toàn auto-cluster, 0 được người xác nhận |
| Không có enrichment history | Khi offer mới đến → không biết căn này đã biết gì trước đó |
| Không có survivorship | Khi 2 nguồn cho data khác nhau → không biết tin ai |

## 2. NGUYÊN LÝ — Property Master Record (bản ghi gốc)

```
┌─────────────────────────────────────────────────────────────┐
│  PROPERTY MASTER RECORD (persistent, không bao giờ xoá)    │
├─────────────────────────────────────────────────────────────┤
│  id: prop_xxx (stable, không đổi)                          │
│  verification: pending → verified → enriched               │
│  verified_by: user / hitl:timestamp                       │
│  verified_at: khi nào được xác nhận                        │
│                                                             │
│  ── DỮ LIỆU GỐC (xác thực 1 lần, thay đổi cần review) ──  │
│  geo: Point (từ S06 99.98%) — CHÍNH XÁC NHẤT              │
│  area_id: phường (hành chính)                               │
│  project_node: khu đô thị (asset_nodes)                     │
│  property_type: apartment/house/land/room                  │
│  address: "Đường Đinh Bộ Lĩnh, Phường 24, Bình Thạnh"      │
│                                                             │
│  ── DỮ LIỆU ENRICH (cập nhật theo thời gian) ──            │
│  bedrooms: 2 (confidence: 0.95 — 3 nguồn confirm)         │
│  bathrooms: 2 (confidence: 0.80 — 1 nguồn)                 │
│  current_price: 7.2 tỷ (latest: 2026-10-22, S06)           │
│  price_history: [{date, price, source, evidence}]          │
│  photos: [url1, url2, ...] (tích luỹ từ mọi nguồn)         │
│  features: ["view hồ bơi", "sẵn sổ"] (enrichment agent)   │
│  seller_current: "Mạnh" (phone_hash, latest)               │
│  seller_history: [{phone_hash, name, first, last, n_ads}]  │
│                                                             │
│  ── EVIDENCE LINKS (mọi tin đăng từng xuất hiện) ──       │
│  evidence: [                                               │
│    {offer_id, source, first_seen, last_seen, matched_by}  │
│  ]                                                          │
│                                                             │
│  ── ENRICHMENT LOG (audit mọi thay đổi) ──                 │
│  enrichment_log: [                                         │
│    {at, field, old, new, source: offer_id|agent|hitl}     │
│  ]                                                          │
└─────────────────────────────────────────────────────────────┘
```

## 3. VÒNG ĐỜI PROPERTY MASTER RECORD

```
                    ┌──────────────┐
                    │   OFFER MỚI  │ (từ mọi nguồn S03/S05/S06)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  MATCH ENGINE │ (Stage A/B + Enrichment Agent)
                    │  "Căn này có │
                    │  phải prop_abc?"│
                    └──────┬───────┘
                    │           │
              MATCH believed    NO MATCH
                    │           │
        ┌───────────▼──┐  ┌────▼─────────┐
        │ ENRICH        │  │ NEW CANDIDATE │
        │ prop_abc      │  │ (pending)     │
        │ +evidence     │  │               │
        │ +fields mới   │  └────┬─────────┘
        │ +confidence ↑ │       │
        └───────────┬──┘       │
                    │           │
                    │    ┌──────▼─────────┐
                    │    │  HITL REVIEW    │
                    │    │  /ops/review    │
                    │    │  "Căn nhà mới?" │
                    │    └──────┬─────────┘
                    │           │
                    │    APPROVED
                    │           │
                    │    ┌──────▼─────────┐
                    │    │  VERIFIED       │
                    │    │  prop_def       │
                    │    │  (bản ghi gốc)  │
                    │    └──────┬─────────┘
                    │           │
                    │    ┌──────▼─────────┐
                    │    │  ENRICHED       │
                    │    │  (theo thời gian│
                    │    │  offer mới →    │
                    │    │  field mới →    │
                    │    │  confidence ↑)  │
                    │    └────────────────┘
```

### 3 trạng thái:
1. **pending** — candidate mới, chờ HITL xác nhận "đây là căn nhà thật"
2. **verified** — người đã xác nhận; bản ghi gốc được lock (geo, area, type)
3. **enriched** — đã có ≥2 nguồn evidence; trường bổ sung tự cập nhật

### Survivorship rules (khi 2 nguồn mâu thuẫn):
| Trường | Nguồn thắng | Lý do |
|---|---|---|
| geo | S06 (Chợ Tốt) | 99.98% có tọa độ, precision cao nhất |
| address | S06 > P1 (LLM extract) | Structured > free-text |
| bedrooms | Consensus (≥2 nguồn cùng số) | Nếu mâu thuẫn → review |
| price | Latest (không lock) | Thay đổi theo thời gian = price_history |
| seller | Latest | Người bán thay đổi = seller_history |
| property_type | Consensus + project context | "Nhóm chung cư" → apartment override |

## 4. THAY ĐỔI KỸ THUẬT vs HIỆN TẠI

| Hiện tại (G-2) | Master Record (đề xuất) |
|---|---|
| `TRUNCATE properties` mỗi đêm | **KHÔNG BAO GIỜ TRUNCATE** — persist vĩnh viễn |
| `resolved_by = 'stage-ab'` (100% auto) | `verification = 'pending'/'verified'/'enriched'` |
| ID thay đổi mỗi rebuild | **ID stable** (prop_xxx không đổi) |
| Không có history | `enrichment_log` JSONB — mọi thay đổi |
| Stage B quyết match | **Master Record match engine** — match vào bản ghi TỒN TẠI |
| Không có confidence per field | Mỗi field có confidence + nguồn |
| Offers là dữ liệu chính | **Property là dữ liệu chính**; offers là evidence |

## 5. MỐI QUAN HỆ các thành phần hiện có

```
asset_nodes (Khu đô thị → Tòa)
  └── Property Master Record (n căn trong tòa)
        ├── evidence: sale_offers (từ mọi nguồn)
        ├── enrichment: Enrichment Agent (E1-E5)
        ├── verification: HITL /ops/review
        └── survivorship: rules (§3)

HITL /ops/review
  └── entity_match → match vào EXISTING property → enrich
  └── new_property → tạo NEW property (pending → verified)

Enrichment Agent (E1-E5)
  └── decode context → enrich fields vào property
  └── confidence thấp → submit review_queue (item_type=agent_output)

Ruler (thước giá)
  └── tính median trên properties (verified + enriched) — KHÔNG phải offers
  └── mỗi property đóng góp 1 phiếu với giá current_price
```

## 6. LỘ TRÌNH THỰC THI

| Bước | Việc | Thay đổi |
|---|---|---|
| M-1 | Migration: properties thêm verification, enrichment_log, field-level confidence; STOP TRUNCATE | 1 buổi |
| M-2 | Match engine: resolve-properties đổi từ "rebuild" sang "match existing + create new" | 1 buổi |
| M-3 | Enrichment integration: E1-E5 agent enrich fields vào property (không chỉ offers) | 1 buổi |
| M-4 | HITL integration: /ops/review "new_property" → verified; "entity_match" → enrich existing | nửa buổi |
| M-5 | Ruler migration: tính median từ properties thay vì offers | nửa buổi |

**Điều kiện tiên quyết**: E1 (Context resolver) cần asset_nodes building
seed (E4) để match "2pn LBV MCP" → đúng tòa Lumiere Boulevard.

## 7. VÌ SAO ĐÂY LÀ QUYẾT ĐỊNH KIẾN TRÚC SỐ 1

1. **Đúng bản chất**: cuối ngày, căn nhà là thực thể vật lý — không phải
   "kết quả clusteringOffers". Data model phải phản ánh thực thể thật.
2. **Bền vững**: ID stable → tham chiếu được từ mọi nơi (Deals, G3,
   Advisor, chat). Hiện tại ID đổi mỗi đêm = không thể tham chiếu.
3. **Tích luỹ tri thức**: mỗi tin đăng mới = một lần enrich → căn nhà
   càng ngày càng "được hiểu" (history giá, người bán, features).
4. **Tin cậy**: verified + survivorship rules → biết TIN AI khi mâu thuẫn.
5. **Nền cho Advisor**: tư vấn cá nhân cần nói về CĂN NHÀ cụ thể ("căn
   2PN Lumière đang giảm giá so với median tòa") — không thể nếu properties
   là ephemeral.
