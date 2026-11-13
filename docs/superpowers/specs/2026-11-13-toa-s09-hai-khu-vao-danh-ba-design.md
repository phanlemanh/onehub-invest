# DA31 — Phân khu và toà S09 của hai khu vào danh bạ (thiết kế)

> Hàng DA31 `toa-s09-hai-khu-vao-danh-ba` của «Lộ trình onehub-invest» (đợt no-cat-hang-1311), dãy U1. Chặn PL35 và PL20.
> Nguồn chỉ gọi bằng mã S0x; tài liệu này không chứa tên nguồn hay tên miền thật. Mọi lời gọi tới nguồn S09 đang đóng
> băng: hàng chỉ đọc bản thu đã có.

## 1. Vấn đề

Danh bạ vật thể (DB1, migration 082) của Ocean Park 1 (OP1) và Grand Park (GP) chỉ dựng từ mã căn S08: OP1 18 tên toà,
GP 46 tên (51 toà, gồm hai phân khu Lumiere). Bài S03 nêu nhiều toà danh bạ không có, nên PL20 gắn được ít và PL35 chọn
mẫu lệch. S09 có danh sách toà đầy đủ của hai khu, kèm phân khu và ngày bàn giao.

## 2. Đầu vào

- **Nguồn — khuôn API** (Mạnh chốt 13/11: thu S09 định kỳ đi đường này): bản thu `vn__s09-du-an__2026-11-13T120908161`
  (344 dự án). Item `kind: du-an`, `payload = {url, danhMuc, chiTiet}`; dữ liệu ở `payload.chiTiet.data`:
  `insight_by_block` (toà: `id`, `block_code`, `block_name`, `sector_uuid`, `handover_date_from`), `insight_by_sector`
  (phân khu: `sector_id`, `sector_name`, `type` HIGH_RISE/LOW_RISE, `handover_date_from/to`…). Trường `blocks` của dự án
  là 0 — không dùng. Nháp hợp đồng dữ liệu cho khuôn này: `_acceptance/toa-s09-hai-khu-vao-danh-ba/s09-data-contract-api-nhap.md`
  (LL chuyển làn thu đưa vào DATA-CONTRACT).
- **Không đọc `meta` hay `notes`**: bản 13/11 có ghi chú của Mạnh «meta/notes bị sửa 12:16Z 13/11, payload không kiểm
  được». Mọi trường lấy từ `payload` (khoá dự án = `chiTiet.data.id`, không phải `meta.duAnId`); `sourceId`, `kind`,
  `fetchedAt` của item giữ làm khoá và mốc.
- **Đối chứng — hai bản Mạnh mở tay** (khuôn trang `{url, nextData}`): `hanoi/…T092747119` (OP1), `hcmc/…T092747129`
  (GP). LL so trọn đối tượng với bản API: 0 khoá lệch. Eval đối chiếu số của bên đọc khuôn API với số đếm trực tiếp trên
  hai bản này (115 và 61 bản ghi toà, 91 và 59 ngày bàn giao, 13 và 7 phân khu). Hàng không đọc khuôn trang trong mã.

## 3. Số đo (13/11, chỉ đọc)

| | OP1 | GP |
|---|---|---|
| Bản ghi toà S09 | 115 | 61 |
| Toà thật (gộp trùng tên trong khu) | 115 | 60 — `OS2` có hai `id`, một bản không phân khu, không ngày bàn giao |
| Cao tầng / dãy thấp tầng / khác | 50 / 64 / 1 toà văn phòng (không phân khu) | 60 / 0 / 0 |
| Có ngày bàn giao | 91 | 59 |
| Phân khu | 13 (7 cao tầng, 6 thấp tầng) | 7 |
| Tên toà danh bạ (S08) | 18 | 46 |
| Trùng S09 → bí danh | 12 | 34 |
| Toà mới | 103 | 26 |
| Tên S08 không có ở S09 | 6 (`S1`, `S2`, `SP`, `U38`, `U38A`, `Z34`) | 12 (toà Lumiere — dự án con khác, S09 không có) |
| Bài S03 căn hộ có tên toà (nhóm một khu) | 9.256 | 8.202 |
| Gắn được toà trước → sau (ước, cùng thước) | 5.663 → 8.295 | 3.772 → 5.689 |
| Bài chỉ nêu cụm (`S10`, `R1`) | 102 | 2.486 |

## 4. Phương án

### 4.1 Staging — migration 097 `stg_s09_item`

Một dòng = một item của snapshot S09, giữ hình dạng nguồn (ADR-0011/0013), khoá `(snapshot_id, source_id)`:
`snapshot_id` (FK `airbnb_snapshots`), `source_id`, `kind` (`danh-muc` | `du-an`), `payload` jsonb nguyên văn,
`fetched_at`; không lưu `item.meta`. Cột sinh `project_id` (`payload.chiTiet.data.id`), `detail_ok`
(`payload.chiTiet.meta.code = '200'`). Hai view đọc khuôn API:

- `v_s09_toa`: mỗi phần tử `chiTiet.data.insight_by_block` của item `du-an` (`detail_ok`) mới nhất mỗi dự án → `project_id`, `block_id`,
  `block_code`, `block_name`, `sector_id` (rỗng được), `handover_date_from`.
- `v_s09_phan_khu`: mỗi phần tử `chiTiet.data.insight_by_sector` → `project_id`, `sector_id`, `sector_name`, `sector_type`,
  `handover_date_from`, `handover_date_to`.

Không sync cloud: `payload.url` mang tên miền thật (tầng A). Đường lên cloud là danh bạ.

### 4.2 Thư viện — `pipeline/lib/s09-du-an.mjs` (khuôn DA30)

- `dongItemS09(items, snapshotId)` → dòng bốn cột cho câu chèn `CAU_CHEN_S09_ITEM`
  (`ON CONFLICT (snapshot_id, source_id) DO NOTHING`); item thiếu `sourceId`, `kind` lạ, hay `du-an` thiếu
  `chiTiet.data.id` bị bỏ và đếm theo lý do. Không đọc `item.meta`.
- `toaS09(project)` → toà đã gộp: khoá gộp là tên toà chuẩn hoá (`chuanHoaTenToa`) trong một dự án; mỗi toà giữ mọi
  `block_id` nguồn (bí danh `ma_nguon`), phân khu và ngày bàn giao lấy từ bản ghi có đủ. Hai bản ghi cùng tên mà khác phân
  khu → không gộp, trả ca mơ hồ.
- Bộ nạp `pipeline/import-s09*` là làn thu (DAZ1, ZCode) — dùng chung hàm và câu chèn này. Hàng này không viết bộ nạp.

### 4.3 Dựng danh bạ — bước S09 trong `danh-ba-vat-the.mjs`

Trong cùng giao dịch và khoá cố vấn của DB1, sau bước S08, với mỗi khu có dự án S09 nối (bảng nối khu ↔ dự án S09 khai
trong `pipeline/lib/s09-du-an.mjs`: hai dòng, id dự án S09 → slug khu):

1. **Phân khu**: mỗi `sector` → nút `asset_nodes` loại `subzone`, con của khu; khớp tên/bí danh nút đã có (GP «The
   Beverly» id 23) thì dùng lại, không đúc thêm. Phân khu thấp tầng cũng thành nút.
2. **Toà**: mỗi toà S09 tra bí danh `ma_nguon` S09 trước (chạy lại không đúc); chưa có thì so tên chuẩn hoá với toà của
   khu: khớp đúng một → thêm bí danh `ma_nguon` S09 + `ten` vào toà đó; khớp không toà nào → (Hỏi-3, khuyến nghị) đúc toà mới
   `catalog_tier = 'mot_loi_khai'` (bậc thấp nhất, như DA10) — lối khác: không đúc, mỗi toà một thẻ `entity_match`, bí danh `ma_nguon` + `ten`; khớp từ hai toà → không ghi, vào
   thẻ `review_queue` (`entity_match`) kèm căn cứ. Toà mới tạo với nút vùng = phân khu (hay cụm) S09 của nó. Toà S08 đã có giữ nguyên nút vùng:
   bảng toà chỉ thêm (082, chỉ đổi được status/merged_into). View `v_toa_nut_vung` (097) trả nút vùng hiệu lực của
   mọi toà — phân khu hay cụm S09 qua bí danh mã nguồn S09, không nối S09 thì nút gốc (Mạnh chọn lối A ở Cổng Phạm vi 13/11).
3. **Cụm** (nếu Mạnh chọn trong hàng này — Hỏi-1): mã `<chữ><số>.<số>` cùng tiền tố từ hai toà trở lên trong một phân khu
   (`S10.01…S10.07`) → nút `subzone` con của phân khu, tên = tiền tố (`S10`), bí danh viết liền. Bài ghi `S10` phân giải về
   cụm, không về toà.
4. Ngày bàn giao, loại cao/thấp tầng: không ghi vào danh bạ ở hàng này (DA16 làm thuộc tính danh mục); đọc được ở view.

Ghi: `buildings`, `asset_nodes`, `registry_aliases`, `review_queue`. Không đổi trục, căn. Không đổi bảng nào khác.

### 4.4 Đích và chạy thật

Rào đích của DB1 giữ nguyên (`kiemDich`: DB thử ghi không cờ; máy thu chỉ với `--db-that`, lần dựng đầu đòi
`--sao-luu`). Áp 097 vào máy thu và lượt dựng thật là bước sau gộp, cần lời Mạnh (DDL thật).

## 5. Ranh giới

- Vùng: `db/migrations/097_*`, `pipeline/lib/s09*`, `pipeline/scripts/*s09*`, `pipeline/danh-ba-vat-the.mjs`,
  `pipeline/lib/danh-ba-vat-the.mjs`, `_acceptance/toa-s09-hai-khu-vao-danh-ba/**` (+ `_acceptance/config.yaml` cho
  executor, xin GS).
- Không `collector/**`, không `snapshots/`, không `sync-cloud`, không `app/`, không bộ nạp. Không gọi nguồn.
- Không tên nguồn/tên miền thật trong mã, test, hồ sơ, commit — fixture test là khuôn tổng hợp, không chép payload thật.

## 6. Hợp đồng dữ liệu khuôn API (LL chuyển ZCode)

Chưa có hợp đồng cho khuôn API. Nháp trường ở `_acceptance/toa-s09-hai-khu-vao-danh-ba/s09-data-contract-api-nhap.md`:
hai `kind`, đường tới toà và phân khu, trường có thể vắng (`sector_uuid`, `handover_date_from`, `insight_by_block` ở dự án
một toà), `blocks` không phải số toà, một tên toà có thể hai `id`, bên đọc không dùng `meta`/`notes`. Nháp khuôn trang
v1 cũ không còn là đường thu.

## 7. Rủi ro

- Dãy thấp tầng OP1 (64) thành «toà»: tên kiểu «Sao Biển 01» là dãy nhà phố — Hỏi-2.
- Tên S08 rút từ mã căn (`S1`, `S2`, `SP`, `U38`) không khớp S09 → giữ nguyên, ghi số; có thể là cụm hay mã lỗi (DB1).
- Toà Lumiere của GP không có ở S09 (dự án con khác) → giữ nguyên.
- Bài OP1 nêu H1–H3, M1–M3 vẫn thiếu sau S09 — khả năng là dự án khác lẫn nhóm (DV6, sổ nhóm), ngoài hàng.

## Đặc tả UX

Bỏ — hàng không đổi giao diện; thẻ `review_queue` hiện trên màn duyệt sẵn có.
