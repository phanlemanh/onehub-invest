# danh-ba-vat-the.itest.mjs xanh lại trên main

Hàng `dbv-itest-xanh-lai-tren-main`, dãy P2, giám sát đợt mở ngày 12/11 (ưu tiên -12). Bộ kiểm này đang chặn E6 của DA2.

## Bối cảnh

Executor `dbv_db` (`node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs`) đỏ sẵn trên main
e01513de. P2 đo lại ngày 12/11 được 17/18 ca đỏ (`.acceptance-runs/dbv-itest-xanh-lai-tren-main/do-nen-main.log`), do hai
nguyên nhân độc lập:

1. **Fixture trái luật ISO một tỉnh (từ #406, DA1).** Lệnh dựng suy ISO của khu bằng `isoCuaKhu` trong
   `pipeline/lib/danh-ba-vat-the.mjs`. Mỗi mã khu vực trong `area_ids` quy về thị trường của nó (market thì là chính nó,
   submarket thì là `parent_id`). Đúng một thị trường mà có ISO (qua `admin_code` → `iso_regions`) thì mới ra ISO.
   - Fixture `napFixture` khai `q-p1, q-p2, q-p3` là submarket nhưng không có `parent_id`, còn `q-m1` là market không có
     `admin_code`.
   - Khu một (`{q-m1,q-p1}`) quy về hai «thị trường» `{q-m1, null}`, nên ra `nhieu-tinh`. Khu hai quy về `{null}`, nên ra
     `tinh-khong-co-iso`.
   - Lệnh thoát 2 ở khu đầu tiên. Mọi ca DBV-AC-3…12 và DBM-AC-* chạy lệnh đều đỏ (16 ca).
2. **DBV-AC-1 đo «áp 082 lần hai không đổi lược đồ» trên DB đủ migration (đỏ từ #422).** 095 đổi CHECK của
   `field_assertions`, nên áp lại 082 trên DB đã có 095 sẽ đặt lại CHECK cũ và đổi dấu lược đồ. Lời hứa của phép đo là
   «082 lũy đẳng», nên chỉ đúng nghĩa trên DB dừng ở 082.

## Thiết kế

Chỉ sửa `pipeline/scripts/danh-ba-vat-the.itest.mjs`. Không sửa mã sản phẩm hay migration, không nới assert nào.

1. **Fixture theo luật một tỉnh.**
   - Thêm hai thị trường tổng hợp mang `admin_code`: `q-m1` mang `01` (Hà Nội → VN-HN), thêm `q-m2` mang `79` (Hồ Chí
     Minh → VN-SG), đúng bảng `iso_regions` của 088.
   - `q-p1` lấy `parent_id = q-m1`; `q-p2`, `q-p3` lấy `parent_id = q-m2`.
   - `area_ids` của các nút giữ nguyên, nên khu một vẫn có một market và một phường. DBV-AC-12 vẫn đo được nhánh «cấp
     market bỏ qua».
   - Kỳ vọng `iso_region` VN-HN cho khu một và VN-SG cho khu hai giữ nguyên. Nay chúng đến từ luật thật thay vì `meta.city`.
2. **DB dừng ở 082 cho phép đo lũy đẳng.**
   - Thêm DB thử thứ ba `oneinvest_dbv_<pid>_082`, dựng bằng `taoDbThu(…, { hetSo: 82 })`, xoá ở `after`.
   - DBV-AC-1 đo dấu lược đồ, áp 082 (hoặc `DBV_MIG_THAY`), rồi đo lại trên DB này. Thông điệp ghim giữ nguyên «DBV-AC-1
     áp 082 lần hai đổi lược đồ».
   - Phần còn lại của DBV-AC-1 (ma trận chỉ thêm, phát biểu vật thể, so Người và phân xử tin với DB tới 081) vẫn chạy trên
     DB đủ migration như cũ.
3. **Đối chứng đỏ (probe).**
   - (a) Bản tệp ở merge-base chạy ca DBV-AC-3 phải đỏ với `nhieu-tinh`. Đây là bằng chứng fixture cũ thật sự trái luật.
   - (b) Bản mới chạy ca DBV-AC-1 với `DBV_MIG_THAY` là bản chép 082 không lũy đẳng (mỗi lần áp tạo một bảng mới) phải đỏ
     đúng thông điệp ghim.
4. **Giữ phép đo (probe tĩnh).**
   - Diff so merge-base chỉ chạm tệp kiểm và `_acceptance/<slug>/` (cùng tệp cấu hình chấm). Không dòng nào chứa `assert`
     bị xoá hay sửa. Số lời gọi `assert.` không giảm.
   - Chiều đỏ: bản chép sửa một dòng assert thì probe gọi tên dòng đó.

## Tệp anh em (chỉ báo, không sửa)

Báo cho giám sát trong `_acceptance/<slug>/anh-em.md`: `danh-ba-vat-the-that.itest.mjs` chép `areas` từ máy thu mà bỏ
`parent_id` và `admin_code`, nên nhiều khả năng gặp cùng lỗi luật một tỉnh khi chạy lệnh dựng. Ba tệp kia
(`-iso`, `-xa`, `-xa-that`) làm việc trên bản chép DB máy thu có PX1, không dựng fixture vùng.

## Ngoài phạm vi

- Mã sản phẩm (`pipeline/danh-ba-vat-the.mjs`, `pipeline/lib/danh-ba-vat-the.mjs`) và mọi migration.
- Sửa các tệp anh em.
- Đưa itest này vào glob CI.
