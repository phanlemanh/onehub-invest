---
schema_version: 1
slug: meta-kev-thanh-phat-bieu
feature: Transform ghi phát biểu ý định tin (tin rao · Yêu cầu · không phải tin) và bán/thuê từ câu hỏi Kev typed kèm xác suất cho mọi tin, không loại tin nào theo Kev khi ngưỡng chưa đo
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T05:00:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL5
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL5 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C1.1
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Transform ghi phát biểu ý định tin (tin rao · Yêu cầu · không phải tin) và bán/thuê từ câu hỏi Kev typed kèm xác suất cho mọi tin, không loại tin nào theo Kev khi ngưỡng chưa đo

Vì sao: C1.1: lọc là phát biểu ở pipeline, chạy lại được khi đổi ngưỡng.

Cổng Đáng: build, Mạnh duyệt 30/10 ~05:00Z bằng câu «Xếp theo bốn làn» (luật đợt dot0-cam-mau, mục «Bốn làn lõi»: PL5 nằm trong danh sách Cổng Đáng = build, dãy P1 đọc tin S03 nối tiếp sau PL28); giám sát giao P1 30/10.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Nạp một ngày v3: mọi tin stg có cột kev_*; số tin rao không giảm so với khi chưa có Kev; bài «khách tìm…» ra Yêu cầu, không bị bỏ» chưa?
- Kết quả nào là SỐNG: [đề xuất] Nạp một ngày v3: mọi tin stg có cột kev_*; số tin rao không giảm so với khi chưa có Kev; bài «khách tìm…» ra Yêu cầu, không bị bỏ
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Nạp một ngày v3: mọi tin stg có cột kev_*; số tin rao không giảm so với khi chưa có Kev; bài «khách tìm…» ra Yêu cầu, không bị bỏ» khi hết timebox
- Timebox: một vòng T3.
