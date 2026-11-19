# Review findings: can-cung-tieu-chi-toan-tap (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Commit chứa next-env.d.ts do Next tự sinh, đường dẫn bị đổi từ bản dev sang bản build**
  Người dùng thấy gì: Một tệp cấu hình tự sinh bị đổi lẫn vào thay đổi này. Người dùng không thấy gì khác, chỉ làm lịch sử thay đổi rối hơn.
  Căn cứ: Không ảnh hưởng màn hình hay dữ liệu, tự quay lại khi chạy lại bản dev, và sửa lúc nào cũng rẻ.
  file: `app/next-env.d.ts`
  severity: low
  Đề xuất: known-limits

- **Mã sản phẩm bị nắn theo cách ca test chép trang và thay chuỗi nguyên văn**
  Người dùng thấy gì: Cách viết một số trang bị uốn theo bài kiểm thử, nên sau này ai sắp xếp lại mã có thể làm bài kiểm thử hỏng mà không rõ lý do. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Màn hình chạy đúng hiện tại, rủi ro chỉ nằm ở lần sửa mã sau và lúc đó bài kiểm thử sẽ báo đỏ nên không âm thầm mất dữ liệu.
  file: `app/src/app/ops/deals/[offerId]/page.tsx`
  severity: low
  Đề xuất: known-limits

- **Kiểu kết quả «Căn cùng tiêu chí» bị khai hai lần ở hai nơi**
  Người dùng thấy gì: Cùng một khuôn dữ liệu được khai ở hai chỗ, nếu sau này một bên đổi mà bên kia quên thì tab có thể hiện sai. Hiện hai bên đang khớp nên người dùng chưa gặp gì.
  Căn cứ: Hiện chưa gây lỗi nào cho người dùng và công cụ kiểm kiểu sẽ báo khi lệch, nên chấp nhận và dọn trong lần sửa kế tiếp.
  file: `app/src/components/ops/deal-similar.tsx`
  severity: low
  Đề xuất: known-limits

- **next-env.d.ts committed with the build-mode type paths, unrelated churn that flips on every dev run**
  Người dùng thấy gì: Một tệp tự sinh bị đổi lẫn vào thay đổi này và sẽ lật qua lại mỗi lần chạy. Người dùng không thấy ảnh hưởng nào.
  Căn cứ: Chỉ là nhiễu trong lịch sử thay đổi, không ảnh hưởng dữ liệu hay màn hình, và khôi phục lúc nào cũng rẻ.
  file: `app/next-env.d.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: ca HTML của AC-2/AC-3/AC-4 không đi vòng qua action thật**
  Người dùng thấy gì: Bài kiểm thử giao diện dùng dữ liệu tự viết nên nếu phần lấy dữ liệu đổi khuôn thì bài vẫn xanh trong khi tab có thể hiện sai số hoặc sai danh sách. Hiện chưa có bằng chứng tab hiện sai.
  Căn cứ: Rủi ro là bỏ sót lỗi trong tương lai chứ không phải lỗi đang có; lỗi nếu xảy ra sẽ lộ ngay trên màn và người dùng tải lại không mất dữ liệu.
  file: `app/tests/can-cung-tieu-chi-bam.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên ma trận kind × type × vị trí × tab nhưng chỉ có 10 điểm-case**
  Người dùng thấy gì: Bài kiểm thử chỉ đổi từng bộ lọc một, nên lỗi chỉ xuất hiện khi kết hợp nhiều bộ lọc (ví dụ chọn dự án rồi đổi tab) có thể lọt qua. Người dùng khi đó có thể thấy số hoặc danh sách lệch.
  Căn cứ: Chưa có lỗi thật được chỉ ra, màn chỉ đọc nên không mất dữ liệu và người dùng đổi lại bộ lọc hoặc tải lại là xem được.
  file: `app/tests/can-cung-tieu-chi.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 — E4 tuyên ba căn, test chỉ có hai (thiếu căn chưa gắn phường)**
  Người dùng thấy gì: Trường hợp căn chưa gắn phường chưa có bài kiểm thử riêng, nên nếu hiện sai câu «Chưa gắn phường» hay vẫn hiện nút mở rộng thì chưa ai biết. Đo thực tế cho thấy hiện chưa có căn nào như vậy.
  Căn cứ: Số liệu máy thu ghi 0 căn chưa gắn phường nên ít ai gặp, và nếu gặp thì chỉ là một câu chữ hay nút thừa, không mất dữ liệu.
  file: `app/tests/can-cung-tieu-chi.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 — probe E9 tuyên khớp «số bốn tab» nhưng chỉ so hai tab**
  Người dùng thấy gì: Phép đo trên dữ liệu thật mới đối chiếu số của hai trong bốn tab, nên số ở hai tab còn lại chưa được kiểm độc lập. Người vận hành có thể thấy số lệch mà chưa ai phát hiện.
  Căn cứ: Hai tab còn lại dùng cùng cách đếm với hai tab đã kiểm và chỉ là số hiển thị, tải lại sẽ tự đúng nếu dữ liệu đổi.
  file: `_acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.mts`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — đột biến AC-10 chỉ assert âm-tính bằng notEqual, không ghim thông điệp; kỳ vọng lấy từ hàm của màn**
  Người dùng thấy gì: Bài kiểm thử cho nút quay về «Căn giá tốt» có thể chấp nhận một đường dẫn sai miễn khác đường dẫn cũ. Nếu lỗi quay về sai trang xảy ra, người vận hành sẽ bị đưa nhầm trang rồi phải tự điều hướng lại.
  Căn cứ: Chỉ làm bài kiểm thử kém nhạy, người dùng nếu gặp chỉ cần bấm lại hoặc mở danh sách từ đầu và không mất dữ liệu.
  file: `app/tests/can-cung-tieu-chi.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 — E10 đo bản chạy dựng từ worktree khác (ops-deals-data-grid) tại sha ghim, không phải cây đang kiểm**
  Người dùng thấy gì: Ảnh chụp màn hình làm bằng chứng lấy từ một bản chạy ở thư mục khác tại một mốc cố định, nên thay đổi về sau không được phủ. Hiện mã giữa mốc đó và bản đang kiểm chưa khác nhau.
  Căn cứ: Hiện nội dung khớp nhau nên bằng chứng vẫn đúng, và chỉ cần chụp lại nếu mã đổi sau này.
  file: `_acceptance/can-cung-tieu-chi-toan-tap/evals.yaml`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/10 lỗi rơi vào file không bộ đo nào phủ (app/next-env.d.ts, _acceptance/can-cung-tieu-chi-toan-tap/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
