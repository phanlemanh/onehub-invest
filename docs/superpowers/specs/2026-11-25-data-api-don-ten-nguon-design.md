# PB5 — Dọn tên nguồn thật trong lược đồ mẫu của data-api (`data-api-don-ten-nguon`)

Hàng PB5 do giám sát đợt cắt ngày 25/11 (chưa có trong `docs/plan/lo-trinh.json`); dãy M5B làm trên máy M5.

## Bài toán

`data-api/` đi nguyên văn sang repo công khai `onehub-data-api` qua `tools/sync-public.sh` (subtree). Tên nguồn thật là
tầng A (AGENTS.md luật 6) nhưng còn trong cây này. Đo bằng bộ dò của kho (`scripts/lib/tier-a-source-names.mjs`, danh sách
tên rút từ `db/migrations`) trên `origin/main` `78ea448dd`: **133 cụm trong nội dung + 8 tên tệp**, chia theo chỗ đứng:

| Loại | Cụm | Ở đâu | PB5 |
|---|---|---|---|
| Chú thích | 31 | `data-api/db/*.sql` | dọn |
| Chuỗi dữ liệu mẫu | 13 | `db/012` (4 `real_name` + 1 giá trị cũ), `db/013` (6 `source_ids`), `db/014` (2 `source_ids`) | dọn |
| Tên tệp | 8 | `db/003, 005, 008, 009, 014, 016, 019, 020` | đổi tên |
| Tên bảng, cột, chỉ mục | 89 | `db/*.sql` 48 · `seed.sql` 14 · `src/routes/` 27 (coverage 6, deals 1, listings 4, markets 16) | **ngoài phạm vi** |

Lần đếm tay đầu báo «15 chuỗi · 87 định danh»: 2 cụm trong `markets.ts` là tên bảng nằm trong câu SQL của template literal,
bộ đọc cú pháp xếp đúng thành định danh.

## Cách làm

1. **Bộ quét** `scripts/data-api-ten-nguon.mjs`: đọc từng tệp theo cú pháp (SQL: `--`, `/* */`, `'…'`; TS: `//`, `/* */`,
   `'…'`, `"…"`, template literal đọc như SQL) để xếp mỗi cụm vào chú thích · chuỗi · định danh; tên tệp xét riêng.
   Định danh chỉ hợp lệ khi dạng che (`«S02»_listings`) nằm trong `DINH_DANH_BIET` — 22 dạng, 89 cụm. Báo bằng mã S0x + tệp:dòng.
2. **Sửa** chỉ dưới `data-api/db/**`: chú thích thay tên bằng mã S0x (tên bảng trong chú thích viết thành «bảng … của S02»);
   `real_name` mẫu = `Nguồn mẫu S0x`; `source_ids` mẫu = `s0x-<vai>` (vai giữ: discovery, listing, research, mock, groups,
   boundaries, agent); giá trị cũ trong câu đổi mã của 012 = `nguon-mau-cu-s02`. Tám tệp đổi tên giữ số đầu (thứ tự nạp
   của `docker-entrypoint-initdb.d` không đổi). Không tệp nào ngoài `data-api/db` tham chiếu tên tệp cũ (grep cả kho:
   chỉ các bản cùng tên trong `db/migrations`, không đổi), data-api không có bảng theo dõi «đã áp tệp nào».
3. **Test** `scripts/data-api-ten-nguon.test.mjs` (chạy trong job `scripts` của CI): cây thật sạch; danh sách tên rỗng thì
   thước dừng (cả hàm lẫn CLI); tám ca phá trên bản sao (SQL, TS, README, Dockerfile, định danh mới, tên tệp); lược đồ mẫu
   dựng trên DB trống mới ra đúng danh sách bảng/view, lỗi, 29 mặc định cột đã ghim từ bản trước khi dọn, và `source_registry`
   đúng ánh xạ trước → sau, kèm hai đối chứng đỏ. Bộ quét đọc mọi tệp chữ dưới `data-api/` (bỏ tệp nhị phân).
   Ở máy dev, `scripts/data-api-ten-nguon-db.sh` dựng PostGIS dùng một lần và chạy ca lược đồ mẫu trong container cùng mạng
   (thoát 3 khi có ca bị bỏ qua); trên CI ca này chạy với service của job `scripts`.

## Lược đồ mẫu trước = sau

Dựng DB trống từ `data-api/db/*.sql` theo thứ tự tên rồi `seed.sql`, từng câu một như `psql -f`. Bản trước khi dọn đã gãy
sẵn: 012 cập nhật `area_sources` chưa có (42P01) → seed.sql lỗi theo (1×42P01 + 10×25P02) — việc của hàng PB1, không phải
PB5. Đo hai đường (psql trong container, và hàm `dungLuocDoMau` của test qua pg): trước và sau cùng 28 bảng + 2 view của
PostGIS, cùng chữ ký lỗi, `source_registry` cùng 4 mã.

## Ngoài phạm vi

- 89 cụm tên bảng/cột/chỉ mục: nợ «dọn tên nguồn trong lược đồ» — đổi tên = migration mới + DDL trên cloud + mọi bên đọc
  (route data-api, app, pipeline); cùng phán với hàng HT26. `src/` còn là vùng của PB2/PB3 và tên biến của HT20.
- Dạng viết tắt ngoài danh sách của bộ dò (tiền tố `abnb_` của id listing và bảng `stg_abnb_*`): là định dạng dữ liệu
  chung của cả hệ thống (AGENTS.md «Prefix»), bộ dò không bắt; đổi là đổi dữ liệu.
- Lỗi dựng sẵn của lược đồ mẫu (012 thiếu `area_sources`, `v_ruler_p2`): hàng PB1.
