# Review findings: trang-chu-methodology (round 1)

## Trong hợp đồng

- **Hình dạng 5: smoke hứa từng chỗ có link /methodology nhưng chỉ đếm tổng cả trang**
  file: `scripts/smoke-trang-chu-methodology.mjs:65`
  severity: medium
  AC: AC-2
  source: measurement
  detail: AC-2 hứa trang chủ, navbar marketing và chân trang chung ĐỀU có href="/methodology". E4 ghi «navbar + Cách dùng + hỏi đáp + chân trang ≥ 4 chỗ». Dòng 65 chỉ kiểm `nHome >= 4` trên toàn HTML. Trang chủ hiện có 5 chỗ: NavigationMenuLink của navbar, 2 link trong how-it-works.tsx (dòng 33 và 48), nút «Đọc phương pháp» của FAQ, chân trang. Mất link ở navbar HOẶC ở chân trang thì vẫn còn 4 và check vẫn xanh. Dòng 59 có cùng lỗi: «/methodology chân trang có href=/methodology» được đo bằng `count(mk, …) >= 1` trên cả trang, mà navbar của trang đó đã có link này, nên chân trang mất link vẫn đạt. Cần một assert cho mỗi vùng (header/nav, how-it-works, FAQ, footer), không đếm gộp có chừa dư.

- **Hình dạng 5: hứa «mọi stop/stroke» dùng var() nhưng ngưỡng ≥ 14 thấp hơn số phần tử thật (16)**
  file: `app/tests/trang-chu-methodology.test.tsx:192`
  severity: medium
  AC: AC-5
  source: measurement
  detail: AC-5/E8 hứa MỌI màu của bản vẽ nền là var(--color-<sắc>-<bậc>). FrameBackdrop có 2 + 7 + 6 = 15 stop (field, BOTTOM_BLOOM, RIGHT_BLOOM) cộng 1 stroke, tức 16 chỗ màu. Test chỉ kiểm `used.length >= 14`, không đếm stop/stroke rồi so bằng. Vậy 2 chỗ có thể dùng màu không phải biến palette mà vẫn xanh. Ví dụ màu tên như `stopColor="white"` hay `navy`: HARD_COLOR (dòng 179) chỉ bắt #hex, rgb(, hsl(, oklch(, nên `hardColors(out)` cũng không bắt. Ma trận phải là mỗi <stop>/stroke vẽ ra đều có var palette (số assert bằng số phần tử), không phải một ngưỡng tối thiểu viết tay.

- **Hình dạng 3: hứa mỗi lớp palette có cặp dark: nhưng chỉ kiểm chuỗi có một lớp dark: nào đó**
  file: `app/tests/trang-chu-methodology.test.tsx:210`
  severity: low
  AC: AC-6
  source: measurement
  detail: AC-6 hứa «mọi lớp màu palette có cặp dark: trong cùng chuỗi», tức mỗi lớp palette ứng với một lớp dark:. `unpairedPalette` (dòng 205-211) chỉ loại chuỗi không có lớp dark: nào: `!toks.some((t) => t.startsWith("dark:"))`. Chuỗi như "bg-indigo-100 text-indigo-700 dark:bg-indigo-950" thì text-indigo-700 không có cặp mà vẫn đạt. Chiều đỏ ở dòng 235 chỉ thử ca chuỗi không có dark: nào, nên không chứng được việc ghép cặp.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **config.yaml: thiếu dấu cách sau dấu hai chấm ở khoá methodology_design_gate nên tệp không còn là YAML hợp lệ**
  Người dùng thấy gì: Khách dùng trang chủ và trang Phương pháp không bị ảnh hưởng. Chỉ có rủi ro cho người vận hành: nếu công cụ nghiệm thu sau này đọc tệp cấu hình bằng bộ đọc chuẩn, cả cổng nghiệm thu có thể báo hỏng.
  Căn cứ: Không đụng tới khách; hiện cổng vẫn chạy bình thường, và lỗi chỉ lộ ra ở phía vận hành nếu công cụ đổi cách đọc, nên có thể ghi lại và sửa sau với chi phí rất thấp.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **catalog.md ghi luật «error.tsx của mỗi nhóm cổng truyền retry, không reset» nhưng (app)/error.tsx và ops/error.tsx vẫn dùng reset**
  Người dùng thấy gì: Ở khu Invest-app và khu Ops, nút «Thử lại» khi gặp lỗi dữ liệu vẫn chỉ vẽ lại phía trình duyệt nên lỗi có thể lặp lại cho tới khi tải lại trang. Tài liệu mô tả như thể đã đổi hết.
  Căn cứ: Khách tự gỡ được bằng cách tải lại trang, không mất dữ liệu, và việc này đã được hợp đồng chủ động để cho nhóm trang app xử lý riêng.
  file: `.claude/skills/onehub-ui/catalog.md`
  severity: low
  Đề xuất: known-limits

- **config.yaml: thiếu dấu cách sau dấu hai chấm ở methodology_design_gate làm cả file thành YAML không hợp lệ**
  Người dùng thấy gì: Khách dùng trang chủ và trang Phương pháp không thấy gì khác. Chỉ người vận hành có thể gặp lỗi nếu công cụ nghiệm thu đọc tệp cấu hình theo cách chuẩn hơn.
  Căn cứ: Không ảnh hưởng người dùng cuối, hiện cổng vẫn chạy và sửa rất rẻ, nên ghi lại là đủ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **smoke-trang-chu-loi-db: khối finally chờ sự kiện 'exit' đã phát rồi, nên khi `next start` chết sớm thì log lỗi và danh sách FAIL bị mất**
  Người dùng thấy gì: Khách không bị ảnh hưởng. Khi bài kiểm tra trang lỗi lúc cơ sở dữ liệu sập tự thất bại sớm, người chạy kiểm tra mất phần giải thích nguyên nhân dù vẫn thấy kết quả đỏ.
  Căn cứ: Chỉ làm người kiểm tra khó tìm nguyên nhân hơn, không mất dữ liệu và không cho kết quả xanh giả; chạy lại là xem được.
  file: `scripts/smoke-trang-chu-loi-db.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3: hứa so le chẵn/lẻ nhưng chỉ kiểm lớp có mặt, không kiểm lớp vắng ở ô khác**
  Người dùng thấy gì: Nếu có ô nào mang thừa đường kẻ hoặc thụt lề sai, lưới định nghĩa trên trang Phương pháp có thể trông lệch nhẹ ở khổ rộng mà bài kiểm tra không báo.
  Căn cứ: Chỉ là lệch thẩm mỹ nhẹ, nội dung vẫn đọc đầy đủ, không mất dữ liệu và sửa sau rất rẻ.
  file: `app/tests/trang-chu-methodology.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/8 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
