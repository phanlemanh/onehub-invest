<!-- Bảng phủ ca S1 của DA3, đo 25/11 trên DB máy thu (chỉ đọc). Bộ đo tạm ở probes/s1/; S3 thay bằng bộ khớp thật. -->
# DA3 bang-noi-ma-du-an — số liệu nền (chỉ đọc), đo 25/11/2026

DB máy thu `:5433`, phiên `default_transaction_read_only=on`. Không ghi DB, không sửa tệp nào trong kho.

**Chạy lại:**

```bash
cd _acceptance/bang-noi-ma-du-an/probes/s1
node do.mjs > ket-qua.json      # JSON đầy đủ; kèm $TMPDIR/da3-ban-ghi.json (mỗi bản ghi một dòng: nguồn, mã, tên, tỉnh, xã, ngả, nút)
node q.mjs "SELECT …"           # truy vấn lẻ, chỉ đọc
```

`do.mjs` import `chuanTen`, `chuanKhop` của `pipeline/lib/noi-du-an-s06-lop.mjs`, `NOI_KHU_S09`
(`pipeline/lib/s09-du-an.mjs`), `NOI_DU_AN_S16` + `duoiDuAn` (`pipeline/lib/s16-danh-muc.mjs`) của kho; `pg` mượn `app/node_modules`.

## 1. Bản ghi cấp dự án theo nguồn

| Nguồn | Bảng | Khoá dự án | Bản ghi dùng | Snapshot mới nhất (stg) | Ghi chú |
|---|---|---|---|---|---|
| S07 | `stg_s07_project_card` (thẻ danh sách) ∪ `stg_s07_project` (trang chi tiết) | `pj_id` | 6.074 (thẻ); 111 có chi tiết (1,8%) | 11/11 17:15Z, 80 snapshot thẻ + 15 chi tiết, tất cả trong ngày 11/11 | chi tiết ⊂ thẻ; `child_pj_ids` rỗng ở cả 111 |
| S08 | `stg_s08_project` | `project_id` | 185 | 21/11 23:30Z (3 snapshot: 177 → 180 → 185) | nhịp tuần đều; bản thu 22/11 |
| S09 | `stg_s09_item` kind=`du-an` = `v_s09_du_an_moi` | `project_id` (= `payload.chiTiet.data.id`) | 344 | 13/11 12:09Z, **một** snapshot | 330/344 ở Hà Nội |
| S10 | `stg_s10_project` | `project_id` | 119 | 11/11 02:21Z | chỉ có `project_label`, `du_an` (31), `phan_khu`; không vị trí |
| S16 | `stg_s16_item` kind=`du-an` có `html.project` | `html.slug` | 20 | 13/11 22:52Z | 155/175 item `du-an` khác là trang phân khu (slug là URL, `project` null). 14 dự án của `stg_s16_khu` đều nằm trong 20 này. Bản thu 18/11, 24/11 chỉ nạp `stg_s16_can_chi_tiet` |

## 2. Phủ trường (bản ghi có giá trị, sau khi bỏ rỗng giả)

| Trường | S07 (6.074) | S08 (185) | S09 (344) | S10 (119) | S16 (20) |
|---|---|---|---|---|---|
| Tên | 6.074 | 185 | 344 | 119 | 20 |
| Tỉnh từ chữ nguồn | 6.067 (1.809 tên tỉnh cũ) | 167 (3 cũ) | 344 (mã tỉnh `province_code` → `area_aliases`) | 0 | 20 (1 cũ) |
| Tỉnh từ điểm (ST_Covers market) | 111 | 180 | 342 | 0 | 20 |
| **Tỉnh cuối** (điểm trước, rồi chữ) | **6.067** | **185** | **344** | **0** | **20** |
| Điểm lệch tỉnh với chữ | 0 | 2 | 0 | — | 0 |
| Xã từ chữ | 1.696 | 60 | 46 (292 phường cũ tách nhiều đích) | 0 | 8 |
| Xã từ điểm (chỉ 4 tỉnh có hình xã: HCM, HN, HP, ĐN) | 108 | 116 | 333 | 0 | 12 |
| **Xã cuối** | **1.729** | **135** | **343** | **0** | **16** |
| Điểm lat/lon | 111 | 182 | 342 | 0 | 20 |
| Địa chỉ nguyên văn | 6.074 | 185 | 344 | 0 | 20 |
| CĐT | 3.579 | 133 (+52 «KHÁC») | 344 | 0 | 0 (nguồn là CĐT, không có trường) |
| Mã số DN (MST) | 0 | 0 | 0 | 0 | 0 |
| Loại hình | 4.968 (+1.106 «khac») | 185 | 342 | 0 | 0 |
| Mã cha | 0 (`child_pj_ids` rỗng) | 3 (suy từ hậu tố khu, không phải mã) | 0 (có phân khu con ở `v_s09_phan_khu`) | 31 (tên dự án cha `du_an`, không phải mã) | 0 (khu con ở `stg_s16_khu`) |

Cách suy tỉnh/xã: điểm → `ST_Covers(areas.geom)` đúng như `SQL_DU_AN` của DA55 (`noi-du-an-s08-luat.mjs`; `phuong-tu-du-an.mjs`
không suy từ điểm mà kế thừa vùng của nút). Chữ: đoạn cuối địa chỉ → tên `areas` market; tên tỉnh cũ → tỉnh mới qua **bảng sáp
nhập 2025 tự ghi trong `do.mjs`** (kho không có bảng tên tỉnh cũ; `area_aliases` chỉ có MÃ tỉnh cũ → mới — S09 dùng mã nên đi
đường dữ liệu kho). Xã chữ: tên phường mới trong tỉnh (S07, S08, S16); S09 phường cũ + quận cũ → `area_aliases.targets` (chỉ khi một đích).
MST: quét toàn văn payload S07/S08/S09 — các «trúng» đều là chữ ngẫu nhiên (Amsterdam, link Drive), không nguồn nào có MST.

## 3. Rỗng giả

Tập so (sau `chuanTen`): "", «Đang cập nhật», «Chưa cập nhật», «--», «-», «0», «N/A», «Liên hệ», «Khác», «null», «Updating», «Không có», «Chưa có», «Other».

| Nguồn | Trường | Giá trị rỗng giả × số |
|---|---|---|
| S07 | loại hình | «khac» × 1.106 |
| S08 | CĐT | «KHÁC» × 52 |
| còn lại | tên, địa chỉ, CĐT, loại hình | 0 |

Top CĐT — S07: Tập đoàn Vingroup 132, Cty TNHH PT Phú Mỹ Hưng 100, Tập đoàn Sun Group 68, Novaland Group 51, Cty CP TĐ Hưng Thịnh 46,
HUD 43, Nam Long 37, Masterise Homes 32. S08 (chữ hoa, tên thương hiệu): KHÁC 52, VINHOMES 26, SUN GROUP 21, MASTERISE HOMES 18,
SUNSHINE GROUP 9, MIK 9. S09: Masterise Homes 6, Tập đoàn Sun Group 4, Sunshine Group 3, … Cùng một CĐT viết nhiều kiểu
(«Tập đoàn Vingroup» / «Công ty Cổ phần Vinhomes» / «VINHOMES»; «Masterise Homes» / «Masterise Group»).
Tên lặp trong cùng nguồn (sau `chuanKhop`): không có ở S07, S08, S09, S16; S10 có «a a» × 2. S10 nhiều tên là mã viết tắt (MGS, NPG, SCB).
S16 có tên dư khoảng trắng cuối («Vinhomes Sài Gòn Park »).

## 4. Phía nút (344 project: 20 xac_minh, 324 mot_loi_khai `meta.nguon='S06'`)

| | Số | Nguồn |
|---|---|---|
| Có tỉnh | 344 | `area_ids[1]` (market, hoặc `parent_id` của submarket) |
| Có xã | 339 | `area_ids[1]` là submarket (324 mot_loi_khai + 15 xac_minh); 5 xac_minh chỉ có tỉnh; 1 nút 2 vùng (Phú Mỹ Hưng) |
| Có điểm | **0** | không nút nào có toạ độ (`meta` chỉ có `nguon`, `rule_id`, `city`, `legal_note`) |
| Có bí danh | 344 | `aliases` |
| Có MST | 0 | — |
| Theo tỉnh | HCM 310 · ĐN 20 · HN 11 · Hưng Yên 3 | không nút nào ngoài 4 tỉnh |

`meta.city` lệch tỉnh vùng ở 3 nút xac_minh: Ecopark, VOP2, VOP3 (`meta.city=hanoi`, vùng ở Hưng Yên; `legal_note` của Ecopark ghi
«Hưng Yên (cũ) — sáp nhập Hà Nội 2025»). Bộ đo dùng `area_ids`, như DA32/DA55.

## 5. Hiện trạng nối

| Nguồn | Cơ chế | Số |
|---|---|---|
| S06 | `project_links` + thẻ luật `project_link_rules#1` (S06-ma-nguon, 349 mã) | 341 nối (334 nút khác nhau), 8 chua_noi (6 khong-ten, 2 khong-xa); 341 bí danh `ma_nguon` |
| S08 | bảng tay `s08_project_links` (DN1) | 8 noi, 0 chua_noi; chưa có dòng `project_links` S08 (DA55 chưa áp — mã DA55 ở worktree `gop-nut-trung-ma-can-s16`) |
| S09 | chép cứng `NOI_KHU_S09` | 2 dự án (OCP1, Grand Park); không `project_links`, không bí danh `ma_nguon` trên nút |
| S10 | `s10_project_links` | 0 dòng |
| S16 | chép cứng `NOI_DU_AN_S16` | 5 dự án; `project_link_rules#2` (S16-danh-sach-khu, 61) và `#3` (S16-noi-nut-san, 7) — theo tên căn cứ là cấp khu/toà, đích chưa xác minh |
| S07 | — | 0 |

Ô «Mã nguồn chưa nối» (`/ops/registry`, `SQL_DANH_MUC` ở `app/src/lib/ops/registry/doc.ts`, cộng ở `registry-view.tsx`):
tổng **529** = S06 **8/349** (mẫu số: dòng `project_links` S06) + S08 **177/185** (mẫu số: `DISTINCT project_id` của `stg_s08_project`,
tử số đã nối: `s08_project_links.status='noi'`) + S09 **344/344** (mẫu số `v_s09_du_an_moi`, đã nối **gán cứng 0** dù `NOI_KHU_S09` có 2).
**S07, S10, S16 không được đếm.**

## 6. Chạy bóng (mỗi bản ghi đúng một ngả: không tỉnh → K1 → K2 → K3 → T → K4 → không khớp; «nhiều nút» khi căn cứ đầu tiên trúng ≥ 2 nút)

Tên khớp = `chuanKhop` (giữ dấu, như DA32/DA55) so với tên + bí danh nút; S08 bỏ «_TT»/«TMDV» như `tenGoc` của DA55. K4: tỉ lệ từ
chung / max(số từ hai bên) ≥ 0,5.

| Nguồn | Không tỉnh | K1 | K2 | K3 | T | K4 | Nhiều nút | Không khớp | Tổng |
|---|---|---|---|---|---|---|---|---|---|
| S07 | 7 | 0 | 0 | 48 | 209 | 0 | 1 | 5.809 | 6.074 |
| S08 | 0 | 0 | 0 | 9 | 3 | 0 | 0 | 173 | 185 |
| S09 | 0 | 0 | 0 | 6 | 1 | 0 | 0 | 337 | 344 |
| S10 | 119 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 119 |
| S16 | 0 | 0 | 0 | 4 | 1 | 0 | 0 | 15 | 20 |

Ngả trống vì thiếu dữ liệu, không phải vì không có cặp:
- **K1 trống ở mọi nguồn**: không nguồn nào và không nút nào có MST.
- **K2, K4 trống ở mọi nguồn**: nút không có điểm (0/344). Nguồn có điểm: S07 111, S08 182, S09 342, S16 20.
- **S10 toàn «không tỉnh»**: S10 không có địa chỉ, điểm hay tỉnh.
- Ngả nhỏ phần lớn vì nút chỉ ở 4 tỉnh (HCM 310): S09 có 330/344 ở Hà Nội, nơi chỉ có 11 nút.

Bóng phụ (cỡ đống «ca không rõ» nếu nút có điểm): trong ngả «không khớp», bản ghi có tên trùng một phần ≥ 50% với nút cùng tỉnh:
S07 1.122 (cùng xã 59) · S08 18 (6) · S09 34 (5) · S16 2 (0). Mẫu cho thấy phần lớn là nhiễu do từ chung
(«Khu đô thị …» ↔ «Khu đô thị mới Xa La»; «… City» ↔ «Vinhomes Smart City») — con số là trần trên, không phải ước lượng.
Độ nhạy: so bằng `chuanTen` (bỏ dấu) thêm S07 4, S08 1, S09 1 cặp.

Đối chiếu bóng với nối đang có (15 cặp): khớp 9. S09 2/2 và S16 5/5 trùng nút. S08 2/8: 6 nối tay bóng không ra (4 dự án con có hậu tố
«(OCP1)», «_SHOP», «TMDV_TT …», 1 «Lumière Boulevard» nối tay vào Grand Park), và **«Masteri Centre Point»**: nối tay vào Vinhomes Grand
Park, bóng K3 ra nút mot_loi_khai riêng «Masteri Centre Point» do S06 đúc (S09 cũng ra K3 vào nút ấy).

### Mẫu (tên nguồn ↔ tên nút · tỉnh · xã; khoảng cách: nút không có điểm nên không tính được)

- S07 K3: Phú Thạnh Apartment ↔ Phú Thạnh Apartment · HCM · phu-thanh; Sunrise City ↔ Sunrise City · HCM · tan-hung; Tòa Nhà Horizon ↔ cùng tên · HCM · tan-dinh;
  Hoàng Kim Thế Gia (The Golden Dynasty) ↔ cùng tên · HCM · binh-tri-dong; Happy City - Khu đô thị Hạnh Phúc ↔ cùng tên · HCM · binh-hung.
- S07 T: KĐT Trung Hòa - Nhân Chính ↔ KĐT Trung Hòa Nhân Chính · HN; KĐT mới Xa La ↔ cùng tên · HN; Saigon Pearl ↔ cùng tên · HCM;
  The Manor - TP. Hồ Chí Minh ↔ The Manor - TP.Hồ Chí Minh · HCM; Chung cư Phú Mỹ ↔ cùng tên · HCM · phu-my.
- S07 nhiều nút (tại T): Happy One Central ↔ «Happy One -  Central» / «Happy One Central» · HCM (hai nút S06 trùng tên).
- S07 không tỉnh (7): địa chỉ kết thúc «Việt Nam», «Vietnam», «Tỉnh Bình Dươn», «TP Vinh cũ)», địa chỉ gạch ngang không dấu phẩy.
- S08 K3: TMDV SMART CITY ↔ Vinhomes Smart City · HN · tay-mo; CAPITAL SQUARE ↔ Capital Square · ĐN · an-hai; THE GLOBAL CITY ↔ cùng tên · HCM ·
  binh-trung; FOURS TOWER ↔ FourS Tower · ĐN · ngu-hanh-son; MIZUKI PARK ↔ Mizuki Park · HCM · binh-hung.
- S08 T: TMDV VINHOMES OCEAN PARK 1 ↔ VOP1 · HN; VINHOMES OCEAN PARK 3 ↔ VOP3 · Hưng Yên; VINHOMES OCEAN PARK 2 ↔ VOP2 · Hưng Yên.
- S09 K3: Masteri West Heights ↔ cùng tên · HN · tay-mo; Masteri Centre Point ↔ cùng tên · HCM · long-binh; Vinhomes Smart City ↔ cùng tên ·
  HN · tay-mo; The Global City ↔ cùng tên · HCM · binh-trung; Vinhomes Ocean Park ↔ Vinhomes Ocean Park 1 · HN · gia-lam.
- S09 T: Vinhomes Grand Park ↔ cùng tên · HCM.
- S16 K3: Vinhomes Ocean Park ↔ VOP1 · HN · gia-lam; Vinhomes Smart City ↔ cùng tên · HN · tay-mo; VOP2 ↔ VOP2 · Hưng Yên · nghia-tru;
  Vinhomes Grand Park ↔ cùng tên · HCM · long-binh. S16 T: VOP3 ↔ VOP3 · Hưng Yên.
- Không khớp (mẫu): S07 Khu đô thị Nam Thăng Long - Ciputra · HN; S08 MASTERI LAKESIDE (OCP1) · HN; S09 Lumi Hà Nội · HN; S16 Vinhomes Hải Vân Bay · ĐN.

## 7. Nối vào nút đúc từ nguồn khác; trùng giữa nguồn

Nút trúng (K3 + T, kể cả nhiều nút) theo bậc: S07 → mot_loi_khai 245 (+2 nhiều nút), xac_minh 12 · S08 → mot_loi_khai 4, xac_minh 8 ·
S09 → mot_loi_khai 2, xac_minh 5 · S16 → xac_minh 5. Tổng **251 cặp vào nút S06 mot_loi_khai**, 30 vào xac_minh. 257 nút khác nhau được chạm.

Trùng giữa nguồn (cùng `chuanKhop` tên + cùng tỉnh, ≥ 2 nguồn): **307 nhóm / 641 bản ghi**; trong đó **295 nhóm / 609 bản ghi chưa có nút**.
Theo cặp nguồn: S07+S09 187 · S07+S08 93 · S07+S08+S16 10 · S07+S08+S09 4 · S07+S08+S09+S16 3 · S07+S16 3 · S08+S09 3 · S08+S16 2 · S07+S09+S16 1 · S09+S16 1.
Mẫu chưa có nút (đều S07+S09, Hà Nội): Hong Kong Tower, Keangnam Hanoi Landmark Tower, Golden Millennium, SME Hoàng Gia, Trung Yên Plaza.
Phụ: cặp giữa hai nguồn khác nhau có điểm ≤ 300 m + tên trùng (căn cứ K2 giữa nguồn với nhau): 17.

## Bất thường

1. Nguồn đứng: S07 và S10 dừng ở 11/11 (14 ngày; SLO S10 ≤ 8 ngày); S09 chỉ một snapshot 13/11; dự án S16 13/11 (bản 18/11, 24/11 chỉ có chi tiết căn).
2. S07 chỉ 111/6.074 dự án có trang chi tiết (điểm, `child_pj_ids`); `child_pj_ids` rỗng ở cả 111 → K5 của S07 chưa có dữ liệu.
3. Địa chỉ S07 lẫn hai đời ĐVHC: 1.809 bản ghi tên tỉnh cũ (Bình Dương, Long An…), nhiều địa chỉ HCM viết «quận 2/7» kiểu cũ → xã từ chữ chỉ 28%.
4. Nút chỉ ở 4 tỉnh, 310/344 ở HCM, không nút nào có điểm → K2/K4 không chạy được ở bất kỳ nguồn nào khi chưa cấp điểm cho nút.
5. Ô màn bỏ S07, S10, S16 và gán cứng S09 đã nối = 0 dù 2 dự án S09 nối qua `NOI_KHU_S09`.
6. Nút S06 trùng tên nhau («Happy One -  Central» / «Happy One Central»); nút S06 «Masteri Centre Point» chồng với nối tay S08 vào Grand Park.
7. `meta.city` của Ecopark, VOP2, VOP3 lệch tỉnh vùng.
8. S08 2 dự án điểm lệch tỉnh với địa chỉ chữ; 3 dự án không có điểm (vẫn có tỉnh từ chữ).
9. CĐT không chuẩn hoá giữa nguồn (S08 chữ hoa thương hiệu, S07/S09 tên pháp nhân) → nếu sau này có MST, K1 vẫn cần bảng CĐT riêng.

## 8. Đo lại 27/11 21:34Z — sau khi DA42, DA55 áp (phạm vi đổi, sổ d-20261127T213940Z-36)

Chỉ đọc trên DB máy thu (phiên `default_transaction_read_only`). Nguồn số:

- bộ đo đóng băng: `cd pipeline && node ../_acceptance/bang-noi-ma-du-an/probes/s1/do.mjs`;
- thẻ chỉ đọc của mã DA3: `node noi-du-an-nguon.mjs --nguon <S0x> --the <tệp>`;
- ô trên màn: `docDanhBa` của app, chạy trên main và trên nhánh 6915541e5.

JSON đầy đủ của bộ đo nằm ở ghi chú chung của đợt, tệp `da3-s1-do-lai-2711.json`.

**Phía nút.** 660 nút dự án:

| Hạng | Nguồn đúc | Số | Có điểm |
|---|---|---|---|
| xac_minh | — | 20 | 0 |
| mot_loi_khai | S06 | 324 | 0 |
| mot_loi_khai | S08 (DA55, 27/11) | 146 | 146 |
| mot_loi_khai | S09 (DA42, 27/11) | 170 | 0 |

**Hiện trạng nối mới.**
- S09: `project_links` có 172 dòng `noi` (170 nút ứng viên, 2 nối tay) và 49 dòng `chua_noi` (cho-the-cap 36, cho-the-luat 13).
  Cả 221 dòng thuộc tập `v_s09_db_du_an` của DA42.
- S08: luật 5 nối 177 mã. `project_links` S08 có 159 dòng `noi`: 150 vào nút ứng viên, 9 vào nút tên chuẩn cùng tỉnh.

**Chạy bóng (bộ đo đóng băng).**

| Nguồn | Không tỉnh | K1 | K2 | K3 | T | K4 | Nhiều nút | Không khớp |
|---|---|---|---|---|---|---|---|---|
| S07 | 7 | 0 | 11 | 62 | 274 | 2 | 1 | 5.717 |
| S08 | 0 | 0 | 150 | 9 | 4 | 0 | 0 | 22 |
| S09 | 0 | 0 | 1 | 6 | 1 | 1 | 0 | 335 |
| S10 | 119 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| S16 | 0 | 0 | 1 | 6 | 2 | 0 | 0 | 11 |

**Thẻ chỉ đọc của mã DA3.** K4 không có mã nên rơi vào «không khớp»; dòng `giu` là nối có sẵn.
- S07: K2 11, K3 62, T 274, nhiều nút 1, không tỉnh 7, không khớp 5.719.
- S16: giữ 5, K2 1, K3 2, T 1, không khớp 11.
- S09: giữ 99, K3 5, K2 1, không khớp 239. S09 rút khỏi đường ghi; số này chỉ để đối chiếu.

**Nút đích của các ngả nối DA3 sẽ ghi** (hạng × nguồn đúc):

| Nguồn | Căn cứ | Xác minh | Ứng viên S06 | Ứng viên S08 | Ứng viên S09 |
|---|---|---|---|---|---|
| S07 | K2 | 0 | 0 | 11 | 0 |
| S07 | K3 | 1 | 47 | 14 | 0 |
| S07 | T | 11 | 198 | 65 | 0 |
| S16 | K2 | 0 | 0 | 1 | 0 |
| S16 | K3 | 0 | 0 | 2 | 0 |
| S16 | T | 0 | 0 | 1 | 0 |

**Hai tập mã S09.**
- DA42: `v_s09_db_du_an`, 221 dự án.
- DA3: `v_s09_du_an_moi`, 344 dự án.
- Hai tập chung 112 mã. Trong 172 dòng `noi` của DA42, 99 dòng có mã nằm trong tập 344; 73 dòng nằm ngoài.

**Ô «Mã nguồn chưa nối»** (`docDanhBa`, chỉ đọc).
- main: 370 (S06 8, S08 18, S09 344).
- Nhánh trước áp: 6.484 (thêm S07 6.074, S16 20; S09 tập 344 trừ dòng nối khớp mã, còn 245; S10 119 riêng).
- Theo AC-8 bản 27/11 (S09 đọc tập DA42):
  - đổi phạm vi: 6.169 (S09 49);
  - sau nối: 5.813 (S07 5.727, S16 11).
