# Review findings: ops-review-khung-hang-cho (round 3)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — Fixture VIẾT TAY đúng khuôn bên đọc: chuỗi «tự tin NN%» trong căn cứ chưa bao giờ đi qua writer basisOf**
  Người dùng thấy gì: Hiện thẻ duyệt không hiện độ tự tin cho người duyệt. Nhưng nếu sau này bên sinh căn cứ đổi cách viết câu chữ, con số tự tin có thể lại hiện ra trên thẻ mà bài kiểm tra không báo.
  Căn cứ: Hôm nay người dùng không thấy độ tự tin nên chưa có hại nào xảy ra, chỉ là rủi ro về sau nếu cách viết căn cứ thay đổi; nếu lộ thì chỉ là một con số hiện thừa, không mất hay lộ dữ liệu nhạy cảm, và sửa lại khá rẻ khi biết nguyên nhân.
  file: `app/tests/review-queue.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Lời hứa là quan hệ «căn cứ AI = nguyên văn trừ vế tự tin», nhưng giá trị kỳ vọng lại tính bằng chính hàm đang kiểm**
  Người dùng thấy gì: Phần căn cứ của AI trên thẻ hiện vẫn đủ tên mô hình và dấu vết. Nhưng bài kiểm tra chưa đủ chặt: nếu về sau phần này bị cắt quá tay thì người duyệt sẽ thấy căn cứ thiếu mà không có cảnh báo nào.
  Căn cứ: Hôm nay người duyệt vẫn thấy đủ căn cứ nên chưa ai bị ảnh hưởng; nếu có hỏng về sau thì chỉ là thẻ hiển thị thiếu chữ, không mất dữ liệu, người dùng không bị quyết định sai ngay, và sửa lại rẻ.
  file: `app/tests/review-queue.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhãn UI mới chưa có thuật ngữ trong CONTEXT.md (r1 · tệp đã đổi)**
  Người dùng thấy gì: Các nhãn mới trên trang Hàng duyệt như «Ghép căn», «Bổ sung tin», «Loại thẻ» chưa được ghi vào bảng từ vựng chung, nên sau này người khác có thể gọi cùng một khái niệm bằng chữ khác nhau.
  Căn cứ: Chỉ là thiếu tài liệu từ vựng, người dùng không thấy lỗi nào trên màn hình và việc bổ sung sau rất rẻ, không mất dữ liệu.
  file: `app/src/lib/ops/review-queue.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ giữa các giá trị): RQ-AC-3 chỉ kiểm nhãn tĩnh, còn fixture Tin A/Tin B có giá trị y hệt nhau (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tự động cho khung chi tiết thẻ ghép căn chưa phân biệt được tin A với tin B, nên nếu sau này hai tin bị hiện lẫn bên nhau thì không có gì báo động.
  Căn cứ: Màn hình hiện tại chưa thấy sai, đây chỉ là lưới an toàn còn mỏng; người dùng không bị mất dữ liệu và bổ sung bài kiểm sau khá rẻ.
  file: `app/tests/review-queue.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo bản đang chạy trên cổng chung thay vì cây đang kiểm): smoke đo BASE_URL mặc định ui1.localhost:3460 mà không xác minh server đó phục vụ worktree đang kiểm (r1)**
  Người dùng thấy gì: Phép kiểm trình duyệt có thể đang đo nhầm bản của một nhánh khác chạy cùng cổng, nên kết quả xanh chưa chắc nói đúng về trang Hàng duyệt đang nghiệm thu.
  Căn cứ: Rủi ro chỉ xảy ra khi có hai nhánh cùng chạy trên một cổng, người duyệt nhìn lại được bằng cách chạy lại đúng nhánh; không ảnh hưởng dữ liệu hay người dùng cuối.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
