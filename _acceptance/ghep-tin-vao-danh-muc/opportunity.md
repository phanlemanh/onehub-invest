---
schema_version: 1
slug: ghep-tin-vao-danh-muc
feature: Tin căn hộ cao tầng Ocean Park 1 và Grand Park được gắn vào Danh bạ ở mức sâu nhất biết được, trục hoặc căn, bằng một phát biểu trường căn
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-12     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL20
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL20 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C2.7
Mốc: Việc đầu tiên sau 05/11: tin căn hộ S03 gắn được toà hoặc trục, diện tích suy ra hiện có nhãn, bắt đầu từ Ocean Park — chưa có ngày.

Tin căn hộ cao tầng Ocean Park 1 và Grand Park được gắn vào Danh bạ ở mức sâu nhất biết được, trục hoặc căn, bằng một phát biểu trường căn

Vì sao: §0.2 D-3: ghép căn là phát biểu; D1/D3.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên tập test: cận dưới Wilson của gắn trục đạt ngưỡng nhóm A» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên tập test: cận dưới Wilson của gắn trục đạt ngưỡng nhóm A
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên tập test: cận dưới Wilson của gắn trục đạt ngưỡng nhóm A» khi hết timebox
- Timebox: …

## Quyết định Cổng Đáng

Mạnh trả lời «Làm cả ba» ở phiên giám sát đợt dot0-cam-mau ngày 12/11/2026, cho câu hỏi «Cho làm DA5, DA6 và PL20 (ba Cổng Đáng của chuỗi định vị căn)?». Giám sát chuyển lời ấy sang phiên thợ U1.
