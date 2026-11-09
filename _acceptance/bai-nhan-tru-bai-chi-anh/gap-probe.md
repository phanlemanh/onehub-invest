---
slug: bai-nhan-tru-bai-chi-anh
at: 2026-11-09T00:20:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Sổ d-3 ghi máy chọn mẫu số «bài nhận − ảnh đã ghép» (ảnh chưa ghép và Yêu cầu vẫn trong mẫu số, S03 ≈ 55%) — đó là nghĩa sản phẩm chỉ người có; câu trích chỉ quyết nhãn nút, không quyết mẫu số; vế SỐNG/CHẾT [đề xuất] của opportunity.md đọc được theo nghĩa bỏ mọi bài chỉ-ảnh | Cổng Phạm vi duyệt bản 55% vì sổ ghi máy đã quyết; Cổng Giá trị đặt số cạnh ngưỡng CHẾT «mẫu số vẫn lẫn bài chỉ-ảnh» thì kill | Dòng Hỏi nguồn chi-nguoi kèm 55% và 71,4%, thêm câu Yêu cầu có trong mẫu số không | fixed: d-3 bị thay bởi hai dòng Hỏi (ảnh chưa ghép · Yêu cầu) mang số 54,9% / 71,4% / 63,2%; Hỏi-1 nêu rõ vế SỐNG/CHẾT [đề xuất] chỉnh theo câu trả lời |
| P1 | evals | E10 đối chiếu imageMerged bằng chính baiAnhCuaTin (vòng tròn); một lỗi chia sai ảnh đã ghép / chưa ghép giữ nguyên tổng nên E10 vẫn xanh. (Vế «bài chỉ-ảnh trong post_ids làm E10 đỏ oan» không đúng: phép đếm SQL đã loại bài thành tin) | Bỏ điều kiện «bài chữ thành tin» ở bộ ghép — tổng hai nhánh ảnh không đổi, E10 xanh, mẫu số trên trang sai | Phép đếm SQL độc lập riêng cho imageMerged (≤ 120 giây, cùng người, cùng nhóm, bài chữ gần nhất trong post_ids), đối chứng đỏ riêng | fixed: E10 thêm đếm SQL ảnh đã ghép viết lại luật PL28 (khớp 24.054 trên DB thử) + thông điệp 'ANH GHEP LECH DEM SQL'; '--doi-chung-hong=anh/ghep/yeu-cau' đỏ đúng từng thước |
| P1 | evals | E5 không assert loại nút (gộp, nhánh, rơi) hay màu; E11 không đo phân biệt bằng mắt; sổ chưa có dòng design-pass [gan-can-dinh-danh-duy-nhat#F2] | buildFlow gắn «Yêu cầu mua/thuê» vào loại rơi — số đúng, E5/E11 xanh, người vẫn đọc Yêu cầu là bài mất | Ma trận nút → loại + chiều đỏ; E11 thêm vế phân biệt bằng mắt; dòng sổ design-pass | fixed: E5 ma trận năm nút → loại + ba biến màu khác nhau, đỏ 'YEU CAU TO MAU ROI'; E11 thêm vế phân biệt gộp/nhánh/rơi ở 1280 sáng và 375 tối; sổ thêm dòng chạy design-pass |
| P2 | evals | Không eval nào chứng mọi lối gọi 600 đi qua bộ chạy — lối gọi trần có lịch sẽ ghi null đè | Một script có lịch chạy psql -f 600 sau cloud-sync → trang lúc có nhánh lúc không | Ca liệt kê lối gọi 600 trong scripts/, pipeline/ + đối chứng lối gọi trần giả | fixed: E4 thêm ca lối gọi (danh sách miễn viết trước) + đỏ 'LOI GOI 600 TRAN' |
| P2 | evals | E6, E7 dùng khối viết tay; chưa có đường từ khối do bộ chạy sinh tới lưới nhóm thu và ô «Chặng theo ngày» | groupRows đọc nhánh từ dòng nguồn — E6, E7 xanh, lưới nhóm thu sai mẫu số | Ca trên khối do bộ chạy sinh từ fixture E1 + đỏ 'NHOM DOC NHANH NGUON' | fixed: E6 thêm ca trên khối bộ chạy sinh (nguồn và từng nhóm thu S03) + đỏ 'NHOM DOC NHANH NGUON'; E7 dựng trên khối bộ chạy sinh |
