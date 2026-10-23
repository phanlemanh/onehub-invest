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
→ enrichment_proposals (E1/E2 đề xuất → luật xác định / /ops/review;
  E1 trái LLM → thẻ đối chiếu, người chọn; không UPDATE thẳng canonical, không lên cloud)
→ sale_offers (canonical; price_tier P0/P1/P2; CHECK enums)
→ properties (entity "Một Căn Nhà", Stage A/B) → ruler v_ruler_p2_*
→ sản phẩm: Deals v2 ở /ops/deals (bait_gap; SĐT chỉ admin, local) · G3 calculator (STR tự thu) · /ops panels
```
- DATA-CONTRACT v1–2: importer nhận cả hai; ảnh Zalo N1 (`meta.mediaFiles`) →
  `stg_zalo_posts.media_files` (migration 035, PII tầng A — chỉ local, test
  `pipeline/sync-pii.test.mjs` gác FILL). Transform/`/ops` chưa đọc cột này.

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

### 2.6 Chuẩn UI/UX ReUI (A) — nhánh `feat/ui-standards-reui`
Thiết kế: `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md`.
- Skill `reui` (`.claude/skills/reui/`, vendor do installer quản lý, khối luật trong AGENTS.md) + MCP `reui`.
- Skill `onehub-ui` (`.claude/skills/onehub-ui/`): route map máy kiểm, danh mục block/component
  (`catalog.md`), màu dữ liệu, chữ VN, vòng làm việc. `app/DESIGN_RULES.md` thu lại thành con trỏ.
- Lint `onehub-ui` (`app/eslint-plugin-onehub-ui`): 10 luật; baseline `app/eslint-suppressions.json`
  = 138 vi phạm / 31 file, chỉ được giảm (B1–B5 dọn dần).
- CI job `ui-lint` (`.github/workflows/ui-lint.yml`) + hook Stop lint file UI vừa đổi.
- Rule `.claude/rules/ui.md` (tự nạp khi chạm `app/src/components|app`); ổ cắm kit
  `_acceptance/config.yaml`: `feature_loop.ui_standards_skill` và `design_pass.ds_skill` = `onehub-ui`.
- **B1 Cổng Ops** (nhánh `claude/ui-clean-b1-ops-c5a53a`): shell riêng `components/shell/ops-shell/`
  (chuyển thể `app-shell-36`, nav nhóm trong `shell/nav.tsx` có `/ops/review`); `/ops` = solution-dev-ops-5,
  `/ops/collections` = solution-dev-ops-6 + lưới job dev-ops-1, `/ops/sources` = solution-ai-ops-2 + lưới
  dev-ops-6, `/ops/quality` giữ `StatTiles`/`InsightGrid`, `/ops/design` thành trang trưng bày. Harness
  kiểm máy `scripts/ui-standards/b1-ops.mjs`; che chữ tầng A khi chụp `scripts/ui-standards/mask-tier-a.js`.

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
9. **Hai agent, hai làn** (22/10): ZCode = thu thập (nguồn → raw → `stg_*`),
   Claude Code = phần còn lại + cổng tích hợp (review, `/verify`, `_acceptance`,
   merge). Ranh giới = DATA-CONTRACT; mỗi bên một worktree, checkout chính giữ
   `main`. Chi tiết: AGENTS.md "Phân làn hai agent" + `collector/AGENTS.md`.
10. **Cổng Ops đóng mặc định** (22/10): vào `/ops/**` khi `users.role` ∈
   {`ops`, `admin`} hoặc email trong `OPS_EMAILS`; đăng nhập thôi không đủ
   (`/register` mở). Cấp quyền data-ops bằng `role = 'ops'`, không cần migration.

## 4. LỘ TRÌNH THỐNG NHẤT

### Track 1 — AGENT (onehub-ai-agent) — chốt, sẵn sàng thực hiện
| # | Việc | Trạng thái |
|---|---|---|
| A1 | runtime/ loop TS (AI SDK) + trace JSONL | ✅ 1fd762e |
| A2 | judge-entity eval 3 cặp (prefetch, không tool) — cần hand-label | 🔶 5440759 |
| A3 | MCP server tools (gom C3-wrap + data-api) | ⬜ |
| A4 | extract-text fallback (coverage 44-65% → tăng) | ⬜ |
| A5 | evals suite agents (pattern kev 620 mẫu) | ⬜ |
| A6 | advisor + compaction (chỉ khi agent dài xuất hiện) | ⬜ hoãn có chủ đích |
| M1 | migration user_events + user_profile + seed (saved/G3) | ✅ 8422289 |
| M2 | memory tool + wire app events (view_market + dau_tu_input) | ✅ 8422289 |
| M3 | consolidation đêm (Qwen local, source+evidence) | ⬜ |
| M4 | form hồ sơ + export JSON (consent, user-owned) | ⬜ |
| M5 | pgvector — chỉ khi đo thấy cần | ⬜ kháng cự |
| HITL | /ops/review Review Queue (12 entity_match seeded) | ✅ c6eea64 |
| M-3 | enrich qua đề xuất: `enrichment_proposals` (033) + luật xác định + thẻ `agent_output` /ops/review; E1 trái LLM → thẻ đối chiếu chọn một bên | 🔶 chờ ký Cổng Bằng chứng (`_acceptance/enrich-qua-de-xuat/`) |

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
| N2 | FB: user quyết định mua Apify Starter — ĐÃ CHỐT 22/10, S05 active | ✅ |
| N3 | AirDNA rotation (passive) | 🔄 sống |
| N4 | S06 phone reveal per-ad (cap 50/ngày, top-deals) | ⬜ |

### Track 4 — Sản phẩm
| # | Việc | Trạng thái |
|---|---|---|
| P-A | Deals v2 + G3 + ảnh/tên listing + ops panels | ✅ |
| P-A2 | Vá cổng: /deals → /ops/deals (SPL tầng A), gỡ AirDNA khỏi /dau-tu (luật 5) — chờ quyết gộp /dau-tu vào /yield | 🔄 nhánh fix/portal-deals-airdna |
| P-B | G4 khai thác sau mua (comps giá đêm — data sẵn) | ⬜ |
| P-A3 | Gỡ ảnh/chữ AirDNA khỏi /listing/[id] (luật 5) — chỉ ảnh tự thu, căn chưa thu PDP không ảnh | 🔄 nhánh fix/listing-airdna-photos |
| P-C | Advisor chat trên app (dựa A6+M4) | ⬜ xa |

### Track 5 — Vận hành
| # | Việc | Trạng thái |
|---|---|---|
| V1 | Backup tuần mã hoá (cần BACKUP_DIR+BACKUP_PASS từ user) | ⏳ nợ cũ nhất |
| V2 | sync-public sau mỗi milestone | 🔄 thủ công |
| V3 | Soak đêm tự động; soi /ops mỗi sáng | 🔄 |
| V4 | Siết quyền: cổng Ops đóng mặc định (role `ops`/`admin` hoặc `OPS_EMAILS`); `/api/zalo-media` chỉ ảnh trong `~/.openclaw/media` + `/tmp/openclaw` (realpath, không khớp tiền tố) — `_acceptance/ops-access-hardening` | ✅ Cổng 2 ký 23/10 — PR #5 (xếp chồng trên #3). Trước deploy: kiểm Vercel prod — user không phải admin cần `role='ops'` hoặc `OPS_EMAILS` |

### Track 6 — Chuẩn UI/UX ReUI
| # | Việc | Trạng thái |
|---|---|---|
| A | Chuẩn: skill reui + onehub-ui, lint 10 luật + baseline, CI ui-lint, hook Stop, ổ cắm kit | ✅ (chờ Mạnh ký) |
| B1 | Cổng Ops (`/ops/**`): shell riêng `app-shell-36` + block Solutions (dev-ops-5/-6/-1, ai-ops-2; agents-5 cho `/ops/review`), primitive, AlertDialog, sonner, PageHeader + Frame — nhánh `claude/ui-clean-b1-ops-c5a53a`, hồ sơ `_acceptance/ui-clean-b1-ops/` (T2, Cổng Phạm vi + Cổng Bằng chứng đã ký 2026-10-23, S4 PASS 16/16 sau 3 lượt). Baseline 138 → 85 (sau B3). `/ops/review` (Task 12, agents-5 theo hướng (a)) TÁCH sang vòng sau — chờ backend ảnh tin vào main | 🔨 PR mở |
| B3 | Biểu đồ: bảng màu chung, gom code trùng, tách file > 200 dòng | ⏳ |
| BĐ | Bản đồ đích cổng Invest: block đích cho mọi route Invest (cột "Block đích" ở `onehub-ui/routes.md`, test chặn dòng thiếu), shell giữ `app-shell-30`, `/dau-tu` gộp vào `/yield`, slug đích tiếng Anh (cột "Slug đích"), bản đồ nguồn `mapcn`, bước tra Mobbin trong `loop.md` — `_acceptance/invest-target-map` | ✅ Mạnh chọn 23/10 (theo khuyến nghị) — chờ ký PR |
| I1 | Finder `/[country]`: `solution-analytics-1` + `@mapcn/choropleth`, PageHeader, trạng thái "đang thu thập" | ⏳ |
| I2 | Insight thị trường + phường: khung `solution-analytics-8`, giữ chart-6/chart-13/InsightGrid, bản đồ `@mapcn/map`, neo mục lục tiếng Anh | ⏳ |
| I3 | Listing: `/listing/[id]` `product-detail-5` (ảnh tự thu) · `/listings` product-grid-2 + `filters` + `@mapcn/store-locator` | ⏳ sau khi gỡ ảnh AirDNA khỏi listing |
| I4 | Lợi suất: `/yield` form-11 + `data-grid-advanced-7` (chi phí + dòng tiền vốn vay), `/dau-tu` → chuyển hướng `/yield` | ⏳ |
| I5 | So sánh + Đã lưu: giữ comparison-1 / wishlist-2, thêm PageHeader + trạng thái; `/so-sanh` → `/compare` (301) | ⏳ |
| I6 | Trang chủ / Phương pháp (`faq-3`, `/phuong-phap` → `/methodology` 301) / Auth (giữ auth-4/5) | ⏳ |
| B5 | Ops còn lại (`/ops/deals`) + gỡ baseline (phải rỗng) | ⏳ |

Cắt lại 23/10: B2 (khung & KPI) và B4 (trạng thái) không còn là đợt riêng — phần Invest của chúng đi
vào đợt nhóm trang I1–I6, mỗi đợt làm trọn khung + KPI + biểu đồ (bảng màu B3) + trạng thái; phần Ops
nằm ở B1/B5.

Phát hiện khi chụp bản đồ đích (chưa kiểm nguyên nhân, việc dữ liệu — chưa mở phiên): bản đồ Hà Nội ở Finder
và Insight mở ra cả nước vì ranh giới "phường" của `vn-hanoi` trải khắp VN (vùng tô gần Cần Thơ; bảng xếp hạng
có "Tỉnh Phú Thọ", "Tỉnh Hưng Yên"). Nghi gán khu vực/ranh giới ở pipeline (`reassign-areas.mjs`); mapcn không sửa được.

**Tích hợp nhánh fix/portal-deals-airdna sau A** (nhánh dời `(app)/deals/page.tsx` → `ops/deals/page.tsx`, sửa `dau-tu/page.tsx`, `investment-simulator.tsx`):
1. Rebase lên `main` đã có A.
2. `.claude/skills/onehub-ui/routes.md`: dòng `/deals` thành `/ops/deals` (file `ops/deals/page.tsx`, operational, Table-backed management, Frame); nếu không `routes-map.test.mjs` đỏ.
3. `app/eslint-suppressions.json`: đổi khoá `src/app/(app)/deals/page.tsx` thành `src/app/ops/deals/page.tsx`, giữ nguyên số đếm (hoặc `npx eslint . --prune-suppressions`), rồi kiểm bằng `node eslint-plugin-onehub-ui/check-baseline-growth.mjs <suppressions-của-main> eslint-suppressions.json`.
4. `cd app && npm run lint && npm run test:lint-rules` xanh.

**Thứ tự khuyến nghị tiếp**: A2 (judge 12 cặp qua /ops/review) → A4 (extract-text) → A3 (MCP) → M3 (consolidation).

## 5. Chỉ mục quyết định

ADR: 0001 stack · 0002 insight-core · 0003 collector · 0004 đa nguồn ·
0005 AirDNA hiệu chuẩn · 0006→0007 SPL+SOC · 0008 scope VN · 0009
boundaries · 0010 bán dài hạn · 0011 RESO-first · 0012 onehub-ai-agent.
Research nền: investment-pipeline-4-stages (north star) ·
unified-property-pipeline · decision-models-landscape ·
agent-harness-survey · agent-memory-survey · reso-standards.
