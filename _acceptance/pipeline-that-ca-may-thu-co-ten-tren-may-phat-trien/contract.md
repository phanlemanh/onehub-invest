---
schema_version: 1
feature: Suite pipeline_that chạy trên máy phát triển bỏ qua có tên, có đếm các ca chỉ máy thu chạy được; trên máy thu vẫn chạy đủ
slug: pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: machine-cleared
approved_by:
veto_state: mo
veto_opened_at: 2026-11-26T09:40:00Z
design_doc: docs/superpowers/specs/2026-11-26-pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien-design.md
---

# Acceptance Contract: pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien

## Context

Hàng HT33 (GS giao 26/11). M5 có nguyên DB máy thu nhưng suite `pipeline_that` không xanh ở đó vì ca ON22-AC-10 đòi log,
cấu hình, launchctl và chạy `push-ops-facts` thật của máy thu. Mọi hàng đổi pipeline vì thế phải chấm trên Mac mini.

## Acceptance Criteria

- **AC-1** Given tệp cấu hình hai máy, When `vaiMay` đọc, Then ma trận viết trước: tệp vắng → `may-thu`; `VAI=may-thu` →
  `may-thu`; `VAI=may-phat-trien` (kể cả có ngoặc kép, có `export`, CRLF, khoảng trắng cuối) → `may-phat-trien`; giá trị lạ, dòng
  bị chú thích, không có dòng `VAI=` → `may-thu`; hai dòng `VAI=` → dòng cuối. Đường tệp chỉ đổi được qua tham số hàm hoặc
  biến `ONEHUB_HAI_MAY_TEP` (dùng trong test).
  Đối chứng: bản sao coi «tệp vắng» là máy phát triển → ghim «không đọc được vai mà vẫn nới».
- **AC-2** Given vai `may-phat-trien`, When `node chay-that.mjs` chạy, Then đúng các mục `ci-bo-qua.json` mang `may_thu` bị bỏ
  qua; đầu ra có dòng tổng «bỏ qua N ca chỉ máy thu» với N bằng số mục ấy và mỗi ca một dòng nêu tệp, tên ca, lý do; mọi ca còn
  lại vẫn nằm trong tập chạy. Không đọc biến `CI`.
- **AC-3** Given vai `may-thu` (hay tệp vắng), Then `chay-that.mjs` chạy đủ mọi ca của danh sách, không ca nào bị bỏ vì máy, in
  «chạy đủ N ca»; lượt soát hằng ngày trên main ở Mac mini vẫn chạy đủ 34 ca.
- **AC-4** Given `ci-bo-qua.json`, Then khoá `may_thu` chỉ nằm ở mục đã được bảng phủ ca chứng là cần tài nguyên riêng của máy
  thu (hôm nay đúng ON22-AC-10), và `loiDanhSach` từ chối khoá `may_thu` rỗng, toàn khoảng trắng, số hay boolean (chay-that
  thoát 2, gọi tên mục).
- **AC-5** Given một lượt chạy `pipeline_that` trên M5 ở sha mã cuối của nhánh (commit cuối chạm tệp ngoài `_acceptance/`), Then
  đầu ra ghi lại trong hồ sơ có dòng vai `may-phat-trien` đọc từ tệp thật của M5, dòng «bỏ qua 1 ca chỉ máy thu» nêu ON22-AC-10,
  `ℹ tests 37` (38 của lượt M5B trừ 1 ca bỏ), `ℹ fail 0`, không có `CI=true` trong môi trường lượt.
- **AC-6** Given máy thu (Mac mini, tệp hai-may.env thật), When `vaiMay()` chạy không đối số và không biến môi trường, Then ra
  `may-thu` — lượt soát hằng ngày ở đó chạy đủ ca.

## Out of scope

- Sửa ca ON22-AC-10 cho chạy được ngoài máy thu: ca ấy đo đúng máy thu thật, giữ nguyên.
- Các suite khác (`app_ui`…) trên M5.

## Coverage

- Trục vai máy: tệp vắng · may-thu · may-phat-trien · giá trị lạ · dòng chú thích [thước CE: tệp ~/.config/onehub/hai-may.env của
  Mac mini] — AC-1, AC-2, AC-3.
- Trục ca: 33 ca chỉ cần DB/plutil · 1 ca chỉ máy thu [thước CE: bảng phủ ca của design doc] — AC-2, AC-4, AC-5.

## Notes

- Ngoài-1 (máy định tuyến 2026-11-26, đề xuất S4 known-limits): Phần ghi chú mô tả danh sách ca bỏ qua chưa nhắc tới khoá mới, nên người đọc sau có thể không biết khoá ấy có và có nghĩa gì. Chạy thật không bị ảnh hưởng. — `scripts/lib/ci-can-du-lieu.mjs`
- Ngoài-2 (máy định tuyến 2026-11-26, đề xuất S4 known-limits): Phép kiểm báo đạt cả trên máy không có tệp cấu hình vai, nên nó chưa chứng minh được đang chạy đúng trên Mac mini. Lượt soát hằng ngày vẫn chạy đủ ca. — `_acceptance/config.yaml`
- Ngoài-3 (máy định tuyến 2026-11-26, đề xuất S4 known-limits): Một máy lạ hoặc máy mất tệp cấu hình cũng được báo là máy thu trong lượt chấm. Hệ quả là bằng chứng nghiệm thu kém chắc, nhưng người dùng không thấy khác biệt khi dùng. — `_acceptance/config.yaml`
- Ngoài-4 (máy định tuyến 2026-11-26, đề xuất S4 known-limits): Nếu sau này mọi ca đều đánh dấu chỉ máy thu, máy phát triển sẽ chạy cả bộ test thay vì dừng lại. Hiện chưa xảy ra. — `pipeline/chay-that.mjs`
- Ngoài-5 (máy định tuyến 2026-11-26, đề xuất S4 known-limits): Phép kiểm hồ sơ chạy trên M5 có thể bỏ lọt một hồ sơ thiếu dòng về môi trường. Người dùng cuối không bị ảnh hưởng. — `_acceptance/pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien/kiem-m5.sh`
- Ngoài-6 (máy định tuyến 2026-11-26, đề xuất S4 known-limits): Khi hồ sơ M5 sai, công cụ kiểm có báo đỏ nhưng chưa chắc ghi rõ sai ở đâu. Chỉ ảnh hưởng người soát nội bộ. — `_acceptance/pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien/kiem-m5.sh`
- Ngoài-7 (máy định tuyến 2026-11-26, đề xuất S4 known-limits): Bài test có thể không phân biệt được lý do chạy dừng, nên có khả năng bỏ lọt một lỗi khác cũng làm dừng. Người dùng không thấy khác biệt. — `scripts/vai-may.test.mjs`
