## Trong hợp đồng

- **Khối catch nối Postgres nuốt mọi lỗi rồi bỏ qua ca DL- như thể «không có Postgres :5433»; executor dau_luoc_do vẫn thoát 0**
  AC: AC-9
  file: `scripts/db-thu.test.mjs:458`
  severity: medium
  source: bugs
  detail: Trong chayMaTran(), `try { qt = await noi("postgres"); } catch (e) { if (process.env.CI === "true") throw ...; return null; }` bắt mọi lỗi từ noi(), không riêng lỗi máy chủ không nghe. noi() gọi luôn `createRequire(app/package.json)("pg")` bên trong khối try đó. Vì vậy cả ba trường hợp sau đều thành null, rồi mọi ca DL-AC-1..7, 9 gọi t.skip("không có Postgres :5433"): thiếu module pg (worktree mới chưa có app/node_modules, symlink gãy), sai mật khẩu hay sai DL_PG_ADMIN (28P01), DB postgres không tồn tại. Máy chủ vẫn chạy nhưng lý do in ra lại sai. Ở máy (không CI), lệnh `node --test --test-name-pattern=^DL- scripts/db-thu.test.mjs` thoát 0 khi mọi ca bị skip, nên E1–E7 và E9 của evals.yaml (kỳ vọng «exit 0») có thể ghi bằng chứng xanh mà không ca nào chạy. Hợp đồng chỉ cho phép bỏ qua khi «không nối được server». Cách sửa: chỉ trả null khi lỗi là lỗi kết nối (ECONNREFUSED, ENOTFOUND, ETIMEDOUT); còn lại ném lỗi. Nạp pg ngoài khối try.
  rationale: AC-9 chỉ cho bỏ qua khi máy không có server, nhưng khối catch cũng bỏ qua khi server có mà lỗi mật khẩu hoặc thiếu module, nên bằng chứng xanh có thể không có ca nào chạy.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ca DL- dùng biến DL_PG_ADMIN tự đặt, không theo quy ước TEST_DATABASE_URL_ADMIN của các test tự CREATE DATABASE**
  Người dùng thấy gì: Trên máy dùng Postgres ở địa chỉ khác, bộ kiểm lược đồ thử nối nhầm chỗ nên không chạy được. Trên máy thường và trên CI thì không ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng cách cấu hình test ở máy lạ, không mất dữ liệu và CI vẫn xanh, nên ghi lại là đủ.
  file: `scripts/db-thu.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: docker giả trả một dòng nên DL-AC-8 ghim định dạng `--dau` trái với đầu ra thật**
  Người dùng thấy gì: Nếu ai đó vô tình bỏ dòng báo chế độ chỉ đọc khỏi lệnh in dấu, bài kiểm nhanh vẫn xanh. Chỉ phép đo trên DB thật mới phát hiện.
  Căn cứ: Phép đo trên DB thật vẫn bắt được lỗi này nên rủi ro thấp, và sửa sau không tốn kém.
  file: `scripts/db-thu.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — đếm đủ ma trận là phép đếm rỗng: `dem` luôn bằng độ dài mảng nó vừa lặp, không ghim số phần tử viết trước**
  Người dùng thấy gì: Nếu ai đó xoá bớt một tình huống khỏi danh sách kiểm, bộ kiểm vẫn xanh và không báo thiếu độ phủ.
  Căn cứ: Chỉ làm yếu khả năng phát hiện việc xoá ca về sau, người dùng không bị ảnh hưởng, và dễ bổ sung khi cần.
  file: `scripts/db-thu.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 — đo chỉ dẫn thay vì đầu ra: «test chỉ nối DB của nó» kiểm danh sách tự ghi của hàm noi(), không kiểm kết nối thật trên máy chủ**
  Người dùng thấy gì: Bộ kiểm khẳng định chỉ chạm DB riêng của nó dựa trên chính lời khai, nên khó phát hiện nếu có kết nối lạc sang DB khác.
  Căn cứ: Hiện chưa có dấu hiệu nối nhầm DB thật, nên rủi ro thấp và đo kỹ hơn sau cũng không đắt.
  file: `scripts/db-thu.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
