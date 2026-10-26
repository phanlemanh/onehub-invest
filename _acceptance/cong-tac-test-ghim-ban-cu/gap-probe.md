---
slug: cong-tac-test-ghim-ban-cu
at: 2026-10-26T16:05:00Z
verdict: findings
p0: 2
p1: 1
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | căn cứ chọn fixture trích lệ aer-ac2 vốn chọn sha cố định đọc bằng git, không quyết giữa fixture và git show sha cố định | Mạnh ký vì tưởng lệ buộc fixture; AC-1 khoá một phía bằng trích dẫn không quyết điều đó | thay câu trích bằng câu quyết fixture thay git, hoặc đưa thành câu hỏi | fixed: dòng sổ mới (supersedes -2) trích lệ so-tu-vung-mot-nguon — fixture thay git lúc chạy vì gãy khi clone nông |
| P0 | design | căn cứ một-lối của việc dời bản chép sang app/tests chưa chứng tiền đề tsc/lint không quét app/tests | bản sót ở app/tests vẫn làm lint đỏ mà E3 vẫn xanh | ca đặt tệp lỗi kiểu ở hai chỗ, chạy tsc + eslint | fixed: đo 26/10 — tsc bỏ qua tệp chấm-đầu ở cả hai chỗ, eslint quét cả hai; bỏ việc dời chỗ và AC-3 (dòng descope supersedes -3) |
| P1 | evals | E3 âm tính không đối chứng dương, đo chuỗi có mặt; git ls-files --others kéo tệp rác | dời bản chép về src mà E3 vẫn xanh, hoặc E3 đỏ oan trên máy dev | kill giữa chừng rồi soát chỗ; dùng find | fixed: E3 bỏ cùng AC-3 |
