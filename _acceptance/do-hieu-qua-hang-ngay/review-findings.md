# Review findings: do-hieu-qua-hang-ngay (round 3)

Review incomplete: không (mọi finder đều chạy xong).

## Trong hợp đồng

- **chanLo so chuỗi con với tên người đăng ≥4 ký tự, nên khi gặp mã khu vực hay tên dự án nó báo rò giả và dừng cả ngày đo (đã chạy lại được)**
  file: `pipeline/lib/do-hang-ngay.mjs:397` · severity: high · source: bugs · AC: AC-5
  detail: Tôi chạy `node pipeline/do-hang-ngay.mjs --ngay 2026-11-05` (không --write, giao dịch ROLLBACK) trên DB thử oneinvest_do1, tức bản sao dữ liệu thật. Lệnh ném `LO NGUOI DANG` và không ghi dòng do1-* nào cho ngày đó. Tôi chạy thêm một bản chép có gắn log trong scratchpad để xem chỗ trúng: đường `do1-tin-hieu.lat.thi_truong.o#key`, chuỗi cấm dài 4 ký tự, bắt đầu bằng «hun». Đó là tên người đăng dạng «Hưng», gập dấu thành `hung`, lại khớp với khoá lát thị trường `vn-hung-yen`. Khoá này là mã khu vực công khai, không phải dữ liệu người đăng. Gốc lỗi nằm ở hai chỗ. chuoiCam (pipeline/do-hang-ngay.mjs khoảng dòng 250-256) đưa mọi `sender_name`/`seller_name` dài từ 4 ký tự vào danh sách cấm. Vòng lặp cuối của chanLo lại so `la.some((x) => x.includes(g))` trên mọi lá và mọi khoá đã gập, không xét ranh giới từ. Vì thế tên người rất phổ biến (Hưng, Linh, Long…) đều trúng mã phường/thị trường (`vn-hung-yen`…). Tên người bán đặt theo dự án (vd «Ocean Park») cũng trúng khoá `theo-chu-bai:<dự án>` và tên toà. Cả bước đo hằng ngày ném lỗi, nên bốn nhóm số do1-* của ngày đó mất hẳn. Đây không phải rò thật: tên/SĐT người bán là tầng C. Vòng này chanLo được viết lại, nhưng chỉ chuyển nhánh TEN NGUON sang guardValues; nhánh NGUOI DANG vẫn so chuỗi con trần. Cách sửa: so có ranh giới từ (như findSourceNames làm với biến thể ngắn), hoặc chỉ soát NGUOI DANG trên giá trị chữ, không trên khoá là mã khu vực hay mã cách đọc. Kèm một ca kiểm: tên «Hưng» và khoá `vn-hung-yen` không được ném lỗi.

## Ngoài hợp đồng

- **Hình dạng 1 + 2: chuoiCam đo chữ SQL và dùng client giả viết tay thay vì chạy SQL thật qua source_registry**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:531` · severity: medium · source: measurement
  detail: Test «DO1-AC-9 chuoiCam dừng khi source_registry không có tên» (dòng 524-533) hứa rằng source_ids được đưa vào danh sách soát. Hai assert đều không đo điều đó trên đầu ra thật. (a) Dòng 531 `assert.match(sql, /unnest\(source_ids\)/)` chỉ grep chữ câu truy vấn, tức là đo câu lệnh chứ không đo kết quả (hình dạng 1). (b) Dòng 532 `deepEqual([...], ["TEN_THAT_V","ma-nguon-v"])` chỉ trả lại đúng hai dòng mà client giả ở dòng 529 tự viết theo khuôn cột `x` của bên đọc. Client giả trả hai dòng đó cho mọi câu có chứa "source_registry", kể cả khi SQL không có UNION/unnest, sai bí danh cột hay hỏng cú pháp (hình dạng 2). Test chạy trên DB thật qua bộ ghi (dòng 635) chỉ chèn `real_name = 'TEN_THAT_V'`, không có `source_ids`. Vì vậy chưa có phép đo nào chèn source_ids vào source_registry rồi kiểm rằng chuoiCam/doHangNgay chặn được một mã trong source_ids.
  đề xuất: known-limits

- **Hình dạng 2: fixture «Không suy ra được» cho lát thẻ viết tay theo khuôn docThe, chưa đi qua đường eval_labels → docThe**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:517` · severity: low · source: measurement
  detail: Test «DO1-AC-7 lát thẻ: người chọn «Không suy ra được» thì không lấy nháp máy» tự dựng `nhan: { building: { value: null, not_stated: true }, project: {...} }`, đúng khuôn mà `jsonb_object_agg(field, jsonb_build_object('value', value, 'not_stated', not_stated))` của docThe sinh ra, rồi gọi thẳng KHOA_LAT_THE.toa/du_an. Test chạy qua bộ ghi thật (dòng 629-690) chỉ gắn nhãn null cho price_min_vnd/area_m2, không gắn cho building/project. Vì vậy chưa có phép đo khứ hồi nào cho thay đổi oThe (`f in t.nhan`): ghi nhãn null cho building/project vào eval_labels, đọc lại qua docThe, rồi kiểm ô lát toà/dự án ra `khong-tin-hieu` trong detail.
  đề xuất: known-limits

- **Hình dạng 3: assert «người gắn có giá trị → theo người» chỉ kiểm có/không có giá trị, không kiểm giá trị của bên nào thắng**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:522` · severity: low · source: measurement
  detail: Chú thích dòng 520 hứa về thứ tự ưu tiên giữa hai giá trị: «người gắn có giá trị → theo người». Nhưng dòng 522 `KHOA_LAT_THE.toa({ draft, nhan: { building: { value: "s9.01" } } })` mong `{ chua: "chua-co-danh-ba" }`. Kết quả này giống hệt khi oThe lấy nháp máy "s8.02", vì chuaThe chỉ xét giá trị có hay không. Đảo thứ tự (nháp trước người) thì assert vẫn xanh. Muốn đo đúng thứ tự ưu tiên thì phải dùng một chiều mang theo giá trị, ví dụ KHOA_LAT_THE.du_an_theo_chu với project của người khác nháp, rồi mong `theo-chu-bai:<giá trị của người>`.
  đề xuất: wont-fix

