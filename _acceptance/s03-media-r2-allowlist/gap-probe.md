---
slug: s03-media-r2-allowlist
at: 2026-11-25T01:30:00Z
verdict: findings
p0: 0
p1: 2
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E3 và E4 ghi fixture localhost (một nhãn) trong khi parseHostSuffixes bỏ hậu tố một nhãn | Hoặc ca đỏ, hoặc mã thêm ngoại lệ ngầm cho localhost và đường hậu tố nhiều nhãn không ca nào chạy qua | Fixture nhiều nhãn trỏ 127.0.0.1 qua tệp và biến; assert parseHostSuffixes bỏ localhost | fixed: mã test đã dùng hậu tố hai nhãn 0.0.1 cho host đích 127.0.0.1 (nguồn là localhost được phép sẵn); sửa chữ expected của E3, E4 cho khớp; ca parse thêm localhost → bị bỏ (không ngoại lệ) |
| P1 | contract | Trục rò tên bỏ sót đầu ra của kiem-sau sau áp | kiem-sau in URL hay host khi KHÔNG ĐẠT, người áp chép lên kênh GitHub công khai | Mẫu có host canh gác, assert đầu ra không chứa chuỗi host | fixed: kiem-sau chỉ in số đếm và họ host băm; kiem.sh thêm mẫu canh-gac.json (host canh-gac-zc15.example) và đòi đầu ra không chứa canh-gac (E11) |
| P2 | contract | Ngưỡng khoảng 20,9% không có dung sai, redirect-host không lọc theo họ 99ee4ac919 | Ngày sau áp http-400 dao động, không biết ĐẠT hay không; redirect sang host lạ khác làm KHÔNG ĐẠT giả | Tỉ lệ đích tính trên chính ngày đo; lọc redirect theo họ host | fixed (một phần): --ty-le in thêm tỉ lệ đích của chính ngày (bỏ bài chỉ hỏng vì r2.dev chặn hay redirect-host), so được ngày nào cũng được; rejected phần lọc theo họ: entry chỉ ghi URL gốc, host cuối không có trong meta.mediaFiles (thêm là đổi DATA-CONTRACT, OOS-4) — mọi redirect-host mới sau áp đều đáng dừng và báo GS |
| P2 | design | Không eval round-trip một entry .jxl qua bên đọc phía sau | Bên đọc ném lỗi với đuôi lạ, cả bài nạp hỏng | Đưa entry .jxl qua vlm-anh và zalo-media | deferred: soát mã 25/11 — pipeline/lib/vlm-anh.mjs đoán kiểu theo byte, kiểu lạ thì đếm sai-dinh-dang rồi continue (không ném); app/src/lib/ops/zalo-media.ts isImage theo đuôi, .jxl không có trong bảng → outside() (404), không ném. Đo 25/11 host đích 0/36 lượt trả JPEG XL; bên đọc nằm ngoài vùng collector/src — nếu .jxl > 0 sau áp, README mục 5 bảo báo LL |
