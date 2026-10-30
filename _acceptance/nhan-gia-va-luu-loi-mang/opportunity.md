---
schema_version: 1
slug: nhan-gia-va-luu-loi-mang
feature: Người gắn nhãn gõ giá có dấu chấm ngăn nghìn hay gửi đơn vị lạ thì bị chặn với lỗi dưới ô thay vì lưu sai 1000 lần, và mất mạng khi Lưu thì thấy thông báo
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T03:30:00Z    # ISO UTC
prototype:
  base_commit:
  disposition:
lo_trinh_ma:
lo_trinh_tep:
---

## Vấn đề & ai gặp

Hàng sửa Ngoài của PL7 `man-gan-nhan-mu` (không có hàng lộ trình — giám sát P4-92). Nguồn: Ngoài-3, Ngoài-5, Ngoài-7 ở
`_acceptance/man-gan-nhan-mu/review-findings.md` (ghi Known limits ở Cổng Bằng chứng 30/10).

Người gắn nhãn (Mạnh và đội) gõ giá theo thói quen Việt — dấu chấm ngăn nghìn («4.350 triệu») — thì màn lưu thấp hơn 1000
lần mà không báo; công cụ ngoài màn gửi đơn vị giá lạ cũng vậy. Nhãn sai lặng lẽ thành đáp án chuẩn cho PL9. Mất mạng đúng
lúc bấm Lưu thì không có thông báo nào, người gắn có thể tưởng đã lưu.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: buổi gắn nhãn đầu có nhãn giá nào bị lưu sai bậc (lệch ≥ 1000 lần so với chữ tin) không?
- Kết quả nào là SỐNG: 0 nhãn giá lệch bậc trên lát gắn đầu.
- Kết quả nào là CHẾT: có nhãn giá lệch bậc lọt vào bảng nhãn.
- Timebox: hết buổi gắn nhãn đầu.

## Cổng 0

- **decision = build** Căn cứ: Mạnh trong phiên P4 30/10: «P4 làm cả hai: nhan-gia-va-luu-loi-mang trước, rồi PL8».
- **disposition = (không có bản mẫu)**
