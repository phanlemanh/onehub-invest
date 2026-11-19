---
schema_version: 1
slug: can-gia-tot-loc-xep-hang
feature: Người vận hành chọn một vị trí bất kỳ trên cây (tỉnh → phường → dự án → phân khu → toà), lọc loại hình, bán hay thuê, số phòng ngủ, diện tích, tầng, đường và thấy danh sách Căn giá tốt xếp theo hạng giá/m², mỗi dòng kèm nhóm so sánh, số căn trong nhóm, lý do lùi cấp và độ tin
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh chốt Q1–Q5 «Căn giá tốt theo vị trí» 09/11 («Chốt theo đề xuất»; CG8 đứng đầu — Q5); giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-09T23:37:30Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Phiên nghiệm thu people-hien-so-goc 03/11: Mạnh chấm 3, «Không sử dụng được» (PR #282, docs/plan/pham-vi-can-gia-tot-0311.md). Nguyên văn: «Không nhìn theo được điều này thì ko thể sử dụng». Mở rộng 09/11 theo phân tích Căn giá tốt theo vị trí (bản phạm vi docs/plan/pham-vi-can-gia-tot-vi-tri-0911.md): câu hỏi là «ở vị trí X, thông số Y, căn nào giá tốt».

Hàng CG3 trong `docs/plan/lo-trinh.json` (PR #394, bản phạm vi `docs/plan/pham-vi-can-gia-tot-vi-tri-0911.md`). Viết lại ở lượt cắt can-gia-tot-vi-tri-0911: tra theo vị trí bất kỳ thay bộ lọc khu vực; đứng trên CG9 thay CG2. Truy vấn chỉ chọn tin nào hiện, không tính lại điểm (luật 10). Cấp dự án, toà đầy dần theo CG10, CG11; mỗi bộ lọc nói phủ bao nhiêu tin (09/11: tầng ở 6% tin S06 bán căn hộ, 0% S03). Hướng, view, nội thất thêm ở CG12. Ô Bán | Cho thuê thay phần giao diện của CG4.

## Context: hàng UI10 gộp vào vòng này (18/11)

Giám sát đợt quyết không mở vòng riêng cho UI10 `ops-deals-data-grid`, vì phần chính đã có trên main. Đề xuất đóng UI10 và
gánh phần còn nợ vào CG3 chờ Mạnh xác nhận ở Cổng Phạm vi. Đo trên màn `/ops/deals` ở máy thu, mã `308f4d3af`, vai admin; ảnh đã
che liên hệ người bán, ảnh tin và email ở `evidence/do-khoang-cach-ui10/`.

| Ý của UI10, OH2 | Hiện trạng |
|---|---|
| PageHeader; bảng data-grid, lọc, phân trang; khung tải | Đã có |
| Trạng thái lỗi có «Thử lại»; liên hệ, nội dung theo vai | Đã có theo mã, chưa đo trên màn |
| Câu về người bán theo chốt 23/10 | Đã có |
| **Báo danh sách bị cắt, số đếm đúng tổng** | **Còn nợ, gánh vào CG3.** Màn tải 30 trên 7.385 căn; «Tất cả» ghi 30, «Cần xác minh» ghi 2.390 |
| **Trạng thái trống của tab có hành động** | **Còn nợ, gánh vào CG3.** Tab trống chỉ ghi «Mục này chưa có căn.» |
| Chữ không nhỏ hơn text-xs | Lệch: hai Badge đầu trang 10 px, ở `PageHeader` dùng chung cho mọi trang, ngoài vòng này |

Đo thêm liên quan trực tiếp tới CG3:

- 30/30 căn đang hiện là S06 cấp phường, cùng mức −35%. Tập có 832 căn «Giá tốt» cấp dự án, trong đó 254 căn S03.
- Dòng trong bảng chưa ghi nhãn hạng hay cấp so sánh, kể cả ở `?project=1`.
- Danh sách một dự án chỉ vào được qua nút «Xem cả dự án» trong sheet của căn cấp dự án.
- Phủ bộ lọc trên 9.841 tin bán có nhãn, thấy trong 45 ngày: diện tích 100%, đường 93%, số phòng ngủ 84%, toà 6%, tầng 1%.
- Bảng hạng có 5.428 tin S03 cấp dự án (1.488 bán, 3.940 thuê), 1.119 tin có nhãn. Danh sách hiện chỉ đọc tin bán.

## Ngưỡng chết / ngưỡng UAT

_Máy đề xuất, chờ chốt ở Cổng Phạm vi. Lệnh đo: `node _acceptance/can-gia-tot-loc-xep-hang/probes/dem-tap-can.mjs [mã dự án]`._

- Câu hỏi phép đo trả lời: người vận hành chọn một vị trí trên cây có thấy đúng và đủ các căn giá tốt của vị trí đó không?
- Kết quả nào là SỐNG: chọn Vinhomes Ocean Park 1 trên cây (không gõ đường dẫn), tab «Tất cả» bằng `tong` của lệnh đo với mã `1`; màn không lọc báo số căn đang hiện trên tổng, và số trên tab khớp `tong`, `can_xac_minh` của lệnh đo (đo 18/11: màn ghi 30, lệnh đo ra 7.385).
- Kết quả nào là CHẾT: số trên màn lệch lệnh đo, hoặc phải gõ đường dẫn mới xem được một dự án.
- Timebox: một vòng
