---
schema_version: 1
slug: dong-chay-len-cloud
feature: Người vận hành mở /ops/data-flow trên cloud và thấy số chặng bài → tin rao → căn theo nguồn và số tin từng bậc, cùng số với máy thu, không còn khung «Chỉ xem ở máy thu»
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo Mạnh 27/10 (liên làn) — «Quyết định đã thống nhất đội vận hành qua cloud nên báo điều phối sắp xếp việc này tránh missing.»; xếp U2 2.5, yêu cầu U2-5 đã trả lời
decided_at: 2026-10-27T00:15:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DF1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DF1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/chu-de/dong-chay-du-lieu.md#c8fda8c16b6a3c754ea9dcda0dab5f5197cb3514` — chưa có trang: trang đợt dong-chay-2710
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành mở /ops/data-flow trên cloud và thấy số chặng bài → tin rao → căn theo nguồn và số tin từng bậc, cùng số với máy thu, không còn khung «Chỉ xem ở máy thu»

Vì sao: Mạnh chốt 27/10 đội vận hành làm qua cloud; trang hôm nay đọc bảng nạp thô nên trên cloud chỉ có khung chỉ-máy-thu. Số tính sẵn ở pipeline (luật 10), một định nghĩa cho cả Thu thập lẫn Dòng chảy; cloud chỉ nhận số tổng hợp qua push-ops-facts như khối Luồng 7 ngày.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Mở /ops/data-flow trên prod thấy số chặng, không còn khung chỉ máy thu; số chặng trên cloud bằng bản máy thu cùng mốc; leak gate xanh, không bảng thô nào lên cloud» chưa?
- Kết quả nào là SỐNG: [đề xuất] Mở /ops/data-flow trên prod thấy số chặng, không còn khung chỉ máy thu; số chặng trên cloud bằng bản máy thu cùng mốc; leak gate xanh, không bảng thô nào lên cloud
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Mở /ops/data-flow trên prod thấy số chặng, không còn khung chỉ máy thu; số chặng trên cloud bằng bản máy thu cùng mốc; leak gate xanh, không bảng thô nào lên cloud» khi hết timebox
- Timebox: [đề xuất] hai ngày làm việc của dãy U2 (27–28/10); quá hạn mà cloud vẫn hiện khung chỉ-máy-thu thì báo giám sát.
