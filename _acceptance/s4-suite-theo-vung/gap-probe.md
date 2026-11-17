---
slug: s4-suite-theo-vung
at: 2026-11-10T14:07:57Z
verdict: findings
p0: 1
p1: 4
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Thiết kế §2 nói loại docs/ROADMAP.md, LO-TRINH.html khỏi vùng pipeline, ngược với sổ d-3 (giữ chúng) | Hàng chỉ sửa ROADMAP làm đỏ DV1-AC-8 mà lượt chấm in bỏ qua pipeline | Một dòng sổ nhất quán + ô ROADMAP trong ma trận E3 | fixed: thiết kế sửa theo sổ d-3 (giữ trong vùng, ghi hệ quả đo); mã đã giữ cả hai tệp; ma trận E3 thêm ô docs/ROADMAP.md (pipeline chạy, năm suite kia bỏ qua) — 24 ô |
| P1 | contract | «Chưa có mã» chỉ xét tiền tố _acceptance/; đầu vòng nhánh còn tài liệu thiết kế, kế hoạch | Đường nền đầu vòng bỏ qua cả sáu suite, nền xanh rỗng nghĩa | Ca E4: hồ sơ + docs/superpowers/specs + docs/plan/lo-trinh.json → chạy | fixed: định nghĩa đổi thành «không tệp nào ngoài _acceptance/ thuộc vùng của bất kỳ suite nào»; AC-4 + E4 thêm ca đúng ba tệp đó |
| P1 | evals | E6 ghim băm khối executors.test.* — hàng này và mọi hàng sau thêm key mới | E6 đỏ trên nhánh hoặc chặn mọi PR sau trên CI | Ghim quan hệ; chiều xanh thêm executors.test.moi | fixed: test S4V-AC-6 kiểm quan hệ (lệnh bọc = lệnh hiện hành), thêm chiều xanh executors.test.moi; vế «không đổi byte» đo một lần bằng probe so merge-base (không vào CI) |
| P1 | evals | Không ca nào chạy lệnh bọc trên worktree có symlink node_modules do bước dựng tạo | Mẫu node_modules/ chỉ khớp thư mục thật, symlink hiện là tệp chưa theo dõi trong vùng app/pipeline nên mọi lượt luôn chạy | Ca: .gitignore node_modules/ + symlink app/node_modules, diff collector → bỏ qua app | fixed: tepDoi loại đường có đoạn node_modules; ca S4V-AC-1 (symlink); phá bộ lọc → ca đỏ (đã chứng) |
| P1 | contract | Lock lệch vẫn nối node_modules về checkout chính, chỉ cảnh báo | S4 đỏ/xanh giả trên gói cũ; npm ci qua symlink ghi vào node_modules checkout chính (launchd) | Then cho ca lệch + ca E7 đếm mục node_modules checkout chính | fixed: lock lệch → không nối thư mục đó, in «lock lệch: <thư mục>», bỏ tsc, thoát 3; AC-7 + E7 thêm ca, đếm mục checkout chính trước/sau |
