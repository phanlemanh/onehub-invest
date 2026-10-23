---
slug: enrich-hau-ky
at: 2026-10-23T02:00:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

# Phản biện context sạch — enrich-hau-ky

Tác tử mới, chỉ đọc design doc · contract.md · evals.yaml · decisions.jsonl + input thứ 5 (claim-scan).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-2) | Tự áp lại quyết định đã duyệt của X lên offer kế Y (giá/diện tích/loại tin khác) là đánh đổi chỉ người chốt, sổ ghi máy quyết; quy tắc chọn Y khi post tách chưa đo [enrich-qua-de-xuat#F3] | Tin sửa diện tích → house người duyệt cho X bị ghi thẳng vào Y không ai xem | Dòng chi-nguoi Hỏi-3; E2 thêm ca post tách Y1/Y2 | fixed: dòng d-…-16 supersedes d-2 thành Hỏi-3 (khuyến nghị tự áp); AC-2 nêu quy tắc tách; E2 thêm biến thể tách + hoà |
| P0 | design (sổ d-10) | Câu trích chỉ quyết «tên nhóm không ra land»; thu hẹp từ khoá trong tin + phủ quyết + thứ tự quét là đánh đổi độ nhạy chưa ai duyệt | Người ký luật mới không thấy bao nhiêu tin đổi kết quả | Tách d-10: (a) muc-tieu tên nhóm; (b) chi-nguoi kèm số đo DB local | fixed: d-…-17 (muc-tieu) + d-…-18 (Hỏi-4, đo 735 tin: khuyến nghị đổi 57 kết quả đều là land; lối khác thêm 50 apartment→house); design §2.3 viết lại theo khuyến nghị; AC-9 + E9 thêm phép so «chỉ land đổi» trên DB local |
| P1 | contract AC-6 + evals E6 | Không có ma trận viết trước từ câu ghi thật của apply_enrichment; property_type/block chưa đo ở properties | Căn liên kết còn land sau hoàn tác mà E6 vẫn xanh | Ma trận field × bảng, số assert = số ô | fixed: design §2.2 bảng 5 field × sale_offers/properties (rút từ 033); AC-6 trỏ ma trận; E6 ma trận 5 dòng + chiều đỏ ghim 'AC-6 ma trận: properties.bedrooms' |
| P1 | contract AC-4 + evals E4 | «Đủ để khôi phục» chưa đi qua đường ghi thật; khoá RESTRICT đòi X tồn tại | Khôi phục thật lỗi 23503, giá trị enrich của X mất | Round-trip: X sinh lại rồi chèn từ audit | fixed: design §2.1 thêm quy trình khôi phục + chụp cột enrich của X (không cột người bán); AC-4 thêm vế khôi phục; E4 round-trip qua writeOffers + jsonb_populate_recordset |
| P1 | evals E7 | Đường CLI không --dry không có ca; chiều đỏ không thể đỏ | --ids phân tích sai, hoàn tác nhầm id mà E7 xanh | main(argv, client) trong transaction; chiều đỏ gỡ unique index | fixed: E7 gọi đường thật qua main(argv, client) trong BEGIN…ROLLBACK + tiến trình con khởi lệnh; chiều đỏ DROP INDEX enrichment_proposals_uq |
