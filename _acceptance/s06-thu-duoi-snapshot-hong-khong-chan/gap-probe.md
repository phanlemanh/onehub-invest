---
slug: s06-thu-duoi-snapshot-hong-khong-chan
at: 2026-11-28T03:10:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Căn cứ dòng sổ d-2 (bỏ coverage-scan) trích một dòng máy tự quyết của ZC18, không quyết cho ZC26; d-4 (dùng readSnapshot) ghi một-lối trong khi lối chép luật chỉ kém hơn, không chết. | Người duyệt tưởng bỏ quét độ phủ đã có tiền lệ, duyệt Coverage thiếu trục; lựa chọn đánh đổi bị ghi là máy quyết. | Dòng mới supersedes d-2 và d-4. | fixed: d-20261128T010325Z-7 thay d-2 (một-lối, trục liệt thẳng trong Coverage); d-20261128T010325Z-8 thay d-4 thành Hỏi-1 cho người (khuyên gọi readSnapshot) |
| P1 | design | Khoá tệp đánh dấu chưa nói là tên thư mục hay id manifest; sợ hai vùng trùng khoá. | Bản hanoi hỏng bị đánh dấu làm bản hcmc lành cùng id bị lọc mãi. | Ca hai vùng cùng tên thư mục. | rejected: khoá là tên thư mục theo khuôn `<vùng>__chotot-ads__<mốc>` của bộ nạp nên luôn mang tiền tố vùng, hai vùng không thể trùng; đã ghi rõ vào design và AC-3, probe kiểm mọi khoá có tiền tố vùng («KHOA KHONG VUNG») |
| P1 | contract | Bản đang ghi dở lúc chọn-nạp có thể bị đánh dấu vĩnh viễn. | Bộ thu đang ghi thư mục, manifest chưa có, vòng chọn đánh dấu nó. | Ngưỡng tuổi cho bản thiếu manifest. | rejected: gốc state chỉ do bộ thu của chính wrapper ghi, tuần tự TRƯỚC bước chọn trong cùng khoá `<gốc>.lock`, bộ thu ghi manifest sau cùng — lúc chọn, thiếu manifest chỉ có thể là bản bị ngắt, không bao giờ hoàn tất; ghi «ngoài phạm vi, vì» vào Coverage |
| P1 | evals | Không có ca vùng mà mọi bản chưa nạp đều hỏng. | Bash gọi bộ nạp với đối số rỗng hay chữ cờ `BO-QUA-MOI`; E1–E7 vẫn xanh. | Ca «vùng toàn bản hỏng». | fixed: thêm ca vào probe (0 lần nạp, 2 dòng log, thoát 1; vòng 2 im, thoát 0; should-NOT-fire «GOI NAP RONG») và vào AC-1, E1 |
| P2 | evals | E2, E3 chỉ đo chuỗi có mặt: không ghim khuôn dòng log, không đếm đúng một dòng, không kiểm lyDo khác rỗng và luc là UTC. | Log mất lý do hay in hai lần, luc là giờ địa phương — probe vẫn xanh. | Regex khuôn log, đếm = 1, kiểm luc kết thúc Z. | fixed: probe ghim regex `bỏ qua snapshot hỏng <id>: .+ — không xoá, không sửa$`, đếm đúng 1 dòng, in giá trị lyDo và luc, kiểm luc parse được và kết thúc Z; should-NOT-fire «LOG SAI KHUON», «LUC KHONG UTC» |
