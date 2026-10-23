---
slug: freshness-do-gio-thu-that-s03
at: 2026-10-23T12:20:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract + sổ d-3 | Bỏ coverage-scan ghi mot-loi mà loi_chet không nêu ràng buộc; tiền đề «đếm hết bằng bảng §1» chưa chứng; cost_if_wrong trùng ngưỡng CHẾT | Một mã khác còn đo giờ nạp, vòng xanh hết, ngưỡng CHẾT vi phạm im | Dòng thay d-3 + eval liệt kê mã → cột | fixed: dòng sổ mới thay d-3 (descope có phép đo thay thế); thêm AC-8/E8 ma trận mã → cột đối chiếu TIME_SOURCE và SQL probe thật, chiều đỏ bản sao đổi probe |
| P1 | contract + evals | Ngưỡng CHẾT không có đường đo; AC-4 chỉ đo phép so SLO, không đo cột nào được đọc | S02 thực chất đo giờ nạp mà E4/E7 vẫn xanh | Bảng mã → cột + test đọc probe thật | fixed: AC-8/E8 + dòng Đường đo cho ngưỡng CHẾT; design §1 trích transform-airdna.mjs:70 (gán fetchedAt cả khi upsert lại) |
| P1 | design + evals | Ngữ nghĩa upsert Zalo (snapshot_id có đổi không) bị «…» che; fixture không round-trip writer thật | Mốc S03/S05 sai hướng khi nạp lại mà E2/E3 vẫn xanh | Trích nguyên dòng upsert; round-trip importer thật | fixed (một phần): design + AC-2 trích nguyên dòng upsert Zalo (KHÔNG đổi snapshot_id) và Chợ Tốt (CÓ đổi); AC-1 chạy importer THẬT import-chotot.mjs trên schema tạm (nạp, nạp lại, nạp mới); deferred: round-trip import-airbnb.mjs cho Zalo (nhiều loại item + media) — ghi ở Notes contract |
| P1 | evals E6 + contract AC-6 | last không ghi múi giờ; tên ca lệch quy ước GT-AC-n | Người chấm so «11:00» với chuỗi UTC và chấm sai | Ghim cả UTC và +07; đổi tên ca | fixed: AC-6/E6 ghim 2026-10-21T11:00Z (UTC = 18:00 +07); ca chẩn đoán riêng 'GT-AC-6 DB hiện tại' |
| P2 | evals E6 | Lối «nguồn thật đổi trạng thái» không phân biệt được với code sai | Hồi quy lọt sang ngoài hợp đồng | In giờ nạp/giờ thu/số hàng lệch snapshot từng mã; luật xếp loại | fixed: GT-AC-6 in nạp/thu/lệch-snapshot cho S03/S05/S06; chỉ xếp «nguồn đổi» khi thu của S05 khác 2026-10-21T11:00Z |
