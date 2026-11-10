---
schema_version: 1
slug: sua-doc-ngan-sach-yeu-cau
feature: Bộ đọc ngân sách của Yêu cầu đọc đúng đầu dưới, đầu trên và đơn vị (triệu/tháng cho thuê, tỷ cho mua) ở các cách viết tắt «tc 8tr», «2ty6», «6tr5», «quay đầu» và sáu lỗi Ngoài-4/5/7/9/10/11 của hồ sơ bang-yeu-cau
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh trả lời 5 câu Bảng Yêu cầu 10/11 ở phiên phân tích (PR #396); giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-10T00:26:09Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Mạnh dặn 30/10 (hồ sơ bang-yeu-cau): các lỗi đọc ngân sách phải gộp trước khi áp bảng Yêu cầu lên máy thu. Đo 10/11: ngân sách đọc được 72,8% bài; trung vị thuê 8 triệu, mua 3 tỷ.

Hàng YC1 trong `docs/plan/lo-trinh.json` (PR #396, bản phạm vi `docs/plan/pham-vi-bang-yeu-cau-1011.md`). Làm trên main (chép pipeline/lib/yeu-cau.mjs từ nhánh feat/bang-yeu-cau nếu YC0 chưa nối); đi trước YC0 vì YC0 áp bảng lên máy thu.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Ma trận ca viết trước (mỗi lỗi Ngoài-* và mỗi cách viết ít nhất hai ca) xanh hết; trên toàn bộ bài Yêu cầu S03 của DB máy thu, số bài có ngân sách không giảm so với bộ đọc cũ và 0 bài thuê mang ngân sách từ 100 triệu/tháng trở lên do đọc nhầm đơn vị?
- Kết quả nào là SỐNG: [đề xuất] Ma trận ca viết trước (mỗi lỗi Ngoài-* và mỗi cách viết ít nhất hai ca) xanh hết; trên toàn bộ bài Yêu cầu S03 của DB máy thu, số bài có ngân sách không giảm so với bộ đọc cũ và 0 bài thuê mang ngân sách từ 100 triệu/tháng trở lên do đọc nhầm đơn vị
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
