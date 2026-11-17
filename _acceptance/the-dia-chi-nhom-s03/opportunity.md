---
schema_version: 1
slug: the-dia-chi-nhom-s03
feature: Người vận hành mở sổ nhóm trên Ops và thấy mỗi nhóm S03 chưa có thẻ địa chỉ đủ một nháp do máy dựng — dự án (một hoặc danh sách ngắn), phường và tỉnh, phân khu mặc định, bán hay thuê — kèm số bài làm căn cứ, rồi nhận, sửa hay bác từng thẻ
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # Mạnh «Cổng Đáng TG1: build, giữ ngưỡng đề xuất» — hàng đầu lát l01, mốc MS1 (lộ trình #462)
decided_by: Mạnh
decided_at: 2026-11-15T23:08:56Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: TG1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng TG1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/dat-lai-lo-trinh-1511.md#b00cddc4283afe255830157060caff31141d3f18` — chưa có trang: mã R2
Mốc: Tin S03 có dự án ngay lúc nạp: ô «Định vị» của S03 trên /ops/data-flow đạt từ 90% tin đang rao, và mọi nhóm S03 có thẻ địa chỉ — chưa có ngày.

Người vận hành mở sổ nhóm trên Ops và thấy mỗi nhóm S03 chưa có thẻ địa chỉ đủ một nháp do máy dựng — dự án (một hoặc danh sách ngắn), phường và tỉnh, phân khu mặc định, bán hay thuê — kèm số bài làm căn cứ, rồi nhận, sửa hay bác từng thẻ

Vì sao: Chủ kho 15/11: bài nằm trong nhóm nào là dữ kiện — nhóm đã mang địa chỉ tới dự án, phường. Đo 15/11: 17 nhóm (khoảng 38 nghìn bài) chưa có thẻ đủ; 73% tin căn hộ S03 không nêu dự án trong chữ (đo 04/11).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: Mọi nhóm S03 có bài trên DB máy thu đã có thẻ địa chỉ (nháp, đã duyệt hay bác) chưa, và thẻ đã duyệt có đủ dự án, phường và tỉnh, mục đích bán/thuê chưa?
- Kết quả nào là SỐNG: Sổ nhóm trên Ops đếm mọi nhóm S03 có bài mang thẻ — theo khoá thật 27/27 (15/11: 13/27 có đúng một dự án; con số 32/15 của hàng lộ trình đếm theo dòng sổ trùng khoá, xem discovery/bang-phu-ca.md); 14 nhóm còn thiếu (9 chưa ghi dự án, 3 nhiều dự án, 2 chưa có trong sổ) có nháp do máy dựng từ bài của chính nhóm, mỗi ô kèm số bài làm căn cứ; người vận hành duyệt hết 14 nháp trong một buổi (≤ 2 giờ) và tỉ lệ nháp được nhận nguyên hoặc chỉ sửa một ô từ 70%; mỗi lần sửa ghi người, giờ, bản trước.
- Kết quả nào là CHẾT: Hết timebox mà còn nhóm S03 có bài không có thẻ, hoặc nháp sai tới mức người vận hành phải gõ lại phần lớn (nhận nguyên hay sửa một ô dưới 40%) — nghĩa là bài của nhóm không đủ làm căn cứ, phải đổi cách (khai tay từ tên nhóm).
- Timebox: 3 ngày tới 18/11/2026 cho vòng máy (dự báo 0,5–4 giờ máy, 1,4% hạn mức tuần), cộng một buổi duyệt 14 nháp của Mạnh hoặc đội vận hành.
- Đọc số: đếm trên DB máy thu ngay sau buổi duyệt; số nhận nguyên/sửa/bác đọc từ lịch sử sửa thẻ.
