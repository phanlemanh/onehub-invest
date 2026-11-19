# Hồ sơ áp máy thu — DA45 phuong-tu-du-an-chay-that

Áp SAU khi PR gộp, từ checkout chính `~/dev/onehub-invest` (đứng ở `main`). Chữ ký Cổng Bằng chứng của Mạnh phủ lượt ghi này (Cổng Phạm vi
19/11, Hỏi-2). Tránh 17:00–18:00Z và lúc lượt đọc gộp đêm chạy. Không có DDL, không chạm cloud trực tiếp.

## Năm thứ

1. **Sao lưu trước:** `bash _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/sao-luu.sh` — chép phát biểu của luật và cột phường của mọi tin S03 ra
   `~/onehub-backups/db/`.
2. **Số chạy thử:** chạy ngay trước khi áp, ghi số vào `so-chay-thu.md` mục «Ngay trước khi áp»:
   `DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/scripts/phuong-tu-du-an.mjs --json` (không cờ là chỉ đếm)
   và `psql … -f _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/kiem-sau.sql`.
3. **Lệnh áp (lượt ghi đầu):** `DATABASE_URL=… node pipeline/scripts/phuong-tu-du-an.mjs --ghi`. Từ lượt nạp kế, chuỗi `zalo-import-daily.sh` tự gọi
   `--ghi --noi-tiep` cho tin mới.
4. **Lệnh kiểm sau:** `psql … -f _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/kiem-sau.sql`. Đạt khi số tin S03 đang hiện có phường không thấp hơn
   số chạy thử ngay trước khi áp, và không vượt quá số ấy cộng số tin S03 nạp sau mốc chạy thử. Lệch thì dừng, báo, không tự sửa cho khớp.
5. **Cách lùi:** `psql … -f _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/lui.sql` (rút mọi phát biểu của luật, phân xử lại tin mang nhãn
   `du-an`). Sau khi lùi, chuỗi nạp tự thôi ghi vì luật không còn dòng sống. Rồi chạy lại hạng giá `node pipeline/xep-hang-gia.mjs` để hạng
   giá theo vị trí về như cũ; lượt đồng bộ cloud kế tiếp mang giá trị đã lùi lên cloud — kiểm bằng `kiem-sau.sql` trên máy thu và ô «Có
   phường» ở `/ops` trên cloud sau lượt đồng bộ.

`psql …` = `docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -X -v ON_ERROR_STOP=1`.
