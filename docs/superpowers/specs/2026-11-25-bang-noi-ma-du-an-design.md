# DA3 bang-noi-ma-du-an — khuôn chung bản ghi nguồn cấp dự án và bộ khớp chạy bóng (thiết kế 25/11)

> **Bản 27/11.** Phạm vi đổi sau khi DA42, DA55 áp lên DB máy thu: S09 rút khỏi đường ghi (chỉ đọc), K2 nay bắn. Số và phạm vi
> hiện hành ở `_acceptance/bang-noi-ma-du-an/contract.md` và `evidence/bang-phu-s1.md` §8. Số 25/11 dưới đây giữ làm sử liệu.

Thay bản 13/11 (`2026-11-13-bang-noi-ma-du-an-design.md`, nháp chưa qua Cổng Phạm vi). Chỉ dùng mã nguồn `S0x`.

## 0. Một trang

**Hướng (GS phán 25/11, đúng lời Mạnh 19/11 «duyệt theo loại căn cứ»).** DA3 là bước 1 cấp dự án của lớp hợp nhất nguồn danh
bạ (bản đề xuất P2 19/11). Hàng này làm ba việc:

- Mỗi nguồn danh mục S07, S08, S09, S10, S16 có một bộ chuyển `stg_*` → bản ghi chuẩn cấp dự án, theo khuôn chung
  (`mo-hinh-danh-ba-du-an.md` §1.1).
- Bộ khớp chạy bóng xếp mỗi bản ghi vào đúng một ngả căn cứ.
- Ngả căn cứ rõ nối vào **nút có sẵn**, qua thẻ luật có băm theo khuôn DA32, DA55: người xem mẫu, áp đúng băm, đảo được.

**Không làm.** Các phần sau tách sang hàng khác (GS ghi sổ):

| Phần | Hàng |
|---|---|
| Đúc nút mới | DA62 `duc-nut-ung-vien-lien-nguon` |
| Thẻ từng cặp trên `/ops/review` | DA60 `the-noi-du-an-tung-cap` |
| Gộp `s08_project_links`, `s10_project_links` thành view | DA61 `project-links-mot-bang` |
| kind `ma_nha_nuoc` | ngoài phạm vi: nguồn nhà nước chưa có dữ liệu nạp |

**Không migration.** `project_links` (100) đã có cột `can_cu`, `ly_do`, `rule_id`. `registry_aliases` đã nhận `node:<id>` và nguồn
S01–S19 (100, 103). Hàng vẫn là T3 vì ghi dữ liệu nối trên DB máy thu.

**Đích trên màn** — ô «Mã nguồn chưa nối» ở `/ops/registry`. Có hai hiệu ứng tách nhau:

1. **Đổi phạm vi đếm.** Hôm nay ô ghi 529 và chỉ đếm S06 (8), S08 (177), S09 (344, phần đã nối gán cứng 0). Sau DA3, ô đếm
   thêm S07 (6.074) và S16 (20). S09 đọc phần đã nối từ bảng. S10 hiện một dòng riêng: «không có vị trí 119/119». Con số trong ô
   **tăng** vì mẫu số đổi, không phải vì có gì hỏng.
2. **Nối thêm.** Số đo chạy bóng 25/11:
   - S07: 6.074 → 5.817 (nối 257 = K3 48 + T 209).
   - S09: −7, trong đó 2 đã nối từ trước bằng chép cứng.
   - S16: −5, cả 5 đã nối từ trước bằng chép cứng.
   - S08: không đổi. DA55 sở hữu thẻ luật S08; ở đây S08 chỉ chạy bóng để đối chiếu, bóng ra 12.

Phần «không khớp» (S07 5.809, S08 173, S09 337, S16 15) là việc của DA62, không phải lỗi của DA3.

## 1. Hiện trạng đo trên DB máy thu (25/11, chỉ đọc)

Số đầy đủ và lệnh chạy lại ở `evidence/bang-phu-s1.md`.

**Cơ chế nối hiện có theo nguồn:**
- S06: `project_links` cộng thẻ luật #1, 341 nối, 8 chưa nối.
- S08: bảng tay `s08_project_links`, 8 nối. DA55 sẽ thêm thẻ luật S08.
- S09: chép cứng `NOI_KHU_S09`, 2 dự án.
- S16: chép cứng `NOI_DU_AN_S16`, 5 dự án.
- S10: `s10_project_links`, 0 dòng.
- S07: chưa có.

**Nút:** 344 nút `project`, gồm 20 `xac_minh` và 324 `mot_loi_khai` do S06 đúc. Nút có ở 4 tỉnh: HCM 310, Đà Nẵng 20, Hà Nội 11,
Hưng Yên 3. Nút nào cũng có tỉnh, 339 có xã, **0 có điểm**, 0 có MST.

**Nguồn đứng** (ghi cho thẻ):
- S07, S10 thu lần cuối 11/11.
- S09 có một snapshot 13/11.
- Phần dự án của S16 thu lần cuối 13/11.

## 2. Bảng phủ ca (đếm từ DB máy thu, không fixture viết tay)

### 2.1 Bản ghi theo nguồn × trường

| Trường | S07 | S08 | S09 | S10 | S16 |
|---|---|---|---|---|---|
| Bản ghi cấp dự án | 6.074 | 185 | 344 | 119 | 20 |
| Tỉnh (điểm trước, rồi chữ) | 6.067 | 185 | 344 | 0 | 20 |
| Xã | 1.729 | 135 | 343 | 0 | 16 |
| Điểm | 111 | 182 | 342 | 0 | 20 |
| CĐT / MST | 3.579 / 0 | 133 / 0 | 344 / 0 | 0 / 0 | 0 / 0 |
| Loại hình | 4.968 | 185 | 342 | 0 | 0 |
| Rỗng giả | loại hình «khac» 1.106 | CĐT «KHÁC» 52 | 0 | 0 | 0 |

Nơi đọc bản ghi của từng nguồn:

| Nguồn | Bảng / view |
|---|---|
| S07 | `stg_s07_project_card` ∪ `stg_s07_project` (111 có chi tiết) |
| S08 | `stg_s08_project` |
| S09 | `v_s09_du_an_moi` |
| S10 | `stg_s10_project` |
| S16 | `stg_s16_item` kind `du-an` có `html.project` |

### 2.2 Bản ghi theo nguồn × ngả (chạy bóng, mỗi bản ghi đúng một ngả)

| Nguồn | Không tỉnh | K1 | K2 | K3 | T | Nhiều nút | Không khớp |
|---|---|---|---|---|---|---|---|
| S07 | 7 | 0 | 0 | 48 | 209 | 1 | 5.809 |
| S08 | 0 | 0 | 0 | 9 | 3 | 0 | 173 |
| S09 | 0 | 0 | 0 | 6 | 1 | 0 | 337 |
| S10 | 119 | 0 | 0 | 0 | 0 | 0 | 0 |
| S16 | 0 | 0 | 0 | 4 | 1 | 0 | 15 |

**Ô trống vì thiếu dữ liệu, không vì thiếu cặp:**
- K1 cần MST ở cả hai phía, mà không bên nào có.
- K2, K4 cần điểm của nút, mà 0/344 nút có. K4 nằm ngoài phạm vi (GS điều kiện c).
- S10 toàn «không tỉnh».

**Nút trúng:** 251 cặp trúng nút `mot_loi_khai` do S06 đúc, 30 cặp trúng nút `xac_minh`.

**Đối chiếu bóng với nối có sẵn: khớp 9/15.**
- S09 khớp 2/2, S16 khớp 5/5.
- S08 khớp 2/8. Sáu ca lệch là nối tay gắn dự án con vào cha (hậu tố «(OCP1)», «_SHOP», «TMDV_TT», «Lumière Boulevard» vào Grand
  Park) và «Masteri Centre Point». Đây là quy ước dự án con có cha (ROADMAP §3 mục 39), không phải lỗi bóng.

### 2.3 Ai đọc đầu ra này phía sau

| Đầu ra | Bên đọc | Ảnh hưởng của DA3 |
|---|---|---|
| `project_links` dòng S07, S09, S10, S16 | màn `/ops/registry`: ô «Mã nguồn chưa nối» (`doc.ts`), danh sách mã của nút (`du-an.ts`) | ô đổi như §0; danh sách mã của nút thêm mã S07, S09, S16 |
| như trên | DA60 (đọc `chua_noi` lý do `nhieu-nut`), DA61 (view gộp), DA62 (đọc `chua_noi` lý do `khong-khop`) | hàng sau, đọc khuôn lý do của DA3 |
| như trên | PL20 `offer_building`, `v_toa_nut_vung`, `s06_offer_project` | không đọc `project_links`; đo băm trước/sau bằng nhau (AC-7) |
| `registry_aliases` `node:<id>` kind `ma_nguon` giá trị `du_an/<mã>` nguồn S07, S09, S16 | `s09-dung.mjs` và `s16-dung.mjs` (đọc mọi `ma_nguon` của nguồn), `danh-ba-vat-the.mjs`, view 111 | khuôn `du_an/` không trùng giá trị toà, trục, căn (`<pid>/<id>`, `<khu>/<mã>`); đầu ra không đổi (AC-7) |
| `project_link_rules` dòng mới | màn registry (nhật ký luật), lệnh đảo | một dòng cho mỗi nguồn × loại căn cứ |

Không lên cloud: `project_links` và `registry_aliases` không nằm trong FILL của `sync-cloud.mjs` (100). Tầng A không đổi.

## 3. Thiết kế

### 3.1 Khuôn chung và bộ chuyển — `pipeline/lib/ban-ghi-nguon.mjs`

Bản ghi chuẩn cấp dự án có các trường:
- `nguon`, `cap` (luôn `du_an`), `ma`, `ma_cha`;
- `ten_goc`, `ten_chuan` (dùng `chuanKhop` của DA32);
- `dia_chi`, `tinh`, `tinh_tu` (`diem` | `chu` | null), `xa`;
- `diem` {lat, lon};
- `cdt`, `mst`, `loai_hinh`;
- `ly_do_trong` (vì sao tỉnh trống).

Nguồn thiếu trường thì để null; không bịa.

- **Tỉnh và xã.** Lấy từ điểm trước, bằng `ST_Covers(areas.geom)` như `SQL_DU_AN` của DA55; không có điểm thì lấy từ chữ. Tên tỉnh
  cũ trong chữ (1.809 bản ghi S07) đổi ra mã tỉnh cũ qua bảng 63 tỉnh trước sáp nhập (mã thống kê công khai, một tệp trong
  `pipeline/lib`, có test đủ 63 dòng). Mã cũ ra tỉnh mới qua `area_aliases` (`old_province_code` → `province_code`). `area_aliases`
  chỉ có mã, không có tên tỉnh, nên phải có bảng tên; không có bảng tỉnh cũ nào khác trong kho.
- **Quy ước rỗng giả** ở một chỗ (`RONG_GIA`), là Hỏi-2 trình Mạnh. Khuyến nghị:
  - về null: ba giá trị ROADMAP mục 45 («Đang cập nhật», «--», «0»), cộng "", «-», «N/A»;
  - giữ nguyên: «Khác» (S07 loại hình «khac» 1.106, S08 CĐT «KHÁC» 52 là giá trị thật «loại khác»), «Liên hệ», tên thương hiệu
    như «Vinhomes», số thật như «0 m2».

  Trên dữ liệu 25/11, bộ sáu giá trị đổi 0 bản ghi.
- **Bộ chuyển.** Mỗi nguồn một hàm thuần nhận dòng SQL và trả bản ghi chuẩn, cộng một câu SQL đọc chỉ-đọc.
  - S10 trả tỉnh null, `ly_do_trong = 'khong-vi-tri'`.
  - S08 bỏ «_TT», «TMDV» đầu tên như `tenGoc` của DA55; viết lại cùng luật, không import nhánh chưa gộp.

### 3.2 Bộ khớp — `pipeline/lib/khop-du-an.mjs`

Hàm thuần `xepNga(banGhi, nut, daNoi)`. Thứ tự xếp, dừng ở ngả đầu tiên trúng:

1. **Đã nối** — có trong bảng nối hoặc chép cứng của nguồn → `giu`. Nối có sẵn luôn thắng. Bóng ra nút khác thì ghi `khac_noi_san`
   để báo, không ghi đè.
2. **Tên rỗng giả** → `chua_noi:khong-ten`.
3. **Không tỉnh** → `chua_noi:khong-tinh`. S10 ra `khong-vi-tri`.
4. **K1** — MST trùng + tên chuẩn trùng. Có ô trong hàm; hôm nay không bắn vì thiếu dữ liệu.
5. **K2** — điểm ≤ 300 m + tên chuẩn trùng. Có ô trong hàm; hôm nay không bắn.
6. **K3** — cùng xã + tên chuẩn trùng tên hoặc bí danh của nút.
7. **T** — tên chuẩn trùng hẳn đúng một nút cùng tỉnh (luật DA55).
8. Căn cứ trúng ≥ 2 nút → `chua_noi:nhieu-nut`, không nối.
9. Còn lại → `chua_noi:khong-khop`.

**Không bao giờ:** nút khác tỉnh là ứng viên; nối chỉ theo điểm; nối khi ≥ 2 nút.

### 3.3 Lệnh — `pipeline/noi-du-an-nguon.mjs`

Khuôn DA32. Ba chế độ:
- `--nguon <S07|S10|S16> --the <tệp>`: dựng thẻ chỉ đọc (S08 dựng thẻ bóng đối chiếu; S09 bị từ chối, bản 27/11). Thẻ có tổng theo ngả, tối đa 20 mẫu mỗi ô căn cứ × hạng và nguồn đúc của nút đích, danh sách
  `khac_noi_san`, dòng cuối «băm: <hex>». Thẻ không in mã dự án nguồn.
- `--ap --bam <hex> --nguoi <tên>`: băm lệch thì không ghi gì. Băm đúng thì ghi trong một giao dịch:
  - mỗi loại căn cứ nối một dòng `project_link_rules` (`<nguồn>-K2`, `<nguồn>-K3`, `<nguồn>-T`), cộng một dòng cho nối có sẵn
    (`<nguồn>-noi-san`) và một dòng cho trạng thái chưa nối (`<nguồn>-trang-thai`);
  - mỗi bản ghi một dòng `project_links` mang `rule_id` của lượt: `noi` kèm `can_cu`, hoặc `chua_noi` kèm `ly_do`;
  - mỗi dòng nối một bí danh `node:<id>` kind `ma_nguon` giá trị `du_an/<mã>`.

  `asset_nodes` không đổi. Mọi dòng mang `rule_id`, nên đảo đủ mọi luật của nguồn là cách lùi trọn, không xoá dòng nào.
- `--dao <rule_id> --nguoi <tên>`: bí danh của luật nghỉ, dòng về `chua_noi` lý do `dao-luat`, dòng luật ghi người và giờ đảo.

S08 bị từ chối kèm lời nhắn «S08 do thẻ luật DA55 nối». S09 bị từ chối ở mọi chế độ ghi, kể cả `--ap --bam` với băm của một thẻ S09, kèm lời nhắn «S09 do DA42 nối» (bản 27/11: DA42 sở hữu đường nối S09).

### 3.4 Màn — `app/src/lib/ops/registry/doc.ts`, `app/src/components/ops/registry/registry-view.tsx`

Nhánh chồng lên DA55, riêng hai tệp này. Ô được cộng ở `registry-view.tsx`, nên đo cả con số dựng ra (AC-8). `SQL_DANH_MUC` thêm nhánh S07, S16 đếm từ bản ghi đã nạp và `project_links`. S09 chỉ đọc
`project_links` S09 của DA42 (tập dự án theo Hỏi-3 bản 27/11), thay hằng 0. S10 hiện dòng riêng lý do «không có vị trí». Mỗi dự án đếm một lần. Danh sách «chưa nối»
mang lý do của `project_links`.

## 4. Áp lên DB máy thu (hồ sơ năm thứ, viết ở S3, ký ở Cổng Bằng chứng)

1. **Lệnh áp:** `noi-du-an-nguon.mjs --ap` cho S07, S10, S16 theo băm in trên thẻ đã ký (S09 không áp, bản 27/11).
2. **Số chạy thử:** trên bản chép.
3. **Sao lưu:** `pg_dump` bốn bảng `project_links`, `project_link_rules`, `registry_aliases`, `asset_nodes` trước khi áp.
4. **Cách lùi:** `--dao` đủ mọi `rule_id` của nguồn (K2, K3, T, noi-san, trang-thai), đúng danh sách lệnh `--ap` in ra. Không xoá dòng nào. Chạy thử trên bản chép
   (AC-5).
5. **Lệnh kiểm sau:** bất biến của AC-4 và AC-7.

Thứ tự gộp: sau DA55 (tệp `doc.ts`).

## 5. Rủi ro

- **T là căn cứ tên trong tỉnh.** Ở HCM có 310 nút, nên trùng tên chung chung (ví dụ «Chung cư Phú Mỹ») có thể nối nhầm. Người xem
  20 mẫu trên thẻ trước khi áp; eval judgment E10 đọc mẫu.
- **Nút trùng tên** («Happy One - Central» / «Happy One Central») ra `nhieu-nut`, không nối. Gộp nút là việc khác (mô hình §1.2:
  không tự gộp theo tên).
- **«Masteri Centre Point».** S09 K3 ra nút S06 riêng, còn S08 nối tay vào Grand Park. DA3 không ghi S08, nên không đụng nối tay;
  ghi vào danh sách cần xem.
