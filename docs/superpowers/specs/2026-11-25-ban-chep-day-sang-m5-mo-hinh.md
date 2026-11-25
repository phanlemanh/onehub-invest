# Đẩy bản chép đã lọc sang M5 tự động — mô hình (đề xuất, chờ Mạnh)

Mạnh 25/11, đáp Hỏi-1 của HT18: «Tôi không tự làm được hãy phân tích và mô hình để tự động hoá được». Bỏ đường «Mạnh chép tay».

## Dữ kiện (BAN-CHOT hai máy, 24/11)

- Mac mini (máy thu) vào được M5 qua SSH trong LAN bằng khoá `~/.ssh/id_ed25519_m5` (khoá đủ quyền shell, dùng cho dựng máy).
- M5: DB trong container `one-invest-db` (colima); cổng 5433 của máy M5 không mở ổn định (bẫy lima) → nạp bằng
  `docker exec … pg_restore`, không qua cổng.
- M5 không giữ tầng A; FileVault bật. Không tự khởi động lại colima trên M5.

## Luồng

```
Mac mini (máy thu)                                   M5 (máy thực thi)
1. chép + soát (HT18) → dump + ke.json
2. đẩy qua SSH, khoá riêng bị ép lệnh  ──────────▶  3. nhan.sh: so sha256 · kiểm không từ điển ·
                                                        nạp vào DB mới · đếm dòng = ke.json ·
                                                        đổi tên: oneinvest_cu ← oneinvest ← mới
4. ghi sổ + báo kênh #4 một dòng    ◀──────────────     trả mã kết quả (0 xanh / khác 0: giữ DB cũ)
```

## Rào

1. Một chiều: chỉ Mac mini đẩy sang M5; M5 không có khoá vào Mac mini.
2. Khoá riêng cho việc đẩy, trong `authorized_keys` của M5 gắn `restrict,command="…/nhan.sh"`: khoá chỉ chạy được đúng bước
   nhận — không shell, không chuyển cổng. Thu hồi = xoá một dòng.
3. Chỉ đẩy tệp vừa qua bộ soát trong cùng lượt (ke.json xanh, sha khớp); từ điển tên nguồn không rời Mac mini.
4. M5 soát lại bằng bản không từ điển trước khi nạp; lỗi ở bất kỳ bước → DB đang chạy trên M5 giữ nguyên.
5. Nạp nguyên tử: nạp vào DB mới, đếm khớp rồi mới đổi tên; giữ đúng một bản cũ để lùi (`nhan.sh --lui`).
6. Trần cỡ tệp, trần thời gian; xoá tệp dump trên M5 sau khi nạp xanh.

## Kích hoạt

- Bước 1: theo lệnh — giám sát hay phiên cần dữ liệu chạy một lệnh trên Mac mini; không cần Mạnh.
- Bước 2 (sau một tuần đo): hằng đêm sau lượt tính chỉ số, bằng launchd — plist mới cần lời riêng của Mạnh.

## Cắt hàng (đề xuất cho GS)

HT18 giữ phần chép + soát (thẻ đã có). Thêm hàng mới «đẩy bản chép sang M5» sau HT18, hạng T3 vì dữ liệu rời máy thu.

## Câu cho Mạnh

- Q1: Duyệt mô hình đẩy một chiều qua SSH khoá bị ép lệnh, gồm cài khoá riêng lên M5 qua đường SSH hiện có?
- Q2: Kích hoạt theo lệnh trước, một tuần sau mới xin lời bật hằng đêm?
