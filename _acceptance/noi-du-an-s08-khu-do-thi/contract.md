---
schema_version: 1
feature: Mỗi dự án S08 của lát Ocean Park 1 và Grand Park nối vào đúng một khu đô thị, không còn bí danh dự án trùng mã toà, area_ids OCP1–3 khớp nguồn xác minh
slug: noi-du-an-s08-khu-do-thi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
design_doc: docs/superpowers/specs/2026-11-05-noi-du-an-s08-khu-do-thi-design.md
approved_by: Mạnh
approved_at: 2026-11-05
---

# Acceptance Contract: noi-du-an-s08-khu-do-thi

## Context

DB1 cần biết dự án S08 nào thuộc khu đô thị nào. Hôm nay tên S08 bị tách nhiều dòng và gần như không khớp `asset_nodes`, bí danh `s7`, `s10` của một dự án trùng mã toà, và mã vùng của Ocean Park 1–3 đã chết. Việc này dựng bảng nối local và dọn sổ dự án cho lát đầu.

Source input: hàng DN1 của `docs/plan/lo-trinh.json`; ROADMAP §3 mục 28, 30.

## Criteria

- AC-1: Given bảng nối hợp lệ, When hàm kiểm chạy, Then trả đúng số dòng `noi` theo từng nút, và mọi dự án S08 không có trong bảng nối thành `chua_noi` với lý do `ngoai-lat`.
- AC-2: Given tệp bảng nối có nút không phải `project`, slug không có, `project_id` không có trong S08, một dự án hai dòng, không dòng nối nào, tín hiệu không khớp, ứng viên từ khoá không nối cũng không loại, hoặc tệp không bị git bỏ qua hay nằm ngoài kho, When chạy lệnh nối thật, Then lệnh thoát khác 0, in mã lỗi, và bảng không đổi dòng nào; `--thu` với tệp lành in số và cũng không đổi bảng.
- AC-3: Given DB thử sao từ máy thu, When áp migration 074 hai lần, Then không lỗi, bảng `s08_project_links` có CHECK từ chối `noi` thiếu nút, `chua_noi` thiếu lý do và `chua_noi` có nút.
- AC-4: Given DB thử đã áp 074 và bảng nối đã duyệt, When chạy lệnh nối hai lần, Then Ocean Park 1 có 3 dự án, Grand Park có 5, mỗi dự án S08 đúng một dòng, mọi dự án còn lại `chua_noi` có lý do, tổng bằng số dự án S08 lúc đo, và lần chạy thứ hai không đổi dòng nào.
- AC-5: Given DB thử trước và sau 074, When so bí danh của nút `project` với mã toà trong `block_raw` của tin S03 và mã phân khu S08 theo luật chuẩn hoá đã ghim, Then trước 074 thấy đúng `s7`, `s10`, sau 074 không còn bí danh trùng mã toà, chỉ các bí danh đã khai bị bỏ, mọi bí danh khác giữ nguyên.
- AC-6: Given DB thử đã áp 074, When đọc `area_ids` của OCP1–3, Then OCP1 là `vn-hanoi-gia-lam`, OCP2 và OCP3 là `vn-hung-yen`, mọi mã có trong `areas`, tên nút không còn «Vũ Yên», `area_ids` của nút khác không đổi, và không mã nào của `app/src`, `data-api/src` đọc `area_ids`.
- AC-7: Given mã, hồ sơ và đầu ra của lệnh, When quét, Then chỉ migration, lệnh nối và `mappings.yaml` nhắc `s08_project_links`, bảng không trong danh sách sync cloud, diff và hồ sơ không chứa tên hay mã dự án S08 sau chuẩn hoá, tệp bảng nối bị git bỏ qua, và đầu ra nhánh lành lẫn nhánh lỗi không in tên hay `project_id`.
- AC-8: Given `pipeline/mappings.yaml` và một lượt đo, When đọc khối S08 và so `oneinvest` trước, sau lượt đo, Then khối S08 có `project_id`, `project_name`, đường nối `s08_project_links`, chính sách chỉ local; phép đo từ chối chạy khi DB đích khác `oneinvest_dn1_noi`, và băm `asset_nodes` cùng việc có hay không có bảng mới của `oneinvest` không đổi.
- AC-9: Given bảng nối đã duyệt có băm ghi ở `probes/bang-noi.sha256`, When đo quan hệ trên dữ liệu S08, Then băm tệp khớp, mỗi dòng `noi` có tín hiệu riêng khớp tên hoặc phân khu S08 đã bỏ dấu, mỗi dự án trúng từ khoá lát hoặc có trong bảng hoặc có lý do loại; tráo hai dòng khác khu hoặc xoá một dòng thì phép đo đỏ.

## Coverage

Quét theo ba trục, thước là 150 dự án S08 và 23 nút `asset_nodes` đo 05/11 (`docs/superpowers/specs/2026-11-05-noi-du-an-s08-khu-do-thi-design.md`):

- Vật được dọn: dự án S08 (AC-1, AC-2, AC-4, AC-9) · bí danh (AC-5) · mã vùng và tên nút (AC-6).
- Đường vào: tệp hợp lệ (AC-1, AC-4) · tệp sai bốn kiểu (AC-2) · chạy lại (AC-3, AC-4).
- Ranh giới S08: bảng local, kho công khai, cloud, đầu ra lệnh (AC-7, AC-8).

Later: lát khác của S08 (thêm dòng vào bảng nối) · xã của OCP2, OCP3 khi `areas` có đủ · 16 cặp nút, mã vùng chết còn lại, gồm một mã của Grand Park. Never: thêm bí danh S08 vào `asset_nodes`, vì `asset_nodes` lên cloud.

## Đường đo

- Ngưỡng «mọi dự án S08 của lát nối đúng một khu đô thị hoặc nằm trong danh sách chưa nối có lý do»: AC-4 đếm trên `s08_project_links` ở DB thử, AC-9 đo quan hệ từng dòng và chiều sót.
- Ngưỡng «0 bí danh dự án trùng mã toà»: AC-5, so bí danh với `block_raw` và mã phân khu S08 trên DB thử.

## Out of scope

- Ghi bảng nối hay áp 074 lên DB máy thu: sau khi gộp, xin giám sát.
- Dựng toà, trục, căn từ S08: DB1.
- Sửa 16 cặp nút, mã vùng chết còn lại, gồm một mã của Grand Park: chưa có nguồn xác minh từng khu, cần việc riêng.
- Giao diện: không sửa màn nào. Tên nút mới hiện ở danh mục khai đơn vị của `/ops` sau lần sync kế; cổng Invest và API công khai không đọc `area_ids`.

## Notes

- Bảng nối ở `research-local/s08-noi-du-an.json` của máy thu, không commit; bản đọc được cho người ở `research-local/s08-noi-du-an-xem.md`.
- Đường lên cloud: áp 074 ở máy thu (xin giám sát) rồi lần `sync-cloud` kế chép `asset_nodes`; `s08_project_links` không đi.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-05:
  - Ngoài-1: Một câu kiểm trong bộ đo có thể bỏ sót trường hợp dự án S08 thiếu dòng trong bảng nối, nhưng một câu kiểm khác trong cùng bộ đo vẫn báo đỏ nên kết quả cuối không bị xanh nhầm.
  - Ngoài-2: Phép kiểm chấp nhận cả trường hợp tín hiệu chỉ khớp mã dự án, rộng hơn lời hứa là khớp tên hoặc phân khu. Với bảng nối hiện tại chưa có dòng nào bị ảnh hưởng.
  - Ngoài-3: Một câu kiểm dự án thiếu dòng chỉ đo được một chiều, nhưng phép kiểm tổng số dòng đi kèm vẫn bắt được trường hợp đó nên không làm lọt lỗi.
  - Ngoài-4: Bộ kiểm chưa có ca nào buộc tín hiệu của mỗi dòng phải khớp tên dự án của chính nó, nên nếu ai làm hỏng riêng điều kiện đó thì kiểm tự động vẫn xanh.
  - Ngoài-5: Hai kiểu sai ở danh sách dự án bị loại (vừa nối vừa loại, mã dự án lạ) chưa có ca kiểm riêng, nên nếu mã xử lý hai kiểu này bị xoá thì kiểm tự động vẫn xanh.
  - Ngoài-6: Phép quét tìm mã dự án S08 lộ ra ngoài không bắt được khi mã nằm trong bảng có dòng tiêu đề hoặc tệp CSV, dù chú thích nói là bắt mọi khuôn.
  - Ngoài-7: Phép kiểm «không dòng nào vừa bị loại vừa được nối» chưa từng được thử với một dòng sai để chứng minh nó thật sự báo đỏ.
  - Ngoài-8: Câu so hai tập dự án nói là so hai chiều nhưng thật ra chỉ so một chiều; phép so tổng số dòng đi kèm vẫn bảo đảm kết quả cuối đúng.
  - Ngoài-9: Sau khi ghi bảng, chưa có phép kiểm nào đọc nội dung lý do loại để chắc rằng từng dự án mang đúng lý do đã duyệt, chỉ kiểm là có lý do.
  - Ngoài-10: Bảng nối dự án với khu đô thị đặt tên cột và giá trị bằng tiếng Việt, lệch quy ước đặt tên tiếng Anh của kho. Người dùng cuối không thấy gì; chỉ người làm tiếp sẽ thấy tên không đồng bộ.
  - Ngoài-11: Nếu phép đo bị ngắt giữa chừng, một tệp tạm chứa mã dự án thật có thể nằm lại trong thư mục không được git bỏ qua và vô tình bị đưa lên kho công khai.
  - Ngoài-12: Bộ test của phần nối dự án không chạy trong kiểm tra tự động khi gộp, nên một thay đổi sau này làm hỏng nó có thể không bị phát hiện ngay.
  - Ngoài-13: Khi tệp bảng nối sai cấu trúc, lệnh vẫn dừng an toàn nhưng báo như lỗi cơ sở dữ liệu, khiến người vận hành đi tìm sai chỗ.
  - Ngoài-14: Tệp bảng nối sai cấu trúc bị báo là lỗi cơ sở dữ liệu, làm người vận hành khó biết lỗi nằm ở tệp của mình.
  - Ngoài-15: Phép kiểm không để lộ tên dự án có một số tên được bỏ qua theo quy tắc tự tính, nên danh sách bỏ qua có thể phình ra mà không ai hay.
  - Ngoài-16: Phép kiểm không để lộ tên dự án chỉ thử lại được cách viết hoa viết thường, chưa thử bỏ dấu hay bỏ hậu tố, nên có thể bỏ lọt một cách viết khác của tên.
  - Ngoài-17: Phép kiểm việc dọn bí danh dự án chỉ thấy bí danh đã biến mất, chưa chứng minh năm bí danh kia từng tồn tại trước khi dọn.
  - Ngoài-18: Phép kiểm xem tệp bảng nối có được git bỏ qua đang đọc luật của thư mục chính chứ không phải nhánh đang chấm, nên nhánh gỡ luật bỏ qua có thể không bị phát hiện.
  - Ngoài-19: Tệp khai báo nguồn dự án có ghi chú «chỉ local» nhưng phép kiểm chỉ dò chữ, không phải một cấu hình mà hệ thống thực sự đọc; chặn đồng bộ thật nằm ở chỗ khác.
