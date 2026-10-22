---
slug: enrich-qua-de-xuat
at: 2026-10-22T13:11:40Z
verdict: findings
p0: 0
p1: 4
p2: 1
---

# Phản biện context sạch — enrich-qua-de-xuat

Tác tử mới, chỉ đọc 4 tệp: design doc · contract.md · evals.yaml · decisions.jsonl. Không có input thứ 5 (claim-scan trả corpus rỗng).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Ca LLM trái E1 thành superseded im lặng, lệch «phần còn lại vào /ops/review», sổ không có dòng cho lựa chọn chỉ-người này | asset_nodes khớp sai, E1 ghi 'house' còn LLM đúng 'apartment' bị loại không ai thấy; E8 vẫn xanh | Dòng sổ chi-nguoi nêu hai lối; sửa AC-7/E8 theo lựa chọn chốt | fixed: thêm dòng sổ d-20261022T131228Z-9 (chi-nguoi, lên thẻ Cổng Phạm vi); AC-7 + E8 thêm in số ca xung đột |
| P1 | evals | E5/E11 dựng thẻ review_queue + liên kết đề xuất bằng tay, không rút từ bên ghi thật | enrich-run quên đặt review_id; duyệt thẻ thật áp 0 field mà E5/E11 vẫn xanh | Ca nối liền: enrich-run sinh thẻ → decide trên id đó → applied = queued > 0; đỏ khi xoá review_id | fixed: E5/E11 đổi sang ca nối liền + chiều đỏ ghim 'AC-5 thẻ không trỏ đề xuất' |
| P1 | evals | E9 so số dòng trong khi lời hứa --dry là không đổi nội dung | --dry vẫn chạy UPDATE fill-gap + cascade; số dòng không đổi nên E9 xanh | Băm md5 theo dòng các cột của sale_offers/properties/bảng đề xuất/hàng duyệt trước = sau; đỏ khi dry chạy UPDATE | fixed: E9 đổi sang băm nội dung + chiều đỏ ghim 'AC-8 dry đã ghi' |
| P1 | evals | Fixture LLM/E1 là chuỗi viết tay đã khớp sẵn; so «cùng giá trị» và khoá duy nhất phụ thuộc chuẩn hoá | LLM trả "2" hoặc 'Apartment' còn E1 trả 2/'apartment' → không corroborated, giá trị đã bác bị đẩy lại | Fixture rút từ ≥3 trace thật qua parser thật; ca "2"↔2, 'Apartment'↔'apartment', chạy lại sau bác | fixed: design §3.1 thêm normalizeValue; E3 dùng fixture từ trace thật; E9 thêm ca chạy lại sau bác |
| P2 | contract | Ô «offer không property» của trục C không có AC/eval | Cascade với property NULL ném lỗi, hỏng cả mảng ids của lượt | Ca gộp offer có/không property trong cùng mảng ids, cả hai applied | fixed: AC-2 + E2 thêm offer không gắn property trong cùng mảng ids |
