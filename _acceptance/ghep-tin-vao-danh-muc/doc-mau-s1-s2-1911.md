# PL20 — Đọc mẫu tin gắn vào tên S1, S2 ở Ocean Park 1 (19/11)

**Vì sao đọc:** tên S1, S2 vừa là hai toà của cụm The Senique (dữ liệu S08), vừa là hai phân khu của The Sapphire (nút 41, 42). Giám sát yêu cầu đọc 25–30 tin trước khi nhận luật «tên trùng thì gắn mức vùng».

**Cách lấy mẫu:** 116 tin căn hộ S03 mà luật đã sửa gắn vào nút 41, 42. Xếp theo băm SHA-256 của `pl20-s1s2-1:<offer_id>`, lấy 30 tin đầu (10 tin S1, 20 tin S2). Em đọc chữ bài dài nhất của từng tin. Chỉ tính điều chữ bài nói, không tính nhãn của model.

| Chữ bài nói gì | Mẫu 30 tin | Đếm máy trên cả 116 tin |
|---|---:|---:|
| Nêu mã toà cụ thể của Sapphire (S1.05, S2.08…) | 12 | 55 |
| Nêu rõ «phân khu S1, S2» | 1 | 5 |
| Nêu rõ The Senique | 1 | 7 |
| Chỉ ghi S1 hoặc S2, không nêu tên khu | 16 | 49 |

Cột đếm máy dò chữ trong bài, một tin có thể rơi vào hơn một nhóm, nên tổng có thể khác 116.

**Kết luận:**

1. Tin nói rõ về Senique là thiểu số: 1/30 trong mẫu (cận trên Wilson 95% khoảng 16,7%), 7/116 trên toàn bộ.
2. Nhãn «Senique» của model không dùng được để phân loại: trong mẫu, ít nhất 3 tin model ghi Senique lại mang mã toà S2.08, S2.16 của Sapphire 2.
3. **Gắn vào nút 41, 42 chưa đủ đúng.** Hai nút này gần như không có toà (41 có 0 toà, 42 có 1 toà). Toà S1.xx nằm dưới nút 394 «The Sapphire 1», toà S2.xx nằm dưới nút 392 «The Sapphire 2». Tin ghi mã S1.05 mà máy gắn nút 41 sẽ bị chấm sai khi người gắn nhãn chọn toà S1.05, vì danh bạ chưa khai hai nút này là cùng một nơi.

**Giới hạn đã biết:** tin nói đúng về toà Senique S1, S2 chỉ gắn tới mức phân khu cho tới khi danh bạ có nút The Senique.
