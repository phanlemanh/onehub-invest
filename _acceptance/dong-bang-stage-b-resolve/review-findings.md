## Trong hợp đồng

- **DBS-AC-7 (dong-bang-khong-ghi.test.mjs) sẽ đỏ vĩnh viễn trên main và trên mọi PR sau khi gộp, làm gãy job `scripts` của CI**
  AC: AC-7
  file: `scripts/dong-bang-khong-ghi.test.mjs:1087`
  severity: high
  source: conventions
  detail: Test nằm đúng glob `scripts/*.test.mjs`. Job `scripts` của `.github/workflows/ci-test.yml` (dòng 160) chạy glob này trên mọi PR và mọi lần push lên `main`. Test lấy `git merge-base HEAD origin/main`, diff từ đó tới cây làm việc, rồi đặt đối chứng dương `assert.ok(d.sua.includes("pipeline/resolve-properties.mjs"), "đối chứng: diff phải thấy tệp vòng đổi")`. Sau khi PR gộp, trên `main` merge-base bằng chính HEAD nên diff rỗng và assert ném lỗi. Với mọi nhánh sau không đụng `resolve-properties.mjs`, diff cũng không có tệp này nên cũng ném lỗi. Kết quả: CI đỏ cho cả kho, không chỉ cho vòng này. Kể cả khi bỏ đối chứng, `kiem()` vẫn chặn vĩnh viễn mọi câu `INSERT/UPDATE/DELETE` mới vào `properties`, `property_offers`, `review_queue` trong mã không phải test. Mà chính chuỗi GC0–GC3, DB1 (phần thay thế đã ghi trong hồ sơ) sẽ cần những câu ghi đó. Các test khác cùng vòng đã tránh bẫy này bằng cách ghim sha `GOC_VONG = 773a0040…` (`review-dong-bang.test.tsx`, `ops-local-dong-bang.test.mjs`, `resolve-properties-dong-bang.itest.mjs`, `judge-run-dong-bang.test.ts`). Riêng test này vẫn so với `origin/main`, nên lệch với mẫu chung của vòng. Mẫu cũ của kho (OD2-AC-7 trong `app/tests/ops-duyet-hop-hang-muc.test.tsx`) chỉ kiểm diff route rỗng, nên vẫn xanh sau khi gộp. Hướng sửa: ghim diff giữa `GOC_VONG` và đầu nhánh của vòng (hoặc giới hạn trong các commit của vòng), hoặc chuyển tệp ra khỏi glob `scripts/*.test.mjs`, chỉ chạy qua executor `dbs_khong_ghi` trong `_acceptance/config.yaml`.
  rationale: Phép kiểm AC-7 so cây của vòng với nhánh chính; sau khi gộp, phép so này rỗng và đối chứng dương ném lỗi nên AC-7 không còn đo được.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Smoke hàng duyệt (review_queue_smoke) vẫn so trang với mọi thẻ pending, gồm cả thẻ Ghép căn đã đóng băng, nên sẽ đỏ**
  Người dùng thấy gì: Hai bài kiểm nhanh trang duyệt thẻ có thể báo lỗi giả trên máy còn thẻ Ghép căn đang chờ, dù trang hoạt động đúng. Người dùng không thấy lỗi gì trên trang.
  Căn cứ: Chỉ làm bài kiểm phụ báo đỏ nhầm trên máy thu, không mất hay lộ dữ liệu, trang thật vẫn đúng; sửa sau không tốn kém.
  file: `scripts/smoke-review-queue.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): RK-AC-8 đếm thẻ = 0 cho cặp rx1|rx2, cặp mà bản cũ vốn cũng không gieo thẻ**
  Người dùng thấy gì: Một bài kiểm xác nhận hệ thống không còn tự tạo thẻ Ghép căn có thể vẫn xanh dù việc đóng băng hỏng ở một số tình huống. Người dùng không bị ảnh hưởng ngay.
  Căn cứ: Chỉ làm bài kiểm kém nhạy, không gây hại dữ liệu hay giao diện cho người dùng; bổ sung ca đối chứng sau rất rẻ.
  file: `agent/tests/judge-run.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): đối chứng đỏ RK-AC-8 là chuỗi đầu ra cũ gõ tay, và bộ đọc được nới để bắt đúng chuỗi đó**
  Người dùng thấy gì: Một bài kiểm dùng chuỗi mẫu viết tay thay vì đầu ra thật của bản cũ nên bằng chứng yếu hơn mong muốn. Người dùng không thấy tác động.
  Căn cứ: Mức nhẹ, chỉ giảm độ tin cậy của một bài kiểm, không có hậu quả với người dùng, chi phí sửa lớn hơn lợi ích.
  file: `agent/tests/judge-run.test.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion âm tính một mình): SL1-AC-3 mất đối chứng dương, «tin cấp thị trường không thành cặp» nay xanh vô điều kiện**
  Người dùng thấy gì: Một bài kiểm về tin cấp thị trường không còn chứng minh được luật loại tin này, vì việc dựng cặp đã đóng băng. Người dùng không thấy khác biệt.
  Căn cứ: Không ảnh hưởng dữ liệu hay giao diện vì cặp không còn được dựng; ca kiểm sẽ có ý nghĩa lại khi chuỗi gắn căn thay thế ra đời.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): quaHan = 0 ở DBS-AC-4 không có đối chứng cho thấy bản cũ ra 1**
  Người dùng thấy gì: Một bài kiểm số thẻ quá hạn chưa chứng minh được rằng phép đếm sẽ đỏ khi hỏng. Số hiển thị cho người dùng vẫn đúng.
  Căn cứ: Mức nhẹ, chỉ là kẽ hở nhỏ trong bài kiểm, số liệu người dùng thấy không sai, sửa không đáng công.
  file: `app/tests/review-dong-bang.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 (tuyên quét lớp nhưng không có ma trận toàn phần viết trước): DBS-AC-6 chỉ kiểm `ma.length >= 10` cộng 7 tệp phải có**
  Người dùng thấy gì: Nếu sau này có người thêm câu đọc thẻ chờ mới, bài kiểm có thể không báo, khiến thẻ Ghép căn đã đóng băng hiện lại ở một số số đếm. Hiện tại chưa có chỗ nào hở.
  Căn cứ: Rủi ro chỉ xảy ra khi có thay đổi sau này và chỉ lệch số đếm, người dùng tự thấy và sửa được; thêm danh sách đối chiếu sau không đắt.
  file: `scripts/ops-local-dong-bang.test.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/7 lỗi rơi vào file không bộ đo nào phủ (agent/tests/judge-run.test.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

