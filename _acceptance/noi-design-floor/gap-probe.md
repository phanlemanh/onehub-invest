---
slug: noi-design-floor
at: 2026-10-29T11:05:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Dòng chọn liệt kê dương ghi một-lối nhưng lối «chờ kit có K1» và lối «dời vendor» vẫn sống; căn cứ thật là kế hoạch kit#308 (mục tiêu). Dòng chọn đường không số cũng chỉ dựa vào lời dặn, lối chép script vào scripts/ chưa bị loại. Cùng lớp [don-hex-tho#F1], [don-clone-tam-design-floor#F1]. | Cổng Phạm vi đọc «chỉ một lối», Mạnh không thấy đánh đổi; căn cứ #308 không truy được từ sổ. | Dòng mới supersedes với nguồn mục tiêu trích ý định, hoặc nêu ràng buộc giết các lối còn lại. | fixed: dòng mới supersedes d-2 nguồn mục tiêu trích ý định đợt «nối M1 bằng liệt kê dương»; dòng mới supersedes d-3 nêu ràng buộc giết lối chép script (bản chép kit phải giữ đồng bộ tay) và lối đường có số (#171) |
| P1 | evals | E4 chạy floor trên diff không chạm tệp giao diện nên xanh cả khi floor không đọc surface_globs; vế docBac thôi báo «chưa khai floor» không có eval. | Floor resolve sai hay bỏ qua --root vẫn thoát 0; sàn coi như nối mà không chặn gì. | Cặp đầu-cuối chạy design-floor-s4 trên bản sao tạm: hex dưới finder → chặn, dưới ui → không; ca docBac. | fixed: AC-4/E5 thêm chayS4 của kit trên kho git tạm (hex dưới components/finder → dòng hex thô + mã chặn; dưới components/ui → 0 dòng) và docBac(kit).floor khác rỗng |
| P1 | evals | E3 không buộc test nạp pathGlobToRe của kit; bộ khớp tự viết là fixture đúng khuôn bên đọc. | Kit đổi nghĩa của * mà bộ khớp tự viết vẫn đếm 240; vendor lọt lại vùng giao diện. | Nạp hàm khớp của kit qua resolve-plugin; không nạp được thì đỏ ghim. | fixed: AC-3/E3 nạp pathGlobToRe từ lib/evidence-core.cjs của kit qua resolve-plugin (đường không số); máy local thiếu kit → đỏ ghim; CI không cài kit → bỏ qua có lời |
| P1 | evals | E6 chỉ chạy lại thước của vòng, không chạy bộ test scripts hay lưới trước gộp như AC-5 hứa. | Config đổi làm test scripts khác hay hồ sơ đã ký hoá cũ mà E6 vẫn xanh. | Eval chạy node --test scripts/*.test.mjs; eval lưới trước gộp. | fixed: E6 đổi sang config:executors.test.scripts (node --test scripts/*.test.mjs); lưới trước gộp bỏ khỏi AC-5 bằng dòng descope có tên (lúc S4 hồ sơ chưa có bằng chứng nên lưới tất đỏ cho chính nó) |
| P2 | evals | Chiều đỏ của AC-2 chạy trên danh sách thư mục giả, bỏ qua bộ liệt kê thật; nguồn liệt kê chưa khai. | Bộ liệt kê lọc sai mà chiều đỏ vẫn xanh. | Chiều đỏ trên bản sao mkdtemp có thư mục thật, qua cùng hàm liệt kê; khai rõ nguồn liệt kê. | fixed: AC-2/E2 khai liệt kê bằng readdir (chỉ thư mục) và chiều đỏ chạy trên bản sao mkdtemp có thư mục thật moi-khong-khai/x.tsx qua cùng hàm |
