# Gắn căn = nhận diện duy nhất — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Native — phiên thợ N1 tự làm tuần tự). Steps dùng checkbox.

**Goal:** FRAMING §3.4 và CONTEXT.md theo thang Mạnh duyệt 08/11; `/ops/data-flow` đo Gom cụm · Định vị · Gắn căn trên Tin rao, chữ trên tin chỉ là «chờ khớp».

**Architecture:** `600_data_flow.sql` tính khoá mới vào `facts` (máy thu), push-ops-facts chở nguyên lên cloud; app chuẩn hoá khối (khối cũ → null) rồi lưới, Sankey, biểu đồ ngày, ngăn tin đọc cùng khoá. Hai CTE rỗng `dinh_vi_link`, `gan_can_link` là chỗ duy nhất đổi khi có bảng nối tin → nút danh bạ.

**Tech Stack:** PostgreSQL (lược đồ tạm trên :5433), Next.js 16 + ReUI, node:test + jsdom (`app/tests`).

**Spec:** `docs/superpowers/specs/2026-11-08-gan-can-dinh-danh-duy-nhat-design.md` · hợp đồng `_acceptance/gan-can-dinh-danh-duy-nhat/`

## Global Constraints

- Khoá `facts.sources[*]`: `clustered`, `located`, `unitLinked`, `locatedPending`, `uniqueIdPending`, `deepest {unitLinked, located, clustered}`; `facts.days[*]`: `unitLinked`. Không còn `linked` trong `facts`.
- Gom cụm = tin trong cụm `properties` có ≥ 2 tin trong view `sale_offers` (Hỏi-2: chỉ tin sống).
- `locatedPending` = `nullif(btrim(block_raw),'') IS NOT NULL OR unit_number ~* 'xx'`, trừ tin đã `located`.
- `uniqueIdPending` = (toà khác rỗng AND `unit_number !~* 'xx'` AND `unit_number NOT IN ('0','1')` AND `length(unit_number) >= 3`) OR (`street_number NOT IN ('0','1')` AND `street_raw` khác rỗng AND khu là `submarket`), trừ tin đã `unitLinked`.
- Luật nút thắt: bỏ kiểm «gắn căn» (Hỏi-1); `NUT_THAT_CHECKS` = đọc · trường lõi · phường.
- Không chuỗi «Thiếu phường hoặc toạ độ» trên trang. Nhãn UI: «Gom cụm», «Định vị», «Gắn căn», «Chưa định vị», «chờ khớp», «Mức nhận diện».
- Khối bậc (`LevelGate`, `levelOf`, 610) KHÔNG đổi (OOS-1, hàng `thang-bac-moi-b0-b5`).
- Cloud không có cột `unit_number`, `street_number`: câu bản ghi tin đọc qua `to_jsonb(o)->>'…'`.

## Review Focus

- Khối cloud đời trước (có `linked`, thiếu khoá mới) → «—», không NaN, không số cũ (Task 4 E9).
- Tin cùng cụm với một tin đã nghỉ (không có trong view) → không Gom cụm (Task 2 E3).
- Số nhà «1» và mã căn «0»/«1» (cờ hiển thị S06) → không «đủ định danh» (Task 2 E3).
- Hàng nhóm thu, S01 → «—» ba cột, không «0%» (Task 3 E5).
- Màn 390 px: lưới thêm hai cột không đẩy cuộn ngang toàn trang (S4 E10; lưới đã cuộn trong khung).

---

### Task 1: FRAMING §3.4 và từ điển — independent: true · phục vụ E1, E2

**Files:** Modify `docs/product/FRAMING.md` (§3.4 dòng 108–126, dòng 101, 170, 171, 178, 237–238, nhật ký) · `CONTEXT.md` (mục «Tài sản & tin»: thêm ba khối sau «Căn nhà»; sửa «Căn nhà»; sửa «Dòng chảy dữ liệu») · Test `app/tests/gan-can-dinh-danh.test.tsx` (tạo)

- [ ] Test «GGC-AC-1 …» và «GGC-AC-2 …» theo expected E1, E2 (bộ kiểm là hàm thuần `kiemContext(text): string[]`, `kiemFraming(text): string[]` trả danh sách lỗi; ca chiều đỏ gọi trên bản sao chữ đã phá và so thông điệp ghim).
- [ ] Chạy `cd app && node --import tsx --test tests/gan-can-dinh-danh.test.tsx` → đỏ (chưa có khối).
- [ ] Áp bản FRAMING của Mạnh nguyên văn (bản áp `framing-34-viet-lai-20261108.md` mục 1–3); viết ba khối CONTEXT (Code: `clustered` · `located` · `unitLinked`; Slug URL: «không có trang riêng — số trên `data-flow`»; _Avoid_: Gắn căn ← «gắn cụm, ghép căn theo toạ độ»; Định vị ← «gắn căn (suy ra), gắn toà»; Gom cụm ← «gắn căn, căn tự dựng»).
- [ ] Chạy lại → xanh; `cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs` xanh (dòng Slug URL mới không phá bộ đọc).
- [ ] Commit `docs: thang bậc FRAMING §3.4 và từ điển Gắn căn, Định vị, Gom cụm`.

### Task 2: Số mức nhận diện ở 600 — independent: false · phục vụ E3, E4

**Files:** Modify `pipeline/sql/600_data_flow.sql` (`offers_daily`, `sources_by_win`, `days_raw`, `days_json`) · `app/src/lib/data-flow-queries.ts` (kiểu) · Test `app/tests/gan-can-dinh-danh.test.tsx`

**Interfaces — Produces:**
- `type Levels = { clustered: number | null; located: number | null; unitLinked: number | null; locatedPending: number | null; uniqueIdPending: number | null; deepest: { unitLinked: number; located: number; clustered: number } | null }`
- `SourceFlow = StageCounts & Levels & {…}`; `StageCounts` bỏ `linked`; `FlowDay = { day, source, received, readable, offers, unitLinked }`
- `normalizeFacts(f: unknown): FlowFacts` — khoá mức thiếu → null (`deepest` thiếu → null), `days[].unitLinked` thiếu → 0; dùng ở cả đường máy thu lẫn cloud.

- [ ] Test «GGC-AC-3 …», «GGC-AC-4 …»: lược đồ tạm `ggc_<pid>` = `makeFlowSchema(admin, s, { offers: [] })` rồi chèn ma trận E3 (cột thêm block_raw, unit_number, street_number, street_raw; cụm qua property_offers; «tin đã nghỉ» = dòng property_offers trỏ offer_id không có trong `sale_offers`; areas có một submarket và một market); kỳ vọng rút bằng hàm `kyVong(matrix, window)` trong test; hai bản đột biến 600 bằng thay chuỗi trên `flowSql()`.
- [ ] Chạy → đỏ.
- [ ] Sửa 600: CTE `cum` (property_id, n sống), `dinh_vi_link`/`gan_can_link` rỗng (`SELECT NULL::text AS offer_id WHERE false`, chú thích V9), cờ từng tin rồi đếm theo (nguồn, ngày); `days` mang `unitLinked`.
- [ ] Chạy → xanh. Commit `feat(data-flow): 600 đếm Gom cụm, Định vị, Gắn căn khớp danh bạ và số chờ khớp`.

### Task 3: Lưới, Sankey, biểu đồ ngày, ngăn tin — independent: false · phục vụ E5, E6, E7, E8, E11

**Files:** Modify `quality-rows.ts` (QualityRow: `clustered`, `located`, `unitLinked`, `locatedPending`, `uniqueIdPending` thay `linked`; bỏ kiểm gắn căn) · `quality-grid.tsx` (ba cột + dòng phụ «N chờ khớp»; khối cũ → dòng «Số mức nhận diện có ở lượt làm tươi kế») · `flow-sankey-data.ts` (Stage thêm `located`, `clustered`; nút `unit`, `located`, `clustered`, `unlocated`; khối cũ → nút `levels-pending` «Chờ lượt làm tươi», tiêu đề «—») · `stage-face.tsx` (`located` → `var(--info)`, `clustered` → `var(--chart-3)`) · `flow-sankey.tsx`, `flow-journey.tsx` (terminal gồm hai stage mới, chú giải) · `stage-trend-data.ts`, `stage-trend-chart.tsx` (`StageKey` `unitLinked`) · `record-sheet.tsx` + `data-flow-queries.ts` (`recordsSql` thêm `identification`, `RecordRow.identification: { level: "unit"|"located"|"clustered"|"none"; locatedPending: boolean; uniqueIdPending: boolean }`)

- [ ] Test «GGC-AC-5 … AC-8» theo expected E5–E8 (jsdom như `ops-dong-chay.test.tsx`).
- [ ] Chạy → đỏ; sửa; chạy → xanh; `cd app && npx tsc --noEmit && npm run lint` sạch.
- [ ] Commit `feat(ops): /ops/data-flow ba cột Gom cụm · Định vị · Gắn căn, Sankey theo mức sâu nhất`.

### Task 4: Cloud và test DF0/DF1 — independent: false · phục vụ E9

**Files:** Test `app/tests/gan-can-dinh-danh.test.tsx` (ca cloud + khối cũ) · Modify `app/tests/ops-dong-chay.test.tsx`, `dong-chay-cloud.test.tsx` (danh sách khoá đóng DC-AC-5, số linked → khoá mới), `df0-chang-theo-ngay.test.tsx`, `dong-chay-so-cu.test.tsx`, `ops-dong-chay-fixture.ts` (giữ cờ `linked` của Offer = có dòng property_offers), `ops-nhan/visible-strings.ts` (chữ mới)

- [ ] Ca «GGC-AC-9»: makeOpsSchema + captureOpsFacts + ingest THẬT như dong-chay-cloud; ca phụ khối cũ; hai chiều đỏ.
- [ ] Sửa test DF0/DF1 theo khoá mới, không nới kỳ vọng nào khác.
- [ ] `cd app && npm test` (DB của riêng lượt) xanh. Commit `test(data-flow): …`.

### Task 5: Kiểm lại toàn kho — independent: false

- [ ] `/verify` app + pipeline; `bash scripts/pre-merge-check.sh . --base origin/main`; hồ sơ khác bị hoá cũ vì chạm `paths` → ghim lại bằng làn (xin lượt `ghim-lai`).
