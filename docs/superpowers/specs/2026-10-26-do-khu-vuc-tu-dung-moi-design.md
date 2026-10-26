# Phép đo gán khu vực tin rao tự dựng mồi trong transaction — thiết kế

Hàng `do-khu-vuc-tu-dung-moi` (dãy P3, Mạnh duyệt 26/10). Hạng T2.

## 1. Vấn đề

`scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu` là phép đo AC-8 của `tin-rao-gan-khu-vuc-dung` (eval E8, executor
`tin_rao_gan_do`). Đối chứng dương của nó — «trạng thái trước có ≥ 1 tin trỏ khu vực không hợp lệ» — đọc từ DB local
THẬT. Sau khi AU9 dọn khu vực lạc và lượt nạp đầu tiên chạy bản đã sửa, DB không còn tin nào như vậy: phép đo đỏ ở
dòng đầu, dù ba transform vẫn đúng. Đó là Ngoài-5 của hồ sơ ấy («bài đo dùng một lần»). Hệ quả: hồ sơ đã ký không ghim
lại được, và mọi PR chạm transform tin rao kế tiếp sẽ thấy E8 đỏ.

## 2. Cách đo mới — mồi tự dựng, một transaction

Toàn bộ trong `BEGIN … ROLLBACK`, khoá tư vấn 33033 (cùng khoá với các test transform khác):

0. **Băm gốc** (ngoài transaction): băm từng bảng mà ba transform và `reconcile_stale_offers` ghi — `sale_offer_records`,
   `property_offers`, `property_candidates`, `review_queue`, `enrichment_proposals`, `areas` (danh sách rút từ câu
   INSERT/UPDATE/DELETE của `pipeline/transform-*.mjs`, `pipeline/lib/write-offers.mjs` và hàm SQL của migration 044) —
   cộng số dòng `ops_audit` do transform ghi (`action LIKE 'transform:%'`).
1. **Chụp gốc** (trong transaction, trước mọi transform) — trạng thái DB thật, mốc của thước lệch như AC-8 cũ.
2. **Lượt nền**: chạy `runTransformZalo` + `runTransformFb` + `runTransformChotot` một lần, **chụp nền**. Kiểm lời hứa
   đã ký của E8 trên lượt này: nối theo `offer_id`, 0 tin có phường hợp lệ ở chụp gốc bị gỡ hay đổi khu vực; in mỗi
   nguồn số tin bị cho nghỉ (để người đọc thấy, không chặn). Tin còn sống sau lượt nền là đúng tập transform sinh lại
   (đo 26/10: chọn tin thẳng từ `sale_offers` thì tin S03/S05 có thể không được sinh lại và bị cho nghỉ).
3. **Tin mồi + khu vực mồi**: với mỗi nguồn S03, S05, S06 chọn hai tin có phường hợp lệ ở Hà Nội từ chụp nền (thứ tự
   `offer_id`, tất định). Với MỖI tin mồi chèn một khu vực mồi dưới `vn-hanoi` mang ĐÚNG tên phường nền của tin ấy (chép
   cả `geom`) — tin thứ nhất của nguồn vào khu vực **lạc** mồi (`meta.source = osm-phuong`, `meta.lac = true`, id xếp
   TRƯỚC mọi phường thật), tin thứ hai vào khu vực **không phải phường OSM** mồi (`meta` không có nguồn osm-phuong, id
   xếp SAU mọi phường thật) — `UPDATE sale_offer_records` (sau #132 `sale_offers` là view). Sáu tin, sáu khu vực mồi.
   Cùng tên với phường thật nên một bộ đọc quên lọc sẽ khớp được khu vực mồi; id xếp hai đầu nên dù bộ đọc lấy bản
   đầu hay bản cuối khi trùng tên, mỗi nguồn có ít nhất một tin rơi được vào mồi.
4. **Chụp trước** → đối chứng dương: tập tin trỏ khu vực không hợp lệ CHỨA đúng sáu tin mồi (in thêm số tin thật).
5. **Lượt đo**: chạy lại ba transform, **chụp sau**. Kiểm:
   - 0 tin trỏ khu vực không hợp lệ, 0 tin trỏ khu vực mồi (so theo id mồi, không qua bộ lọc);
   - mỗi tin mồi về đúng `area_id` của nó ở chụp nền (dòng mỗi nguồn «S0x: 2 tin mồi → 2 về phường cũ»);
   - thước lệch chụp trước → chụp sau (bỏ sáu tin mồi) — 0 tin hợp lệ bị gỡ hay đổi, kèm đối chứng dương của thước.
6. **ROLLBACK** → băm lại các bảng ở bước 0 ngoài transaction: từng bảng bằng gốc, `ops_audit` không thêm dòng
   transform, không còn khu vực mồi. Hàm so băm có đối chứng dương riêng (một bảng băm khác → dòng FAIL gọi tên bảng).

Chiều đỏ, hai cờ chỉ dùng cho test (`scripts/kiem-tin-rao-gan-khu-vuc.test.mjs` chạy cả ba chiều trên cùng DB):
- `--pha khong-sua` bỏ bước 5 (không chạy lại transform) — trạng thái mồi còn nguyên, phép đo đỏ ở khối «sau», gọi tên
  sáu tin mồi;
- `--pha mo-loc` trước lượt đo đổi `meta` của sáu khu vực mồi thành phường hợp lệ (giả lập bộ đọc quên lọc khu vực lạc
  và khu vực không-OSM), chạy lượt đo, rồi trả `meta` cũ trước khi chụp sau — phép đo đỏ ở dòng «0 tin trỏ khu vực
  mồi» và gọi tên tin đã rơi vào mồi. Đây là đối chứng dương cho chính cái hỏng AC-8 cũ canh.

Lối bị loại: (a) chọn tin mồi thẳng từ `sale_offers` thật không qua lượt nền — đã đo, tin S03/S05 bị cho nghỉ;
(b) chèn bài stg mồi mới cho từng nguồn — S06 cần bản ghi `stg_chotot_ads` đủ trường, nhiều khuôn hơn và vẫn không
đo được «transform sửa tin đang gán sai» trên dữ liệu thật.

## 3. Thay eval của hồ sơ đã ký

| Eval cũ | Thay bởi | Vì sao |
|---|---|---|
| `tin-rao-gan-khu-vuc-dung/E8` | `do-khu-vuc-tu-dung-moi#AC-2` | E8 đòi đối chứng dương từ DB thật; AC-1 dựng trạng thái ấy bằng mồi, AC-2 đo lại lời hứa «sau lượt 0 tin trỏ khu vực không hợp lệ, 0 tin hợp lệ bị gỡ hay đổi». |

E8 khai `status: not-run` + `superseded_by: do-khu-vuc-tu-dung-moi#AC-2` (khuôn EVAL-THAY-BOI của kit 2.24). Luật kit
chỉ nhận con trỏ khi hồ sơ thay đã có chữ ký người, nên hồ sơ cũ được ghim lại SAU chữ ký Cổng Bằng chứng của hàng
này, trong cùng PR.

## 4. Quét phép đo cùng khuôn «dựa vào DB thật, dùng một lần»

Khuôn: đối chứng dương đòi một trạng thái hỏng có thật trên DB local mà chính việc sửa (hay lượt dọn đi kèm) xoá mất.
Quét 26/10 mọi script/test có DB với điều kiện `> 0` trên dữ liệu thật:

| Phép đo | Kết luận |
|---|---|
| `scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu` (E8 tin-rao-gan-khu-vuc-dung) | đúng khuôn — sửa ở hàng này |
| E3 của `tin-rao-doi-phuong-noi-post-ids` | cùng script, hồ sơ đã đóng không merge (PR #133) — hết khi script sửa |
| `scripts/kiem-ranh-gioi-khu-vuc.mjs --thu` | đã tự chèn khu vực lạc mồi trong transaction (AU9 r1) — không thuộc khuôn |
| `pipeline/scripts/tin-rao-gan-khu-vuc.test.mjs`, `reassign-areas.test.mjs` | mồi trong transaction — không thuộc khuôn |
| `scripts/smoke-review-queue.mjs` («DB local có thẻ chờ») | cần dữ liệu có mặt, bị người duyệt tiêu dần chứ không do việc sửa — khuôn khác, ngoài phạm vi |
| `scripts/smoke-listing-no-airdna.mjs`, `smoke-listings-browse.mjs`, `smoke-yield-dong-tien.mjs`, `deals-phi-ly-do.mjs`, `luong-7-ngay-do.mjs`, `hieu-chuan-do.mjs`, `dq-moi-nhat-do.mjs` | cần dữ liệu thật có mặt, không bị việc sửa xoá — khuôn khác, ngoài phạm vi |
