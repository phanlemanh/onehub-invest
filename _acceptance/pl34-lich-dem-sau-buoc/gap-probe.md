---
slug: pl34-lich-dem-sau-buoc
at: 2026-11-09T06:10:00Z
verdict: findings
p0: 0
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Trục Job thiếu «không có snapshot Zalo mới»; không AC nào nói doc-gop-hang-ngay chạy hay bị bỏ ở đường thoát sớm. | Đêm không có snapshot mới, job thoát 0 trước mọi bước, đọc gộp đêm đó không chạy mà E1–E6 vẫn xanh. | Thêm vế cho AC-1 + ca PL34-AC-1 không mới có đối chứng ngược; một dòng sổ approach. | fixed: AC-1 thêm vế «không snapshot mới thì không chạy bước nào, kể cả doc-gop-hang-ngay»; E1 thêm ca «PL34-AC-1 không mới» có đối chứng dương; Notes ghi hệ quả; dòng sổ approach. |
| P1 | design | Tệp giả một dòng không round-trip với tệp bước thật; AC-3 chỉ đo chuỗi có mặt, không đo tệp thật chạy được trong ngữ cảnh job_run (cwd, env, ngày VN). | Tệp thật cần cwd hay biến mà job không xuất, hoặc tính ngày lệch; mỗi đêm JOB FAIL hay đọc sai ngày mà bảy eval vẫn xanh. | Eval chạy tệp thật trong cây tạm như dòng job_run, node giả ghi argv + cwd, giờ cố định; chiều đỏ đổi cwd. | fixed: AC-3 thêm vế chạy tệp thật trong cây job, E4 thêm ca «PL34-AC-3 tệp thật» (node -e chạy node thật, hai lời gọi doc-gop-s03.ts trong agent/ với ngày hôm qua, hôm kia VN, chiều đỏ đổi cd). rejected phần «thoát 0 khi chạm trần hay không bài»: mã thoát của doc-gop-s03 (3 = chạm trần) là tiêu chí đã ký của doc-gop-hang-ngay, JOB FAIL khi chạm trần là hành vi đã định. |
| P1 | evals | Dòng descope «bỏ coverage-scan» dựa vào lưới đỡ «suite scripts ở lượt chấm», mà không eval nào chạy cả suite; test ngoài scripts/ nhắc tệp bọc chưa được quét. | Một tệp test thứ năm hay test ở pipeline/ đọc zalo-import-daily.sh đỏ sau khi thêm bước; bảy eval vẫn xanh. | Eval chạy cả suite hoặc ca kê mọi tệp test nhắc zalo-import-daily.sh. | fixed: quét thật 09/11 ra bảy tệp (thêm nap-argmax, pipeline media-wiring, importer-bo-qua-du-lieu-thu — cả ba xanh trên nhánh); AC-4 kê đủ bảy; E8 chạy ba tệp thêm; E9 ca «PL34-AC-4 tập tệp» so tập quét với tập kê, chiều đỏ ghim tên tệp chưa kê. Suite lượt chấm (feature_loop.suite_keys) vẫn chạy cả bộ pipeline. |
| P2 | contract | AC-5 «không còn vi phạm nào» nhưng E7 miễn mọi dòng của slug; vế «lưới đọc được bảng thay» không có eval. | Lưới in thêm một vi phạm thật dưới tên slug, bị E7 nuốt; vế bảng thay xanh suông. | Ghim danh sách dòng miễn đúng chuỗi, hoặc bỏ vế bảng thay. | fixed: AC-5 bỏ vế bảng thay; E7 và khoá pl34_khong_lui miễn đúng hai dòng chờ so nguyên dòng (grep -vxF), mọi dòng khác của slug làm đỏ. |
