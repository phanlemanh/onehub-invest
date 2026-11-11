---
schema_version: 1
feature: Hai thước lệch trên main đo đúng vật — báo cáo ngày nhận mã nguồn hai chữ số, thước lịch S05 đo cửa sổ theo quan hệ thay chuỗi «4 day»
slug: thuoc-lech-ma-nguon-va-lich-s05
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-11-thuoc-lech-ma-nguon-va-lich-s05-design.md
---

# Acceptance Contract: thuoc-lech-ma-nguon-va-lich-s05

## Context

Lượt ghim lại bốn hồ sơ sau au3 trên main 2d1a97fc đỏ ở ba eval của `khoa-nap-s05-paused`, dù vật không hỏng. Bài test
báo cáo ngày chỉ nhận mã nguồn `S0x`, trong khi bộ đăng ký nay có S10, S11 (nguồn `draft`). Probe lịch S05 ghim cửa sổ
mặc định bằng chuỗi «4 day», trong khi hồ sơ `s05-khoa-nap` (Mạnh ký 02/11) đã đổi mặc định sang 5 ngày. Giám sát đợt mở
hàng này để sửa hai thước. Hai eval cũ của hồ sơ đã ký — `khoa-nap-s05-paused/E11` và `khoa-nap-s05-paused/E12` — được thay
bằng AC-3 của hợp đồng này qua con trỏ `superseded_by`, không sửa lén.

## Criteria

- AC-1: Given danh sách độ tươi mẫu `S01/…`, `S10/…`, `S11/…` và ba phần tử hỏng `chotot/…`, `s10/…`, `S1/…`, When hàm
  kiểm mã nguồn của `scripts/bao-cao-ngay.test.mjs` chạy (không cần DB), Then ba phần tử mã hợp lệ qua, mỗi phần tử hỏng
  bị gọi tên trong lỗi.
- AC-2: Given DB máy thu có nguồn S10, S11 trong bộ đăng ký, When chạy ca «ra đủ số chính, không để giao dịch mở» của
  `scripts/bao-cao-ngay.test.mjs`, Then ca xanh và kiểm độ tươi bằng chính hàm của AC-1: ca in số phần tử độ tươi mang mã
  từ S10 trở lên và số đó lớn hơn 0 (khi bộ đăng ký có nguồn ấy); cùng ca, danh sách độ tươi thật cộng một phần tử
  `chotot/…` bị hàm gọi tên — thông điệp «độ tươi chỉ mang mã nguồn Sxx».
- AC-3: Given plist thu S05 và bộ dựng yêu cầu `buildRunInput` của `pipeline/apify-facebook-collector.mjs`, When chạy
  probe lịch S05 của hồ sơ này, Then mọi kiểm của probe cũ vẫn có (plist hợp lệ, Ba + Sáu 06:00, không mốc hằng ngày, plist
  trần 100 và cửa sổ ≥ 4 ngày, trần rác hay âm về 100, trần hợp lệ giữ, mỗi nhóm một địa chỉ, không còn «12 hours»), còn
  cửa sổ mặc định khi không có biến môi trường bằng hằng `S05_NEWER_THAN_MAC_DINH` và hằng ấy ≥ 4 ngày (quy đổi «N days»,
  «N hours», «N weeks» ra ngày); chế độ tự kiểm có hai đột biến tách nhau — hằng giả «3 days» thì FAIL đúng kiểm «≥ 4
  ngày», bộ dựng trả cứng «3 days» với hằng thật thì FAIL đúng kiểm «bằng hằng» — và hai đối chứng dương «4 days», «96
  hours» qua.
- AC-4: Given `_acceptance/khoa-nap-s05-paused/evals.yaml`, When đọc bằng `lib/eval-yaml.cjs`, Then ô E11 và E12 có
  `status: not-run` và `superseded_by: thuoc-lech-ma-nguon-va-lich-s05#AC-3`, mọi ô khác không khai `status` hay
  `superseded_by`; chiều đỏ trên bản chép chuỗi (bỏ `superseded_by` của E11, đổi slug ở E12, bỏ `status` của E12, thêm
  `status: not-run` vào E13) thì lỗi gọi tên đúng ô; và bộ chứng con trỏ của kit (`chungThayBoi` trong
  `lib/evidence-core.cjs` của acceptance-gate) trên cây này trả cho E11, E12 lý do `ho-so-thay-chua-ky` khi hồ sơ này chưa
  ký, `ok` khi đã ký — tức mọi điều kiện đứng trước chữ ký (con trỏ đúng khuôn, hồ sơ thay có mặt, thẻ hai đầu, AC-3 có) đều
  qua; bản chép hợp đồng bỏ thẻ `khoa-nap-s05-paused/E11` thì bộ chứng trả `thay-khong-nhan`.
- AC-5: Given `scripts/bao-cao-ngay.mjs`, `scripts/lib/bao-cao-ngay.mjs`, `scripts/lib/freshness.mjs`, When probe quét mã
  báo cáo chạy, Then không tệp nào mang một trong năm hình thái giả định mã một chữ số (regex `S0\d`/`S0[0-9]`/`S0[1-9]`,
  `startsWith("S0")`, nối chuỗi `"S0" +`, regex `^S\d$`, cắt cố định `.slice(0, 3)` trên mã); chế độ tự kiểm chèn từng hình
  thái vào bản chép chuỗi và bộ quét gọi tên đúng hình thái + tệp + dòng, mỗi hình thái một dòng.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — hai thước, mỗi thước một lỗi đã gọi tên, liệt tay:

- Trục A — thước báo cáo ngày: hàm kiểm mã (thuần, hai chiều) → AC-1 · ca DB thật có S10, S11 → AC-2 · mã báo cáo không
  giả định S0x → AC-5
- Trục B — thước lịch S05: kiểm cũ giữ + cửa sổ theo quan hệ → AC-3 · hai eval cũ thay có con trỏ → AC-4

## Out of scope

- Các chỗ giả định `S0x` ngoài mã báo cáo (`app/src/lib/dq-labels.ts`, `app/src/lib/ops/people.ts`,
  `pipeline/sync-cloud.mjs`, CHECK của migration 048/053/055/065, `pipeline/lib/vocab-core.mjs`, test app/pipeline): kê ở
  design doc, việc riêng khi S10+ bắt đầu thu.
- Ca KDM-AC-3 của `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`: hàng `do-san-sl1-kdm` (P3).
- Ghim lại bốn hồ sơ sau au3: làm sau khi hàng này và `do-san-sl1-kdm` gộp.
- Đổi cửa sổ thu hay lịch S05 thật: làn ZCode, hồ sơ `s05-khoa-nap`.

## Notes

- Con trỏ `superseded_by` của E11, E12 chỉ được kit công nhận khi hồ sơ này đã ký Cổng Bằng chứng; trước đó lưới
  trước-gộp coi hai ô là xung đột. Gộp PR sau chữ ký thì không vướng.
