---
slug: dong-du-lieu-that-neu-lan-do-moi-nhat
at: 2026-11-26T03:10:00Z
verdict: findings
p0: 0
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Bốn eval chung một lệnh, không eval nào chứng ca HT30-AC-n có mặt và đã chạy | Ca bị đổi tên hay skip mà lệnh vẫn xanh, bốn eval PASS dù AC không đo | Đầu ra reporter có đúng tên từng ca, pass, không skip | fixed: mỗi expected đòi ca tên HT30-AC-n pass, không skip |
| P1 | contract | Không ca nào đọc sổ thật; dòng sổ khuôn cũ thiếu ca_do có thể làm hỏng dòng in | Sổ thật có dòng thiếu ca_do, dòng in sai hay ném lỗi dù fixture xanh | Chạy trên bản chép sổ thật; ca dòng thiếu ca_do | fixed (một phần): dòng thiếu ca_do đọc như rỗng, có ca test; deferred: đối chiếu sổ thật — sổ chạy trên máy thu, không tất định trong test, ghi Out of scope |
| P2 | evals | Trục tên ca thiếu ô một tên và biên ba tên | Lệch một ở chỗ cắt lọt qua vì ca bốn tên vẫn đúng | Ma trận 1 · 3 · 4 tên | fixed: E1 ma trận 1 · 3 · 4, ô 3 tên không có «(+» |
| P2 | design | Chưa nói cách xử lý dòng sổ hỏng | Dòng cuối cắt dở bị bỏ qua, lần đỏ đang ghi bị giấu | Ca [xanh, dòng cuối cắt dở] | fixed: AC-4 thêm dòng cuối hỏng → «không đọc được sổ (dòng cuối hỏng)», dòng giữa hỏng bỏ qua |
