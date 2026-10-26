---
slug: auth-error-thu-lai-retry
at: 2026-10-26T11:05:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---
# Gap-probe — auth-error-thu-lai-retry

Phản biện context sạch (một tác tử tươi, chỉ đọc design doc, contract, evals, decisions và tệp bài học claim-scan).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract (sổ d-7, d-8) | Lý do bỏ ui-observed và lối chết của bỏ design-pass bị chính câu trích phủ định: tiền lệ compare-saved-trang-thai chọn chứng trên Next thật bằng chỉnh tạm có ảnh | Next không truyền retry cho error.tsx; bấm Thử lại trên /login thật không làm gì mà ca jsdom vẫn xanh vì tự cấp prop | Eval trên next dev: chỉnh tạm trang ném lỗi, bấm Thử lại, thấy request RSC mới, ảnh trước/sau | human-gate1: thành Hỏi-1 (dòng sổ mới supersedes d-8); d-7 viết lại bỏ vế sai (supersedes d-7); AC-1 + E1 đổi sang render ErrorBoundaryHandler thật của Next và đếm router.refresh |
| P0 | contract (sổ d-2) + evals E1 | Câu trích của d-2 quyết cho hai ranh giới lỗi khác, không cho (auth); cost_if_wrong hứa ca AER-AC-1 bắt được lệch tên prop trong khi fixture tự đặt tên retry | Next truyền prop tên khác; code và test cùng dùng retry nên cùng xanh | Ràng buộc với kiểu hoặc đường thật của Next; chiều đỏ khi đổi tên prop | fixed: dòng sổ mới trích Ngoài-5 (supersedes d-2), sửa cost_if_wrong; E1 render ErrorBoundaryHandler của Next nên tên prop do Next quyết |
| P1 | contract + evals | Không eval nào đo việc nối superseded_by và thứ tự ký → ghim lại → đẩy chưa khai | Gõ sai đích superseded_by hoặc quên ghim lại auth-hop-chuan; CI đỏ hoặc E4 treo không ai thấy | Script đọc evals.yaml của auth-hop-chuan bằng bộ đọc kit, kiểm status, superseded_by, AC-1, ca AH-AC-4 đã rời | fixed: thêm AC-4 + E5 (có chiều đỏ); Notes khai thứ tự ký → repin-lane --write → pre-merge-check → đẩy |
| P1 | contract AC-2 + evals E2 | Lời hứa không lệnh nào đổi nghĩa là quan hệ trước-sau, E2 chỉ so hai bộ đọc trên bản sau | Bộ đọc kit từng bỏ qua dòng thiếu dấu cách, sửa xong mới đọc — đổi hành vi mà E2 vẫn xanh | So resolveConfigKey của kit trên bản trước vòng và HEAD cho mọi khoá | fixed: AC-2 + E2 thêm ca so bc6e5120 với HEAD cho mọi khoá lá tới ba cấp (chiều đỏ: đổi một giá trị); ghi chú: bộ đọc kit đọc đúng methodology_design_gate cả trước khi sửa |
| P2 | evals E3 | E3 hứa suppressions không thêm khoá mà lệnh tsc + lint không đo điều đó | Thêm khoá miễn lint cho error.tsx; eslint 0 lỗi, E3 xanh | Đếm khoá suppressions của (auth), chiều đỏ trên bản sao | fixed: tách E4 (ca AER-AC-3 đếm khoá src/app/(auth)/ trong eslint-suppressions.json, có chiều đỏ); E3 chỉ còn kiểu + lint |
