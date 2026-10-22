# One Invest — ROADMAP v4 MASTER (2026-10-22)

> **NGUỒN CHÂN LÝ DUY NHẤT cho mọi phiên AI / người mới.** Thay thế ROADMAP
> v3 (10/18 — lưu ở ROADMAP-v3-archive.md) và mọi lộ trình rời. Đọc file
> này trước khi đề xuất bất kỳ việc gì. Cập nhật file này mỗi khi chốt
> quyết định mới (luật AGENTS.md).

## 0. Cách dùng

- Mọi phiên bắt đầu: đọc §1 nguyên tắc + §3 quyết định đã chốt (KHÔNG hỏi
  lại user những gì đã chốt), §4 lộ trình để biết vị trí hiện tại.
- Làm xong việc: cập nhật §2 as-built + §4 đánh dấu ✅.
- Việc mới phải tra §3 xem đã chốt chưa; quyết mới → ghi §3/§4.

## 1. Nguyên tắc bất biến (hiến pháp)

1. **Dữ liệu**: KHÔNG scrape AirDNA cho sản phẩm; RESO-first (ADR-0011 —
   tra DD trước khi bịa field); migration-only (AGENTS.md #3); metrics
   precompute server-side.
2. **LLM-off-data-path**: LLM/agent chỉ gate/judge/extract có audit +
   evidence; KHÔNG bao giờ sửa dữ liệu trực tiếp. Regex/structured là
   đường chính.
3. **SPL**: mã nguồn S0x (ADR-0007); tier A (tên thật, SĐT, hồ sơ cá nhân
   user) KHÔNG bao giờ rời máy local — cloud chỉ hash + aggregate.
4. **Observability là điều kiện ra quyết định**: nguồn mới phải hiện trên
   /ops ngay (feed health), hành vi thu phải đo được (CCP/DQO).
5. **An toàn social**: agent LLM không bao giờ gửi tin vào nhóm xã hội
   (lockdown 7 lớp + watchdog runtime guard — 2 sự cố đã xảy ra).
6. **Local-first AI**: Qwen 27B (MTPLX :8000) + Kev-4B gate (81ms) là mặc
   định; cloud (OpenAI Decisions) chỉ cho dữ liệu phi-PII.
7. **Đơn vị nghĩ là CĂN NHÀ**: "Một Căn Nhà" (entity properties) là đơn vị
   phân tích; nguồn chỉ là evidence.
8. **Đo trước khi build**: không graph/vector/infra mới trước khi số liệu
   chứng minh nhu cầu (bài học Mem0 bỏ graph).

## 2. Kiến trúc AS-BUILT (2026-10-22)

### 2.1 Monorepo onehub-invest (private, ADR-0012)
```
app/        Invest+Ops portal (Next.js; prod Vercel + Supabase)
data-api/   public standalone Hono (subtree → onehub-data-api)
collector/  thu thập (hooks, CCP, source_groups — quản trị /ops/sources)
agent/      onehub-ai-agent (kiến trúc chốt §3.5-3.6)
pipeline/ db/ docs/ tools/sync-public (overlay sanitise)
```
`~/dev/one-invest` = symlink → `~/dev/onehub-invest` (launchd cũ chạy được).
Public mirrors LIVE: onehub-invest-app + onehub-data-api.

### 2.2 Pipeline dữ liệu 5 tầng
```
thu (S0x, launchd tự động) → raw snapshots (DATA-CONTRACT)
→ stg_* → transform (parser VN + phone + RESO property_type)
→ sale_offers (canonical; price_tier P0/P1/P2; CHECK enums)
→ properties (entity "Một Căn Nhà", Stage A/B) → ruler v_ruler_p2_*
→ sản phẩm: Deals v2 (bait_gap + SĐT) · G3 calculator · /ops panels
```

### 2.3 Nguồn (source_registry + /ops/collections feed health)
| Mã | Nguồn | Trạng thái | Ghi chú |
|---|---|---|---|
| S01 | Airbnb | active (20:00 discovery; PDP tuần) | |
| S02 | AirDNA | active (19:05; rotation 34 tỉnh) | hiệu chuẩn |
| S03 | Zalo | active (hook liên tục; lockdown 7 lớp + watchdog) | media CHỜ tin ảnh (dbg-media) |
| S04 | OSM | completed (one-time) | |
| S05 | Facebook | paused (credit cạn; reset 7/11 — chờ đánh giá) | 118 offers giữ |
| S06 | Chợ Tốt | active (05:30; ruler 150 phường) | phone reveal chưa làm |
| S07 | Batdongsan | rejected-Apify | tự build nếu cần |

### 2.4 Chạy đêm (launchd)
19:05 AirDNA · 19:30 Airbnb tuần · 20:00 smoke+discovery · 00:00
zalo-import · 05:30 chotot (collect→import→transform→refresh→resolve) ·
15′ cloud-sync + ops-facts · 5′ zalo-watchdog · KeepAlive kev-gate.

### 2.5 Số liệu hôm nay
1.195 P1 + 8.647 P2 offers · 8.270 properties (gộp 375 repost) ·
ruler 150/338 phường · 1.043 sellers · 237 candidates P1↔P2 ·
506 listings (493 ảnh, tên host thật) · G3 live 2 thị trường.

## 3. QUYẾT ĐỊNH ĐÃ CHỐT (không hỏi lại)

1. **kind ↔ RESO**: sale≈Residential*; rent_lt≈ResidentialLease+Monthly;
   STR (rent_st)=local extension. BusinessType(109 ngành nghề) ≠ bán-vs-thuê.
2. **property_type**: apartment|house|land|room(VN ext)|commercial|unknown.
3. **Monorepo**: private + subtree/overlay public (tools/sync-public).
4. **Agent = onehub-ai-agent** (thư mục agent/; 2 vai pipeline+advisor).
5. **KIẾN TRÚC AGENT** — harness "3 tầng + 1 hợp đồng": TS + Vercel AI
   SDK; runtime loop (ReAct + step budget + hooks + trace JSONL); tools
   MCP-first; agents-as-config; KHÔNG LangGraph; kev-serve gọi qua HTTP.
   Hợp đồng: questions[] typed + MCP + audit. → agent-harness-survey.md.
6. **MEMORY AGENT** — Postgres-first 3 lớp: episodic (user_events) →
   semantic bi-temporal (user_profile + source+evidence + consolidation
   đêm Qwen local) → procedural (sau); memory là TOOL của runtime; KHÔNG
   graph/vector trước nhu cầu; PII tầng A + user-owned export.
   → agent-memory-survey.md.
7. **Làm tốt từng nguồn trước**; FB/BDS khả thi nhưng là bài toán chi phí.
8. **Decision models**: Kev-4B gate chính (local); upgrade kev-9b cùng
   repo; Laya loại (OOD); OpenAI Decisions chỉ phi-PII.

## 4. LỘ TRÌNH THỐNG NHẤT

### Track 1 — AGENT (onehub-ai-agent) — chốt, sẵn sàng thực hiện
| # | Việc | Trạng thái |
|---|---|---|
| A1 | runtime/ loop TS (AI SDK) + trace JSONL | ⬜ |
| A2 | judge-entity: 124 cặp needs_llm (case đầu, mở khoá G-2) | ⬜ |
| A3 | MCP server tools (gom C3-wrap + data-api) | ⬜ |
| A4 | extract-text fallback (coverage 44-65% → tăng) | ⬜ |
| A5 | evals suite agents (pattern kev 620 mẫu) | ⬜ |
| A6 | advisor + compaction (chỉ khi agent dài xuất hiện) | ⬜ hoãn có chủ đích |
| M1 | migration user_events + user_profile + seed (saved/G3) | ⬜ |
| M2 | memory tool + wire app events | ⬜ |
| M3 | consolidation đêm (Qwen local, source+evidence) | ⬜ |
| M4 | form hồ sơ + export JSON (consent, user-owned) | ⬜ |
| M5 | pgvector — chỉ khi đo thấy cần | ⬜ kháng cự |

### Track 2 — "Một Căn Nhà" hoàn thiện
| # | Việc | Trạng thái |
|---|---|---|
| G-1 | property_type + DQ + asset_nodes R1 | ✅ 3313a9c |
| G-2 | properties + ruler dedup + candidates | ✅ 50005b7 |
| G-2.5 | pHash ảnh — khi ảnh P1 nhiều hơn | ⬜ |
| G-3 | Kev-V media gate + VLM collage + LLM judge (≡ A2) | ⬜ |
| R2-R4 | asset_nodes mở rộng (subzone/building; geo-polygon; dedup căn) | ⬜ |

### Track 3 — Nguồn thu
| # | Việc | Trạng thái |
|---|---|---|
| N1 | media Zalo: đọc dbg-media khi tin ảnh về → map → bỏ debug | ⏳ chờ dữ liệu |
| N2 | FB: đánh giá giá trị 118 offers vs chi phí → quyết ~7/11 | ⏳ chờ user |
| N3 | AirDNA rotation (passive) | 🔄 sống |
| N4 | S06 phone reveal per-ad (cap 50/ngày, top-deals) | ⬜ |

### Track 4 — Sản phẩm
| # | Việc | Trạng thái |
|---|---|---|
| P-A | Deals v2 + G3 + ảnh/tên listing + ops panels | ✅ |
| P-B | G4 khai thác sau mua (comps giá đêm — data sẵn) | ⬜ |
| P-C | Advisor chat trên app (dựa A6+M4) | ⬜ xa |

### Track 5 — Vận hành
| # | Việc | Trạng thái |
|---|---|---|
| V1 | Backup tuần mã hoá (cần BACKUP_DIR+BACKUP_PASS từ user) | ⏳ nợ cũ nhất |
| V2 | sync-public sau mỗi milestone | 🔄 thủ công |
| V3 | Soak đêm tự động; soi /ops mỗi sáng | 🔄 |

**Thứ tự khuyến nghị tiếp**: A1+A2 → M1+M2 → A4 → N2 (khi tới 7/11).

## 5. Chỉ mục quyết định

ADR: 0001 stack · 0002 insight-core · 0003 collector · 0004 đa nguồn ·
0005 AirDNA hiệu chuẩn · 0006→0007 SPL+SOC · 0008 scope VN · 0009
boundaries · 0010 bán dài hạn · 0011 RESO-first · 0012 onehub-ai-agent.
Research nền: investment-pipeline-4-stages (north star) ·
unified-property-pipeline · decision-models-landscape ·
agent-harness-survey · agent-memory-survey · reso-standards.
