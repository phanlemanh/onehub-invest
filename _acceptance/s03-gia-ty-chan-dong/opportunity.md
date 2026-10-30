---
schema_version: 1
slug: s03-gia-ty-chan-dong
feature: Transform S03 đọc giá tỷ chẵn viết bằng đồng («3.000.000.000 đ», «15.000.000.000») — bước gạt SĐT của N1 đang nuốt đuôi «.000.000.000» nên giá ra null
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T02:39:51Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Hàng phát sinh từ Ngoài-8 (vòng 3) của `_acceptance/s03-cam-mau-so-lieu` (N1, PR #189 đã gộp 30/10). Người đọc tin S03
trên `/ops` thấy tin bán ghi giá tròn tỷ bằng chữ số đồng («3.000.000.000 đ», «2.000.000.000đ», «15.000.000.000»)
không có giá: regex SĐT của `gatSo` bắt đầu ở số 0 sau dấu chấm đầu tiên và nuốt «00.000.000» như một SĐT, nên luật
giá đồng `GIA_DONG` không còn gì để đọc. Trước N1 cũng không đọc được dạng này, nên đây không phải lỗi lùi.

Cổng Đáng: Mạnh chọn «mở hợp đồng mới» cho mục này ở Cổng Bằng chứng N1 vòng 3, câu ký nguyên văn
«/acceptance-gate:signoff s03-cam-mau-so-lieu … Ngoài-8: mở hợp đồng mới; … ký hay trả: ký» (30/10); giám sát đợt
dot0-cam-mau coi đó là quyết build (P1-52, giao P1 30/10).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] giá tỷ chẵn viết bằng đồng có ra đúng số đồng mà không làm lùi các dạng giá N1 đã đo không?
- Kết quả nào là SỐNG: [đề xuất] mọi dòng ma trận giá đồng (tròn tỷ, có/không «đ», có/không dấu cách) ra đúng giá; ma trận AC-1…AC-4 của N1 vẫn xanh; SĐT thật vẫn bị gạt khỏi bước đọc số.
- Kết quả nào là CHẾT: [đề xuất] còn dòng giá tỷ chẵn ra null, hoặc một SĐT lọt vào bước đọc số.
- Timebox: một vòng T2.
