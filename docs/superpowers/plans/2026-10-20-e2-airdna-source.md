# E2 — AirDNA làm nguồn dữ liệu + Track ảnh Listing: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AirDNA trở thành nguồn (1) discovery bổ sung cho vũ trụ listing, (2) lịch sử LTM không thể tự thu — qua đường bền nhất có thể (MCP chính thức trước, RE sau); song song surface ảnh/thông tin listing từ raw sẵn có.

**Architecture:** Phase A nghiên cứu quyết định go/no-go từng lớp dữ liệu (audit MCP docs + REA khảo sát app đã login — chỉ đọc, ghi evidence). Phase B-D build theo kết quả: bảng AirDNA listing-level keyed Airbnb-ID (không trộn cột — ADR-0005), collector tuân CCP mở rộng cho AirDNA. Track ảnh = transform re-parse thuần, không thu thập lại.

**Tech Stack:** WebFetch/WebSearch (MCP docs), REA `inspect_web_page` + chrome-devtools-mcp (tab AirDNA đã login, CDP :9222), TypeScript collector + node:test, PostgreSQL migration, Next.js.

**Spec:** `docs/adr/0005-source-strategy.md` (buy-now own-later, không trộn số), `docs/adr/0007-collector-operating-principles.md` (CCP/SPL), ADR-0009 (mới — ranh giới RE), AGENTS.md (phạm vi tab AirDNA, research-local không commit).

## Global Constraints

- RE chỉ trên **tài khoản trả phí của chính user, tab đã login** (CDP :9222); passive inspect trước, active click tối thiểu; **không tải hàng loạt** trong giai đoạn khảo sát.
- Evidence REA → `research-local/` (gitignored); chưng cất vào `docs/research/`.
- Dữ liệu AirDNA listing-level → bảng riêng keyed `listing_id` (Airbnb ID); KHÔNG đè cột `listings`.
- CCP áp cho AirDNA web app: requestsPerSecond ≤0.3, một profile, fail = lùi + báo.
- Quyết định go/no-go từng lớp (universe / history / detail) ghi trong bảng quyết định Task A2 — không mặc định "RE tất cả".
- UI tiếng Việt; mã SPL S02 cho AirDNA ở serving.

## Review Focus

1. MCP docs có expose listing-level + history nhưng gói $249 không cho phép → quyết định ghi rõ giới hạn gói trong bảng go/no-go (đừng build collector rồi mới phát hiện 403) → A2.
2. Endpoint RE đổi shape giữa market (Hà Nội) và market khác → khảo sát ≥2 market trước khi chốt schema → A3.
3. Universe AirDNA đếm khác ta vĩnh viễn (Vrbo, inactive) → thẻ độ phủ phải giải thích khác biệt định nghĩa, không phải "ta thiếu X%" duy nhất → C1.
4. History LTM tháng nào cũng dịch (rolling 12 tháng) → bảng phải lưu `period` + `captured_at`, không coi là bất biến tuyệt đối → C2.
5. Ảnh extract từ raw cũ thiếu trường (snapshot đầu kỳ) → transform phải để null an toàn, không crash batch → B1.

---

### Task A1: ADR-0009 — ranh giới reverse engineer AirDNA

**Files:** Create `docs/adr/0009-airdna-re-boundaries.md`

- [ ] **B1:** Viết ADR: chấp nhận RE listing-level trên tài khoản trả phí của chính mình (nhất quán ADR-0003/0005); ranh giới: volume chia ngày (≤500 request/ngày khảo sát đo đạc), không phân phối dữ liệu thô, MCP ưu tiên khi có parity, CCP áp dụng, rủi ro tài khoản = mất nguồn hiệu chuẩn (không mất dữ liệu self). Trạng thái accepted.
- [ ] **B2:** Commit: `docs(adr): 0009 — ranh giới RE AirDNA listing-level`.

### Task A2: Audit MCP/API chính thức AirDNA

**Files:** Create `docs/research/airdna-mcp-audit.md`

**Interfaces:** Produces: bảng go/no-go từng lớp dữ liệu {universe, listing-history, market-timeseries, for-sale} × {MCP có?, gói cho phép?, đủ không?} + endpoint/auth mẫu.

- [ ] **B1:** WebFetch `https://mcp.airdna.co/docs` + search thêm tài liệu developer API (api-gateway.airdna.co) — ghi endpoint, auth (OAuth/key), scope, rate limit, giá theo gói.
- [ ] **B2:** Với mỗi lớp dữ liệu đánh giá: MCP có暴露 không → nếu có: "MCP-first" (Task C/D dùng MCP); nếu không: RE cần (Task A3).
- [ ] **B3:** Ghi bảng quyết định + trích nguồn. Commit.

### Task A3: REA khảo sát app.airdna.co cấp listing (chỉ đọc)

**Files:** Evidence → `research-local/`; distill → `docs/research/airdna-listing-api.md`

**Interfaces:** Consumes: CDP :9222 tab AirDNA login (AGENTS.md). Produces: danh sách endpoint XHR cấp listing/market-history + params + sample response shape (field names thật) cho Task C/D.

- [ ] **B1:** `mcp__rea__list_browser_targets cdp_endpoint http://127.0.0.1:9222` → tìm target app.airdna.co. Passive `inspect_web_page` (network, không navigate).
- [ ] **B2:** Dùng chrome-devtools (chỉ tab đó): vào trang market Hà Nội → mở danh sách listing → click 1 listing → ghi mọi XHR `api.airdna.co` (URL, method, params, response JSON shape — field names, không cần toàn bộ values).
- [ ] **B3:** Lặp với 1 market khác (TP.HCM) — so shape (Review Focus #2).
- [ ] **B4:** `export_evidence_bundle` → `research-local/`; chưng cất endpoint map vào docs (kèm evidence_id).
- [ ] **B5:** Commit (chỉ file docs).

### Task B1: Track ảnh — transform extract photos/review/amenities + migration + UI

**Files:** Modify `pipeline/transform-airbnb.mjs`; Create `db/migrations/015_listing_media.sql`; Modify `app/src/lib/queries.ts` (getListingDetail trả ảnh), `app/src/app/(app)/listing/[id]/page.tsx` (gallery)

**Interfaces:** Produces: cột `listings.photo_urls jsonb`, `review_count int`, `amenities jsonb`; `getListingDetail` thêm `photos: string[]` (max 10), `reviewCount`.

- [ ] **B1:** Migration 015 (3 cột, nullable). Apply.
- [ ] **B2:** Transform: từ `deferredState.niobeClientData` + `pdpSections` regex `a0\.muscache\.com/im/pictures/[^\"]+` → unique, strip query, dùng `?im_w=1200` cho full, cover = phần tử đầu; `reviewCount` từ `"reviewCount":(\d+)`; amenities từ key amenities (đếm + names nếu parse được). RED trước: chạy 1 listing cũ → cột null; sau implement → re-run → có giá trị (verify SQL).
- [ ] **B3:** Re-parse toàn bộ: chạy transform-airbnb (idempotent theo snapshot) → verify: ≥90% listings VN có photo_urls (một ít snapshot đầu kỳ có thể thiếu — null an toàn, Review Focus #5).
- [ ] **B4:** UI listing detail: gallery (cover lớn + grid) + review count; ẩn khi null. Build + verify `/listing/<id mẫu>` hiển thị ảnh.
- [ ] **B5:** Commit + push.

### Task C1: Collector universe AirDNA (theo kết quả A2/A3)

**Files:** Create `collector/src/collectors/airdna-listings.ts` (MCP hoặc RE tuỳ go/no-go); Create `db/migrations/016_airdna_listings.sql` (bảng `airdna_listings(listing_id PK text, market_airdna_id, meta jsonb, first_seen, last_seen)`)

- [ ] Chỉ mở sau A2/A3. Kéo danh sách listing-id theo market (HN + HCMC trước) → bảng riêng. Diff với discovery tự thu: số listing AirDNA có mà ta chưa fetch → đưa vào queue airbnb-listing (checkpoint doneIds trừ). Tiêu chí: bảng có ≥90% universe HN; log diff rõ ràng.

### Task C2: History LTM (market trước, listing nếu gói cho phép)

**Files:** Create `pipeline/sql/460_airdna_history.sql` hoặc MCP job tương ứng; bảng `airdna_monthly_history(metric, airdna_id, period, value, captured_at)`.

- [ ] Market-level timeseries 43 tỉnh (12–24 tháng) → bảng + `/ops/quality` cột đối chiếu LTM. Listing-level: chỉ khi gói cho phép (A2) — nếu không, ghi "out of scope gói" vào ROADMAP.

### Task D: Độ phủ trung thực + đóng gói

- [ ] `/ops/quality`: thẻ "Độ phủ tự thu" = listings tự thu / airdna active count, kèm chú thích khác biệt định nghĩa (Review Focus #3). Footer trang Insight thêm % độ phủ khi có số AirDNA.
- [ ] Update ROADMAP E2 hoàn thành + memory.

## Thứ tự thực thi

A1 → A2 → (A3 ∥ B1) → C1 → C2 → D. B1 độc lập chạy song song ngay.
