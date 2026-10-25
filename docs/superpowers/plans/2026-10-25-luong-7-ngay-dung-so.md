# Luồng 7 ngày đếm đúng (ON5) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (tuần tự trong phiên chính).

**Goal:** Hai cột S03 của «Luồng 7 ngày qua» đếm đúng nguồn và cùng đồng hồ ngày đăng; máy thu đẩy khối `luong7`; máy chủ
dựng lại bảng từ khối, cột snapshot ghi «Chỉ ở máy thu».

**Architecture:** Một định nghĩa SQL cho hai cột S03 ở `pipeline/lib/ops-flow.mjs` (bên ghi) và `getFlowDays` (app, máy
thu), giữ khớp bằng phép đo đối chiếu trên lược đồ tạm (tiền lệ ON22). Khối mới theo khuôn `blocks` của ON22, đọc qua
`readOpsFacts`. `FlowTable` có chế độ máy chủ.

**Tech Stack:** Next.js 16, ReUI data-grid (`InsightGrid`), pg, `node --test` + tsx, playwright-core (collector).

**Spec:** `docs/superpowers/specs/2026-10-25-luong-7-ngay-dung-so-design.md` · hợp đồng
`_acceptance/luong-7-ngay-dung-so/contract.md` (Hỏi-1, Hỏi-2 theo khuyến nghị).

## Global Constraints

- Ngày = ngày giờ VN (`VN_DAY_SQL` / `vnDayKey`, ON8). Bài thô: `stg_zalo_posts` có `snapshot_id LIKE '%zalo-agent%'`,
  theo `posted_at`. Tin rao: `sale_offers.source = 'S03'`, theo `first_seen`.
- Khối: `blocks.luong7 = {measured_at, days:[{day, s03Posts, s03Offers}]}` đúng 7 phần tử, cũ → mới; lỗi →
  `{measured_at, error}`. Không đổi khoá cũ `zaloFlow`, không đổi route ingest, không migration.
- Nhãn ô: «Chỉ ở máy thu»; ô không số: «—»; số cũ: `text-muted-foreground` trên từng ô số S03.
- Không sửa `components/ui|reui|blocks|examples`. Smoke chỉ trên DB localhost, không ghi `public.ops_heartbeat`.
- Tên ca mở đầu `ON5-AC-n`; mỗi thước mới có chiều đỏ cùng fixture, thông điệp ghim.

## Review Focus

1. Máy thu đẩy bản tin đời cũ (không có `luong7`) sau khi app mới đã lên → ô «—», không 0 (AC-6).
2. Ngày ranh 23:59 / 00:01 giờ VN và mốc đo lúc 00:30 giờ VN (khoá ngày cuối là ngày VN, không ngày UTC) — AC-1, AC-5.
3. Bên ghi đổi tên khoá mà bên đọc không biết — vòng trọn AC-5.
4. DB local không có tin S03 trong 7 ngày → E8 đỏ có tên, không xanh rỗng.
5. Smoke chạm `public.ops_heartbeat` thật → kiểm trước/sau bằng nhau (AC-9).

---

### Task 1: Một định nghĩa hai cột S03 ở máy thu (independent: false) — phục vụ E1, E2, E7

**Files:** Modify `pipeline/lib/ops-flow.mjs` (thêm `luong7(client, {now, n})` trả mảng 7 ngày, SQL hằng
`S03_POSTS_SQL` / `S03_OFFERS_SQL` xuất ra), `app/src/lib/collections-queries.ts` (nhánh máy thu của `getFlowDays` dùng
đúng hai câu SQL đó — chép nguyên văn, có ghi chú trỏ bản `.mjs`), `app/src/components/ops/collections-tables.tsx` (mô
tả bảng). Create `app/tests/luong-7-ngay-dung-so.test.tsx` (lược đồ tạm riêng, chèn bài/tin viết trước).
- [ ] Ca `ON5-AC-1 …` (S06 cùng ngày, 23:59/00:01) + chiều đỏ đếm mọi nguồn; ca `ON5-AC-2 …` (mock, 22:49 nạp sau nửa
  đêm) + chiều đỏ theo `captured_at`; ca `ON5-AC-7 …` (7 `data-col-id`, mô tả) + chiều đỏ thiếu cột.
- [ ] Sửa tới xanh; `tsc`, `lint`, `npm test` (app + pipeline) xanh.

### Task 2: Khối `luong7` trong bản tin (independent: false) — phục vụ E3, E4

**Files:** Modify `pipeline/push-ops-facts.mjs` (khối `luong7: await measure(() => luong7(client, {now}))`),
`app/src/lib/ops-facts.ts` (`OPS_FACT_BLOCKS` thêm `luong7`). Test cùng tệp Task 1, bên ghi qua `captureOpsFacts`
(`OPS_FACTS_NOW` ghim mốc), đột biến qua `mutantPush`.
- [ ] `ON5-AC-3` 7 khoá liên tiếp, ngày rỗng 0, `measured_at`, tầng A không chặn; bảng vắng → `error`; hai chiều đỏ.
- [ ] `ON5-AC-4` khối = `getFlowDays` máy thu từng ngày; chiều đỏ đếm mọi nguồn.

### Task 3: Bảng trên máy chủ (independent: false) — phục vụ E5, E6

**Files:** Modify `app/src/lib/ops-cloud.ts` (`CloudOpsView.luong7: {day, s03Posts, s03Offers}[] | null`),
`app/src/lib/collections-queries.ts` (hàm `getCloudFlowDays(view)`: S03 từ khối, `listings` từ bảng đã đồng bộ, snapshot
`null`), `app/src/app/ops/collections/page.tsx` (nhánh máy chủ tải ngày khi `state ≠ none`),
`app/src/components/ops/collections/collections-view.tsx` (dựng `FlowTable mode="cloud"`, bỏ «Luồng 7 ngày» khỏi Alert
khi đã có bản tin), `app/src/components/ops/collections-tables.tsx` (`FlowTable` nhận `mode`, `stale`: ẩn S02, ô
`null` → «Chỉ ở máy thu» cho snapshot / «—» cho S03, mờ ô S03 khi `stale`).
- [ ] `ON5-AC-5` vòng trọn (captureOpsFacts → `ops_heartbeat` lược đồ tạm → `readOpsFacts` → SSR, 14 ô) + 4 chiều đỏ.
- [ ] `ON5-AC-6` ba trạng thái + hai chiều đỏ, đọc lớp mờ theo từng ô.

### Task 4: Đường đo ngưỡng trên DB local (independent: false) — phục vụ E8

**Files:** Create `scripts/luong-7-ngay-do.mjs` (mượn `pg` từ `app/`, gọi `luong7` thật, đường độc lập = ngày đăng bài
sớm nhất trong `post_ids`; từ chối DB không localhost; k ≥ 1 ngày có tin; chiều đỏ trên số đếm mọi nguồn).
- [ ] Chạy trên DB local: exit 0, in 7 dòng + số ngày có tin + dòng chiều đỏ.

### Task 5: Smoke trình duyệt chế độ máy chủ (independent: false) — phục vụ E9

**Files:** Modify `scripts/lib/ops-app.mjs` (`batApp(root, {env})` nhận biến môi trường thêm — ON13 gọi như cũ).
Create `scripts/smoke-luong-7-ngay.mjs`: lược đồ tạm gồm view của mọi bảng `public` trừ bảng chỉ có ở máy thu
(`source_registry`, `stg_*`, `airbnb_snapshots`, `review_queue`, `user_events`, `user_profile`), view `ref_calib_*` cho
`airdna_*`, bảng `ops_heartbeat` riêng; `next dev` với `VERCEL=1` + `DATABASE_URL` trỏ lược đồ đó; ba trạng thái (ghi
bản tin bên ghi thật / đổi `pushedAt` cũ 50′ / xoá khối) × 1280 và 390; ảnh vào `.acceptance-runs/luong-7-ngay-dung-so/`;
`public.ops_heartbeat` băm trước = sau; dọn lược đồ và phiên tạm trong `finally`.
- [ ] Hai chiều đỏ (ô canh trái, phần tử 500px); `node scripts/smoke-luong-7-ngay.mjs` exit 0.
