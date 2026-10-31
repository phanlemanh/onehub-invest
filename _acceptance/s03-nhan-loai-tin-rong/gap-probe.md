---
slug: s03-nhan-loai-tin-rong
at: 2026-10-31T10:30:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Luật đưa tin mới lên sale_offers (lên cloud, cổng Invest) mà sổ ghi kho_dao=false và không AC nào đo đường rút | Precision thấp, lùi bản mà tin suy vẫn nằm trên cổng | AC đo rút: bật rồi tắt suy loại trong ROLLBACK, tin chỉ gồm bài suy loại còn sống = 0, đối chứng dương | fixed: kiểm mã — reconcile_stale_offers (044) rút tin không còn trong lượt; dòng sổ mới ghi căn cứ trích 044, kho_dao giữ false; AC-9 và E9 thêm vế rút có đối chứng dương |
| P0 | design | Ngưỡng 20 bài / 85% và luật «cả hai giữ rỗng» là lựa chọn mà sổ ghi một-lối | Nhóm 30.001 bài dưới 85% thì bài giá không đơn vị bị bỏ, trái lời Mạnh | Tách dòng ngưỡng, trích căn cứ hoặc thành Hỏi kèm số đo | fixed: đo 31/10 theo thứ tự quyết mới — bước nhóm quyết 7 bài, giữ rỗng 12 bài trên 38.104 (mọi ngưỡng khác lệch tối đa 19 bài); dòng sổ mới supersedes d-…-4 nêu số; lối «coi là tin rao» chết vì kind chỉ bán hoặc thuê |
| P1 | evals | Tín hiệu bán «chuyển nhượng/giá tốt/hạ giá» cũng có ở tin thuê mà bước bán chạy trước đơn vị giá | «chuyển nhượng HĐ thuê 2PN 14tr» thành bán 14 triệu | Ô đối chứng ở E1; AC-9 chặn bán giá < 300tr | fixed: đổi thứ tự — đơn vị giá thuê xét trước tín hiệu bán (design, AC-1, AC-2, dòng sổ supersedes d-…-3); E1 thêm hai ô đối chứng; AC-9/E9 thêm vế bán < 300 triệu không tăng |
| P1 | contract | Đường đo precision thiếu tầng chu-bai; E10 không đo «chạy lại thêm 0 dòng» và «--thu» | Không so được precision cũ với mới; mẫu nhân đôi mà E10 xanh | Tầng chu-bai; ca DB chạy hai lần và --thu | fixed: AC-10 ba tầng bằng nhau (chu-bai, mới nhận, vẫn bỏ), công thức precision cũ/mới ở «Đường đo»; E10 chuyển sang bộ đối chiếu DB ROLLBACK với ca chạy hai lần và --thu |
| P1 | evals | Tỉ lệ nhóm «trong cùng lượt» có thể chỉ là bài mới của đêm | Bước nhóm không bao giờ chạy ở production | Ca một ngày trong E9, hoặc nói rõ lượt | rejected: kiểm mã — loadStgPosts nạp lại TOÀN BỘ stg_zalo_posts mỗi lượt (DISTINCT ON post_id), nên «lượt» là lịch sử nhóm; AC-3 và design bước 5 sửa chữ cho rõ |
