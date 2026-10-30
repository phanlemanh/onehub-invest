---
slug: s03-gia-ty-sau-khoang-trang
at: 2026-10-30T04:20:00Z
verdict: findings
p0: 2
p1: 1
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ d-3 ghi `mot-loi` nhưng chỉ loại lối «không điều kiện»; điều kiện chọn vẫn để lọt SĐT 3-3-3 + đuôi sau «số đứng riêng + dấu chấm» («… 2.098.765.432 1»), hợp đồng đẩy ca này ra Out of scope không dòng sổ; lý lẽ 3-3-3 / 3-3-4 tự mâu thuẫn với AC-2 | Tin «Cho thuê 9tr, LH 2.098.765.432 1» đọc ra giá tỷ, bị chốt khoảng bỏ hoặc nhận giá sai; không AC nào đo, E6 chỉ có bài tổng hợp «50m2.» | Thay d-3 bằng dòng supersedes, loại từng lối thay thế hoặc chuyển phần dư thành câu Hỏi; sửa lý lẽ 3-3-3 / 3-3-4 | fixed: thêm điều kiện nhóm cuối «000» (chặn «2.098.765.432 1»), AC-2 thêm dòng ấy và dòng «50m2.098.765.000 1» (mỗi điều kiện một dòng chỉ nó chặn, mỗi dòng một ca đỏ); d-3 thay bằng dòng mới supersedes, lối «theo chữ đứng sau đuôi» ghi lý do chết; phần dư hẹp còn lại (SĐT 3-3-3 nhóm cuối 000 sau số đứng riêng) ghi Out of scope — hẹp hơn dạng khuôn vòng trước đã ký giữ lại; design sửa lý lẽ 3-3-4; E6 bài tổng hợp đổi sang «LH 2.098.765.432 1» |
| P0 | design | Dòng sổ d-2 trích câu chỉ quyết giữ PHONE_RE/extractPhones, không quyết tập ký tự cách đuôi gồm cả «-» và «.»; ô cơ hội chỉ nói khoảng trắng | Gate 1 duyệt phạm vi rộng hơn ô cơ hội mà không ai quyết; dạng gạch/chấm làm lọt SĐT không truy được | Dòng sổ riêng cho tập ký tự cách, hoặc thu về khoảng trắng và đưa dòng gạch ra Out of scope | fixed: thu nhánh đuôi về khoảng trắng/xuống dòng; dòng sổ mới supersedes d-2, căn cứ câu hỏi phép đo của ô cơ hội; dòng gạch rời AC-1 sang Out of scope |
| P1 | contract | Dòng «3.000.000.000-3.500.000.000» không có trong bảng khớp SĐT của design, hợp đồng không ghi đáp án | E1 đỏ hoặc đáp án chọn sau khi chạy code (đo vòng tròn) | Ghi khớp thật vào design, ghi đáp án hoặc bỏ dòng | fixed: dòng rời AC-1 (gạch ngoài vòng); khớp thật «000.000.000-3» in từ lần chạy match, ghi vào bảng design và Out of scope |
| P2 | evals | E3 so mảng viết tay thay vì quan hệ trước/sau; ca đỏ không mô phỏng lối (a); chuỗi ghim không nằm trong ma trận | Đáp án viết tay chép từ code mới, E3 xanh mà quan hệ không được chứng | So extractPhones bản nền ec899d03 với bản cây ở 15 dòng; ca đỏ dùng lối (a), ghim một dòng trong ma trận | fixed: AC-3/E3 so extractPhones bản cây với bản nền ghim ec899d03 (git show; CI fetch-depth 0) ở 15 dòng; ca đỏ lối (a) — PHONE_RE thôi nhận khoảng trắng — ghim «liên hệ.0901 234 567» (dòng AC-2) |
| P2 | evals | Nhãn E6 chỉ ràng buộc giá, không ràng buộc trường khác | Bài thật giá đúng nhưng diện tích/số phòng đổi sai vẫn tính là đổi hợp lệ | Trường khác giá chỉ được đổi từ null sang đúng số đuôi | fixed: nhãn E6 đòi mọi trường khác bị đổi chỉ đổi từ null sang đúng số đuôi; in trường đổi của từng bài |
