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

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] ?
- Kết quả nào là SỐNG: [đề xuất] 
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
