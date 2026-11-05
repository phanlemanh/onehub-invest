---
schema_version: 1
slug: e1-e2-theo-lop
feature: E1 phát biểu theo lớp (tên nhóm, mặc định dự án là suy luận); E2 là bộ đọc chạy mù ra mảng căn, mỗi giá trị kèm trích dẫn, chỉ được tính khi trích dẫn có thật trong tin, và mỗi căn của bài nhiều căn thành một offer có khoá riêng
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh qua giám sát, yêu cầu P2-118
decided_at: 2026-11-05T11:27:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL18
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL18 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C2.4
Mốc: Việc đầu tiên sau 05/11: tin căn hộ S03 gắn được toà hoặc trục, diện tích suy ra hiện có nhãn, bắt đầu từ Ocean Park — chưa có ngày.

E1 phát biểu theo lớp (tên nhóm, mặc định dự án là suy luận); E2 là bộ đọc chạy mù ra mảng căn, mỗi giá trị kèm trích dẫn, chỉ được tính khi trích dẫn có thật trong tin, và mỗi căn của bài nhiều căn thành một offer có khoá riêng

Vì sao: L01/L02: tên nhóm vẫn quyết 4 loại; E2 bị mồi đáp án E1.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: bài nhiều căn chiếm bao nhiêu, và tách có đúng không?
- SỐNG: từ 125 nhãn `multi_unit`, trong đó từ 30 nhãn Có và từ 30 bài máy nhận, độ chính xác và độ phủ có cận dưới Wilson từ 0,80; đọc tay từ 27/30 bài đúng cả quan hệ căn, giá, diện tích; không prompt E2 nào chứa đáp án E1; trích dẫn giả bị loại 100%; nạp lại không đổi `offer_id`.
- CHẾT phần tách: cận trên Wilson của tỉ lệ bài nhiều căn dưới 3% trên từ 125 nhãn. Khi đó giao E1 và đọc mù, bỏ phần tách và migration 077. Mức này chờ Mạnh duyệt ở Cổng Phạm vi.
- Timebox: đọc số ngay khi đủ nhãn; thi công chưa bắt đầu trước lúc đó.
