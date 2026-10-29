---
slug: so-cuoc-goi-ai
at: 2026-10-29T11:20:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Ngưỡng Hỏi-4 «khớp trace» không có đường đo; trace hiện không ghi token; bốn ô ngưỡng ở ô cơ hội để trống | Phiên nghiệm thu sau 7 ngày không có số để so, sổ thiếu dòng lọt qua | Mục Đường đo + lệnh đối chiếu; trace mang usage; điền ô ngưỡng | fixed: AC-2 thêm usage vào dòng final của trace; contract thêm mục «Đường đo» với lệnh doi-chieu.mjs; opportunity.md điền bốn ô ngưỡng (đề xuất, Hỏi-4 chờ Mạnh) |
| P1 | evals | E2–E4 chỉ đo đường tiêm recordCall, không đo đường mặc định agent thật dùng | Writer mặc định no-op, test vẫn xanh, production không ghi dòng nào | Eval backend-effect đường mặc định + đột biến no-op | fixed: thêm E13 (đường mặc định, kết nối riêng, đối chứng 'KHONG GHI SO MAC DINH'); AC-2 thêm vế đường mặc định |
| P1 | evals | Phần cloud của E8 đọc payload mẫu tự dựng; chế độ cloud không có ảnh chụp | Bên ghi và bên đọc lệch tên khoá, E8 vẫn xanh | Lấy khối từ chính đầu ra --kho; đối chứng đổi tên khoá | fixed: E8 dùng khối do push-ops-facts --kho sinh, render server chế độ cloud ba trạng thái, đối chứng 'LECH KHUON'; deferred: ảnh chụp chế độ cloud (cần app chạy với VERCEL=1 + ops_heartbeat) — chỉ có render HTML ở E8 |
| P1 | contract | AC-10 thiếu app/tests/ai-calls.test.tsx và tên tệp cấu hình | E12 báo ngoài phạm vi khi làm đúng E9 | Liệt đích danh tệp được phép | fixed: AC-10 thêm app/tests/ai-calls.test.tsx, agent/package.json + lock, _acceptance/config.yaml; E12 thêm đối chứng app/tests/x.test.tsx → ok |
| P2 | evals | Vế âm của E3 không có đối chứng dương với lỗi mang prompt | Bản cài chép err.message vào loi, lỗi API thật mang prompt bị ghi | Model giả ném lỗi mang PROMPT-MAU; đột biến err.message | fixed: E3 hai dạng lỗi mang PROMPT-MAU (message, responseBody), loi = tên lớp, đối chứng 'LOI CHEP PROMPT'; AC-3 ghi loi = tên lớp |

Ghi thêm (ngoài 5 finding): nhóm theo ngày giờ Việt Nam và lượt sát nửa đêm — fixed: AC-5 ghi «ngày (giờ Việt Nam)», ma trận có lượt sát nửa đêm.
