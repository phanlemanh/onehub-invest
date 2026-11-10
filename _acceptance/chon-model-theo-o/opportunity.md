---
schema_version: 1
slug: chon-model-theo-o
feature: Bộ đánh giá chạy ba model Haiku, GLM-5.3 Flash, DeepSeek V4.1 Flash qua AI Gateway trên cùng tập nhãn vàng S03 (chữ, mọi ảnh, thẻ nhóm) và sinh bảng chọn model theo ô (rẻ nhất đạt ngưỡng và độ trễ)
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh 07/11 ở phiên thợ P2: «Cổng Đáng chon-model-theo-o: decision build · disposition archive · ngưỡng theo đề xuất»
decided_by: Mạnh
decided_at: 2026-11-06T20:25:44Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition: archive
lo_trinh_ma: PL30
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL30 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã CM.2
Mốc: Việc đầu tiên sau 05/11: tin căn hộ S03 gắn được toà hoặc trục, diện tích suy ra hiện có nhãn, bắt đầu từ Ocean Park — chưa có ngày.

Bộ đánh giá chạy ba model Haiku, GLM-5.3 Flash, DeepSeek V4.1 Flash qua AI Gateway trên cùng tập nhãn vàng S03 (chữ, mọi ảnh, thẻ nhóm) và sinh bảng chọn model theo ô (rẻ nhất đạt ngưỡng và độ trễ)

Vì sao: §0.4: chọn model theo số đo.

Đã có (06–07/11): lượt đo ba model trên 48 thẻ vàng lát `s03-theo-nhom` (script `agent/scripts/doc-gop-3-model-s03.ts`,
prompt `dg3-s03-v3`, chi 0,75 USD). Test 23 thẻ × 2 lượt: Haiku 5.5 đúng gộp 17 ô 96%/96%, GLM-5.3 Flash 94%/91%,
DeepSeek V4.1 Flash 91%/95%; ô WC chưa model nào qua 83%. Báo cáo ở thư mục ghi chú chung của giám sát
(`doc-gop-ba-model-s03-ket-qua.md`), số thô ở `research-local/do-3-model-s03/` (gitignored).

Lời Mạnh 07/11 (nguyên văn): «Quyết định của tôi là xây dựng tính năng để có thể dễ dàng thay đổi các model và hiện tại
sử dụng haiku báo với điều phối.»

Ai gặp: Mạnh và đội gắn nhãn (đường đọc tin S03 hiện chỉ đọc chữ — `dtb-s03-v1` đúng 43–96% theo ô, Bộ đọc 35–91%);
pipeline cần đọc đủ 17 ô từ chữ + ảnh + thẻ nhóm để gắn toà/trục/diện tích (mốc «Việc đầu tiên sau 05/11»).

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Một lời gọi đọc gộp (chữ + mọi ảnh + thẻ nhóm) cho đủ 17 ô tốt hơn đường chỉ đọc chữ | Giữ `dtb-s03-v1`, không cần đường mới | Đo trên vàng | Đã thử 07/11: Haiku 96% gộp 17 ô; `dtb-s03-v1` 43–96% theo ô |
| 2 | Đổi model chỉ cần đổi mã Gateway + đơn giá, prompt dùng chung cho cả ba model | Mỗi model một prompt — bảng cấu hình phải mang cả prompt | Chạy cùng prompt cho ba model | Đã thử 07/11: cùng prompt, ba model 91–96% |
| 3 | Số trên 48 thẻ (quy ước, từ điển viết trong lúc gắn chính các thẻ này) giữ được trên bài mới | Độ đúng thật thấp hơn, cần người duyệt nhiều ô hơn | Đo lại trên lô thẻ gắn sau 06/11 | Chưa thử |

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: Đổi model của một ô (hay mọi ô) chỉ bằng bảng cấu hình, không sửa code bộ đọc, và bộ đọc mặc định Haiku giữ được độ đúng đã đo trên vàng không?
- Kết quả nào là SỐNG: Đổi model của một ô trong bảng → lượt chấm trên vàng gọi đúng model mới, diff chỉ chạm tệp cấu hình; Haiku qua đường mới đạt ≥ 92% gộp 17 ô trên 23 thẻ test (mốc đo 96%, trừ 1 thẻ nhiễu); chi phí đo ≤ 0,0025 USD/bài.
- Kết quả nào là CHẾT: Đổi model phải sửa code bộ đọc; hoặc Haiku qua đường mới < 90% gộp 17 ô trên test; hoặc hết timebox.
- Timebox: 3 ngày làm (tới 10/11/2026).

## Kết quả prototype

Prototype đã dựng là script đo (`agent/scripts/doc-gop-3-model-s03.ts`, commit a277155f): bảng `MODELS` trong mã, đổi bằng cờ `--model`; số ở mục «Vấn đề & ai gặp». Chưa có bảng cấu hình theo ô, chưa ghi lớp đề xuất.

## Nguồn ngoài & phạm vi kế thừa

| Món vật liệu | Nguồn (đường dẫn/tên gói) | Phân loại | Kế thừa? | Người ký |
|---|---|---|---|---|
| Bảng giá model của Vercel AI Gateway (06/11) | trang công khai của Gateway | triết-lý/logic | có (đơn giá để ước trước khi gọi; số thật lấy `gateway.cost`) | — |

## Cổng 0

- **decision = build** Căn cứ: lời Mạnh 07/11 «xây dựng tính năng để có thể dễ dàng thay đổi các model và hiện tại sử dụng haiku»; số đo 07/11 (Haiku 96% gộp 17 ô trên test).
- **disposition = archive** Căn cứ: script đo `agent/scripts/doc-gop-3-model-s03.ts` giữ làm công cụ đo; đường đọc dựng mới theo hợp đồng.
- **Ngưỡng UAT chốt cùng lúc ký:** theo mục «Ngưỡng chết / ngưỡng UAT» (Mạnh: «ngưỡng theo đề xuất»).

## Thước đo thành công → ứng viên criterion

- Đổi model một ô bằng cấu hình → lượt chấm gọi model đó (bảng chọn là nguồn duy nhất của mã model).
- Độ đúng Haiku trên vàng qua đường mới so mốc 96% (lệnh chấm có sẵn, chạy trên lát, có trần tiền).
- Mỗi lời gọi để lại audit: model, prompt, token, USD, giây; đề xuất ghi lớp đề xuất, không ghi canonical (luật 7).

## Out of scope từ khám phá

- Chạy hàng loạt trên toàn S03 (~13–17 USD/ngày): quyết định tiền của Mạnh, hỏi ở Cổng Phạm vi; mặc định chỉ chạy trên lát/mẫu khi chấm.
- Cặp A/B kiểm chéo theo ô (GLM + Haiku): Mạnh chọn một model; bảng cho phép thêm sau mà không sửa code.
- Ô WC tự điền: chưa model nào đạt (83%), giữ người duyệt.
- Sửa ADR-0007/luật 6: đã sửa ở #334.
