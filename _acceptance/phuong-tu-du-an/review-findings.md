## Trong hợp đồng

- **Hình dạng 2 — PTD-AC-5 và PTD-AC-3 «qua bước ghi tin S03» dùng hàng viết tay đưa thẳng vào lib/write-offers, không đi qua transform-zalo như evals E5 hứa**
  file: `pipeline/scripts/phuong-tu-du-an.test.mjs:333`
  severity: medium
  AC: AC-5
  source: measurement
  detail: evals.yaml E5 hứa «bước ghi tin S03 của transform-zalo (rút từ module, không chép)» và chiều đỏ «bản chép transform-zalo đột biến bỏ lời gọi resolve sau ghi». Thực tế kiemAc5 (dòng 333-336) và ca PTD-AC-3 writeOffers (dòng 276-277) gọi `writeOffers(c, "S03", [{offer_id, kind, first_seen, last_seen, post_ids, area_id}])` của lib/write-offers.mjs bằng các hàng viết tay, chỉ có sáu trường. Test không import transform-zalo.mjs ở chỗ nào. Đường thật ở transform-zalo.mjs:995 truyền `assertions: [...phatBieuPhongNgu, ...phatBieuToaTruc, ...dongLoai, ...dongTang]`, sau đó chạy rutTangCu kèm resolve_offer_fields và ganSo. Fixture không được sinh từ bên viết thật (bộ dựng hàng của transform-zalo), nên nếu transform-zalo đổi cách ghi hay thứ tự gọi thì phép đo không thấy. Chiều đỏ ở dòng 350 cũng đột biến lib/write-offers.mjs chứ không phải transform-zalo như eval mô tả. pipeline/transform-zalo.mjs nằm trong paths của E3 và E5 nhưng không được đo.
  rationale: AC-5 đòi chạy chuỗi thật bước S03 của transform-zalo, mà phép đo lại dùng hàng viết tay đi thẳng vào bộ ghi nên chưa chứng minh đúng điều AC nêu.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Áp lại 099 theo đúng hướng dẫn của chính nó sẽ âm thầm ghi đè bản vá 102, quay về lỗi vỡ khoá ngoại sale_offers_area_id_fkey**
  Người dùng thấy gì: Nếu sau này ai đó làm theo hướng dẫn ghi trong tệp cũ và áp lại bước cấu hình cũ, bản vá lỗi phường đã sửa sẽ mất mà không báo. Khi đó việc cập nhật tin có thể dừng giữa chừng vì mã khu vực đã bị xoá.
  Căn cứ: Chỉ xảy ra khi có người cố ý áp lại bước cũ theo thứ tự sai, hậu quả là dừng cập nhật chứ không mất dữ liệu, và áp lại bản vá là khôi phục được; nên ghi rõ thứ tự áp là đủ.
  file: `db/migrations/099_phuong_tu_du_an.sql`
  severity: medium
  Đề xuất: known-limits

- **Phường do nguồn ghi trùng đúng phường suy ra bị coi là phường suy ra: nhãn «du-an» giữ sai, và khi rút thì cột về giá trị gốc cũ, mất phường của nguồn**
  Người dùng thấy gì: Hiếm khi, một tin đã được gán phường theo dự án, rồi sau đó nguồn cũng đọc ra đúng phường đó. Tin vẫn bị ghi là phường suy ra từ dự án, và nếu sau này dự án bị gỡ khỏi bài thì phường đúng của nguồn có thể bị trả về tỉnh hoặc trống.
  Căn cứ: Chỉ gặp ở tin nguồn vừa được đọc lại tốt hơn và sau đó mất dự án, số tin rất nhỏ; tin chỉ sai tạm thời và đúng lại khi được nạp lại, nên chấp nhận và ghi giới hạn.
  file: `db/migrations/102_phuong_tu_du_an_va.sql`
  severity: medium
  Đề xuất: known-limits

- **Lệnh kiểm DB chỉ đòi có hàm của 099, không biết đã áp bản vá 102 chưa: DB mới áp 099 vẫn chạy --ghi được và làm vỡ khoá ngoại**
  Người dùng thấy gì: Công cụ gán phường vẫn chạy trên máy chưa áp bản vá mới nhất, và có thể dừng cả quá trình cập nhật tin nếu gặp phát biểu trỏ vào khu vực đã bị xoá. Người vận hành không được cảnh báo trước.
  Căn cứ: Chỉ xảy ra khi áp thiếu bước trên máy thật, đã có ghi chú thứ tự áp, và lỗi hiện ra ngay chứ không làm hỏng dữ liệu; người vận hành tự áp bản vá rồi chạy lại được.
  file: `pipeline/scripts/phuong-tu-du-an.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — PTD-AC-8 «chạy thử không đổi gì» chỉ có khẳng định âm, cùng ca không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm cho lệnh chạy thử có thể báo xanh dù dữ liệu thử không sinh ra gì để so sánh. Người dùng không gặp lỗi nào, chỉ là độ tin của phép kiểm yếu hơn.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, chỉ làm phép kiểm kém chắc; nhánh quan trọng hơn là lỗi giữa chừng đã có đối chứng, nên ghi lại và để sau.
  file: `pipeline/scripts/phuong-tu-du-an.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
