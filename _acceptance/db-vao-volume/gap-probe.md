---
slug: db-vao-volume
at: 2026-10-29T08:30:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design | Container kiểu cũ của tập dượt không mang nhãn compose thật; không ca nào đo bản lùi sống sót khi compose project `db` chạm vào nó trong 7 ngày giữ | Checkout còn compose cũ cấu hình lệch chạy `up -d` hay `down` → compose xoá bản lùi; E8/E10 vẫn xanh | Dựng container kiểu cũ bằng compose cũ thật; ca `down` từ compose cũ; thêm lưới thứ hai nếu ca đỏ | fixed: tập dượt dựng bằng compose cũ thật; ca «compose cũ down xoá bản lùi» đo rủi ro; thêm tar lạnh `datadir-17.tar` + sha256 và `--lui --tu-tar` (AC-6, AC-8, E10, design §3.3–3.6); runbook + tin liên làn cảnh báo (AC-10) |
| P1 | evals | E13 hỏi «không xấu hơn trước», «ngoài cửa sổ», «bảng chính» mà inputs không có mốc trước, lịch plist, danh sách loại trừ | Hội đồng FAIL vì thiếu mốc sau khi chuyển thật đã xong, hoặc PASS theo lời tự thuật khi danh sách loại trừ nuốt cả `sale_offers` | Mốc `ops-check-truoc/sau.log` vào inputs; log ghi bảng cửa sổ + danh sách loại trừ; ca máy cấm bảng canonical trong danh sách | fixed: design §4 thêm mốc trước; E13 inputs thêm hai log và câu hỏi nêu đích danh; E15 + đột biến `loai-canonical` ở E2; AC-1/AC-2/AC-10 sửa lời |
| P1 | evals | E7 thiếu ca đỏ cho tiến trình đang chạy, đĩa, bản sao lưu quá 24 giờ, cụm đã chuyển; thiếu đối chứng dương cho cửa sổ | Chuyển giữa lúc `chotot-daily.sh` đang transform; `pg_ctl stop -m fast` ngắt phiên giữa chừng mà E7 vẫn xanh | Thêm bốn ca đỏ ghim + đối chứng dương giờ ngoài cửa sổ | fixed: AC-5 kể đủ tám điều kiện; E7 thêm các ca và đối chứng dương; design §3.3 điều kiện 1, 5, 6 |
| P1 | contract | AC-1 hứa `live` của db-tu-khoi-dong xanh nhưng không eval nào chạy nó | Sau chuyển container do project `onehub-db` tạo; `live` của hồ sơ đã ký đỏ trên main mà Gate 1 tưởng đã đo | Eval `config:executors.script.db_autostart_live` sau chuyển + mốc trước | fixed: E14 (sau chuyển, mốc `autostart-live-truoc.log`); AC-1 nói rõ trước và sau lượt chuyển thật |
| P2 | evals | E5 hứa đếm cùng snapshot mà không có cơ chế chen ghi lẫn đột biến | Script đếm ở giao dịch riêng vẫn qua E5; tới bản thật lệch số dòng, không có `khoi-phuc-ok` | Móc `DB_SAO_LUU_SAU_SNAPSHOT_HOOK` chen INSERT; đối chứng đỏ đếm ngoài snapshot | fixed: E5 + AC-3 + design §3.6 |
