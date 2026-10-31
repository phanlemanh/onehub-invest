---
slug: proxy-anh-chan-svg
at: 2026-10-31T01:10:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ chọn 415 ghi «một lối» nhưng lối «SVG trả 502 như bảng HD10» vẫn sống; ô cơ hội không quyết mã nào | Người ký tưởng 415 là lối duy nhất; hành vi 415 chưa ai duyệt | Thay dòng sổ bằng căn cứ có quyết 415, hoặc thành câu Hỏi; xác nhận thẻ duyệt xử 415 như 502 | fixed: dòng d-20261031T005347Z-9 thay d-20261031T005148Z-3, căn cứ là câu giao hàng HD16 trong docs/plan/lo-trinh.json («SVG và kiểu ảnh lạ trả 415»); Notes ghi thẻ duyệt dùng img nên 415 và 502 cùng hiện «ảnh hỏng» |
| P1 | evals | E5, E6 gọi thẳng serveZaloMedia, không đo route handler thật | Route dựng Response mới làm rơi nosniff và CSP mà E5, E6 vẫn xanh | Gọi GET của route với Request thật, hoặc đo route trả nguyên phản hồi lõi | fixed: thêm E8 (portal_static mục 6 — route trả thẳng serveZaloMedia(req, user), có chiều đỏ sẵn); AC-5 thêm vế route không dựng phản hồi mới |
| P1 | evals | Vế «không ca nào bị sửa kỳ vọng» của E7 không đo được; «55 ca» viết cứng | Ca HD10 đỏ ở S3, người làm sửa kỳ vọng cho xanh, hồ sơ HD10 đổi nghĩa không ai duyệt | git diff tệp test HD10 rỗng; số ca so với base | fixed: thêm E9 (git diff --exit-code 6b610913 tệp test HD10); E7 bỏ số viết cứng |
| P2 | evals | E2 chỉ kiểm tên máy, thân 415 không ghim nguyên văn | Thân 415 in pathname hay query của URL nguồn mà E2 vẫn xanh | Ghim thân bằng chuỗi hằng; chiều đỏ nối pathname | fixed: AC-2 và E2 ghim thân «định dạng ảnh không được phép», kiểm không chứa pathname/query, thêm chiều đỏ «PAS-AC-2 thân lộ đường» |
