# DV1 — mọi nút dự án trỏ mã xã/phường hiện hành (thiết kế)

Hàng `DV1` (`nut-du-an-tro-xa-moi`) của `docs/plan/lo-trinh.json`, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`.
Ô cơ hội: `_acceptance/nut-du-an-tro-xa-moi/opportunity.md` (Mạnh chốt gói 09/11). T2, dãy P3.

## 1. Vấn đề, đo trên DB máy thu 10/11

20 nút dự án (`asset_nodes.node_type = 'project'`) mang 23 mã khu vực, gieo từ migration 026 (sửa ba nút Ocean Park ở 074),
đặt trước khi có danh bạ xã PX1 (084, `nap-dvhc.mjs`). Sau PX1:

| Lớp sai | Nút | Ví dụ |
|---|---|---|
| Mã không còn trong `areas` | 15 mã ở 13 nút | `vn-hanoi-tay-ho-tay`, `vn-hcmc-phuoc-long-b` |
| Mã còn nhưng nay là xã KHÁC cùng tên | 3 nút | Estella, Global City → `vn-hcmc-an-phu` = phường An Phú của Thuận An; Central Park → `vn-hcmc-binh-thanh` = phường Bình Thạnh mới (gộp P12, P14, P26), không chứa dự án |
| Mã đúng chỗ nhưng sai phường | Grand Park | `vn-hcmc-long-truong` (gộp Long Trường + Phú Hữu) |
| Chỉ tới tỉnh | Ocean Park 2, 3 | `vn-hung-yen` |
| Đúng | Ocean Park 1 | `vn-hanoi-gia-lam` |

Hệ quả: «mã có trong `areas`» KHÔNG đủ làm thước — ba nút đang qua phép thử ấy mà sai chỗ. Thước của vòng là mã bằng đúng
mã suy từ xã cũ có nguồn qua bảng chuyển đổi chính thức.

Bên dùng mã: phường của toà (`phuongCuaToa`, DB1, chỉ nhận nút có đúng một phường), DA9 (tin kế thừa phường từ dự án), PX2
và DA7 (nút mới mang `area_ids`). 69 toà đã dựng trên máy thu; 18 phát biểu phường kế thừa (`registry_inherit`), cả 18
là `vn-hanoi-gia-lam` của Ocean Park 1.

## 2. Cách làm

**Tệp xã của nút** `pipeline/data/xa-nut-du-an.json` — một mục mỗi nút dự án:

```json
{ "nut": { "vinhomes-grand-park": {
    "cap": "xa",
    "xa_cu": [ { "old_code": "26830", "ten": "Long Bình", "huyen": "Thành phố Thủ Đức", "nguon": { "ten": "…", "url": "https://…" } },
               { "old_code": "26833", "ten": "Long Thạnh Mỹ", "huyen": "Thành phố Thủ Đức", "nguon": { … } } ],
    "chon": ["26833"], "nguon_chon": { "ten": "…", "url": "https://…" } } } }
```

- `cap: "xa"` — mã mới SUY bằng máy: hợp các `targets` của `area_aliases` (bảng chuyển đổi Cục Thống kê, PX1) theo
  `old_code`; xã cũ bị tách (`split`) thì phải có `chon` (tập con của đích) kèm `nguon_chon`. Tra theo MÃ, không theo
  tên — tránh bẫy cùng tên (Tân Phú Q7 ≠ `vn-hcmc-tan-phu`; An Khánh Thủ Đức ≠ `vn-hanoi-an-khanh`).
- `cap: "tinh"` — chỉ biết tới tỉnh: `tinh` là mã thị trường, `ly_do` bắt buộc (Hỏi-2).
- Mỗi xã cũ có nguồn có tên (`ten` + `url` http(s)). Tệp không chứa tầng A (dữ liệu công, tên dự án công khai).

**Lõi thuần** `xaMoiCuaNut(muc, { biDanh, maXa, thiTruong })` ở `pipeline/lib/danh-ba-vat-the.mjs` → `{ area_ids }` hoặc
`{ loi }`, `loi` ∈ `thieu-nguon` · `xa-cu-khong-co` · `can-chon-xa` · `chon-ngoai-dich` · `ma-khong-co` · `tinh-khong-co`.

**Lệnh** `node pipeline/danh-ba-vat-the.mjs --sua-xa [--tep <tệp>] [--thu] --db <url> [--db-that]`:
cùng rào đích `kiemDich` của DB1b (DB thử ghi không cờ; DB khác trên máy này chỉ với `--db-that`; máy chủ ngoài máy luôn
chặn). Một giao dịch, cùng khoá cố vấn `danh-ba-vat-the`:
1. Đọc tệp; đủ một-một với nút dự án trong DB (thiếu hay thừa slug → thoát 2 gọi tên).
2. Suy mọi mục; một mục lỗi → thoát 2 gọi `<slug>: <loi>`, 0 dòng ghi.
3. `UPDATE asset_nodes SET area_ids` chỉ nút đổi; in bảng `slug · cũ → mới`; chạy lại `doi=0`.
4. Với mọi toà dưới nút đổi: tính lại `phuongCuaToa` theo mã mới; rút mọi phát biểu `area_id` `registry_inherit` sống
   của toà có giá trị khác kết quả đó (`retract_reason = 'sua-xa-nut'`) — gồm ca nút từ một phường sang nhiều phường,
   khi mã cũ vẫn còn trong tập nhưng toà không còn được kế thừa phường nào. Phát biểu mới do lần dựng kế (`dung`, hay
   bước đêm) sinh.
5. `--thu` → ROLLBACK, in cùng bảng.

Không thêm vào bước đêm: tệp đổi hiếm, áp là việc tay có người nói.

**Vì sao không là migration.** Seed nằm ở migration (026, 074 từng `UPDATE asset_nodes`), nhưng: (a) vùng của hàng là
hai tệp danh bạ vật thể; (b) `db/migrations/**` là `t3_paths` — đổi hạng; (c) áp migration lên cloud là việc Supabase
riêng, còn `asset_nodes` lên cloud qua `sync-cloud` ở lượt đồng bộ kế; (d) mã suy từ `area_aliases`, bảng do bộ nạp PX1
ghi, không có trong lược đồ của migration.

## 3. Kết quả tra 20 nút (nguồn trong tệp)

15 nút chắc: OCP1 Gia Lâm · OCP2 Nghĩa Trụ · Smart City Tây Mỗ · Riverside Phúc Lợi · Ecopark Phụng Công · KĐT Văn Khê
Hà Đông · Masteri West Heights Tây Mỗ · Central Park Thạnh Mỹ Tây · Masteri Thảo Điền An Khánh · Estella Bình Trưng ·
Global City Bình Trưng · Empire City An Khánh · Grand Park Long Bình · Phú Mỹ Hưng Tân Hưng + Tân Mỹ · Golden River Sài Gòn.

Grand Park: hai xã cũ Long Bình và Long Thạnh Mỹ (Q9 cũ) — nguồn SGGP; Long Thạnh Mỹ tách cho Long Bình và Tăng Nhơn
Phú — chọn Long Bình theo bài viết sau 01/07/2025.

Năm nút không chốt được xã (Hỏi-2): OCP3 (nguồn mâu thuẫn: Như Quỳnh + Nghĩa Trụ hay chỉ Nghĩa Trụ), Celadon City (Sơn
Kỳ cũ tách ba phường, chỉ có nhãn tin rao), và ba nút gieo không ứng với dự án nào tìm được (`the-rainbow`,
`sun-grand-park-11`, `saluto`).

## 4. Ngoài vòng (ghi lại, không sửa)

- `meta.city = hanoi` của Ecopark, OCP2, OCP3 (thuộc Hưng Yên) và `legal_note` sai của Ecopark: `city` sinh mã tỉnh ISO
  trong UPI của toà (`ISO`), đổi là đổi UPI — hàng riêng (DR1 / DA19).
- Rút hay sửa tên ba nút gieo không xác định — DA19 (sửa cây danh bạ).
- Áp lên DB máy thu và cloud — bước triển khai sau gộp (Hỏi-1).

## Đặc tả UX

Không chạm giao diện — lệnh CLI và tệp dữ liệu (dòng sổ `bỏ đặc-tả-UX`).
