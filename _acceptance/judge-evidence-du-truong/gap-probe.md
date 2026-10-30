---
slug: judge-evidence-du-truong
at: 2026-10-30T22:41:00Z
verdict: findings
p0: 1
p1: 1
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Ngưỡng `bat_khi` «Gieo lại một lô thẻ…» không có đường đo; việc gieo lại trên `oneinvest` bị đẩy ra ngoài phạm vi mà sổ không có dòng descope. | Cổng 2 ký trên evidence chỉ từ DB thử rỗng với queryPair giả; lỗi chỉ lộ trên dữ liệu thật vẫn để thẻ «Thiếu» sau gộp. | Chạy judge-run trên bản chép lô `needs_llm` thật: thẻ mới đủ khuôn, thẻ cũ không đổi; hoặc dòng descope có căn cứ + mục Đường đo. | Đã sửa: thêm AC-6 + E6 (lô thật chép chỉ-SELECT sang DB thử, lượt chấm + gieo lại); dòng descope d-7 cho việc gieo trên chính `oneinvest`; Notes hợp đồng có «Đường đo». |
| P1 | evals | Không eval nào cho evidence thật đi qua hàm dựng bảng so; giả định «bảng so đọc đúng khoá» chưa đo. | Hàm dựng hàng lọc/ép kiểu khác → thẻ thật vẫn «Thiếu» bốn hàng trong khi E1, E3 xanh. | Evidence thẻ sinh thật qua `soTruongGhepCan`, ma trận 16 ô, đối chứng đỏ khoá `street_raw`. | Đã sửa: AC-3 + E3 thêm ma trận 16 ô bảng so qua `soTruongGhepCan` thật và đối chứng đỏ 'JE-AC-3 bảng so sai: street.a' (d-8). |
| P2 | evals | E2 không ghim kiểu JS; so với hàng đọc lại thì chuỗi '2' vẫn qua. | `bathrooms` ra chuỗi, PairData sai kiểu lúc chạy mà không ca nào bắt. | Assert typeof + so với giá trị viết trước; đối chứng đỏ 'JE-AC-2 sai kiểu: a.bathrooms'. | Đã sửa: E2 so với giá trị viết trước, thêm 8 assert kiểu và đối chứng đỏ (3). |
| P2 | evals | Không eval nào đo E6 cũ đã được ghi là bị thay. | Lưới trước gộp chạy E6 cũ → đỏ chặn PR, hoặc xanh rỗng. | Lưới trước gộp phải thấy E6 thay bởi `judge-evidence-du-truong#AC-1`. | Không thêm eval: lưới trước gộp (`pre-merge-check.sh`, luật thay-khong-nhan / ac-thay-khong-con-eval) chạy ở S4/S5 và chặn đúng hai kịch bản; E5 ghi rõ điều đó. |
