---
schema_version: 1
slug: buoc-chup-khong-in-ten-that
feature: Bước chụp trang của kho (scripts/ui-capture-login.mjs) gặp lỗi ở bước che tầng A thì không in danh sách tên nguồn thật ra stderr hay argv, và ảnh không được ghi
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-22) theo lựa chọn của Mạnh ở Cổng Bằng chứng ON10
decided_at: 2026-10-25T01:32:09Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Sinh từ hồ sơ `hieu-chuan-mot-bo-so` (ON10): ở Cổng Bằng chứng 25/10 Mạnh ký `/acceptance-gate:signoff hieu-chuan-mot-bo-so … Ngoài-9: mở hợp đồng mới; … ký hay trả: ký` (sổ `_acceptance/hieu-chuan-mot-bo-so/decisions.jsonl`, dòng `d-20261025T012505Z-32`). Hàng chưa có trong `docs/plan/lo-trinh.json`; giám sát giao P4 25/10 và duyệt Cổng Đáng ở P4-22.

Người vận hành (hoặc tác tử chấm) chạy `scripts/ui-capture.sh` cho một trang `/ops/**`. Bước che tầng A truyền danh sách tên nguồn thật vào argv của `playwright-cli eval`; khi lệnh ấy lỗi (trang lỗi JS, phiên chết, timeout), lỗi của `execFileSync` mang nguyên dòng lệnh — kèm tên thật — ra stderr. Đầu ra ấy hay được dán vào bằng chứng `_acceptance/` của kho công khai (luật 6, ADR-0007). Tên còn lộ qua `ps` trong lúc chạy.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] bước chụp gặp lỗi ở mọi chỗ (eval che, đăng nhập, mở trang, chụp) có còn in hay đặt vào argv tên nguồn thật nào không?
- Kết quả nào là SỐNG: [đề xuất] không đường lỗi nào in tên thật ra stdout/stderr; tên không xuất hiện trong argv của tiến trình con; lỗi che tầng A → thoát khác 0, lời chung chung, không ảnh
- Kết quả nào là CHẾT: [đề xuất] còn một đường lỗi in hay đặt tên thật ra ngoài khi hết timebox
- Timebox: …
