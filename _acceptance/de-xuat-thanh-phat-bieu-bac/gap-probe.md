---
slug: de-xuat-thanh-phat-bieu-bac
at: 2026-10-30T05:37:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E12 đếm `data_level_snapshot` — bảng migration không chèn dòng; dòng seed `ref_field_lookup`/`ref_lookup` mới là chỗ có thể nhân đôi | Seed không ON CONFLICT nhân nhãn bậc khi áp lần hai mà E12 vẫn xanh vì bảng ảnh chụp 0→0 dòng | Đếm `ref_lookup`, `ref_field_lookup` trước/sau lần áp hai, đúng một dòng gắn cột | fixed: AC-9 + E12 đếm ba bảng; executor `idem_056` thêm `ref_lookup ref_field_lookup` |
| P1 | contract | AC-5 hứa phân khúc đúng nhưng E5 chỉ đo tổng; cách lưu `chua-ro` trong khoá chính chưa định | Nối phường lên sai cấp hoặc lấy loại hình từ tin bất kỳ — tổng vẫn khớp, bảng phân khúc sai | Câu đếm độc lập theo phân khúc + fixture tin không phường | fixed: AC-5 ghi `market_id = 'chua-ro'` chữ, loại hình căn từ `properties`; E5 thêm dòng khớp từng phân khúc; E18 mới (fixture chua-ro, chiều đỏ ghim) |
| P1 | contract | Design tính `reverted` và khớp dự phòng theo ô·giá trị·phương pháp; contract loại `reverted`, AC-7 chỉ thử `proposal_id`; khớp dự phòng có thể nhận nhầm `legacy` | Phát biểu legacy cùng giá trị che một đề xuất applied thật sự thiếu phát biểu → dòng kiểm pass sai | Bốn dạng đề xuất applied (proposal_id · khớp dự phòng · chỉ legacy · không gì) | fixed: một phạm vi ở cả design lẫn contract — chỉ `applied`, khớp dự phòng không bao giờ nhận `legacy`; AC-7/E7 bốn dạng, chi tiết `applied=4 missing=2` |
| P1 | design | Sổ d-8 ghi máy quyết chỗ chạy (cloud-sync) bằng một-lối trong khi lối chotot-daily còn sống; mã thoát khi dòng kiểm fail chưa ghim | Dòng kiểm fail làm cloud-sync báo JOB FAIL mỗi 15′ dù đồng bộ tốt, hoặc vi phạm nằm im | Hỏi người chỗ chạy; ghim mã thoát | human-gate1: Hỏi-3 (dòng sổ mới `supersedes` d-8); fixed: AC-7 + AC-9 ghim dòng kiểm fail vẫn thoát 0, chỉ lỗi chạy khác 0 |
| P2 | evals | Ma trận AC-1 chỉ một dạng «thiếu» mỗi trường; giá 0, diện tích 0, loại hình unknown/rỗng không có ô | SQL viết `IS NOT NULL` cho giá còn levelOf `> 0` — 64 ô vẫn khớp, máy thu báo hai bậc cho cùng tin | Ô biên viết trước + chiều đỏ giá 0 | fixed: AC-1 thêm 5 ô biên × gắn/chưa (74 ô); E1 chiều đỏ ghim 'ô lệch: giá 0' |
