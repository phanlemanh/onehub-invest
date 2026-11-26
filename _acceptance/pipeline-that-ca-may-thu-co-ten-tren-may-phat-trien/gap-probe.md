---
slug: pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien
at: 2026-11-26T09:23:19Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design · contract AC-4 | Khối s03 «không đo được» trên M5 nhưng không AC nói các ca s03 xanh thật hay tự bỏ qua khi thiếu tệp | Ca s03 lặng lẽ qua nhánh thiếu tệp trên M5 mà không tên, không đếm | Số pass/skip theo lượt M5 | rejected: lượt M5B đo thật 38 ca, 37 xanh, 0 bỏ qua, 1 đỏ — «không đo được» là khối bên trong ON22-AC-10, không phải ca khác; E5 nay ghim tests 37 và một dòng bỏ qua |
| P1 | evals E5 | E5 không ghim sha được chấm, số ca, môi trường | Tệp cũ hay lượt bỏ thêm ca vẫn qua | sha mã cuối, tests 37, vai, không CI | fixed: AC-5/E5 đòi sha commit mã cuối, «vai may-phat-trien», tests 37, fail 0, không CI=true, chiều đỏ |
| P1 | contract AC-3 · evals | Vế lượt soát hằng ngày ở Mac mini chạy đủ ca không có eval trên tệp thật | Tệp thật lệch, máy thu bỏ ON22-AC-10 mỗi ngày mà xanh | vaiMay() thật trên Mac mini | fixed: AC-6 + E6 chạy vaiMay() không đối số trên máy chấm (Mac mini), đòi may-thu |
| P2 | evals E2 | Không kiểm bỏ qua thật qua skip-pattern khớp chuỗi con | Mẫu khớp tên ca khác, bỏ hơn 1 ca | Tệp giả hai ca tên gần | rejected: nodeOptions neo mẫu ^…$ và thoát ký tự đặc biệt (ci-can-du-lieu.mjs); E5 ghim tests 37 trên lượt thật |
| P2 | evals E4 · E1 | Thiếu ô may_thu không phải chữ và các dạng ghi VAI= thật | true lọt; tệp M5 có ngoặc nên không nới | Ma trận thêm ô | fixed: E1 mười một ô (ngoặc, export, CRLF, khoảng trắng, trùng dòng), E4 thêm khoảng trắng, số, true |
