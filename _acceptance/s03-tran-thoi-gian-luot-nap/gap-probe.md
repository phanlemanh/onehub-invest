---
slug: s03-tran-thoi-gian-luot-nap
at: 2026-11-17T14:20:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E4 chỉ quét đồng hồ trong nhóm của lượt (pgid); đồng hồ mồ côi có thể đã rời nhóm | ZCode vá lỗ A bằng setsid; quét theo pgid ra 0 nên E4 xanh dù đồng hồ còn sống và 4 giờ sau gửi TERM | Quét toàn máy theo dấu riêng; chiều đỏ setsid + giữ trap - EXIT | fixed: node đồng hồ chạy qua symlink riêng của thư mục thử, E4 đếm toàn máy theo đường symlink; AC-4 và E4 sửa chữ. Chiều đỏ setsid không dựng: ô (a) đang đỏ trên @99b2778e9 chính là chiều đỏ |
| P1 | evals | E5 chấp nhận mọi rc và không đo bước treo đã chết | ZCode chỉ kill $$: người gọi sống, E5 xanh, nhưng transform treo vẫn chạy | rc script = 143; 10 giây không còn tiến trình bước treo | fixed: E5 ghim rc=143 và đếm toàn máy theo đường fixture bước treo; AC-5 sửa chữ |
| P1 | evals | E2(b) cho state = T1 khi T1 đang nạp dở; nạp giả không ghi lúc xong | Script ghi state trước khi nạp, trần bắn giữa chừng; E2(b) vẫn xanh dù T1 bị bỏ | Nạp giả ghi XONG; state < T1 khi chưa XONG; chiều đỏ ghi state trước nạp | fixed: nạp giả ghi «XONG <snapshot>»; E2(b) đòi state < T1 và lượt 2 nạp lại T1 tới XONG; thêm chiều đỏ ghi state trước khi nạp (đã chạy, đỏ đúng thông điệp) |
| P1 | contract | do-luot-dem không kiểm trần có bật dưới launchd | Máy thu thiếu node riêng → «TRẦN THỜI GIAN TẮT», đêm 3 giờ in ĐẠT, đêm 5 giờ kế lặp sự cố | KHÔNG ĐẠT khi lượt có dòng TẮT; thêm log mẫu | fixed: do-luot-dem in KHÔNG ĐẠT khi lượt có dòng TẮT; thêm hai log mẫu (TẮT ở lượt này · TẮT ở lượt cũ); AC-9, E9 sửa chữ |
| P2 | design | Trần 4h/30′ không có dòng sổ người quyết, không đối chiếu va chạm cloud-sync | Lượt 3h59m vẫn chồng cloud-sync mà kiểm sau in ĐẠT | Dòng sổ dẫn câu duyệt; ghi va chạm cloud-sync ngoài phạm vi | fixed: dòng sổ S1 dẫn GS U1-133 («sau áp phải ≤ 4 giờ hoặc có dòng cắt trần»); Out of scope ghi va chạm cloud-sync dưới 4 giờ không đo |
