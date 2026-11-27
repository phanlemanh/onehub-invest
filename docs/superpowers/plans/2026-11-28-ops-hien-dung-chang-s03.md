# Kế hoạch thi công — ON25 `ops-hien-dung-chang-s03`

Hồ sơ: `_acceptance/ops-hien-dung-chang-s03/` (duyệt Cổng Phạm vi 2026-11-27, Mạnh). Thiết kế:
`docs/superpowers/specs/2026-11-28-ops-hien-dung-chang-s03-design.md`.

Hai đợt theo lời giám sát 28/11: **đợt A** («Khớp toà», không đụng tệp của KEV2 #554) làm ngay; **đợt B** («Luồng 7 ngày»: `ops-flow.mjs`,
`collections-queries.ts`, `ops-cloud.ts`, `sync-activity.tsx`, `palette.ts`, `CONTEXT.md`, test luong7/từ ngữ) chỉ bắt đầu sau khi
KEV2 gộp và nhánh gộp `origin/main` một lần. Mọi task tuần tự (`independent: false`) — cùng chạm hai tệp test dùng chung.

## Đợt A

### A1 — `toa_link` đọc `offer_building`, bộ chạy giữ đường lùi khi DB chưa có view
- Files: `pipeline/sql/600_data_flow.sql`, `pipeline/lib/than-600.mjs`, `pipeline/refresh-data-flow.mjs`
- Làm: `toa_link AS MATERIALIZED (SELECT offer_id FROM offer_building WHERE status = 'gan' AND muc = 'toa'),`; sửa chú thích CTE.
  `than-600.mjs` thêm `DONG_KHOP_TOA` + `toaKhiCoView(c, sql)` cùng khuôn `dinhViKhiCoView` (DB chưa có `offer_building` → CTE rỗng +
  một dòng stderr); `chayLamTuoi` gọi cả hai.
- Verify: `node --check` hai tệp mjs; `node -e` chạy `than600(SQL600)` không ném.
- Phục vụ: E1, E2, E3. `independent: false`.

### A2 — Lược đồ tạm của test app có bảng `offer_building`
- Files: `app/tests/ops-dong-chay-fixture.ts`
- Làm: cạnh bảng `offer_project`, tạo bảng rỗng `offer_building (offer_id text PRIMARY KEY, status text, muc text, building_key text)`
  — 600 đọc đúng lược đồ của test, không rơi về view của public (dữ liệu thật) khi search_path còn public.
- Verify: `cd app && npx tsc --noEmit -p .` (không DB).
- Phục vụ: giữ các ca data-flow hiện có xanh. `independent: false`.

### A3 — Test SM1/ON25 trên bảng thật, probe
- Files: `pipeline/tests/so-moc-s03.itest.mjs`, `_acceptance/ops-hien-dung-chang-s03/probes/moc.sh`
- Làm: lược đồ `sm1_<pid>` có bảng `offer_building`; `tin()` nhận `blockRaw`, `unitNumber`, `toa` (`gan/toa` · `gan/vung` · `xung_dot`).
  Viết lại SM1-AC-2 «đối chứng dương» trên bảng thật (bỏ `noiToa`). Thêm `ON25-AC-1` (sáu ô, mỗi ô một lượt làm tươi + đột biến CTE
  rỗng, đột biến bỏ `muc = 'toa'`) và `ON25-AC-2` (sáu ô `locatedPending` + đột biến bỏ `NOT m.toa_khop`). Probe chạy
  `db-thu.sh oneinvest_suite_on25_moc --chay node --test --test-name-pattern=<mã> tests/so-moc-s03.itest.mjs` và đòi số ca đạt ≥ số ca
  khai của mã, 0 fail.
- Verify: probe `ON25-AC-1`, `ON25-AC-2`, và cả tệp (SM1) — xin khoá `s4` ước ngắn trên Mac mini.
- Phục vụ: E1, E2. `independent: false`.

### A4 — Probe máy thu (E3)
- Files: `_acceptance/ops-hien-dung-chang-s03/probes/may-thu.sh` (+ `.mjs`)
- Làm: trên bản chép dữ liệu thật của riêng lượt: chạy 600 của nhánh và của merge-base, in hai cặp số; phần bảy ngày `luong7` thêm ở đợt B.
  Dừng nếu `DATABASE_URL` trỏ `oneinvest`.
- Verify: chạy ở S4 (cần khoá).
- Phục vụ: E3. `independent: false`.

## Đợt B (sau KEV2)

- B1 `ops-flow.mjs`: `S03_ACTIVE_OFFERS_SQL`, `luong7()` thêm `s03ActiveOffers` — E4.
- B2 `collections-queries.ts` (chép nguyên văn câu, `FlowDay.s03ActiveOffers`, `getCloudFlowDays`), `ops-cloud.ts` (`Luong7Day`) — E5, E6.
- B3 `sync-activity.tsx` (ba nhãn, bỏ `stackId` tab S03, mô tả, định dạng tooltip `null` → «—»), `palette.ts` (`opsVolumeActive`),
  `CONTEXT.md` (thuật ngữ mới, sửa mục Bài và Định vị) — E7, E8.
- B4 `app/tests/luong-7-ngay-dung-so.test.tsx` (ON25-AC-4/5/6), `app/tests/tu-ngu-collections.test.tsx` (cặp thay mới), probe `luong7.sh`.
