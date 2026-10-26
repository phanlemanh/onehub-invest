---
slug: do-khu-vuc-tu-dung-moi
at: 2026-10-26T12:45:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Mốc thước lệch dời từ DB thật sang kết quả lượt nền — «0 tin hợp lệ bị gỡ hay đổi» chỉ còn đo tính lặp lại của transform, không còn đo lời hứa đã ký của E8 mà §3 nói AC-2 đo lại; số tin lượt nền cho nghỉ không in ra. | Một PR làm transform gỡ phường một phần tin S05 hợp lệ ở cả hai lượt: chụp trước đã thiếu, chụp sau thiếu y hệt, thước báo 0, E2 xanh, E8 đã trỏ sang AC-2, lượt đêm gỡ phường tin người dùng thấy. | Chụp gốc trước lượt nền; AC-2 thêm dòng lượt nền so DB thật theo nguồn; chiều đỏ tiêm transform gỡ area_id. | fixed: design §2 bước 1–2 + AC-2(a) — chụp gốc trong transaction trước lượt nền, kiểm 0 tin hợp lệ bị gỡ hay đổi trên lượt nền và in số tin cho nghỉ mỗi nguồn (dòng sổ «thước lệch giữ mốc DB thật»). Chiều đỏ của thước dùng lại đối chứng dương sẵn có (tin bị gỡ nhãn giả lập → thước gọi đúng offer_id), không tiêm transform hỏng. |
| P1 | contract | Khu vực mồi không buộc mang đúng tên phường trong chữ của tin mồi, S06 không chép hình học; chiều đỏ duy nhất bỏ hẳn transform nên không chạm bộ lọc phường hợp lệ. | Gỡ bộ lọc phuongHopLe ở pipeline/lib/osm.mjs: tin mồi về phường thật X vì khu vực mồi mang tên Y, E1–E4 vẫn xanh, cái hỏng AC-8 cũ canh lọt. | Khu vực mồi mang đúng tên phường nền của tin mồi, chép geom; thêm ca đỏ tắt bộ lọc. | fixed: design §2 bước 3 + AC-1/AC-3 — mỗi tin mồi một khu vực mồi đúng tên phường nền, chép geom, id xếp hai đầu; chiều đỏ `--pha mo-loc` (sáu khu vực mồi mang meta phường hợp lệ trong lượt đo) phải đỏ ở dòng «tin trỏ khu vực mồi». |
| P1 | evals | E4/AC-4 chỉ đếm số dòng ba bảng; không thấy UPDATE area_id hay retired_at bị commit ngoài transaction; bảng khác transform ghi không đếm; chiều đỏ khai trong expected không có ca dựng. | Transform mở pool riêng, commit việc cho nghỉ tin S03/S05 lên DB thật; số dòng không đổi, dòng ROLLBACK xanh, sync cloud đẩy tin nghỉ lên cổng. | Băm có thứ tự các bảng transform ghi, ngoài transaction; ca đỏ một UPDATE commit ngoài. | fixed: AC-4/E4 — băm sáu bảng (sale_offer_records, property_offers, property_candidates, review_queue, enrichment_proposals, areas) + dòng ops_audit transform; danh sách rút từ câu ghi của transform, write-offers và hàm SQL 044. Ca đỏ là ca thuần của hàm so băm (một bảng băm khác → FAIL gọi tên bảng): commit thật lên DB dùng chung không được phép. |
| P1 | evals | E3/E5 nhận «ca … ok» exit 0 nhưng node:test in «ok … # SKIP» exit 0 khi ca bị bỏ qua; E5 là ca tĩnh mà chung tệp với ca DB bị bỏ ở CI. | Ca KDM-AC-3 bị SKIP ở nơi thiếu stg: «ok … # SKIP», exit 0, E3 PASS dù chiều đỏ chưa chạy. | Expected đòi không «# SKIP»/«# TODO», đếm pass theo số ca; E5 ngoài danh sách bỏ qua CI. | fixed: expected E3/E4/E5 đòi không «# SKIP»/«# TODO» và «ℹ skipped 0»; E5 ghi rõ ca không nằm trong scripts/ci-bo-qua.json. |
| P2 | contract | Dòng sổ d-2 (muc-tieu) trích câu của hồ sơ ranh-gioi-khu-vuc-dung cho script khác — chỉ liên quan, không quyết. | Người duyệt hay máy kiểm căn cứ đọc d-2 thấy căn cứ trỏ hồ sơ khác, đánh trượt hay hỏi lại. | Thay căn cứ bằng câu giao của Mạnh. | fixed: dòng sổ mới supersedes d-20261026T122010Z-2, căn cứ đổi sang một-lối (lối dựa vào DB thật đã chết sau lượt dọn AU9) — câu giao nằm ở thư mục đợt ngoài kho nên không trỏ được làm tệp căn cứ. |
