---
schema_version: 1
slug: danh-ba-s16-thang-cau-truc
feature: "Ở các dự án có S16, phân khu hiệu lực của toà đi theo S16: S16 đúc nút phân khu từ danh sách khu chủ đầu tư công bố qua thẻ luật, view nút vùng hiệu lực (v_toa_nut_vung) đặt toà S16 vào phân khu qua khu S16 của nó và xếp S16 trên S09, S08 và S09 lệch về cấu trúc thành bí danh và số lệch đếm theo cặp nguồn, thẻ lệch S08 ↔ S16 đã thành thừa được cho nghỉ; cột gốc của toà giữ nguyên"
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build
decided_by: Mạnh
decided_at: 2026-11-17T07:57:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DA37
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Cổng Đáng: «build» theo lời Mạnh «Theo khuyến nghị cả ba câu» (gõ ở phiên phân tích cấu trúc danh bạ, 07:57Z 17/11; ROADMAP
§3 mục 54, Q-B và Q-C); giám sát đợt ghi theo bản ghi đó (GS 17/11), không có lượt hỏi mới.

Mở từ hàng DA37 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/danh-ba-cau-truc-1711.md#a946caece1e1bcd3b2620aafb1068390fc5d0e39` — chưa có trang: mã CT2
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Ở các dự án có S16, phân khu hiệu lực của toà đi theo S16: S16 đúc nút phân khu từ danh sách khu chủ đầu tư công bố qua thẻ luật, view nút vùng hiệu lực (v_toa_nut_vung) đặt toà S16 vào phân khu qua khu S16 của nó và xếp S16 trên S09, S08 và S09 lệch về cấu trúc thành bí danh và số lệch đếm theo cặp nguồn, thẻ lệch S08 ↔ S16 đã thành thừa được cho nghỉ; cột gốc của toà giữ nguyên

Vì sao: Mạnh 17/11 Q-B, Q-C «Theo khuyến nghị cả ba câu» (ROADMAP §3 mục 54): sửa mô hình 11/11 §1.3 cho phần cấu trúc ở dự án có S16. Khoảng 110 nghìn căn S16; mỗi lệch một thẻ thì không duyệt nổi. DA33 chép luật xếp phân khu cũ (chỉ xét con loại building, khớp tên tuyệt đối) nên toà S16 mới treo dưới dự án.

## Số đã đo trước vòng (P2, 17/11)

- DA33 đã áp lên DB máy thu 15:06Z (GS): toà 198 → 307 (109 mới), căn 1.748 → 111.668, trục 412 → 3.463, bí danh S16 114.707,
  60 thẻ = 38 «một mã căn dưới nhiều toà» + 20 «toà S16 trùng tên» + 2 «căn S08 cùng mã nằm ở toà khác»; 21 toà `VN-66`.
- 109/109 toà S16 mới mang bí danh mã toà S16; nối toà → khu qua `stg_s16_*`: 90 toà đúng một khu, 19 toà hai `khu_id` (GP 4,
  OP2 10, OP3 5) — bản thu không kèm danh sách khu ghi `khu_id` khác, không có trong `stg_s16_khu`; `v_s16_toa` lấy bản mới nhất
  nên nối thẳng qua view chỉ ra 90/109. Luật cho vòng này: lấy khu từ bản thu có danh sách khu → 109/109 đúng một khu.
- Rào chỉ-thêm 082 chặn `UPDATE buildings SET region_node_id` (đã thử) → phân khu hiệu lực đi qua view `v_toa_nut_vung` (097).
- Quyết định (B) chỉ giải 2 thẻ lệch S08 ↔ S16; 38 thẻ mơ hồ và 20 thẻ trùng tên không thuộc Q-B — cần lời Cổng Phạm vi.

## Gom từ DA33 (GS 17/11)

Hai mục Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng DA33, cùng tệp và cùng đường lùi, gom vào vòng này:
- Ngoài-5 DA33: đường lùi có đích phải xử được dòng khẳng định (`field_assertions`) hoặc từ chối sớm có hướng dẫn.
- Ngoài-6 DA33: job đêm (`buocVatTheDem`) tự chạy bước S16 cho hai khu mặc định — vòng này khai rõ job đêm dựng những khu nào,
  có mốc/khoá lùi không, và Ocean Park 2, Ocean Park 3, Smart City có vào mặc định không.
Ngoài-2 DA33 (bộ nạp kiểm sha256/schemaVersion) không thuộc vòng này — GS chuyển làn ZCode qua LL.
Thử sớm ở S1: rào 082 với `parent_id` của `asset_nodes` (cho DA38). Bảng phủ ca đếm từ DB máy thu sau áp.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên DB máy thu sau khi DA33 áp, đo trên view hiệu lực: ô «toà treo thẳng dưới dự án» ở các dự án có S16 về 0 (ước 109 toà S16 mới cộng phần còn treo của Ocean Park 1, Grand Park; số trước đo lại sau DA33); 2 thẻ lệch S08 ↔ S16 của DA33 cho nghỉ, 38 thẻ «một mã căn dưới nhiều toà» và 20 thẻ trùng tên xử theo lời Cổng Phạm vi; số lệch cấu trúc hiện theo cặp nguồn; lệch giá, pháp lý vẫn ra thẻ; nút phân khu S16 chỉ nhận toà sau khi thẻ luật được duyệt; 0 dòng buildings đổi region_node_id (rào chỉ-thêm 082 giữ nguyên); dựng lại hai lần không đổi khoá» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên DB máy thu sau khi DA33 áp, đo trên view hiệu lực: ô «toà treo thẳng dưới dự án» ở các dự án có S16 về 0 (ước 109 toà S16 mới cộng phần còn treo của Ocean Park 1, Grand Park; số trước đo lại sau DA33); 2 thẻ lệch S08 ↔ S16 của DA33 cho nghỉ, 38 thẻ «một mã căn dưới nhiều toà» và 20 thẻ trùng tên xử theo lời Cổng Phạm vi; số lệch cấu trúc hiện theo cặp nguồn; lệch giá, pháp lý vẫn ra thẻ; nút phân khu S16 chỉ nhận toà sau khi thẻ luật được duyệt; 0 dòng buildings đổi region_node_id (rào chỉ-thêm 082 giữ nguyên); dựng lại hai lần không đổi khoá
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên DB máy thu sau khi DA33 áp, đo trên view hiệu lực: ô «toà treo thẳng dưới dự án» ở các dự án có S16 về 0 (ước 109 toà S16 mới cộng phần còn treo của Ocean Park 1, Grand Park; số trước đo lại sau DA33); 2 thẻ lệch S08 ↔ S16 của DA33 cho nghỉ, 38 thẻ «một mã căn dưới nhiều toà» và 20 thẻ trùng tên xử theo lời Cổng Phạm vi; số lệch cấu trúc hiện theo cặp nguồn; lệch giá, pháp lý vẫn ra thẻ; nút phân khu S16 chỉ nhận toà sau khi thẻ luật được duyệt; 0 dòng buildings đổi region_node_id (rào chỉ-thêm 082 giữ nguyên); dựng lại hai lần không đổi khoá» khi hết timebox
- Timebox: …
