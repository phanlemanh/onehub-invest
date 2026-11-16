# Thiết kế: nạp danh mục dự án S07 vào `stg_s07_*` (DAZ3, `thu-danh-muc-s07`)

Ngày 11/11/2026. Hạng T3 (có migration). Làn thu (phiên thu thay ZCode); danh sách cột và mục v9 do liên làn duyệt 11/11.

## Bối cảnh

S07 là cổng rao có danh mục khoảng 6.080 dự án toàn quốc (608 trang danh sách × 10 thẻ). Mạnh chốt thu S07 ngày 11/11:
thông tin dự án là thông tin cần công bố cho người mua (ROADMAP §3 mục 38, 44). Việc thu chạy bằng bộ chạy local (mang tên
miền nên không vào kho), ghi raw snapshot bất biến ở `collector/snapshots/vn/vn__s07-danh-muc__*`. Tới 11/11 có 12
snapshot: 38 trang danh sách, 7 trang dự án, 2 sitemap. Chưa có đường nào đưa raw này vào DB.

Vòng này làm phần **nạp**: raw → ba bảng `stg_s07_*`. Phần thu không nằm trong PR.

## Dòng chảy

```
snapshot vn__s07-danh-muc__<mốc>  (items-*.json.gz + manifest.json, bất biến)
   │  import-s07-danh-muc.mjs: kiểm khuôn tên, manifest.source, schemaVersion {1..9}, sha256 từng tệp
   │  lib/s07-danh-muc.mjs (hàm thuần): bỏ tên miền → bóc theo kind
   ├─ project_list_page → stg_s07_project_card   một dòng mỗi thẻ chính (10 thẻ/trang)
   ├─ project_catalog   → stg_s07_project        một dòng mỗi trang dự án
   └─ project_sitemap   → stg_s07_sitemap_url    một dòng mỗi đường dẫn dự án
   + một dòng dấu ở airbnb_snapshots (cùng khuôn bộ nạp chung)
```

Bước đọc stg (chọn bản mới nhất của mỗi dự án, nối danh bạ, cha–con) là việc của làn Claude ở DA7, DA3, DA11.

## Lựa chọn

1. **Bộ nạp riêng**, không thêm nguồn vào ALLOWLIST của `import-airbnb.mjs`. Lối kia chết vì cùng chỗ sửa (ALLOWLIST và
   `SUPPORTED_SCHEMA_VERSIONS`) đang nằm trong commit S10 chưa gộp của dãy P3. `import-airbnb.mjs` gặp snapshot S07 thì bỏ
   qua có dòng báo như mọi nguồn ngoài ALLOWLIST.
2. **Khoá `(snapshot_id, pj_id)` ở cả ba bảng**, chèn `ON CONFLICT DO NOTHING`. Khoá chỉ `pj_id` thì nạp lại một snapshot
   cũ sau snapshot mới sẽ đè bản mới bằng bản cũ; khoá đôi cho cùng kết quả với mọi thứ tự nạp và giữ lịch sử thay đổi của
   dự án giữa hai lần thu.
3. **Tên miền nguồn không vào stg và không nằm trong mã.** Bộ nạp suy tên miền từ chính snapshot (`payload.canonical` của
   một trang dự án; không có thì hậu tố chung của các link trong HTML), hoặc đọc `S07_HOST` ở cấu hình local. Link trang
   thành đường dẫn tương đối, link ảnh thành `s07://<máy con>/<đường dẫn>`, tên miền đứng trần trong chữ thành «S07».
   Trước khi ghi, bộ nạp soát mọi dòng theo MỌI tên miền suy được (cấu hình, canonical, link của item); còn sót thì dừng,
   không ghi gì của snapshot đó — đặt `S07_HOST` sai cũng không làm tên miền thật lọt. Tên nguồn viết bằng chữ trong văn bản
   tự do (mô tả, tóm tắt, hỏi đáp) không bị che ở bộ nạp: stg chỉ nằm ở máy thu, đường lên cloud phải qua `mask-source-names`. Đọc tên miền từ `source_registry`
   không dùng được vì lược đồ thử và CI không có bảng ấy với dữ liệu thật.
4. **Loại hình và khu vực suy từ đường dẫn**, không đọc `meta.loaiHinh`: 7 item cũ ghi sai và raw là bất biến.
5. **Item thu trong phiên đăng nhập không nạp.** Item cờ `true` bị bỏ có đếm. Trang danh sách và trang dự án thiếu cờ: khuyến
   nghị cũng bỏ (Hỏi-1 ở Cổng Phạm vi; 12 snapshot hiện có không có item nào thiếu cờ ở hai kind này). Sitemap lượt đầu không
   ghi cờ (tệp công khai) vẫn nhận.
6. **Tên cột theo RESO khi có**: chủ đầu tư là `builder_*` (BuilderName), số toà là `number_of_buildings_total`
   (NumberOfBuildingsTotal), số căn là `number_of_units_total`, địa chỉ nguyên văn là `unparsed_address`, toạ độ là
   `latitude`/`longitude`. Giá trị chưa chuẩn hoá mang hậu tố `_raw`.
7. **DB chưa áp 093**: in `CHUA-AP-093`, thoát 0, không đánh dấu snapshot — áp xong nạp lại vẫn đủ.

## Ba bảng (migration 093)

DDL đã được liên làn duyệt (ghi chú `s07-cot-093-de-xuat-20261111.md`), kèm ba bổ sung: chỉ mục `(pj_id, captured_at DESC)`
trên cả ba bảng; `COMMENT ON TABLE` «stg S07 — chỉ máy thu, không sync cloud»; `COMMENT` cho `price_range_raw` «chỉ nội bộ,
ROADMAP §3 mục 27». Migration idempotent (`CREATE … IF NOT EXISTS`), không đụng bảng nào khác.

- `stg_s07_project_card`: `pj_id`, trang và vị trí trong danh sách, đường dẫn, loại hình, khu vực, tên, trạng thái, địa chỉ,
  diện tích (nguyên văn), số căn, số toà, chủ đầu tư, tóm tắt, ảnh.
- `stg_s07_project`: thêm toạ độ, breadcrumb (quận cũ), ghi chú trạng thái, mọi cặp thuộc tính (`attributes`, mảng các cặp
  `{label, value}` để giữ thứ tự nguồn), mã và đường
  dẫn chủ đầu tư, pháp lý, quy mô, khoảng giá (chỉ nội bộ), tiện ích, khối mô tả, câu hỏi thường gặp, ba mảng mã dự án
  (con theo `meta.children`, link trong mô tả, dự án liên quan), album.
- `stg_s07_sitemap_url`: `pj_id`, đường dẫn, loại hình, khu vực — để đối chiếu đủ/thiếu với danh sách.

## Đo

- Hàm thuần: test trên HTML giả dựng theo khuôn lớp CSS, miền thử `.test`; mỗi trường một khẳng định, có ca không-được-nhận.
- Nạp DB: lược đồ tạm trên DB của riêng lượt (`db/db-thu.sh --chay`), bảng dựng bằng chính tệp 093.
- 093: bộ soát lược đồ đọc danh mục hệ thống; ba bản đột biến của 093 (bỏ chỉ mục, bỏ chú thích, đổi khoá) phải đỏ đúng tên.
- Tầng DB: đọc lại từng cột của một dòng mỗi bảng so với đầu ra hàm bóc; nạp hai thứ tự phải ra cùng nội dung.
- Dữ liệu thật: nạp mọi snapshot S07 trên máy vào lược đồ tạm của DB thử; số dòng = số đếm độc lập trên raw trừ phần bỏ theo
  từng lý do; nạp lần hai ghi 0 dòng; soát tên miền và nhãn nguồn (suy từ raw) trên stg và các tệp của vòng trong kho. Lệnh đo
  chỉ nhận DB theo tên `oneinvest_<…>`, có năm đối chứng đỏ.

## Không làm trong vòng

- Nối bộ nạp vào lịch chạy đêm; áp 093 lên DB máy thu (bước sau gộp, cần lời riêng của Mạnh).
- View «bản mới nhất», nối danh bạ, quyết định cha–con (DA7, DA3, DA11).
- Đưa `stg_s07_*` lên cloud; che tên nguồn viết bằng chữ trong mô tả (đường lên cloud qua `mask-source-names`, lời DA16).
- Thu tiện ích quanh dự án, tin rao, SĐT.
