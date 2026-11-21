---
schema_version: 1
slug: cham-bong-bo-sung-tin
feature: Mỗi thẻ «Bổ sung tin» còn đề xuất có kết quả chấm bóng của hai lần đọc độc lập kèm trích dẫn, thẻ hai lần đọc lệch hay máy bỏ trống được đánh dấu ca biên, và không dòng tin nào đổi
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: NB1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng NB1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/nguoi-o-bien-2111.md#6668c46a91b99667c11daf4f47233933a5d9f83c` — chưa có trang: mã NB1
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Mỗi thẻ «Bổ sung tin» còn đề xuất có kết quả chấm bóng của hai lần đọc độc lập kèm trích dẫn, thẻ hai lần đọc lệch hay máy bỏ trống được đánh dấu ca biên, và không dòng tin nào đổi

Vì sao: Hàng «Bổ sung tin» chờ 1.018 thẻ, 7 ngày vào 197, người quyết 0 (đo 21/11). Bước đầu của mục 61 quyết định 1: biết phần nào là ca biên trước khi cho chấp thuận lô.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên DB máy thu: 786/786 thẻ «Bổ sung tin» còn đề xuất (đếm 21/11) có kết quả bóng của hai lần đọc không thấy đáp án của nhau, mỗi kết quả kèm trích có thật trong bài; số ca biên in theo ô (loại hình, số WC, toà, số phòng ngủ, đường); 0 dòng tin rao và 0 đề xuất đổi trạng thái; mỗi lời gọi model có dòng ở sổ ai_calls; 232 thẻ không còn đề xuất được phân loại theo lý do kèm lệnh đếm; chạy lại cùng đầu vào không sinh kết quả mới» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên DB máy thu: 786/786 thẻ «Bổ sung tin» còn đề xuất (đếm 21/11) có kết quả bóng của hai lần đọc không thấy đáp án của nhau, mỗi kết quả kèm trích có thật trong bài; số ca biên in theo ô (loại hình, số WC, toà, số phòng ngủ, đường); 0 dòng tin rao và 0 đề xuất đổi trạng thái; mỗi lời gọi model có dòng ở sổ ai_calls; 232 thẻ không còn đề xuất được phân loại theo lý do kèm lệnh đếm; chạy lại cùng đầu vào không sinh kết quả mới
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên DB máy thu: 786/786 thẻ «Bổ sung tin» còn đề xuất (đếm 21/11) có kết quả bóng của hai lần đọc không thấy đáp án của nhau, mỗi kết quả kèm trích có thật trong bài; số ca biên in theo ô (loại hình, số WC, toà, số phòng ngủ, đường); 0 dòng tin rao và 0 đề xuất đổi trạng thái; mỗi lời gọi model có dòng ở sổ ai_calls; 232 thẻ không còn đề xuất được phân loại theo lý do kèm lệnh đếm; chạy lại cùng đầu vào không sinh kết quả mới» khi hết timebox
- Timebox: …
