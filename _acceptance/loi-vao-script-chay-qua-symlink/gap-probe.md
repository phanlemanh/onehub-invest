---
slug: loi-vao-script-chay-qua-symlink
at: 2026-10-24T03:00:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | Quyết định để lượt đêm dọn dữ liệu không có dòng sổ, không căn cứ | Lần chạy đầu của 5 job câm ghi và xoá dữ liệu thật không ai trông | Dòng sổ trích quyết định đã ký | fixed: dòng sổ descope trích PL2 (Hỏi-1, Hỏi-2 Mạnh đã ký) — hàng này không ra quyết định xoá mới, chỉ để thiết kế đã ký chạy; Notes ghi giám sát theo dõi lượt đầu |
| P1 | contract | Thiếu bước pull checkout chính và hạn 05:15 | PR merge nhưng checkout chính chưa pull, job 05:30 vẫn câm | Bước ra-khỏi-kho có hạn | fixed: Notes «Ra khỏi kho» ghi pull trước 05:15 + dòng log cần thấy sau 00:00 và 05:30 (đo sau merge thuộc làn merge, không là eval trong kho) |
| P1 | contract, evals | Đường thật và đường tương đối không có AC; E4 dùng -e nên argv[1] rỗng | Khuôn mới hỏng khi gọi đường thật mà eval vẫn xanh | Ma trận 12 tệp × 3 cách gọi; runner thật cho E4 | fixed: AC-1/E1 thành 12×3 ô; AC-4/E4 dùng runner tạm gọi qua symlink và đường thật kèm đối chứng |
| P1 | evals | Quét theo dòng, bỏ collector/data-api/tools | Khuôn cũ tách dòng hoặc endsWith lọt | Quét theo tệp + ma trận mẫu đỏ | fixed: quét theo tệp, thêm collector/src, data-api/src, tools/; ma trận mẫu 6 ô (tách dòng, endsWith, realpath bọc nhầm vế) |
| P2 | evals, decisions | smoke-api-matrix chỉ đòi đầu ra khác rỗng; trích d-1 là chú thích | Cảnh báo stderr làm ô xanh dù main không chạy | Ghim chuỗi lỗi mạng | fixed: ghim chuỗi «fetch failed» hoặc «ECONNREFUSED» với OPS_API_TOKEN giả · rejected phần trích d-1: chú thích là chứng cứ kho đã chọn khuôn này cho đúng lỗi symlink |
