# Áp migration 105 lên DB máy thu — DV7 du-an-cua-tin-len-dinh-vi

Theo AGENTS.md «Ai quyết gì»: chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp 105 lên DB máy thu, vì hồ sơ ghi đủ năm thứ
dưới đây. Người chạy: phiên được GS giao, sau khi PR gộp. Chạy ngoài 17:00–18:00Z và khi tải máy dưới 14. Năm tệp của thư
mục: `README.md` (tệp này), `sao-luu.sh`, `so-chay-thu.md`, `105-lui.sql`, `kiem-sau.sql`.

1. **Sao lưu trước** — `bash _acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/sao-luu.sh`. Ghi bản lược đồ ra
   `~/onehub-backups/db/truoc-105-<UTC>.dump`, ngoài cây kho. 105 chỉ đổi lược đồ, không chạm dòng dữ liệu.
2. **Áp** — từ checkout chính sau khi đã kéo main:
   ```bash
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -1 < db/migrations/105_offer_project.sql
   ```
   rồi làm tươi hai bảng tổng hợp:
   ```bash
   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/refresh-data-flow.mjs pipeline/sql/600_data_flow.sql
   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/bac-du-lieu.mjs --write
   ```
3. **Số chạy thử** — `so-chay-thu.md`: áp 105 và chạy 600 trong một giao dịch rồi lùi trên chính DB máy thu (E9). Số thật
   sau khi áp phải khớp số này trong biên tin mới vào giữa hai lần đo.
4. **Lùi** (nếu cần) —
   ```bash
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -1 < _acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/105-lui.sql
   ```
   rồi chạy lại hai lệnh làm tươi ở bước 2. Tệp lùi trả `offer_located`, `data_level_units` về thân 087 trước rồi mới bỏ
   view, không CASCADE: có view của hàng khác (vd CG10) dựa trên `offer_project` thì lùi thất bại cả khối — lùi view kia
   trước. Bản lược đồ ở bước 1 là đường cuối nếu tệp lùi không đủ.
5. **Kiểm sau** —
   ```bash
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -X < _acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/kiem-sau.sql
   ```
   Đạt khi: có view; ô Định vị S03 (all) khớp số tin `mot_du_an` S03 của dòng 3 và gần số chạy thử; `xung_dot` được liệt
   kê; số B2 hôm nay bằng `b2_ky_vong`.

**Dòng chuyển bậc dự kiến.** Lượt `do-hang-ngay` đầu sau áp ghi một loạt dòng `huong = 'len'` (B1 → B2) vào
`data_level_change`, tới số `b2_ky_vong` (tin có dự án và đủ năm trường lõi, mọi nguồn — xem `so-chay-thu.md`). Đây là đổi định
nghĩa một lần, không phải biến động dữ liệu; báo cáo DO1 ngày áp đọc theo chú thích này.
