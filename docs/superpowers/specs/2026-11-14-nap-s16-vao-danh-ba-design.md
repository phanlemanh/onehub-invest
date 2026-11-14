# DA33 nap-s16-vao-danh-ba — thiết kế

Hàng DA33 (T3, mốc MN3 «Nhịp 3 — tầng, S16, Invest»). Cổng Đáng: «build» theo QĐ7 ngày 14/11 (ROADMAP §3 mục 48, đoạn
«Nguồn S16»). Khuôn: DA31 (`pipeline/lib/s09-du-an.mjs`, `pipeline/lib/s09-dung.mjs`, bước S09 trong
`pipeline/danh-ba-vat-the.mjs`).

## 1. Vì sao

Danh bạ căn hôm nay có 1.736 căn, đều từ S08, ở hai khu. S16 là danh mục do chính chủ đầu tư công bố: 177 dự án, 67 trang
phân khu, 226 toà, và 147.266 cặp (dự án, mã căn) lấy bằng phiên đăng nhập (đếm lại 14/11 trên ba bản thu; tệp kê nói
147.268). Mạnh chốt 14/11: «Phần đăng nhập là mã chính từ chủ đầu tư, nên sự tin cậy cao». Vì vậy mã căn S16 là neo cao nhất
khi dựng cây toà → căn, xếp trên S08 và trên mã suy từ tin S03.

## 2. Dữ liệu vào (đo 14/11 trên ba bản thu, không in tên nguồn)

| Bản thu | kind | Hình dạng payload |
|---|---|---|
| pha 1 (249 item) | `du-an` ×177, `phan-khu` ×67 | `{url, html}` trang SSR nguyên văn |
| | `du-an-dang-ban` ×1 | `{items}` 20 dự án × 26 trường |
| | `mngt-khu`, `mngt-toa`, `mngt-can` ×1 mỗi loại | `{csv, tenTep}`: khu 114 dòng, toà 226 dòng, căn 103.436 dòng |
| | `tin-niem-yet` ×1 | `{items}` 1.357 tin |
| pha 2 (2 item) | `mngt-toa-khong-alias` | `{toaKhongAlias}`: 56 khu, 178 toà kèm id |
| | `mngt-can-moi` | `{theoTang, khongTang}`: chuỗi jsonl, mỗi dòng một toà có mảng `can` (`du_an, khu, toa, tang, ma_can`) |
| pha 3 (2 item) | `mngt-can-pha3` | `{jsonl}`: 140 dòng, mỗi dòng một toà (`key = <dự án>\|<khu_id>\|<toa_id>`, `can[]`) |
| | `mngt-toa-progress` | `{progress}` theo toà |

Như vậy có 11 kind, không phải 8 như con số trong lời giao. Mã căn có 308.588 dòng, gom lại còn 147.266 cặp (dự án, mã căn):

- 36.570 nhóm trùng chỉ khác nhãn khu hoặc khác pha → cùng một căn.
- 891 nhóm cùng mã mà khác toà. Hầu hết là một toà thật («S2.05») đứng cạnh một nhãn gom («Rainbow»).
- 2 nhóm chỉ khác hoa thường.
- 0 mã rỗng.

Mã căn S16 giao với mã S08 ở hai khu đã có danh bạ:

| Khu | Mã S08 | Có trong S16 |
|---|---|---|
| Grand Park | 1.419 | 1.283 |
| Ocean Park 1 | 332 | 153 |

Phần còn lại phần lớn thuộc các toà mà pha 1 chưa có; pha 2 và pha 3 phủ thêm.

## 3. Phân làn

- **ZCode** viết bộ nạp `pipeline/import-s16*`. Bộ nạp đọc snapshot rồi ghi vào bảng stg qua **hàm dùng chung** của hàng
  này, gồm `dongS16(items, snapshotId)` và các câu chèn trong `pipeline/lib/s16-danh-muc.mjs`, giống cách DA31 làm với
  `dongItemS09`. Nhờ vậy cột stg chốt ngay ở S1 và ZCode viết song song được.
- **P3 (Claude)** làm:
  - migration 103;
  - hàm dùng chung;
  - bước S16 của lệnh dựng danh bạ;
  - bộ soát sync-cloud;
  - duyệt hợp đồng dữ liệu (soát chữ «8 kind» và danh sách kind ở §2).

## 4. Migration 103 `103_stg_s16.sql`

Migration idempotent. Không bảng nào trong 103 lên cloud.

1. `stg_s16_item(snapshot_id, source_id, kind, payload jsonb, fetched_at)`, khoá chính `(snapshot_id, source_id)`.
   - Giữ mọi kind nguyên văn, có CHECK danh sách 11 kind.
   - `payload.url` chỉ giữ đường tương đối; hàm dùng chung bỏ host trước khi chèn (luật đọc 1 của nháp hợp đồng).
   - Item `mngt-*` giữ cả chuỗi csv/jsonl để đối chiếu, vì snapshot bất biến và stg không thay bản thu.
2. `stg_s16_khu(snapshot_id, du_an, khu_id, khu_ten, khu_alias, so_can)`, khoá chính `(snapshot_id, du_an, khu_id)`. Lấy từ
   `mngt-khu` và phần khu của `mngt-toa-khong-alias`.
3. `stg_s16_toa(snapshot_id, du_an, khu_id, toa_id, toa_ten, so_can)`, khoá chính `(snapshot_id, du_an, toa_id)`. Lấy từ
   `mngt-toa` và `mngt-toa-khong-alias`.
   - Dòng csv pha 1 không có `khu_id`, chỉ có `khu_alias`. Hàm nối qua `stg_s16_khu` của cùng snapshot.
   - Nối không được thì giữ `khu_id` NULL và ghi `khu_alias` vào cột phụ `khu_nhan`.
4. `stg_s16_can(snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)`, khoá chính
   `(snapshot_id, du_an, khu_nhan, toa_ten, ma_can)`.
   - Mỗi dòng nguồn một dòng; chỉ bỏ dòng trùng y hệt trong cùng snapshot.
   - `toa_id` NULL khi dòng pha 1 không nối được toà theo `(du_an, khu_alias, toa_ten)`.
5. View `v_s16_can`, mỗi `(du_an, upper(ma_can))` một dòng:
   - `toa_ten` chọn theo luật ở §5.2;
   - `mo_ho = true` khi luật không chọn được;
   - `so_dong` đếm số dòng nguồn.
6. View `v_s16_toa`, mỗi `(du_an, toa_id)` một dòng, lấy bản mới nhất.
7. Nới `registry_aliases_source_check` từ `^S0[1-9]$` sang `^S(0[1-9]|1[0-9])$`, để bí danh mang nguồn `S16` (055 đặt luật
   cũ). Các bảng 055 khác giữ nguyên, vì hàng này không ghi người và không ghi tin S16.

Mọi bảng `stg_s16_*` và view ở trên KHÔNG có trong `FILL` của `sync-cloud.mjs`; bộ soát ở §6 chặn mọi đường thêm vào.

## 5. Bước S16 của lệnh dựng (`pipeline/lib/s16-dung.mjs`, gọi trong `dung()` sau bước S09)

### 5.1 Nối dự án

Dự án S16 chỉ vào danh bạ khi nối với một nút dự án có sẵn qua bảng `NOI_DU_AN_S16` (tên dự án S16 → slug nút). Bảng có
năm cặp, trình duyệt một lần ở Cổng Phạm vi (Hỏi-1). Đây là luật «mã có cấu trúc của nguồn qua một lần người duyệt cặp nối»
của trang tri thức danh bạ dự án.

| Dự án S16 | Nút | Căn S16 |
|---|---|---|
| Ocean Park | `vinhomes-ocean-park-1` | ≈35 nghìn |
| Ocean Park 2 | `vinhomes-ocean-park-2` | ≈13 nghìn |
| Ocean Park 3 | `vinhomes-ocean-park-3` | ≈8 nghìn |
| Smart City | `vinhomes-smart-city` | ≈22 nghìn |
| Grand Park | `vinhomes-grand-park` | ≈39 nghìn |

Đo 14/11: 153 và 1.283 mã S08 của OP1 và GP nằm trong đúng dự án S16 ở cột trái. Chín dự án S16 khác không có nút. Hàng này
không đúc nút cho chúng; chúng nằm ở stg chờ thẻ luật theo nguồn (DA3, DA18). Lệnh in số căn bị bỏ theo dự án. Khu không nằm
trong danh sách `--khu` thì không chạy.

### 5.2 Khoá căn trong S16

Khoá căn là `(du_an, upper(btrim(ma_can)))`. Cùng mã mà nằm dưới từ hai tên toà trở lên:

- đúng một toà có tên chuẩn hoá (`chuanHoaTenToa`) là tiền tố của mã chuẩn hoá → chọn toà đó;
- không có toà nào như vậy, hoặc có từ hai toà → căn mơ hồ, không đúc, một thẻ `review_queue` mỗi căn.

**Thẻ S16 không chở giá trị đăng nhập.** Mọi thẻ của bước S16 (căn mơ hồ, toà khớp hai, căn lệch toà) chỉ mang:

- khoá vật thể (`bld_…`, `unt_…`);
- `nguon: "S16"` và loại thẻ;
- chỉ mục local `s16_ref`: băm của `(du_an, ma_can)` hay `(du_an, toa_id)`.

Thẻ không mang mã căn, `khu_id`, `toa_id` hay tên toà S16. Người duyệt ở máy thu tra giá trị từ stg bằng `s16_ref`. Màn hiện giá trị ấy là hàng sau. Lý do: thẻ `review_queue` lên cloud cho vai ops (ADR-0015, luật 6).

### 5.3 Toà

Toà S16 nhận diện theo `(du_an, toa_id)`. Với mỗi toà S16 của khu đã nối:

1. Đã có bí danh `ma_nguon` S16 `<du_an>/<toa_id>` → dùng toà đó.
2. Chưa có bí danh → so tên chuẩn hoá với tên toà của khu (bí danh `ten`):
   - khớp một toà → thêm bí danh `ma_nguon` S16 và bí danh `ten`;
   - không khớp → đúc toà mới, **chỉ khi toà có ít nhất một căn được chọn theo luật §5.2**. Toà 0 căn là nhãn gom («Rainbow»):
     không đúc, đếm và in. Toà mới có `catalog_tier = 'xac_minh'`, cùng bậc danh mục chủ đầu tư S08 (Hỏi-2), và có UPI từ ISO
     của khu (088). `region_node_id` là nút phân khu có sẵn trùng tên khu S16 (chỉ đọc), không có thì là nút khu;
   - khớp từ hai toà → không ghi, một thẻ `entity_match`.

### 5.4 Căn

Với mỗi căn không mơ hồ của toà đã chốt:

1. Đã có bí danh `ma_nguon` S16 `<du_an>/<MA>` → dùng căn đó.
2. Chưa có → tìm căn S08 cùng mã ở khu, theo giá trị bí danh S08 `<s08_pid>/<MA>` của các dự án S08 nối khu:
   - cùng toà → thêm bí danh S16 cho chính căn đó; S08 trở thành bí danh cùng căn, không đúc mới;
   - khác toà → không ghi, một thẻ `entity_match` nêu hai toà.
3. Không có căn nào → đúc căn mới:
   - mã tách được bằng bộ tách có sẵn (`tachMa`, ví dụ khuôn `toa-cham-dinh` cho «S2.081101») và toà tách ra khớp tên toà
     S16 → trục (bí danh S16 `<du_an>/<toa>/<truc>`) và tầng;
   - không tách được, hoặc toà tách ra khác toà S16 → căn không trục (`stack_key` NULL, `sub_id = unit_key`; ràng buộc `units_sub_id_khop` cho phép).
     Căn liền kề, biệt thự và mã lô thuộc nhánh này.

### 5.5 Thứ tự tin cậy

Bước S08 vẫn chạy trước. Sửa bước S08: ở khu có bảng nối S16, trước khi đúc căn mới cho một mã S08, nó tra bí danh S16 cùng
mã:

- căn S16 cùng toà → gắn bí danh S08, không đúc;
- căn S16 khác toà → không đúc, không gắn, một thẻ nêu hai toà. Đây là cùng kết cục với §5.4 khi S08 đi trước. Nhờ đó dựng S16 trước rồi S08 sau, hay S08 trước rồi S16 sau, đều ra cùng
một tập căn cho các mã có ở cả hai nguồn.

Mã suy từ tin S03 hôm nay chỉ thành ứng viên toà, không thành căn. Bí danh `ten` S16 thêm ở §5.3 làm ứng viên ấy khớp vào
toà S16. Luật «S16 trên S03» cho việc gắn tin → căn (GC0–GC3) ghi ở đây cho các hàng ấy, không dựng ở hàng này.

## 6. Không rời máy

Phần không rời máy gồm:

- mã căn, `khu_id`, `toa_id` lấy bằng đăng nhập;
- trường nguồn và tên thư mục bản thu (tầng A).

Hôm nay `buildings`, `stacks`, `units`, `registry_aliases` không có trong `FILL`. Bước S16 không ghi `asset_nodes` (bảng có
lên cloud).

Bộ soát mới trong `sync-cloud.mjs`:

1. Tên bảng khớp `^stg_s16` hoặc nằm trong `{registry_aliases, units, stacks, buildings}` mà có trong danh sách đẩy → dừng
   trước khi gửi.
2. Mỗi lượt có `stg_s16_toa` ở local → nạp tập token `khu_id`, `toa_id` và tập mã căn S16. Quét payload của **mọi bảng trong
   danh sách đẩy**, khớp theo token, không theo chuỗi con. Trúng → dừng, thoát khác 0, in bảng và cột, không in giá trị.
3. Hàm soát `soatS16(giaTri, token)` xuất ra cho mọi đường đẩy khác (thẻ `review_queue` theo ADR-0015). Ca đo cấy token vào
   evidence một thẻ.

Ca đo cấy một dòng `asset_nodes` mang một mã căn S16 và một `toa_id`, cấy token vào evidence một thẻ; bộ soát phải đỏ cả ba.

## 7. Ngoài hàng

- Tin rao S16 (`tin-niem-yet`) vào stg nguyên văn nhưng chưa thành tin, căn hay giá. Đó là hàng sau, cần hàng tin S16 và luật
  «chỉ nội bộ».
- Giá chủ đầu tư, trạng thái quỹ căn của S16.
- Nút dự án cho chín dự án chưa có nút (DA3, DA18).
- Nút phân khu mới từ S16: phải có lời Mạnh rằng mục 38 áp cho phần công khai của S16.
- Hiện mã căn lấy bằng đăng nhập trên Invest hay API.
- Thu định kỳ bằng phiên đăng nhập.
- 47 toà khép một phần (khoảng 11.868 căn).
- Áp 103 và chạy dựng trên DB máy thu: lời riêng của Mạnh sau gộp.
- Dòng S16 trong `source_registry` local: bước triển khai, ghi DB máy thu cần lời Mạnh.

## 8. Rủi ro đã cân

| Rủi ro | Cách giữ |
|---|---|
| Nhãn gom («Rainbow») bị đúc thành toà | Toà 0 căn (theo luật tiền tố §5.2) không đúc. AC-10 in số căn theo từng toà mới, kèm số toà mới có dưới 10 căn. |
| Một tên toà S16 ở hai khu | Nhận diện theo `toa_id`, không theo tên. Khớp tên với toà có sẵn từ hai trở lên thì thành thẻ. |
| Dựng lại sinh khoá mới | Tra bí danh S16 trước mọi lần đúc. AC-8 dựng ba lần. |
| Lộ mã đăng nhập lên cloud | AC-9: bộ soát đỏ khi cấy. |
