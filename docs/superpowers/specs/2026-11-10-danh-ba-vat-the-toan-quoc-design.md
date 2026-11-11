# DA1 — danh bạ vật thể dựng toà ở cả 34 tỉnh/thành (thiết kế)

Hàng `DA1` (`danh-ba-vat-the-toan-quoc`, gộp DR1 + DB1c của `docs/plan/ke-hoach-danh-ba-du-an-0811.md`). Ô cơ hội:
`_acceptance/danh-ba-vat-the-toan-quoc/opportunity.md` (Mạnh chốt gói 09/11). Migration **088** (giám sát cấp, P3-183).
Hạng T3 (`db/migrations/**`).

## 1. Vấn đề

- 082 khoá `buildings.iso_region IN ('VN-HN','VN-SG')` và `upi ~ …VN-(HN|SG)…`; `pipeline/danh-ba-vat-the.mjs` viết cứng
  `ISO = { hanoi: "VN-HN", hcmc: "VN-SG" }` theo `meta.city` của khu. PX2 (150 dự án S08 toàn quốc) không dựng được toà
  ngoài hai thành phố; và `meta.city` sai ở ba khu Hưng Yên (Ecopark, Ocean Park 2, 3 ghi `hanoi`) — dựng toà ở đó sẽ đúc
  UPI `VN-HN` sai mãi mãi (UPI đúc một lần).
- Lệnh tay ghi `builder_name` lớp `fact`/`hitl` mà `changed_by` trống: «hitl» khai có người duyệt mà không có ai. Đo máy
  thu 10/11: 0 phát biểu `builder_name` (từ điển chưa chạy) — không có dòng cũ để rút.

## 2. Cách làm

**088 (idempotent):**
1. Bảng `iso_regions (admin_code text PK '^\d{2}$', iso_region text UNIQUE '^VN-[0-9A-Z]{2}$', ten, ten_iso_cu)` — 34 dòng,
   một dòng mỗi tỉnh/thành của danh bạ PX1 (`areas.admin_code` 2 số = `pipeline/data/dvhc/tinh.json`). Luật (kế hoạch
   0811 §DR1): mã ISO của tỉnh sau sáp nhập = mã ISO 3166-2:VN cũ của tỉnh mang tên được giữ. Nguồn mã cũ: ISO 3166-2:VN
   (63 mã, bản 2020-11-24, trang Wikipedia «ISO 3166-2:VN» đọc 10/11) — chụp vào `pipeline/data/iso-3166-2-vn.json`
   kèm ngày đọc; test nối với `tinh.json` theo tên. Huế giữ mã Thừa Thiên-Huế `VN-26` (ngoại lệ tên duy nhất).

   | Mã | Tỉnh | ISO | | Mã | Tỉnh | ISO |
   |---|---|---|---|---|---|---|
   | 01 | Hà Nội | VN-HN | | 44 | Quảng Trị | VN-25 |
   | 04 | Cao Bằng | VN-04 | | 46 | Huế | VN-26 |
   | 08 | Tuyên Quang | VN-07 | | 48 | Đà Nẵng | VN-DN |
   | 11 | Điện Biên | VN-71 | | 51 | Quảng Ngãi | VN-29 |
   | 12 | Lai Châu | VN-01 | | 52 | Gia Lai | VN-30 |
   | 14 | Sơn La | VN-05 | | 56 | Khánh Hòa | VN-34 |
   | 15 | Lào Cai | VN-02 | | 66 | Đắk Lắk | VN-33 |
   | 19 | Thái Nguyên | VN-69 | | 68 | Lâm Đồng | VN-35 |
   | 20 | Lạng Sơn | VN-09 | | 75 | Đồng Nai | VN-39 |
   | 22 | Quảng Ninh | VN-13 | | 79 | Hồ Chí Minh | VN-SG |
   | 24 | Bắc Ninh | VN-56 | | 80 | Tây Ninh | VN-37 |
   | 25 | Phú Thọ | VN-68 | | 82 | Đồng Tháp | VN-45 |
   | 31 | Hải Phòng | VN-HP | | 86 | Vĩnh Long | VN-49 |
   | 33 | Hưng Yên | VN-66 | | 91 | An Giang | VN-44 |
   | 37 | Ninh Bình | VN-18 | | 92 | Cần Thơ | VN-CT |
   | 38 | Thanh Hóa | VN-21 | | 96 | Cà Mau | VN-59 |
   | 40 | Nghệ An | VN-22 | | | | |
   | 42 | Hà Tĩnh | VN-23 | | | | |
2. `buildings.iso_region`: bỏ CHECK hai mã, thêm FK tới `iso_regions(iso_region)`; `upi` CHECK nới thành
   `^urn:onehub:upi:1:VN:VN-[0-9A-Z]{2}:bld_…$`; CHECK `upi = … || iso_region || …` giữ nguyên. 69 toà sẵn có (VN-HN, VN-SG)
   vẫn hợp lệ, không UPI nào đổi.
3. Không đổi dữ liệu phát biểu (0 dòng builder_name).

**Lệnh dựng (`pipeline/danh-ba-vat-the.mjs`, lõi `lib/danh-ba-vat-the.mjs`):**
- `isoCuaKhu(khu, { thiTruongCuaVung, isoCuaTinh })` thuần: thị trường của mỗi mã vùng trong `area_ids` (mã có trong
  areas: market → chính nó, submarket → `parent_id`; mã không có trong areas bỏ qua); đúng MỘT thị trường → ISO qua
  `admin_code` → `iso_regions`; không thị trường nào / nhiều thị trường / thị trường không có ISO → lỗi gọi tên. KHÔNG
  đọc `meta.city`.
- `dung()` dùng `isoCuaKhu` cho mọi khu; khu lỗi → `LoiGoi("khu <slug>: <lý do>")` trước khi ghi.
- DB chưa áp 088 (`iso_regions` vắng): CHỈ dựng lại khu đã có toà theo đường cũ (`meta.city` → VN-HN/VN-SG) để bước đêm
  trên máy thu không gãy; in «chưa áp 088 — ISO theo meta.city»; dựng lần đầu khu chưa có toà → LoiGoi «chưa áp 088 — chỉ
  dựng lại khu đã có toà» (không đúc UPI theo meta.city cho khu mới).
- Chủ đầu tư: `method = 'source_field'`, `evidence = {tu_dien, ban, tep}` (nguồn là tệp từ điển) — không ghi `hitl`.

## 3. Ngoài vòng

- Áp 088 lên máy thu — lời riêng của Mạnh (`pg_dump` trước). Cloud không có `buildings` (không sync), không áp Supabase.
- Sửa `meta.city` của ba khu Hưng Yên — không cần khi ISO không còn đọc `meta.city`; giữ nguyên.
- Dựng toà ngoài hai khu (PX2).

## Đặc tả UX

Không chạm giao diện (dòng sổ `bỏ đặc-tả-UX`).
