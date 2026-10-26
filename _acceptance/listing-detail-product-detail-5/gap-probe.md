---
slug: listing-detail-product-detail-5
at: 2026-10-25T09:52:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-6, d-9) + contract AC-4 | d-6 ghi nguồn mục-tiêu nhưng câu trích routes.md không quyết việc gỡ badge đặc điểm khỏi PageHeader (lựa chọn người dùng thấy); d-9 trích cổng 3460 không quyết nấc nac-1; vế «PageHeader một badge» của AC-4 không eval nào đo [nhom-s03-tren-cloud#F1] | Mạnh ký mà không được hỏi việc gỡ badge; bản cài để sót badge lẫn dòng vẫn xanh | d-6 thành câu chỉ-người; d-9 đổi căn cứ; ca đếm badge PageHeader | fixed: d-11 thay d-6 thành Hỏi-3 (chi-nguoi); d-12 thay d-9 (mot-loi, loại nac-0/2/3 có lý do); ca LD-AC-5 assert stats PageHeader = ['Nguyên căn'] (E7) |
| P0 | design (sổ d-1) | d-1 mot-loi chỉ giết nút tay và ToggleGroup; Tabs và Button aria-pressed còn sống [audit-all-doc-log-o-checkout#F1] | Người duyệt tưởng không có lựa chọn ngữ nghĩa | Viết lại căn cứ | fixed: d-10 thay d-1, loi_chet nêu vì sao Button aria-pressed (bật/tắt độc lập + luật ReUI cấm ép h/px/rounded) và Tabs (một TabPanel mỗi tab, gallery một ô ảnh chung) chết |
| P1 | evals E12, E13 (AC-7) | Vế lỗi tại vùng mượn ca CS-AC-6 của hồ sơ khác, không ghim chữ lỗi từng vùng; không đo comps có dữ liệu trên Next thật | Truyền nhầm chữ lỗi hay ListingComps rỗng sai trên Next thật mà E12/E13 vẫn xanh | Ca lỗi từng vùng + dòng smoke comps n ≥ 1 | fixed: LD-AC-8 thêm what = ['chỉ số của listing','listing tương tự'] + render vùng KPI ném lỗi cạnh vùng comps lành (1 alert, Thử lại, vùng kia đứng); smoke thêm 'comps: <n> hàng' (E13); AC-7 ghim chữ lỗi |
| P1 | evals E5, E6 (AC-3) | Nhánh lỗi trước hydrate (ref kiểm complete + naturalWidth) không có phép đo tất định | Phần kiểm ref hỏng, prod để lại ô vỡ, E6 vẫn xanh vì dev rơi vào onError | Ca jsdom stub complete/naturalWidth, không phát error; chiều đỏ gỡ kiểm ref | fixed: ca 'LD-AC-4 ảnh lỗi TRƯỚC hydrate' (E5); phá-thử gỡ kiểm ref → đỏ với thông điệp ghim |
| P2 | evals E9 (AC-5) | Vế tooltip tóm tắt mở bằng bàn phím không đo | Trigger mới chỉ mở khi hover, người dùng bàn phím mất tóm tắt | Smoke Chromium focus bằng Tab, chờ tooltip | fixed: smoke thêm dòng tooltip «Công suất …» mở khi focus bằng Tab — eval E21 |
