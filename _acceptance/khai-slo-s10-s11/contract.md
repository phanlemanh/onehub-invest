---
schema_version: 1
feature: Khai hạn độ tươi 192 giờ cho S10, S11 — báo độ tươi thôi ghi «chưa khai SLO», ca báo cáo ngày không còn dựa vào việc hai nguồn đang hỏng
slug: khai-slo-s10-s11
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
---

# Acceptance Contract: khai-slo-s10-s11

## Context

S10 (bảng hàng chủ đầu tư) và S11 (nhà nước — dự án công khai) đã `active` trong bộ đăng ký từ 10/11 nhưng chưa có hạn
độ tươi, nên `scripts/check-freshness.mjs` báo hai ô «nguồn active chưa khai SLO» và thoát 1 mỗi lượt. Giám sát đợt duyệt
ngưỡng S10 = S11 = 192 giờ (8 ngày, khuôn S01, S08 — hai nguồn thu một lượt/tuần). Hai bản chép định nghĩa độ tươi
(`scripts/lib/freshness.mjs` cho CLI, `app/src/lib/freshness.ts` cho /ops) phải đổi cùng nhau. Hai nguồn chưa có bảng
`stg_*` (bộ nạp là việc làn thu), nên độ tươi đo ở mức bản thu trong `airbnb_snapshots`, như S01.

Hồ sơ `thuoc-lech-ma-nguon-va-lich-s05` ghi hạn chế đã biết (Ngoài-1, Ngoài-2): ca TL-AC-2 của báo cáo ngày chỉ xanh vì
S10, S11 đang hỏng; khai SLO rồi thu đúng hạn thì ca đỏ oan. Hàng này gỡ hạn chế đó.

## Criteria

- AC-1: Given hai bản chép định nghĩa độ tươi, When đọc bảng SLO, cột giờ thu và probe, Then cả hai bản có S10 = 192 và
  S11 = 192 giờ, cột giờ thu `airbnb_snapshots.collected_at`, probe lấy max đúng cột ấy; mọi mã cũ giữ nguyên giá trị; hai
  bản khớp từng hằng, từng câu SQL và ra cùng hàng trên ma trận trạng thái có S10, S11.
- AC-2: Given bản thu S10 hay S11 tuổi đúng 192 giờ, When đo độ tươi, Then ô ấy «fresh»; tuổi 193 giờ thì «stale»; bản thu
  mới của S11 không làm S10 tươi và ngược lại.
- AC-3: Given S10, S11 active mà chưa có bản thu nào, When đo độ tươi, Then mỗi mã ra đúng một hàng «none» có SLO 192 giờ,
  dòng chữ «chưa có dữ liệu ở bảng nạp của nguồn» — không còn «no-slo».
- AC-4: Given danh sách độ tươi có S10, S11 ở bất kỳ trạng thái nào, When ca TL-AC-2 của báo cáo ngày kiểm, Then ca đếm
  mã từ S10 trên toàn danh sách (không chỉ hàng hỏng), nhãn mọi hàng ấy qua hàm kiểm mã `Sxx`, mỗi hàng hỏng có mặt trong
  báo cáo (`freshnessBad` hoặc ô đã biết); S10, S11 đều tươi thì ca vẫn qua; hàng hỏng thiếu trong báo cáo thì bị gọi tên.
  Trên DB máy thu ca in «TL-AC-2 độ tươi mã từ S10: n» với n > 0.
- AC-5: Given các ca đã có dùng bảng SLO (`s05-slo`, ca app của /ops), When chạy lại, Then xanh; S5-AC-1 kiểm các mã nó
  khai giữ nguyên, không đỏ vì mã thêm sau.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — một hằng hai bản chép, liệt tay theo tiền lệ khai SLO S08 (7d94a3c6):

- Trục A — định nghĩa: bảng SLO + cột giờ thu + probe, hai bản khớp → AC-1
- Trục B — hành vi đo: biên 192/193, tách nguồn → AC-2 · chưa có bản thu → AC-3
- Trục C — thước phụ thuộc: TL-AC-2 báo cáo ngày → AC-4 · S5-AC-1 và ca app → AC-5

## Out of scope

- Bộ nạp `stg_*` cho S10, S11 và siết probe về join bảng stg như S06, S08: làn thu (ZCode) — khi có bảng thì mở hàng siết.
- Lịch thu S10, S11 (claudedp-1111-27 S11 tuần; S10 chờ Mạnh): làn thu.
- Các chỗ khác còn giả định `S0x` (nhãn Ops, danh bạ, CHECK migration): đã kê ở hồ sơ `thuoc-lech-ma-nguon-va-lich-s05`.
- Sửa `muc-tieu.json` (ô đã biết của báo cáo ngày) cho S10, S11 «chưa có dữ liệu»: quyết của liên làn khi báo cáo ngày đỏ.

## Notes
