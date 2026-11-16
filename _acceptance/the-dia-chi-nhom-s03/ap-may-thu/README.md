# Áp migration 108 + 109 lên DB máy thu — TG1 the-dia-chi-nhom-s03

Theo AGENTS.md «Ai quyết gì»: chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp 108 và 109 lên DB máy thu, vì hồ sơ ghi đủ năm thứ
dưới đây. Người chạy: phiên được GS giao, sau khi PR gộp. Chạy ngoài 17:00–18:00Z và khi tải máy dưới 14. Năm tệp của thư
mục: `README.md` (tệp này), `sao-luu.sh`, `so-chay-thu.md`, `108-lui.sql`, `kiem-sau.sql`.

108 chỉ THÊM: hai bảng mới (`group_address_cards`, `group_address_card_history`), một sequence, một hàm và trigger kiểm tham
chiếu. 109 thêm hai cột cho nghỉ vào bảng thẻ của 108 và nới ràng buộc hành động của bảng lịch sử — chỉ chạm hai bảng mà
108 vừa dựng. Không đổi bảng, view hay hàm có sẵn; không vào `sync-cloud` (thẻ chỉ ở máy thu). **Hai migration là MỘT bộ,
áp cùng lượt**: trang Ops coi DB chỉ có 108 là chưa áp (hiện «Chỉ ở máy thu») và lệnh dựng nháp dừng với lời gọi tên 109.

1. **Sao lưu trước** — `bash _acceptance/the-dia-chi-nhom-s03/ap-may-thu/sao-luu.sh`. Ghi bản lược đồ ra
   `~/onehub-backups/db/truoc-108-<UTC>.dump`, ngoài cây kho; nếu hai bảng thẻ đã có (áp lại), ghi thêm dữ liệu của chúng.
2. **Áp** — từ checkout chính sau khi đã kéo main:
   ```bash
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -1 < db/migrations/108_the_dia_chi_nhom.sql
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -1 < db/migrations/109_the_dia_chi_nhom_cho_nghi.sql
   ```
   rồi dựng nháp thẻ cho mọi nhóm S03 có bài (chỉ ghi hai bảng thẻ, không đụng sổ, tin hay `field_assertions`):
   ```bash
   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/scripts/the-dia-chi-nhom.mjs --ghi --may-thu
   ```
3. **Số chạy thử** — `so-chay-thu.md`: áp 108 + 109 và dựng nháp trên bản chép DB máy thu `oneinvest_u1_tg1` (E7, E8). Số thật
   sau khi áp phải khớp số này trong biên nhóm và bài mới vào giữa hai lần đo. Máy thu áp lần đầu nên bảng thẻ rỗng: số thẻ
   sống ra đúng số nhóm thật có bài, 0 thẻ nghỉ. Các lần chạy SAU, nhóm thôi đủ điều kiện sẽ có thẻ chuyển sang nghỉ — dòng ở
   lại, chỉ rời tập sống; `kiem-sau.sql` in cả hai số.
4. **Lùi** (nếu cần) — thẻ người đã duyệt là dữ liệu mới: chạy lại bước 1 trước để giữ chúng, rồi
   ```bash
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -1 < _acceptance/the-dia-chi-nhom-s03/ap-may-thu/108-lui.sql
   ```
   Tệp lùi bỏ đúng các đối tượng 108 tạo, không CASCADE (hai cột của 109 nằm trong bảng thẻ nên đi cùng, không cần tệp lùi riêng): có đối tượng của hàng khác dựa trên bảng thẻ (vd TG2) thì lùi thất
   bại cả khối — lùi đối tượng kia trước. Trang `/ops/group-cards` khi không còn bảng thì hiện «Chỉ ở máy thu», không vỡ.
5. **Kiểm sau** —
   ```bash
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -X < _acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql
   ```
   Đạt khi: có hai bảng; số thẻ bằng số nhóm S03 có bài (dòng `nhom_co_bai`) — mốc chạy thử 16/11 là **26** sau khi gạt bài
   thử; mọi thẻ đang `nhap`; mỗi thẻ
   có một dòng lịch sử `dung_nhap`.

**Thứ tự gộp và áp.** Gộp trước hay áp trước đều an toàn: khi DB chưa có bảng thẻ, trang `/ops/group-cards` hiện «Chỉ ở máy
thu» và route ghi trả 500 «không ghi được thẻ» mà không đổi gì; lệnh dựng nháp thoát 2 «DB chưa áp 108».
