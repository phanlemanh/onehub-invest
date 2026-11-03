## Trong hợp đồng

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): «bất biến sai thì thoát 1» được kiểm bằng grep mã nguồn**
  file: `pipeline/scripts/so-ghep-s06.test.mjs:398`
  severity: high
  AC: AC-9
  source: measurement
  detail: Ca SG-AC-9 tên «bất biến sai thì thoát 1» chỉ chạy `/usr/bin/grep -c "process.exitCode = 1"` trên do-so-ghep-s06.mjs rồi assert đếm bằng "1" (dòng 398-399). Không có lượt nào cho lệnh chạy với bất biến sai rồi đọc mã thoát. AC-9 hứa «bất biến sai thì thoát 1»; E9 hứa «ca đột biến trong test cho bất biến sai thì thoát 1». Ca này đo chuỗi chữ, không đo hành vi: đổi `if (loi.length)` thành điều kiện không bao giờ đúng, hoặc đặt dòng đó vào nhánh chết, thì grep vẫn ra 1 và ca vẫn xanh. Ca `CA` ở dòng 380-388 chỉ chứng minh `kiemBatBienSoGhep` trả khoá sai, không nối tới mã thoát của `main`.
  lý do vào hợp đồng: AC-9 hứa rõ «bất biến sai thì thoát 1», nhưng ca kiểm chỉ đếm chuỗi chữ trong mã nguồn nên không chứng minh được hành vi này.

- **Hình dạng 3 (assert có mặt khi lời hứa là quan hệ): «số A phải một dòng» đo qua câu có LIMIT 1**
  file: `pipeline/scripts/so-ghep-s06.test.mjs:245`
  severity: medium
  AC: AC-3
  source: measurement
  detail: AC-3 và E3 hứa số có tin trực tiếp có ĐÚNG MỘT dòng ở `sellers`. `docSeller` nối `sellers` với `sale_offers` rồi `LIMIT 1` (dòng 245), nên `deepEqual(..., [2])` với thông điệp «phải một dòng» ở dòng 246 không thể đỏ vì thừa dòng: `sellers` có hai dòng cho cùng số thì vẫn trả một dòng. LIMIT có đó vì phép nối theo `sale_offers` tự nhân dòng, nên phép đếm dòng đã bị bỏ. Chỉ `n_ads` còn được đo. Cùng ca, dòng 255-256 đối chứng dương chỉ kiểm `thieu.length === 1` và `endsWith(":S06")`, không buộc phần tử báo thiếu vào băm của +84900000212, trong khi `bait-gap-sellers.test.mjs` đã so đúng `${bam(z)}:S06`.
  lý do vào hợp đồng: AC-3 hứa số có tin trực tiếp có đúng một dòng ở danh bạ người bán, nhưng phép đo giới hạn một dòng nên không thể đỏ khi có dòng thừa.

- **Hình dạng 4 (âm tính một mình): «số B không có dòng» xanh cả khi tin 211 không mang số**
  file: `pipeline/scripts/so-ghep-s06.test.mjs:247`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Tin 211 có `themStg` và `ganSdtS06` ở dòng 238-241, nhưng không có assert nào rằng `seller_phone` của tin 211 đã bằng +84900000211, khác với số A có tiền đề ở `dungCapGhep` dòng 193. `docSeller` lọc qua `o.seller_phone = $1`, nên nếu số B không được ghép thì phép nối rỗng và `deepEqual([], ...)` ở dòng 247 vẫn xanh. `sellersThieuNguoi == []` ở dòng 248 cũng vậy. Lời hứa «số chỉ trên tin ghép không có dòng, không bị báo thiếu» không phân biệt được với «số đó không tồn tại». Đối chứng dương ở dòng 251-256 dùng số trực tiếp khác, không phải đối chứng cho số B.
  lý do vào hợp đồng: AC-3 hứa số chỉ còn trên tin ghép không có dòng và không bị báo thiếu, nhưng ca kiểm xanh cả khi số đó không tồn tại nên không chứng minh được lời hứa.

- **Hình dạng 4 (âm tính một mình): kiểm dòng in không có số không thể đỏ vì fixture chỉ có số đếm**
  file: `pipeline/scripts/so-ghep-s06.test.mjs:417`
  severity: low
  AC: AC-9
  source: measurement
  detail: `for (const dong of veDong(truoc, sau, nhanh)) assert.doesNotMatch(dong, /\+84\d{9}|\b0\d{9}\b/)` không có thông điệp ghim và không có đối chứng dương. `veDong` chỉ nội suy các trường đếm nguyên của `docMoc` và `docNhanhSoGhep`, nên với fixture này chuỗi không thể khớp mẫu SĐT. Bỏ `.map(inKhongSo)` khỏi `veDong` thì ca vẫn xanh. Đối chứng của `inKhongSo` nằm ở `gan-sdt-s06.test.mjs:675`, chỉ gọi trực tiếp hàm và không chứng minh `veDong` đi qua nó. Tiêu đề tệp lại tuyên «mỗi phép đo có ca đỏ trên cùng fixture, ghim thông điệp».
  lý do vào hợp đồng: AC-9 hứa đầu ra không chứa SĐT, nhưng ca kiểm không có đối chứng dương và không thể đỏ với dữ liệu thử chỉ có số đếm.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **gan-sdt-s06 --thu nạp 070 trên DB dùng chung, giữ AccessExclusiveLock trên public.sale_offers suốt phép đo**
  Người dùng thấy gì: Nếu chạy lệnh đo thử trên cơ sở dữ liệu thật của máy thu, các trang vận hành và việc đồng bộ có thể đứng chờ trong lúc đo. Dữ liệu không mất, nhưng người vận hành sẽ thấy trang treo cho tới khi phép đo xong.
  Căn cứ: Chỉ xảy ra khi chạy tay lệnh đo đúng chỗ, không mất dữ liệu và hết khi phép đo kết thúc; chỉ cần ghi lại để người chạy dùng bản sao dữ liệu thử.
  file: `pipeline/gan-sdt-s06.mjs`
  severity: medium
  Đề xuất: known-limits

- **Kiểm danh-ba-sdt:n3 đỏ giả khi có số chỉ nằm trên tin S06 ghép hoặc mất dấu; thay đổi chỉ sửa sellersThieu**
  Người dùng thấy gì: Khi xuất hiện một số điện thoại chỉ có trên tin ghép, phép kiểm hằng ngày của danh bạ sẽ báo đỏ dù không có gì hỏng. Người vận hành có thể bị báo lỗi giả trên trang Ops.
  Căn cứ: Hôm nay chưa xảy ra vì mọi số đều có tin trực tiếp, và chỉ gây cảnh báo giả chứ không mất hay lộ dữ liệu; nên sửa trong một việc riêng trước khi số ghép tăng.
  file: `pipeline/do-danh-ba-sdt.mjs`
  severity: medium
  Đề xuất: new-contract

- **Sau khi áp 070, nạp lại 061 và 059 lỗi «cannot drop columns from view», làm đỏ các itest và thước đo đang dùng**
  Người dùng thấy gì: Sau khi áp bản cập nhật mới lên máy thu, một số lệnh kiểm và đo cũ sẽ báo lỗi dù dữ liệu thật vẫn đúng. Người vận hành có thể tưởng hệ thống hỏng trong khi chỉ công cụ kiểm hỏng.
  Căn cứ: Dữ liệu người dùng không bị ảnh hưởng, chỉ các lệnh kiểm nội bộ đỏ; sửa không gấp nhưng cần làm trước khi các bản sao máy thu có bản cập nhật mới.
  file: `pipeline/lib/nap-061.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): chiều đỏ SG-AC-1 phá bản chép luật trong test, không phá mã thật**
  Người dùng thấy gì: Một ca kiểm âm của luật ghép người có thể vẫn xanh dù luật thật bị sửa sai. Việc phát hiện lỗi về sau yếu hơn bảng nghiệm thu mô tả.
  Căn cứ: Hành vi thật vẫn được ca kiểm dương bảo vệ và không ảnh hưởng người dùng; chỉ là lưới an toàn mỏng hơn, sửa sau rẻ.
  file: `pipeline/scripts/so-ghep-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ô S03, S05 chèn thẳng cột trong khi E1 hứa ghi bằng đường nạp của nguồn**
  Người dùng thấy gì: Phép kiểm cho nguồn S03 và S05 dùng dữ liệu viết tay nên có thể không thấy lỗi nếu đường nạp thật ghi dạng số khác. Lỗi như vậy chỉ lộ khi chạy trên dữ liệu thật.
  Căn cứ: Độ lệch đã được ghi nhận công khai, hai nguồn này không đổi hành vi trong vòng này và nếu có lỗi cũng lộ ngay khi đo trên dữ liệu thật mà không làm mất dữ liệu.
  file: `pipeline/scripts/so-ghep-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): E8 tự viết thân trả về của route, không lấy từ route thật**
  Người dùng thấy gì: Nếu sau này tên trường của API và của thẻ tin lệch nhau, bài kiểm giao diện vẫn xanh còn người dùng có thể mất nhãn «Chưa xác minh» trên trang công khai.
  Căn cứ: Hiện hai phía đang khớp và có bài kiểm riêng cho từng phía; rủi ro chỉ xuất hiện khi ai đó đổi tên trường, và người dùng chỉ thấy thiếu nhãn chứ không lộ số.
  file: `app/tests/so-ghep-nhan-giao-dien.test.tsx`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/10 lỗi rơi vào file không bộ đo nào phủ (pipeline/do-danh-ba-sdt.mjs, pipeline/lib/nap-061.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
