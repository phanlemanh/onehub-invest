---
schema_version: 1
slug: nap-s16-vao-danh-ba
feature: Dự án, phân khu, toà và mã căn S16 vào danh bạ không sinh toà, căn trùng, và mã căn S16 là neo tin cậy cao nhất khi dựng cây toà → căn ở các dự án của chủ đầu tư S16, xếp trên S08 và trên mã suy từ tin S03
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build
decided_by: Mạnh
decided_at: 2026-11-14T00:00:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DA33
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Cổng Đáng: «build» theo lời Mạnh ở QĐ7 ngày 14/11 (ROADMAP §3 mục 48, đoạn «Nguồn S16»: «Cả phần đăng nhập»); giám sát đợt ghi theo bản ghi đó, không có lượt hỏi mới.

Mở từ hàng DA33 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/mo-neo-1411.md#25d4d86af406a37bd41d0ce5f05dead8bc4e54b2` — chưa có trang: mã M3
Mốc: Nhịp 3: lọc tầng, mở ra ngoài hai khu và căn giá tốt lên Invest — chưa có ngày.

Dự án, phân khu, toà và mã căn S16 vào danh bạ không sinh toà, căn trùng, và mã căn S16 là neo tin cậy cao nhất khi dựng cây toà → căn ở các dự án của chủ đầu tư S16, xếp trên S08 và trên mã suy từ tin S03

Vì sao: Mạnh chốt 14/11 «Cả phần đăng nhập»: «Phần đăng nhập là mã chính từ chủ đầu tư, nên sự tin cậy cao». Danh bạ căn hôm nay 1.736 căn, đều từ S08, chỉ hai khu; S16 có khoảng 103 nghìn mã căn, 226 toà. QĐ7: cắt hàng nạp S16.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Trên DB máy thu: bản thu S16 nạp vào stg (migration 103) bằng bộ nạp của làn thu theo DATA-CONTRACT có schemaVersion mới; số dự án, phân khu, toà, mã căn trong stg khớp manifest bản thu; 0 toà hai UPI, 0 căn hai khoá; căn S08 trùng mã căn S16 thành bí danh của cùng căn, lệch thì lên thẻ; ở dự án có cả hai, cây toà → căn lấy mã S16 làm khoá và S08 thành bí danh; mã căn lấy bằng đăng nhập không rời máy (bộ soát sync-cloud đỏ khi cấy một dòng); mọi thứ rời máy chỉ mang mã S16; chạy lại không đổi khoá» chưa?
- Kết quả nào là SỐNG: [đề xuất] Trên DB máy thu: bản thu S16 nạp vào stg (migration 103) bằng bộ nạp của làn thu theo DATA-CONTRACT có schemaVersion mới; số dự án, phân khu, toà, mã căn trong stg khớp manifest bản thu; 0 toà hai UPI, 0 căn hai khoá; căn S08 trùng mã căn S16 thành bí danh của cùng căn, lệch thì lên thẻ; ở dự án có cả hai, cây toà → căn lấy mã S16 làm khoá và S08 thành bí danh; mã căn lấy bằng đăng nhập không rời máy (bộ soát sync-cloud đỏ khi cấy một dòng); mọi thứ rời máy chỉ mang mã S16; chạy lại không đổi khoá
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Trên DB máy thu: bản thu S16 nạp vào stg (migration 103) bằng bộ nạp của làn thu theo DATA-CONTRACT có schemaVersion mới; số dự án, phân khu, toà, mã căn trong stg khớp manifest bản thu; 0 toà hai UPI, 0 căn hai khoá; căn S08 trùng mã căn S16 thành bí danh của cùng căn, lệch thì lên thẻ; ở dự án có cả hai, cây toà → căn lấy mã S16 làm khoá và S08 thành bí danh; mã căn lấy bằng đăng nhập không rời máy (bộ soát sync-cloud đỏ khi cấy một dòng); mọi thứ rời máy chỉ mang mã S16; chạy lại không đổi khoá» khi hết timebox
- Timebox: …
