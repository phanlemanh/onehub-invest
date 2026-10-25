---
slug: s05-slo-theo-lich
at: 2026-10-25T07:04:29Z
verdict: findings
p0: 0
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Không quét nơi thứ ba định nghĩa hoặc tự tính độ tươi S05 (cloud /ops qua ops facts, DQ SQL…) | Đường /ops cloud tự tính bằng ngưỡng 12 giờ riêng; mọi eval xanh mà đèn cloud vẫn đỏ | Quét toàn kho tìm nơi ghi SLO S05, kèm đối chứng tệp thứ ba | fixed: AC-6 + E6 quét app/src, scripts, pipeline, data-api/src, agent/src — chỉ hai bản chép; ghim push-ops-facts lấy readFreshness của bản CLI (đã kiểm: 450_dq_checks.sql không đo S05) |
| P1 | design | Mô hình lịch giờ tròn, không khai probe đọc mốc nào và độ nhạy khi lượt trễ | Lượt thứ Ba xong muộn hơn lượt thứ Sáu vài phút, S05 đỏ mỗi tuần | Khai mốc probe + độ nhạy trong Context; ca tuổi lẻ | fixed: Context khai probe đọc collected_at, tuổi làm tròn xuống — trễ dưới 1 giờ vẫn xanh, từ 1 giờ thì đỏ; AC-3 thêm ca 96 giờ 59 phút |
| P2 | evals | E2 quét giờ nguyên nên tuổi lớn nhất là 95, không chạm 96 | Người viết test sửa mô hình cho khớp con số | Ghim quy ước trong expected | fixed: giờ trùng một lượt được đánh giá trước khi tính lượt đó; quét h = 1…336, tuổi 96 gặp ở h = 168 và 336 |
| P2 | evals | E3 không nói đo chữ của bản nào, thiếu đối chứng «SLO 12» | Chữ /ops sai mà chỉ CLI được đo | Đo chữ của từng bản + đối chứng | fixed: CLI describe nguyên văn; /ops fmtOverdue «trễ 1 giờ» + fmtAge «4 ngày»; đối chứng bản SLO 12 nói «SLO 12 giờ» |
