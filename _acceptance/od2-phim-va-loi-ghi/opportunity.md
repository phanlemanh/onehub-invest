---
schema_version: 1
slug: od2-phim-va-loi-ghi
feature: Chế độ duyệt ở /ops/review không còn ba lỗi của OD2 — lệnh quyết lỗi khi rời Hàng duyệt được báo ra, giữ phím số không quyết liền nhiều thẻ, phím duyệt im khi hộp phóng ảnh đè lên sheet
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau theo lựa chọn của Mạnh ở Cổng Bằng chứng OD2 (Ngoài-5 «mở hợp đồng mới»)
decided_at: 2026-11-08T14:39:19Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Sinh từ hồ sơ `ops-duyet-hop-hang-muc` (OD2, PR #376 đã gộp): ở Cổng Bằng chứng 08/11 Mạnh ký «Ngoài-5: mở hợp đồng
mới» (sổ `_acceptance/ops-duyet-hop-hang-muc/decisions.jsonl`, dòng `d-20261108T143919Z-26`). Giám sát giao hàng này cho
dãy P4 và gom thêm hai lỗi phím lượt chấm 1 của OD2 (chưa lên thẻ vì lượt 2 không nêu lại).

Người Vận hành duyệt liền bằng phím ở `/ops/review` gặp ba chỗ sai:

1. Bấm đáp án rồi chuyển sang trang Ops khác trong 5 giây hoàn tác: lệnh được gửi ngay khi rời, nhưng kết quả bị bỏ qua.
   Route trả lỗi hay mất mạng thì không ai biết — toast vẫn ghi «Đã ghi», nút «Hoàn tác» còn báo «đã ghi — quá 5 giây»,
   trong khi thẻ vẫn chờ.
2. Giữ phím số hơi lâu: trình duyệt lặp phím, mỗi lần lặp quyết luôn thẻ kế — một cú bấm quyết nhiều thẻ.
3. Mở hộp phóng ảnh trên thẻ: phím 1–4, J/K vẫn chạy ở sheet bên dưới — bấm số để xem ảnh hoá thành quyết thẻ.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] ba đường sai trên còn đường nào cho ra quyết định người duyệt không chủ ý, hay lỗi ghi không ai thấy?
- Kết quả nào là SỐNG: [đề xuất] lỗi ghi sau khi rời Hàng duyệt hiện toast lỗi kèm đường mở lại thẻ; giữ phím số chỉ quyết một thẻ; phím duyệt không làm gì khi hộp phóng ảnh mở
- Kết quả nào là CHẾT: [đề xuất] còn một trong ba đường cho kết quả sai khi hết timebox
- Timebox: một vòng
