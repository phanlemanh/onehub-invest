---
schema_version: 1
slug: duong-thang-n-khong-dau
feature: Ô đường viết không dấu so như dạng có dấu — «30 thang 4» ↔ «2 thang 4» là hai đường khác, «3 thang 2» không bị coi số 3 là số nhà, ô chỉ «Ngo»/«Hem» là thiếu tên đường
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-01T00:00:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Hàng phát sinh `duong-thang-n-khong-dau` (dãy U2, sau `chuan-hoa-o-duong`), giám sát duyệt ở yêu cầu U2-50. Nguồn: Ngoài-4
Cổng Bằng chứng `chuan-hoa-o-duong` (Mạnh «mở hợp đồng mới», 31/10) cùng ba giới hạn đã ghi ở `## Notes` của hợp đồng ấy
(Ngoài-2, Ngoài-3, Ngoài-5).
Cổng Đáng: build — Mạnh «Làm, gộp cả ba» (01/11, phiên U2): gộp các giới hạn không dấu cùng lớp vào vòng này.

Người duyệt hàng ghép căn: `khoaDuong` nhận ngoại lệ «tháng <số>» và từ vị trí trần chỉ ở dạng có dấu, nên ô gõ không dấu
ra khoá khác dạng có dấu — «30 thang 4» ↔ «2 thang 4» khớp nhầm (hai căn khác đường có thể bị ghép), «Ngo»/«Hem» trần ra
«Lệch» thay vì «Thiếu» (loại oan).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] mọi cặp có dấu ↔ không dấu của cùng một ô đường cho ra cùng nhãn Khớp/Lệch/Thiếu, trừ ô có tiền tố không dấu «duong»/«pho» (HD2 cố ý giữ hai cách đọc).
