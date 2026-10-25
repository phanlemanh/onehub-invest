## Trong hợp đồng

- **ci-test-local: phép so 'tập ca bỏ qua khớp danh sách' gần như luôn đúng, không đo được gì**
  file: `scripts/ci-test-local.mjs:127`
  severity: low
  source: bugs
  AC: AC-6
  detail: `r.boQua` lấy từ dòng stderr của chính helper (`bỏ qua ${all[mod].length} ca`). Helper đọc đúng tệp scripts/ci-bo-qua.json trong bản clone, mà `ds` cũng đọc từ tệp đó. Vì vậy `r.boQua === ds.length` luôn đúng khi job tới được bước test. Nửa còn lại (`vanChay`) chỉ bắt chiều «ca trong danh sách vẫn chạy». Nó không bắt chiều ngược lại: skip-pattern lọc nhầm thêm ca ngoài danh sách. Theo luật khớp của node:test, mẫu khớp tên cha hoặc tên kèm tổ tiên thì cả cây con bị bỏ. Như vậy dòng 'ok … tập ca bỏ qua khớp scripts/ci-bo-qua.json' được in ra mà không chứng điều nó nói. Muốn đo thật thì đếm số ca thực chạy (ℹ tests) ở chế độ CI so với chế độ không CI, chênh lệch phải bằng đúng ds.length.
  rationale: AC-6 đòi «tập ca bỏ qua thực tế khớp đúng scripts/ci-bo-qua.json», mà phép đo hiện là đếm tự báo nên không chứng được vế này.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc, không round-trip qua writer thật): nhánh «không CI» đưa cờ ci=false trực tiếp, không đi qua CLI đọc biến CI**
  file: `scripts/ci-test-module.test.mjs:138`
  severity: medium
  source: measurement
  AC: AC-4
  detail: Lời hứa AC-4 là «chỉ khi CI=true thì bỏ qua». Workflow lấy NODE_OPTIONS bằng `opts="$(node ../scripts/lib/ci-can-du-lieu.mjs <module>)"`, tức CLI tự đọc `process.env.CI === "true"` (ci-can-du-lieu.mjs dòng 51). Trong test, `chay(ci)` (dòng 137-138) dựng NODE_OPTIONS bằng `nodeOptions(list, ci)` với cờ ci do test truyền tay. Dòng 156 cũng vậy: `assert.equal(nodeOptions(all.app, false), "")`. Biến môi trường `CI: ci ? "true" : ""` truyền cho tiến trình con không có tác dụng gì, vì node --test không đọc CI. CLI chỉ được gọi một lần với CI=true (dòng 145). Không lần nào chạy CLI khi CI rỗng hay chưa đặt. Hệ quả: nếu CLI bỏ qua biến CI và luôn in skip-pattern, ca «AU11-AC-4 không CI → ca vẫn chạy và đỏ như cũ» vẫn xanh. Đối chứng «helper không nuốt lỗi ở local» mà evals E4 tuyên bố không đo đường thật.
  rationale: Chiều đỏ của AC-4 là «không CI trên DB trống thì ca vẫn đỏ (helper không nuốt lỗi ở local)», mà test hiện không chạy đường thật của helper khi CI rỗng.

- **Hình dạng 6 (đường dẫn ROOT, đo checkout của tác giả thay vì cây đang kiểm): workflow đọc từ cây làm việc ROOT còn mã chạy là bản clone HEAD**
  file: `scripts/ci-test-local.mjs:109`
  severity: low
  source: measurement
  AC: AC-6
  detail: Dòng 109 `yaml.load(readFileSync(WF, "utf8"))` với `WF = path.join(ROOT, ".github/workflows/ci-test.yml")` đọc tệp workflow từ cây làm việc của tác giả, gồm cả thay đổi chưa commit. Trong khi đó, mã được chạy là bản `git clone` HEAD (dòng 116 chế độ sạch, 134 --agent-types, 149 --cay), và bản clone có `.github/workflows/ci-test.yml` của riêng nó. Bằng chứng in 'bản sạch: clone <sha>' (dòng 118) như thể mọi thứ được đo ở sha đó, nhưng bước `run:`, node-version và services lại lấy từ checkout của tác giả. Khi workflow có sửa chưa commit, kết quả AC-5/6/7 là của một cấu hình không tồn tại ở sha được báo. Cách sửa là đọc workflow từ `path.join(repo, ".github/workflows/ci-test.yml")` của bản clone.
  rationale: AC-6 đòi chạy lại trên git clone sạch với lệnh, node-version, services rút từ chính workflow, nhưng script đọc workflow từ cây làm việc của tác giả thay vì bản clone.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thăm dò CI commit bằng --no-verify, bỏ qua hook git-secrets trước khi đẩy lên kho công khai**
  Người dùng thấy gì: Các commit thăm dò đẩy lên kho công khai không đi qua bước quét khoá bí mật. Hiện nội dung đẩy lên chỉ là chuỗi cố định, không chứa khoá, nên chưa có gì bị lộ.
  Căn cứ: Hậu quả nhẹ vì nội dung đẩy lên là chuỗi cố định, không có dữ liệu thật, và nhánh thăm dò bị xoá sau khi dùng; sửa rẻ nhưng không đáng mở việc riêng.
  file: `scripts/ci-test-github.mjs`
  severity: low
  Đề xuất: wont-fix

- **ci-db-init: migration đã khai (031) nuốt mọi lỗi câu lệnh, không đối chiếu lỗi thật với lý do đã khai**
  Người dùng thấy gì: Nếu sau này có thêm một câu lệnh hỏng khác trong migration đã được khai là lỗi sẵn, kiểm tra CI vẫn báo xanh. Một lỗi mới có thể lọt qua mà không ai biết.
  Căn cứ: Chỉ lọt lỗi mới nằm trong đúng một tệp migration đã biết là hỏng, không mất dữ liệu người dùng; lỗi sẽ lộ khi vá tệp đó, và có thể ghi vào các hạn chế đã biết rồi sửa khi đụng tới tệp này.
  file: `scripts/ci-db-init.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): «mỗi luật có chiều đỏ» trong khi 3/11 luật không có đột biến nào**
  Người dùng thấy gì: Ba loại sửa workflow (thêm `|| true`, thêm điều kiện bỏ bước, đổi khoá kích hoạt) chưa được thử để chứng minh bộ kiểm tra bắt được. Nếu luật kiểm tương ứng hỏng, nó vẫn báo xanh.
  Căn cứ: Bộ kiểm tra vẫn bắt đủ các chiều đỏ mà hợp đồng liệt kê; chỗ hở chỉ ảnh hưởng độ tin cậy của vài luật phụ, không mất dữ liệu, và bổ sung đột biến sau này rất rẻ.
  file: `scripts/check-ci-test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

