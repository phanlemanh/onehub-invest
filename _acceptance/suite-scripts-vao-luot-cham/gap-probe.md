---
slug: suite-scripts-vao-luot-cham
at: 2026-11-17T05:40:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

# Gap probe — suite-scripts-vao-luot-cham

Phản biện context sạch: một tác tử tươi chỉ đọc design doc, contract, evals, decisions và bài học xuyên hồ sơ
(claim-scan, advisory). Không đọc mã kho. Một lượt, không probe lại sau khi sửa.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Tập đọc chỉ là tham chiếu trực tiếp, không bao đóng qua chủ thể; đọc động chỉ bắt readdir, glob, git ls-files — sót template literal, import() động, exec find/grep/git; ma trận bảy tệp của AC-3 rút từ chính phép đếm readdirSync nên thước vòng tròn | foo.test.mjs gọi foo.sh, foo.sh chạy pipeline/bar.mjs; nhánh chỉ sửa bar.mjs → foo.test bị bỏ qua giả, CI đỏ sau chữ ký | AC bao đóng a.test → x.sh → pipeline/y.mjs có đối chứng; ma trận độc lập 43 tệp × lối đọc | fixed: AC-5 thành bao đóng qua chủ thể với kho thử a.test → x.sh → pipeline/y.mjs và đối chứng; AC-3 nhận thêm exec find/grep/git, template literal có biểu thức, import() không literal, và ma trận 43 dòng đọc tay TRƯỚC mã, không sinh từ bộ phát hiện; mỗi lối có bản sao tắt riêng làm chiều đỏ |
| P0 | decisions | Dòng d-5 khai mot-loi mà loi_chet ghi «chưa lối nào chết»; AC-7 không ngưỡng; lệch môi trường không AC nào đo | S3 chọn chạy tại chỗ, ảnh DB khác CI → xanh ở lượt chấm mà đỏ ở CI; hoặc chọn ci-test-local, chọn 42/43 tệp mà E7 vẫn xanh | Đổi nguồn d-5 hoặc nêu ràng buộc thật; ngưỡng viết trước cho AC-7; phép so đồng nhất môi trường | fixed: d-5 bị thay bởi dòng mới chốt chạy tại chỗ — đã kiểm DB máy thu cùng ảnh kartoza/postgis:17-3.5 với services của job, Node 24 trùng; ci-test-local chết vì chi phí cố định clone + npm ci không phụ thuộc số tệp chọn. AC-7 có ngưỡng: ≤ 15 tệp trên tệp cố định app/src/lib/ops/registry/doc.ts, giây ≤ 40% trọn bộ. AC-1 đo ảnh DB, bản chính Node và đầu ra thật |
| P1 | design | Rào trọn bộ không phủ hạ tầng của chính chuỗi bước CI: scripts/ci-db-init.mjs, ci-bo-qua.json, ci-test.yml, lockfile app | Nhánh sửa ci-db-init.mjs làm lược đồ DB trống khác đi → 30 tệp bị bỏ, đỏ ở CI | Ma trận mỗi tệp hạ tầng một assert, đối chứng tệp scripts thường | fixed: AC-4 và E4 phủ scripts/ci-db-init.mjs, scripts/ci-bo-qua.json, .github/workflows/ci-test.yml, package.json và package-lock.json của app, pipeline, agent, mỗi tệp một assert; đối chứng tệp scripts/ thường và scripts/lib-khac |
| P1 | evals | AC-6 không nói bộ chọn nào chạy trên đỉnh cũ; cả hai ca tái hiện đều qua rào, đường chọn từng tệp không có bằng chứng trên dữ liệu thật | Probe chạy suite-neu-doi.mjs cũ trong worktree cũ → chạy trọn bộ, E6 xanh vì lý do sai | Ghim cách chạy và in sha bộ chọn; ca tái hiện đi qua nhánh từng tệp trên kho thật | fixed: AC-6 và E6 chạy bộ chọn của HEAD với --root trỏ worktree cũ, in sha bộ chọn và lý do từng tệp, thoát 1 nếu sha khác HEAD; AC-5 và E5 thêm ca kho thật: với mỗi tệp trong 15 tệp có chủ thể cùng thân tên, diff chỉ sửa chủ thể → đúng tệp ấy được chọn với lý do «tập đọc», không qua rào |
| P1 | contract | AC-1 chỉ kê bốn bước, không nói phần nào của job phải khớp, phần nào được miễn; đo chuỗi lệnh chứ không đo cái thật sự chạy | Lệnh có CI=true nhưng DATABASE_URL vẫn trỏ DB máy thu → E1 xanh, lượt chấm đỏ giả như KDM-AC-3 | Ma trận mọi run, env, services.image, mỗi phần tử tương đương hoặc miễn có lý do; đo đầu ra thật | fixed: AC-1 và E1 thành ma trận mọi bước run, khoá env, services.*.image, mỗi phần tử một dòng viết trước «tương đương» hoặc «miễn: lý do»; đo đầu ra thật — DB test nối tới là DB vừa dựng, không phải oneinvest, và danh sách ca bỏ khớp ci-bo-qua.json |
