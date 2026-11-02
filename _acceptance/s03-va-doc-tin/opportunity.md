---
schema_version: 1
slug: s03-va-doc-tin
feature: "Vá hẹp bộ đọc tin S03 trong pipeline/transform-zalo.mjs: diện tích có phẩy, phòng ngủ viết tắt, tắt khớp phường theo hướng, số ngữ cảnh không phải giá, «thuê ≥ 1 tỷ» thành bán thay vì vứt, giá che số, giá không đơn vị (làm sau cùng, có test riêng); lưu toà và trục qua phát biểu có sẵn, không migration"
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-02T01:08:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: SV1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mạnh chốt «Chọn làm hết» lúc 01:08Z ngày 02/11, ngay sau câu hỏi về làm hết đợt vá; giám sát đối chiếu nhật ký và duyệt (N1-8), chỉ cho SV1.

Mở từ hàng SV1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt tin-rao-0511
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Vá hẹp bộ đọc tin S03 trong pipeline/transform-zalo.mjs: diện tích có phẩy, phòng ngủ viết tắt, tắt khớp phường theo hướng, số ngữ cảnh không phải giá, «thuê ≥ 1 tỷ» thành bán thay vì vứt, giá che số, giá không đơn vị (làm sau cùng, có test riêng); lưu toà và trục qua phát biểu có sẵn, không migration

Vì sao: Audit S03 02/11: 43% ô hỏng do bộ đọc, 33% đọc được mà không lưu; luật sửa được 87% lỗi giá, diện tích, phòng ngủ trên mẫu.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên tập nhãn của audit: phòng ngủ đúng ≥ 90%, không còn diện tích sai do dấu phẩy, không còn phường đọc nhầm từ hướng; giá không đơn vị không làm tụt giá đúng so với trước» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên tập nhãn của audit: phòng ngủ đúng ≥ 90%, không còn diện tích sai do dấu phẩy, không còn phường đọc nhầm từ hướng; giá không đơn vị không làm tụt giá đúng so với trước
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên tập nhãn của audit: phòng ngủ đúng ≥ 90%, không còn diện tích sai do dấu phẩy, không còn phường đọc nhầm từ hướng; giá không đơn vị không làm tụt giá đúng so với trước» khi hết timebox
- Timebox: …
