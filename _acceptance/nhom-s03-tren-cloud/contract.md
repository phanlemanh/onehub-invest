---
schema_version: 1
feature: Bảng nhóm S03 ghi đúng số nhóm đang bật trong danh sách cho phép và «Vào bảng thô» theo nhóm — ở máy thu đo trực tiếp, trên máy chủ đọc khối s03 máy thu đẩy lên; thiếu số thì «—», không 0
slug: nhom-s03-tren-cloud
owner: phanlemanh@gmail.com
risk_tier: T3      # chạm pipeline/push-ops-facts.mjs (t3_paths)
surfaces: [ui, cli]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-25-nhom-s03-tren-cloud-design.md
approved_by: Mạnh
approved_at: 2026-10-25
lo_trinh_ma: ON4
---

# Acceptance Contract: nhom-s03-tren-cloud

## Context

Bảng nhóm S03 ghi «danh sách cho phép đang bật 0 nhóm» trên máy chủ (đọc tệp cấu hình ngay trên Vercel) và 4 nhóm ở máy
thu (khoá `groups` cũ, trước bản nhiều tài khoản — thật là 7); cột «Vào bảng thô» theo nhóm của bản tin luôn 0 vì
`parseLog` không cộng `accepted` vào hàng nhóm, trong khi trang máy thu đếm đúng (OPS-9, gốc G1). Vòng này sửa cách đếm ở
bên ghi, sửa N ở cả hai bên theo một định nghĩa, đẩy khối `s03` (ADR-0014) và cho bảng trên máy chủ đọc khối ấy.

Căn cứ: docs/plan/lo-trinh.json ON4 (`cau_giao`, `bat_khi`, `ghi_chu`); docs/adr/0014-ops-cloud-doc-so-tong-hop.md;
`app/src/lib/zalo-admin.ts` (`effectiveGroups` — luật kế thừa nhóm của OpenClaw); AGENTS.md luật 6 (tên nhóm tầng C, mã
nguồn thật tầng A); ON3, ON23 (nhánh máy chủ của trang, Alert gom).

## Criteria

Ma trận viết trước dùng chung (mã giả, HOME tạm):

- Nhật ký cổng — nhóm A (có tên): `post 202 {"accepted":3}`, `post 202 {"accepted":2}`, `skip … {"accepted":4}`,
  `post 500 {"accepted":7}`; nhóm B (có tên): một `post 202` không có `accepted` (khuôn cũ của handler); nhóm C ghi bằng
  mã `9000000000000000003` (handler thiếu tên kênh thì ghi mã nhóm): một `post 202 {"accepted":1}`.
- Cấu hình OpenClaw — cấp ngoài `groups`: T1, T2, T3, T4 (bật); `accounts.default.groups`: T1, T2, T3, D4, D5, D6, D7 (bật)
  và D8 (`enabled: false`); `accounts.b`: không khai `groups` (kế thừa cấp ngoài); `accounts.c.groups`: D4 (bật, trùng
  `default`) và X (`allow: false`, không bật ở tài khoản nào). Nhóm bật hiệu dụng = {T1, T2, T3, T4, D4, D5, D6, D7} → **N = 8**.
  Bản sao sai cho số khác: chỉ đọc cấp ngoài → 4 · không kế thừa → 7 · không khử trùng → 12 (7 + 4 + 1) · bỏ qua `allow:false` → 9 ·
  bỏ qua `enabled:false` → 9.

- AC-1: Given nhật ký của ma trận, When chạy `parseLog` của bên ghi VÀ `gateByGroup` của trang máy thu trên cùng tệp, Then
  «Vào bảng thô» của A = 5 (không cộng dòng `skip`, không cộng `post 500`), của B = null (đã qua cổng mà không biết số tin
  vào — không 0), của C = 1, funnel tổng `accepted` = 6, và hai bên ra cùng giá trị theo nhóm.
- AC-2: Given cấu hình của ma trận, When bên ghi (`push-ops-facts` THẬT) dựng khối `s03` và trang máy thu gọi
  `readZaloAllowlist`, Then cả hai ra N = 8; và `zaloAccounts[].enabledGroups` của cùng bản tin là `default` 7 nhóm, `b`
  {T1…T4}, `c` {D4} — hợp lại đúng tập 8 nhóm ấy.
- AC-3 (cross-layer): Given bản tin do `push-ops-facts` THẬT dựng trên nhật ký và cấu hình của ma trận, đẩy qua handler ingest
  thật, When dựng trang `/ops/collections` THẬT ở chế độ máy chủ, Then bảng «Nhóm S03» có mặt, mô tả «đang bật 8 nhóm»,
  «Vào bảng thô» A = 5, B = «—», C = 1 với ô tên «Nhóm chưa có tên»; khối `s03` của bản tin và HTML trang không chứa mã
  `9000000000000000003` hay mã nhóm nào của cấu hình; chân bảng ghi «mã nhóm chỉ xem ở máy thu»; «nhóm S03» không còn trong
  Alert «Phần còn lại…».
- AC-4: Given lược đồ như máy chủ không có bản tin, hay bản tin mà khối `s03` lỗi ở bên ghi (không viết tay khối lỗi),
  When dựng trang, Then bảng nhóm S03 không dựng, Alert «Phần còn lại…» vẫn liệt «nhóm S03», không có chữ «0 nhóm» nào.
- AC-5: Given bản tin THẬT của AC-3 với mốc đo của khối `s03` lùi 46′, When dựng trang, Then Alert vàng «Máy thu không đẩy số
  từ …» có mặt, bảng vẫn hiện số của khối (N = 8, A = 5) nhưng 0 badge `success-light` trong bảng nhóm («Hoạt động» viền xám).
- AC-6: Given DB máy thu đủ bảng, When dựng `/ops/collections` ở máy thu, Then bảng nhóm đo trực tiếp (không đọc
  `ops_heartbeat`), N theo `readZaloAllowlist` mới, B = «—», và chân bảng vẫn liệt mã nhóm rút gọn như cũ.
- AC-7 (judgment): Given bảng trạng thái của đặc tả UX, chữ thật của bảng nhóm S03 và mã dựng khối `s03`, When đối chiếu với
  ADR-0014, CONTEXT.md và luật SPL (AGENTS.md luật 6), Then chữ đúng nhãn, không «0 nhóm» hay «0» trấn an khi không có số,
  và máy chủ không hiện mã nhóm hay tên tài khoản thu.
- AC-8: Given lint UI của kho, When `npm run lint` + `npm run test:lint-rules`, Then sạch.
- AC-9: Given dev server với lược đồ như máy chủ ở ba trạng thái (không có / tươi / cũ 46′) và một dev server ở máy thu, When
  mở `/ops/collections`, Then mỗi dòng `ST-s03-…` của bảng trạng thái có một khung mang đúng tên, kèm khung tối và khung
  390px, và trang không có thanh cuộn ngang ở 390px.

## Coverage

Quét không gian tiêu chí trong thiết kế theo các trục (dòng `approach` trong sổ):

- Trục số: «Vào bảng thô» theo nhóm (AC-1, AC-3, AC-5) · N nhóm bật (AC-2, AC-3, AC-6) [thước CE: `bat_khi` ON4].
- Trục cấu hình nhóm: cấp ngoài cũ · tài khoản khai riêng · tài khoản kế thừa · trùng mã · `enabled:false` · `allow:false`
  (AC-2, mỗi trục một bản sao sai cho số khác 8) [thước CE: `zalo-admin.ts` `effectiveGroups` + `enabledKeys`].
- Trục trạng thái bản tin: không có · khối lỗi (AC-4) · tươi (AC-3) · cũ > 45′ (AC-5) · số tin vào không biết (AC-1, AC-3).
- Trục dòng nhật ký: `post 202` có / không `accepted` · `skip` mang `accepted` · `post` khác 202 · nhóm ghi bằng mã (AC-1, AC-3).
- Trục môi trường: bên ghi (AC-1, AC-2) · máy chủ (AC-3…AC-5, AC-9) · máy thu (AC-1, AC-2, AC-6).
- Trục lớp đo: hàm (AC-1, AC-2) · HTML trang thật (AC-3…AC-6) · chữ (AC-7) · lint (AC-8) · ảnh (AC-9).

## Đường đo

- Ngưỡng «Máy thu có N nhóm bật … máy chủ hiện N» ← AC-2, AC-3.
- Ngưỡng «M tin vào raw của một nhóm: máy chủ hiện M» ← AC-1, AC-3.
- Ngưỡng «facts thiếu trường: ô ghi «—»» ← AC-1, AC-3 (nhóm B, do bên ghi thật sinh) và AC-4 (không khối).

## Out of scope

- Ô «Cổng S03 hôm nay» trên máy chủ (ON3 Ngoài-3, hợp đồng riêng).
- Luồng 7 ngày, xoay vòng trên máy chủ — ON5.
- Quản trị danh sách cho phép (`/ops/sources`) và sửa khoá `groups` cũ trong cấu hình OpenClaw.

## Notes

- Chạm `pipeline/push-ops-facts.mjs`, `pipeline/lib/ops-flow.mjs`, `scripts/lib/ops-local.mjs` — chung với AU12 và các hàng
  ON — chạy liền, không song song. Nhánh cắt từ ON23 (PR #83 chưa gộp).
- Phép đo không gọi lệnh ghi nào trên OpenClaw (`.claude/rules/zalo-safety.md`): cấu hình và nhật ký ở HOME tạm.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-25:
  - Ngoài-1: Khi máy thu không đọc được nhật ký cổng, đường API máy trên máy chủ (khoá zaloGroups cũ) vẫn báo 0 lượt thấy, qua cổng, vào bảng thô thay vì «không có số»; trang Ops không bị ảnh hưởng.
  - Ngoài-2: Phép đo «số cũ mờ» mới kiểm ba cột Thấy, Qua cổng, Vào bảng thô; hai cột bài thật 7 ngày và bài thử chưa có phép kiểm.
  - Ngoài-3: Phép đo «không đọc được cấu hình» mới kiểm ca tệp vắng; tệp JSON hỏng hay thiếu khai báo tài khoản Zalo chưa có ca đo.
  - Ngoài-5: Phép kiểm «máy chủ không hiện mã nhóm» mới có đối chứng cho một mã; các mã của cấu hình chưa có đối chứng dương.
  - Ngoài-6: Ma trận AC-2 chưa phủ cấu hình kiểu cũ khi tài khoản mặc định không khai nhóm riêng (rơi về nhóm cấp ngoài).
