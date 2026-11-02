---
schema_version: 1
slug: s03-luu-tang-huong
feature: "Lưu tầng và hướng của tin S03 bằng migration mới: thêm floor_raw vào field_assertions_field_chk, thêm trường hướng kèm nhãn «của cái gì» (ban công, cửa, không nói), nhiều giá trị"
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-02T01:08:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: SV2
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mạnh, 02/11: 00:52Z «còn có thể suy tầng và hướng», 01:03Z «Nếu làm hết trong đợt vá thì thế nào? Đồng ý cách lưu hướng theo khuyến nghị», 01:08Z «Chọn làm hết». Giám sát đối chiếu nhật ký và duyệt (N1-14), chỉ Cổng Đáng; các cổng T3 vẫn của Mạnh; migration 067 không áp lên cloud nếu chưa có lệnh Mạnh.

Mở từ hàng SV2 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt tin-rao-0511
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Lưu tầng và hướng của tin S03 bằng migration mới: thêm floor_raw vào field_assertions_field_chk, thêm trường hướng kèm nhãn «của cái gì» (ban công, cửa, không nói), nhiều giá trị

Vì sao: Audit S03 02/11: mô phỏng 29% tin có hướng, 7% có khoảng tầng, hiện không có chỗ lưu.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Tầng và hướng đọc được đi tới phát biểu của tin; trường hướng khai đủ 6 điều kiện ADR-0011 vì DirectionFaces không dùng được» chưa?
- Kết quả nào là SỐNG: [đề xuất] Tầng và hướng đọc được đi tới phát biểu của tin; trường hướng khai đủ 6 điều kiện ADR-0011 vì DirectionFaces không dùng được
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Tầng và hướng đọc được đi tới phát biểu của tin; trường hướng khai đủ 6 điều kiện ADR-0011 vì DirectionFaces không dùng được» khi hết timebox
- Timebox: không cản ra mắt 05/11; chưa kịp thì sang sau (ghi chú hàng SV2).
