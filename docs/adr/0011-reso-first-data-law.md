# ADR-0011: Luật dữ liệu nền tảng — RESO-first & danh pháp "Dự án"

Ngày: 2026-10-22 · Trạng thái: accepted · Kèm theo: docs/research/reso-standards.md
(điều tra RESO), ADR-0007 (SPL — mã nguồn S0x), ADR-0010 (lớp bán dài hạn)

## Bối cảnh

Ba định hướng từ user (2026-10-22), sau điều tra RESO:

1. **Bám chuẩn, không bịa lại** — dữ liệu listing phải theo RESO Data Dictionary;
   những gì đặc trưng thị trường VN mà RESO chưa có thì **mới** được tạo mới.
2. **Làm rõ "Dự Án"** — ngôn ngữ thị trường gọi mọi tầng đều là "dự án" (cả đại
   đô thị, phân khu, một tòa) → nền tảng phải có danh pháp tách tầng, không được
   mơ hồ theo.
3. Đặt trong bối cảnh cấu trúc phân cấp đại đô thị (registry `asset_nodes` đang
   đề xuất — R1–R4) và `sale_offers` 23 cột tích luỹ qua 24 migrations tự sinh tên:
   nếu tiếp tục tự sinh danh pháp, mỗi tuần một kiểu.

Field RESO đã xác minh (dd.reso.org): `SubdivisionName` (subdivision/community),
`ComplexName` (condominium complex) — thuộc Property resource.

## Quyết định 1 — RESO-first (mặc định)

1. Mọi **field / enum / pattern dữ liệu listing mới**: tra Data Dictionary 2.0
   tại dd.reso.org **trước** (kể cả draft 2.1 nếu liên quan). Có tương đương →
   dùng **ngữ nghĩa** DD, không tự định nghĩa lại.
2. Cột DB giữ `snake_case` Postgres như hiện tại; **không** đổi tên cột theo
   PascalCase DD. Cầu nối là **`pipeline/mappings.yaml`**: field nguồn → cột DB
   → `dd_field` tương đương (tạo cùng Lô 2; mọi field mới khai ở đây).
3. Enum: ưu tiên enum DD (`PropertyType`, `StandardStatus`…). Được phép (a) chọn
   tập con, (b) thêm giá trị local — mỗi giá trị local phải khai alias gần nhất
   sang DD hoặc ghi rõ "không tương đương".
4. Identity theo pattern RESO: `source` ≈ OriginatingSystemName (qua SPL mã S0x),
   `external_id` ≈ OriginatingSystemKey, `offer_id` ≈ Key; `phone_hash` người
   bán ≈ ULI. Tên hiển thị không bao giờ là key.
5. Sync giữ pattern TimestampReplication (`last_seen`) như hiện tại.

## Quyết định 2 — Danh pháp "Dự án" (chống mơ hồ)

"**Dự án**" bị cấm dùng làm danh pháp kỹ thuật đứng một mình. Bảng ánh xạ bắt buộc:

| Thị trường gọi | Danh pháp nền tảng | `node_type` | RESO DD |
|---|---|---|---|
| "Dự án", "đại đô thị" (Ocean Park, Grand Park, Global City, PMH, Ecopark) | **Khu đô thị** — `project` | `project` | `SubdivisionName` |
| "Dự án con", phần/phase (Sapphire, Beverly, The Rainbow) | **Phân khu** — `subzone` | `subzone` | — chưa có → extension (Qđ 3) |
| "Tòa", "chung cư", "block" (S1.03, BE02) | **Tòa nhà** — `building` | `building` | `ComplexName` |
| Phường/xã | `area` (bảng `areas`) | — | Country / StateOrProvince / City |

Quy tắc kèm theo:

- Từ "dự án" gặp trong dữ liệu thô (tin đăng) **không được tự suy tầng bậc** —
  chỉ resolve qua matcher 2 tầng (project + subzone cùng lúc), vì tên phân khu
  trùng lặp giữa các khu đô thị (Sapphire/Rainbow/Beverly ở cả Ocean Park lẫn
  Grand Park).
- Key là `slug`/`node_id`; tên hiển thị và alias chỉ là metadata. Alias lưu
  NFC + lowercase (bài học NFC/NFD của parser).
- Một dự án pháp lý đầu tư VN có thể chứa nhiều cụm thương mại (Ocean Park 1/2/3):
  mỗi cụm là một `project` riêng; pháp lý chỉ là metadata note — không model
  quan hệ pháp nhân.
- **Hai trục địa lý song song, không thay nhau**: `area` (phường — hành chính,
  ruler toàn thị trường) ∥ `asset_nodes` (thị trường sản phẩm, benchmark trong
  khu đô thị). `asset_nodes.area_ids` là mảng (một khu đô thị đè nhiều phường).

## Quyết định 3 — Quy trình tạo mới (local extension)

Được tạo mới **chỉ khi** thoả cả 6 điều kiện (thiếu 1 = không merge):

1. **Bằng chứng tra cứu**: đã tra DD 2.0 (+ draft 2.1 nếu liên quan), ghi ngày
   tra + kết quả "không có tương đương" trong mappings.yaml (`dd_field: null`).
2. **Lý do đặc trưng VN**: ví dụ được chấp nhận trước — `subzone` (mô hình khu
   đô thị phát triển theo phase của Vinhomes/Masterise/PMH); giá trị enum
   taxonomy VN cho `property_type` (shophouse, liền kề — DD field có nhưng
   lookup không có).
3. **Migration** trong `db/migrations/` (giữ rule AGENTS.md #3 — không sửa tay).
4. **Enum có ràng buộc**: CHECK constraint hoặc lookup table — không text trần
   (bài học NaN của S05).
5. **Khai báo mappings.yaml**: field nguồn → cột DB → `dd_field` (hoặc null +
   `rationale` + `checked_on`).
6. **DQ check theo dõi**: đổ vào `dq_check_results` — field không có check coi
   như chưa hoàn thành.

## Quyết định 4 — Đơn vị & kiểu (thừa nhận hiện trạng làm luật)

- Giá: VND `bigint` (≈ ListPrice, đơn vị ngầm hiểu VND).
- Diện tích: `numeric` m² (≈ LivingArea, LivingAreaUnits='sqm' ngầm hiểu).
- Thời gian: `timestamptz`; text chuẩn NFC; giá trị enum chữ thường snake_case.

## Quan hệ với luật hiện có

- Không thay thế AGENTS.md (không scrape AirDNA, migration-only, PII…) và
  ADR-0007 SPL — ADR này nằm **dưới** chúng, về danh pháp và ngữ nghĩa dữ liệu.
- `pipeline/mappings.yaml` (artifact thực thi — bản khởi đầu đã tạo, khai toàn
  bộ 23 field canonical + 3 nguồn S03/S05/S06 + controlled vocabulary enum) và
  ADR này có hiệu lực ngay cho mọi field/enum mới kể từ ngày chấp nhận.
