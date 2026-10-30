---
slug: eval-classify-wilson
at: 2026-10-30T14:40:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ ghi dq_check_results trích câu giao, không trích quyết định hiện trên /ops/quality; không AC nào đo bên đọc hiện có diễn giải check_name mới; theo [d-20261030T105852Z-12] dòng kiểm chưa diễn giải làm suite app đỏ ở ON12-AC-5, mà AC phạm vi cấm chạm app/ | Lượt ghi thật đầu tiên đưa 9 dòng thô lên /ops/quality và làm đỏ ON12-AC-5 trên DB máy thu | Dòng sổ mới cho quyết định hiện thô; eval chạy ON12-AC-5 sau khi có dòng eval-classify đủ ba trạng thái | fixed: dòng sổ supersedes trích review §3.5 «ghi dq_check_results → /ops/quality»; AC-9 mới (diễn giải ở dq-labels.ts + CONTEXT.md, E9 ma trận nhãn, E9b ON12-AC-5 trên DB thử sau lượt ghi thật); AC-10 mở vùng tệp app/src/lib/dq-labels.ts |
| P1 | evals | E7 đòi detail «đủ 13 khoá» trong khi hợp đồng liệt 12 | Code đúng hợp đồng làm E7 đỏ, hoặc phải thêm khoá ngoài hợp đồng | So tập khoá bằng đúng tập viết trước, đỏ khi thiếu hay thừa | fixed: detail thành dòng khoá=giá trị đúng 12 khoá theo thứ tự; E7 đỏ khi thiếu hay thừa và in tên khoá lệch |
| P1 | contract | Đường đo dùng --dry (không ghi); E7 gọi thẳng ghiKetQua, không đo đường CLI ghi thật, run chung, một giao dịch | CLI quên ghi hoặc ghi ngoài giao dịch mà E5–E8 vẫn xanh | Tiến trình con không --dry trên DB thử có nhãn, đếm chênh bằng số ô, một run; lỗi ở dòng k thì không dòng nào ở lại | fixed: AC-7 viết lại theo lượt ghi thật; E7 chạy tiến trình con không --dry, đếm chênh = số ô, run chung, ô thứ 5 status NULL làm cả lượt hoàn tác |
| P1 | evals | Fixture dựng trong giao dịch ROLLBACK cùng client với hàm: giao dịch lồng, READ ONLY không đo được hàm, COMMIT của hàm phá ROLLBACK | docNhanNguoi không READ ONLY mà E5 xanh; fixture ở lại DB thử | Fixture COMMIT trên kết nối riêng rồi dọn; hàm chạy trên client riêng; đo READ ONLY bên trong hàm | fixed: DB thử dựng mới mỗi lượt, fixture COMMIT trên kết nối riêng, hàm chạy client riêng ghi lại câu lệnh (câu đầu phải BEGIN … READ ONLY, đối chứng đỏ bản bỏ READ ONLY); cuối probe 0 dòng 'ecw-thu-' |
| P1 | evals | Fixture nhãn viết tay đúng khuôn bên đọc, không qua bên ghi PL7; không đo miền giá trị parser ⊂ miền nhãn PL7; E8 chỉ ghim n | parser trả giá trị khuôn khác nhãn thật → mọi ô dung = 0 trên nhãn thật mà eval vẫn xanh | Fixture qua bên ghi thật; giá trị parser qua chuanHoaLuot; E8 ghim dung và can_duoi | fixed: nhãn fixture ghi bằng chuanHoaLuot + ghiNhan thật (probes/nap-nhan.tsx); E4b đưa mọi giá trị parser qua chuanHoaLuot thật; E8 ghim n, dung, can_duoi bằng phép đếm độc lập (parsePost thẳng, không qua chamO). Còn lại: eval_label_items của fixture vẫn viết tay (bên ghi thật label-sample.mjs chọn tin từ stg) |
