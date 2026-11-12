---
schema_version: 1
feature: DA5 — tin S06 không còn mã căn và số nhà rác từ cờ nguồn, và mang toà từ trường block của nguồn thành phát biểu
slug: ma-can-s06-sach
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-12
design_doc: docs/superpowers/specs/2026-11-12-ma-can-s06-sach-design.md
---

# Acceptance Contract: ma-can-s06-sach

## Context

Bộ đọc đặc trưng S06 lấy cờ hiển thị `unitnumber_display`/`streetnumber_display` (chỉ có `0`, `1`) làm mã căn và số nhà: đo
12/11 có 12.928 phát biểu mã căn và 28.993 phát biểu số nhà rác, lớp sự thật, thắng chữ bài. Trường `block` của nguồn (3.068 tin)
không được đọc. Hàng DA5 sửa bộ đọc, thêm toà, dựng lệnh dọn (chạy thử mặc định) và đo nghĩa `pty_project_type`.

## Criteria

- AC-1: Given ma trận viết trước của `payload` (cờ `unitnumber_display` ∈ {vắng, `0`, `1`, `A-12.05`} × `unitnumber` ∈ {vắng,
  `1205`, `A-12.05`, `0`, `00`, `1`, `  `}), When gọi `docDacTrungS06`, Then phát biểu `unit_number` có đúng khi `unitnumber` là
  mã thật (`1205`, `A-12.05`) với `rule_id` `payload.unitnumber`, và không bao giờ mang `rule_id` `payload.unitnumber_display`.
- AC-2: Given ma trận viết trước (cờ `streetnumber_display` ∈ {vắng, `0`, `1`, `208`} × `street_number` ∈ {vắng, `số 88`, `208`,
  `1`, `0`, `000`, `  `}), When gọi `docDacTrungS06`, Then `street_number` có đúng khi `street_number` không rỗng và không chỉ gồm
  chữ số 0 (`1` được giữ), `rule_id` `payload.street_number`, không bao giờ `payload.streetnumber_display`.
- AC-3: Given `payload.block` ∈ {`A`, ` A1 `, `zen  b`, `1`, `""`, `"   "`, số `2`, vắng}, When gọi `docDacTrungS06`, Then có đúng
  một phát biểu `block_raw` (`rule_id` `payload.block`) cho mỗi giá trị có chữ, giá trị đã NFC, cắt đầu cuối, gộp khoảng trắng
  (`A1`, `zen b`, `2`), và không có phát biểu cho chuỗi rỗng, toàn khoảng trắng hay vắng.
- AC-4: Given DB của lượt với phát biểu đã nạp (045, 059, 061) và tin S06 mồi trong `stg_chotot_ads`, rác cài sẵn TRÊN CHÍNH các
  tin mồi (cùng khoá chủ thể): nhóm A có cờ mã căn `0` và `unitnumber` thật `1205`, nhóm B chỉ có cờ mã căn `0`/`1` và cờ số nhà
  `0`; `block` có chữ ở 20 tin, When chạy `runTransformChotot`, Then không phát biểu mới nào mang `rule_id`
  `payload.unitnumber_display` hay `payload.streetnumber_display`; nhóm A: rác bị thay bằng `1205` (rút lý do `thay-boi-luot`
  — bộ đọc chạy lại ra giá trị mới thì thay chính nó); nhóm B: mọi phát biểu rác vẫn còn hiệu lực (transform không rút khi bộ
  đọc thôi phát ra); số tin mồi có `block_raw` (fact · source_field) còn hiệu lực = 20/20.
- AC-5: Given cùng DB với phát biểu rác S06 có sẵn (mã căn `0`/`1` từ cờ và từ `unitnumber`, số nhà `0`/`1` từ cờ, số nhà `0`
  từ `street_number`), phát biểu sạch S06 (mã căn `1205`, số nhà `1` từ `street_number`), phát biểu không thuộc diện dọn (mã căn
  `1` của S03; mã căn `0` của S06 phương pháp khác `source_field`), và một tin có cả rác lẫn phát biểu chữ bài `1205`, When chạy
  lệnh dọn không cờ, Then lệnh in số đếm theo (trường, rule_id, giá trị) đúng bằng số rác đã cài, in dòng «toà: N tin có block
  trong thô · M tin có block_raw hiệu lực · tỉ lệ», và số dòng `field_assertions` còn hiệu lực không đổi; When chạy với `--ghi`,
  Then còn 0 phát biểu S06 `source_field` hiệu lực có mã căn chỉ gồm chữ số 0 hay `1`, số nhà chỉ gồm chữ số 0, hay rule
  `*_display`; phát biểu sạch và phát biểu ngoài diện vẫn hiệu lực; cột `unit_number` của tin có chữ bài = `1205`, của tin chỉ có
  rác = NULL (qua `resolve_offer_fields`); chạy `--ghi` lần hai rút 0 dòng.
- AC-6: Given `stg_chotot_ads` mồi có `pty_project_type` và `category`, When chạy lệnh dọn với `--bang-pty <tệp>`, Then tệp có
  đúng một hàng cho mỗi giá trị `pty_project_type` có mặt, cột số tin bằng tổng các cột theo `category`, cột loại đa số và tỉ lệ
  đúng, cột giả thuyết ZCode đúng bảng (1, 3, 4, 7 căn hộ; 2 shophouse; 10 nhà phố; 11 đất nền), dòng tổng bằng số tin có
  `pty_project_type`, và tệp mang dòng «sinh bởi … lúc …»; bảng không tự kết luận khớp/lệch (người đọc cân); bảng thật trên DB
  local ghi ở `docs/research/pty-project-type-s06.md`.
- AC-7: Given cây làm việc, When chạy `cd pipeline && npm test`, Then thoát 0 (gồm `dac-trung-s06.test.mjs` sửa các ô mang cờ
  `*_display`).

## Coverage

Bỏ quét không gian AC — xem dòng sổ `descope` «bỏ coverage-scan»: trục viết trước trong AC-1…AC-3 (cờ × trường thật × giá trị
rác/sạch) và AC-5 (rác theo nguồn × sạch); đổi lại không có bằng chứng độ phủ ngoài các trục ấy.

## Đường đo

| Ngưỡng (opportunity) | Số từ đâu | AC |
|---|---|---|
| 0 phát biểu mã căn «0»/«1» còn hiệu lực; 0 số nhà «0» | `node pipeline/scripts/ma-can-s06-sach.mjs` (chạy thử) trên máy thu sau lượt `--ghi` | AC-5 |
| tin S06 có toà ≥ 95% số tin có block | cùng lệnh, dòng «toà: N tin có block · M có block_raw · tỉ lệ» sau một lượt `chotot-daily` (transform đọc lại mọi tin của `stg_chotot_ads` mỗi lượt) | AC-4, AC-5 |
| bảng nghĩa pty_project_type kèm số mẫu | `docs/research/pty-project-type-s06.md` | AC-6 |

## Out of scope

- OOS-1: Rút phát biểu rác trên DB máy thu hay cloud trong vòng này — lượt `--ghi` chờ lời Mạnh sau gộp.
- OOS-2: Tầng của tin S06 (PL13); dùng `pty_project_type` để gán loại hình hay dự án (chỉ đo nghĩa).
- OOS-3: Gắn toà S06 vào danh bạ vật thể (`buildings`) hay chuẩn hoá tên toà.
- OOS-4: Bộ thu S06 (làn ZCode) — cờ hiển thị vẫn lưu trong thô.

## Notes
