# Review findings: s06-region-tinh (round 2)

Phạm vi soát: `git diff origin/main...HEAD` trên bộ thu S06, importer S06, test của hồ sơ và probe `nap-region.mjs`, trên HEAD `3839846d`. Phiên chấm không sửa mã hay probe. Không finding nào chặn gộp, vì chưa vùng nào dùng `params.region` trước lời GIAO triển khai riêng. So với `ba9601af`, bốn tệp bộ thu, importer, test, probe không đổi.

## Soát lại finding vòng 1

| Finding | Trạng thái trên HEAD | Cách xác nhận |
|---|---|---|
| F1 | còn | đo lại trên lược đồ tạm |
| F2 | còn trong test; cây thật đúng AC-3 | đọc test + đếm lại lời gọi |
| F3 | còn trong test; cây thật đúng AC-2 | đọc test + đọc meta snapshot do bộ thu ghi |
| N1 | còn | đọc lại job hằng ngày của S06 |

## Trong hợp đồng

- **F1 (trung bình, không chặn, còn) — AC-5 chỉ đúng trọn vẹn với snapshot một item.** AC-5 đòi «importer dừng khác 0 và không có dòng nào được ghi — không có dòng thiếu mã vùng lọt vào». Probe chỉ có một item. Importer duyệt từng item, không có giao dịch theo snapshot, và ghi bảng snapshot trước vòng lặp. Đo lại, snapshot ba item với item giữa thiếu `region_v2`:
  - mã nạp khác 0, lỗi là vi phạm NOT NULL ở cột `region_v2`;
  - bảng stg chỉ có item đầu; item thiếu mã không có dòng, item thứ ba bị bỏ;
  - bảng snapshot có 1 dòng cho snapshot lỗi.
  Eval E5 vẫn đạt `expected` của nó. Hành vi có từ trước nhánh và chỉ gây thiệt hại khi payload thật thiếu mã. Gợi ý: người ký chốt cách đọc AC-5, hoặc thêm ca nhiều item.
- **F2 (thấp, không chặn, còn) — vế «0 lời gọi» của ca thiếu mã gần như không có răng.** Test chỉ đếm lời gọi có `region=2` hoặc `region_v2=2100`, trong khi vùng hổng không có mã nào. Một bản lỗi gọi `region_v2=undefined` vẫn xanh. Đếm lại: 8 lời gọi đều thuộc hai vùng có mã, 0 lời gọi lạ.
- **F3 (thấp, không chặn, còn) — ca «region_v2 (cũ)» không kiểm meta dù tên ca và AC-2 nói có.** Thân ca chỉ kiểm tham số lời gọi; ca «ưu tiên region» cũng vậy. Đọc lại snapshot do bộ thu ghi: meta vùng cũ có `region_v2`, không có `region`; meta vùng có cả hai mã chỉ có `region`.
- **F4 (thấp, không chặn, mới) — `s06r_unit` và `s06r_cong` tự CREATE DATABASE, không phải lược đồ tạm.** Lời giao vòng 2 ghi rằng các probe đã dùng lược đồ tạm và không cho CREATE DATABASE; điều đó đúng với `s06r_nap` nhưng không đúng với hai lệnh này. Vì vậy chạy eval theo lời giao thì DB tạm vẫn được tạo. Bốn lượt chạy vòng này đều tự xoá, không còn DB `zcode_s06r%`. Gợi ý: chuyển hai test sang lược đồ tạm như probe, hoặc sửa lại câu trong lời giao.

## Ngoài hợp đồng

- **Một tin thiếu mã ở một vùng dừng cả lượt xử lý S06 hôm đó**
  Người dùng thấy gì: Một vùng mới trả tin thiếu mã thì dữ liệu S06 của mọi vùng không được làm mới trong lượt đó.
  Căn cứ: Dữ liệu chậm một lượt, không mất, lượt sau chạy lại được; hành vi có từ trước, và lời giao triển khai sẽ có bước đo dữ liệu thật trước khi bật Hải Phòng, Bình Dương.
  file: `scripts/chotot-daily.sh`
  severity: medium
  Đề xuất: known-limits

## Ghi chép gốc của phiên chấm (mục ngoài hợp đồng)

Bản chép đúng khuôn thẻ do tác giả viết lại ở mục «Ngoài hợp đồng» trên.

- **N1 (còn) — một tin thiếu mã ở một vùng dừng transform của cả S06 trong lượt đó.** Job hằng ngày đặt cờ lỗi khi nạp hỏng rồi thoát trước transform. Hành vi có từ trước; chế độ `region` thêm một đường mới dẫn tới nó. Nên đưa vào lời GIAO bật Hải Phòng và Bình Dương một bước đo payload thật trước khi bật. Phiên chấm không gọi API thật nên không đo được.

## Đã soát, không phải finding

- **Hai điểm dùng mã khớp nhau.** `loadRegions` chỉ đẩy một trong hai khoá vào vùng, `fetchPage` và meta suy cùng từ khoá đó. Không có đường nào phát cả hai tham số.
- **Nơi đọc `meta.region_v2`:** ngoài bộ thu và importer chỉ còn test và script nghiệm thu của các hồ sơ cũ. Importer ưu tiên payload.
- **`collector/docs/DATA-CONTRACT.md` không nhắc `region_v2`,** nên đổi khoá meta không đòi tăng `schemaVersion` theo luật 4.
- **Form `/ops/sources` chỉ biết `regionV2`:** hợp đồng đã khai ngoài phạm vi.
- **Test và probe không gọi nguồn thật:** ca dùng bộ thu trỏ biến môi trường API về máy chủ giả; probe chỉ gọi importer.
