# Hai ca SL1-AC-5 đỏ sẵn của itest s03-len-cong: đọc lại «không đổi ô nào» và phát lại 067 (thiết kế)

Hàng `sl1-ac5-the-gioi-069` (dãy P3, T2, tách từ `do-san-sl1-kdm` ngày 10/11). Vùng sửa: `pipeline/scripts/s03-len-cong.itest.mjs`
và khối executor của hàng trong `_acceptance/config.yaml`.

## 1. Vấn đề (đo 11/11)

Hai ca của `pipeline/scripts/s03-len-cong.itest.mjs` đỏ trên DB thử chép từ máy thu. Lệnh chấm `dbs_s03_len_cong` của hồ sơ đã ký
`dong-bang-stage-b-resolve` bỏ qua chúng bằng `--test-skip-pattern`.

- **«áp 069 không đổi ô nào của tin hiện có»**: ca phân xử lại mọi tin bằng hàm 061, rồi áp 069 và phân xử lại lần nữa.
  Kết quả: 2.225 tin đổi ở cột `property_type` và `field_provenance`.
  - Nguyên nhân: phát biểu `property_type` bậc `inferred`. DB máy thu có 39.884 phát biểu loại này (35.474 còn sống), tất cả là
    `method_version = transform-zalo@sl1`, sinh từ 03/11 trở đi, tức là sau 069.
  - 069 sinh ra đúng để cho loại phát biểu này vào cột. Câu đã ký của `s03-len-cong` AC-5 («phân xử lại mọi tin hiện có không đổi
    ô nào») nói về tin lúc 069 ra đời, khi chưa có phát biểu loại hình suy nào.
- **«hai thứ tự với 068»**: phát lại bản sao 067 (`fixtures/067_tang_huong_tin.ban-sao.sql`) báo lỗi
  `cannot change name of view column "seller_phone_inferred" to "unit_facing"`.
  - 067 chạy `CREATE OR REPLACE VIEW sale_offers AS SELECT * …`, trong khi view hiện tại đã có cột tính `seller_phone_inferred` do
    070 thêm.
  - Ca này đo thứ tự áp hàm phân xử, không đo view. View đời 070 chỉ là vật cản của thế giới hôm nay.

## 2. Cách làm

**(1) Ca «áp 069» — đọc lại câu đã ký (Hỏi-1, chờ Mạnh).** Khuyến nghị (A), đo trên dữ liệu thật, câu chặt hơn:
- Tin không có phát biểu `property_type` bậc `inferred` còn sống: không đổi ô nào (trọn dòng trừ `updated_at`, như ca cũ).
- Tin có phát biểu ấy: chỉ được đổi cột `property_type` và khoá `property_type` của `field_provenance`. Giá trị mới phải đúng luật
  069: một giá trị suy thì cột nhận giá trị đó, `tier: inferred`; hai giá trị suy thì `unknown` kèm `goi_y`.
- Đối chứng:
  - Đổi một ô `bathrooms` của tin không có phát biểu suy → đỏ ghim «SL1-AC-5».
  - Đổi một ô ngoài `property_type` của tin có phát biểu suy → đỏ ghim «SL1-AC-5».

Lối khác (B), dựng thế giới lúc 069:
- Trong giao dịch, gỡ tạm mọi phát biểu `property_type` bậc `inferred` (tất cả đều là `transform-zalo@sl1`, sinh sau 069) trước
  khi đo, rồi giữ nguyên ca cũ.
- Rẻ hơn và sát nghĩa đen, nhưng chỉ đo một thế giới không còn, và không bắt được 069 đổi nhầm ô khác trên tin có phát biểu suy.

**(2) Ca «hai thứ tự» — gỡ view đời 070 trong giao dịch.** Mỗi giao dịch của ma trận năm thứ tự chạy
`DROP VIEW IF EXISTS sale_offers CASCADE` trước khi phát lại thứ tự có 067, rồi để 067 dựng lại view.
- Mọi thứ nằm trong `BEGIN … ROLLBACK` nên DB thử không đổi.
- Mọi assert của ca giữ nguyên, kể cả ca «mất mốc thì dừng».
- Chiều đỏ: cùng thứ tự `067→069` mà không gỡ view thì phát lại vẫn vỡ đúng lỗi `seller_phone_inferred`, ghim «SL1-AC-5».
  Như vậy phần gỡ view là phần chống đỡ thật của ca.
- Không đọc lại tiêu chí: AC-5 hứa về thứ tự áp hàm, không hứa về view.

**(3) Cả tệp itest xanh, không bỏ ca nào.** Hàng khai lệnh riêng `sl1_ac5_toan` chạy trọn tệp trên DB của riêng lượt
(`db/db-thu.sh --chay`), không `--test-skip-pattern`. Lệnh `dbs_s03_len_cong` của hồ sơ đã ký không đổi: gỡ skip của nó là việc của
hồ sơ kia khi ghim lại.

## 3. Ngoài vòng

- Không sửa migration 067, 068, 069, 070, không sửa dữ liệu thật, không ghi DB dùng chung.
- Không sửa hợp đồng đã ký của `s03-len-cong`. Cách đọc lại ghi ở hồ sơ này (hợp đồng, sổ) và trỏ về AC-5 kia.
- Không gỡ `--test-skip-pattern` của `executors.test.dbs_s03_len_cong`.

## Đặc tả UX

Không chạm giao diện (dòng sổ `bỏ đặc-tả-UX`).
