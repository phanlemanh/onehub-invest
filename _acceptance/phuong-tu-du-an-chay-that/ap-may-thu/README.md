# Hồ sơ áp máy thu — DA45 phuong-tu-du-an-chay-that

Áp SAU khi PR gộp, từ checkout chính `~/dev/onehub-invest` (đứng ở `main`). Chữ ký Cổng Bằng chứng của Mạnh phủ lượt ghi này (Cổng Phạm vi
19/11, Hỏi-2). Tránh 17:00–18:00Z và lúc lượt đọc gộp đêm chạy. Không có DDL, không chạm cloud trực tiếp.

## Năm thứ

1. **Sao lưu trước:** `bash _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/sao-luu.sh` — chép phát biểu của luật và cột phường của mọi tin S03 ra
   `~/onehub-backups/db/`.
2. **Số chạy thử:** chạy ngay trước khi áp, ghi số vào `so-chay-thu.md` mục «Ngay trước khi áp»:
   `DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/scripts/phuong-tu-du-an.mjs --json` (không cờ là chỉ đếm)
   và `psql … < _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/kiem-sau.sql`.
3. **Lệnh áp (lượt ghi đầu):** `DATABASE_URL=… node pipeline/scripts/phuong-tu-du-an.mjs --ghi`. Từ lượt nạp kế, chuỗi `zalo-import-daily.sh` tự gọi
   `--ghi --noi-tiep` cho tin mới.
4. **Lệnh kiểm sau:** `psql … < _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/kiem-sau.sql`. Đạt khi đủ ba điều: `phat_bieu_song` > 0;
   `tin_nhan_du_an` > 0; tỉ lệ `co_phuong` / `tong` không thấp hơn tỉ lệ chạy thử trên bản chép trừ 2 điểm phần trăm (`so-chay-thu.md`, dòng
   «Mẫu số toàn kho»). Bản chép là bản sao DB máy thu trong vòng một ngày, nên tỉ lệ hai bên gần nhau; số tuyệt đối thì không so được, vì
   máy thu nạp thêm tin sau mốc chạy thử. Lệch thì dừng, báo, không tự sửa cho khớp.
5. **Cách lùi:** `psql … < _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/lui.sql` (rút mọi phát biểu của luật, phân xử lại hai lượt các tin
   mang nhãn `du-an` hoặc có phát biểu của luật). Lùi giữ khoá tư vấn chung với bước phường của chuỗi nạp: lượt nạp đang ghi thì lùi chờ nó
   xong; lượt nạp tới sau chờ lùi commit rồi thấy luật hết dòng sống và bỏ qua. Vì vậy lùi chạy được lúc nào cũng được, không phải dừng
   job (tránh lượt 00:00: lượt ấy chờ khoá tối đa 10 phút rồi báo JOB FAIL). Sau khi lùi, chuỗi nạp tự thôi ghi vì luật không còn dòng sống. Kiểm ngay: `psql … < _acceptance/phuong-tu-du-an-chay-that/ap-may-thu/kiem-sau.sql`
   phải cho `phat_bieu_song` = 0 và `tin_nhan_du_an` = 0; khác thì chạy lại `lui.sql` và báo. Rồi chạy lại hạng giá
   `node pipeline/xep-hang-gia.mjs` để hạng giá theo vị trí về như cũ; lượt đồng bộ cloud kế tiếp mang giá trị đã lùi lên cloud — kiểm ô
   «Có phường» ở `/ops` trên cloud sau lượt đồng bộ.

`psql …` = `docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -X -v ON_ERROR_STOP=1`.
