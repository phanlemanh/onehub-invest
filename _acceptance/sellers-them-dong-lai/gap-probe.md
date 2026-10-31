---
slug: sellers-them-dong-lai
at: 2026-10-31T01:10:00Z
verdict: findings
p0: 3
p1: 1
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-2 trích câu audit chỉ quyết khôi phục INSERT … ON CONFLICT; không quyết luật giữ tên cũ và ghi đè flags | Mạnh ký tưởng chỉ duyệt khôi phục INSERT; AC-3/E3 ghim hành vi chưa ai quyết | Tách d-2; luật tên/flags trích nguồn hoặc thành Hỏi | fixed: tách thành hai dòng mới (supersedes d-2); luật tên/flags trích đúng dòng của refresh-bait-gap.mjs đang chạy — vòng không đổi luật cho dòng đã có |
| P0 | design | d-3 ghi một-lối cho «sale_offers hợp sellers» nhưng lối «chỉ đọc sellers» còn sống, why dựa audit không trích | Mạnh ký tưởng AC-7 bắt buộc; nghĩa phép đối chiếu đã ký đổi không ai duyệt | Ghi lại bằng mục-tiêu trích câu audit, hoặc Hỏi | fixed: làm đúng câu audit (chỉ đọc sale_offers), dòng mới trích nguyên văn; ca AC-8 DB2b đổi chiều đỏ sang tin, ghim lại hồ sơ ho-nguoi-theo-nguon |
| P0 | contract | d-4 kho_dao false trong khi ~190 dòng sellers mới lên cloud; không AC đo phía cloud | sync lọc theo watermark làm dòng mới không lên — chip cloud thiếu mà E6 xanh | kho_dao true hoặc nêu cách đảo; thêm AC đo payload sync | fixed: thêm AC-8/E8 đo payload bằng selectList + localReadSql thật (đủ SĐT, không name); rejected phần kho_dao: sync-cloud thay trọn bảng mỗi lượt (stage + swap), lùi code thì lượt sau rút dòng, kèm audit co bảng — ghi trong dòng sổ mới thay d-4 |
| P1 | evals | E5 so hai số đếm thay vì quan hệ tập; ngưỡng >19 hardcode | Khoá lệch + sót mồ côi bù nhau, số đếm bằng mà chip vẫn thiếu | Hiệu tập hai chiều rỗng; ngưỡng so số dòng đo trước lượt | fixed: E5 đổi sang hiệu tập hai chiều và n0 đo trong cùng giao dịch |
| P2 | evals | E1 «đúng 3 dòng» mơ hồ trên DB máy thu có dữ liệu thật | Đếm cả bảng thì đỏ giả trên máy thu | Đếm theo từng hash | fixed: E1 ghim count theo từng hash trong {A,B,C} |
