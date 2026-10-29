---
schema_version: 1
feature: Thước live của DB local không đòi bản lùi tồn tại mãi
slug: db-volume-live-ban-lui
owner: phanlemanh@gmail.com
risk_tier: T2      # scripts/db-volume-check.sh + hồ sơ — không chạm t3_paths
surfaces: [ops]
status: approved
design_doc: _acceptance/db-volume-live-ban-lui/design.md
approved_by: Mạnh
approved_at: 2026-10-29
---

# Acceptance Contract: db-volume-live-ban-lui

## Context

Ngoài-4 của hồ sơ `db-vao-volume`, Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 29/10 (sổ
`_acceptance/db-vao-volume/decisions.jsonl`, `d-20261029T095727Z-27`). `bash scripts/db-volume-check.sh live` hiện gộp
bất biến «dữ liệu DB local nằm trong volume `onehub_pgdata`» với điều kiện tạm «còn container bản lùi
`one-invest-db-cu-*`»: sau khi xoá bản lùi theo kế hoạch (sớm nhất 05/11) thước sẽ đỏ giả mãi. Vòng này tách hai điều,
và phải gộp trước 05/11 (giám sát, trả lời P2-80).

## Criteria

- AC-1: Given `one-invest-db` có `data_directory` dưới mount volume `onehub_pgdata` và KHÔNG còn container
  `one-invest-db-cu-*` nào, When chạy bộ đọc của `live` SAU hạn giữ bản lùi (05/11/2026 16:20 giờ VN), Then nó xanh với
  dòng ghim `PASS không còn bản lùi one-invest-db-cu-*`; còn TRƯỚC hạn ấy thì nó đỏ với `FAIL bản lùi mất trước hạn
  giữ` (lối b của Hỏi-1 — Mạnh chọn lối a thì vế «trước hạn» bỏ, vắng luôn xanh).
- AC-2: Given `data_directory` KHÔNG nằm dưới mount volume `onehub_pgdata` (mount ở `/var/lib/postgresql/data`), When
  chạy bộ đọc của `live` với bất kỳ trạng thái bản lùi nào trong tám trạng thái của ma trận, Then nó đỏ với `FAIL
  data_directory nằm trong lớp ghi container`.
- AC-3: Given dữ liệu nằm đúng volume và CÒN bản lùi, When chạy bộ đọc của `live`, Then xanh khi MỌI bản lùi `exited`
  với restart `no` (một bản hay hai bản); đỏ với `FAIL bản lùi <tên> trạng thái <st> restart=<rp>` gọi đúng tên bản
  sai khi có bất kỳ bản lùi nào đang chạy hay restart khác `no` — dù bản ấy đứng đầu hay cuối danh sách.
- AC-4: Given máy thật, When chạy `live` (gồm tự kiểm), Then đường gom bản lùi chạy qua docker thật cho mảng rỗng (exit
  0) khi không container nào khớp và cho đủ số phần tử khi có; ma trận 16 ô dựng từ `docker inspect one-invest-db` thật
  cho đúng chiều đã khai trước với thông điệp ghim từng ô và đếm đủ 16 ô; phần «máy này» xanh theo trạng thái bản lùi
  lúc chạy.
- AC-5: Given cây sau vòng, When chạy các thước khác của cùng tệp (`static`, `mutation`, `tap-duot`) và làn ghim lại của
  hồ sơ `db-vao-volume`, Then tất cả xanh với dòng ghim của chúng — hồ sơ đã ký `db-vao-volume` không lùi.

## Coverage

Không chạy `morphological-scan`: không gian là ma trận dữ liệu × trạng thái bản lùi (16 ô) cộng đường gom, đã liệt kê trọn trong design (entry `descope` «bỏ
coverage-scan» trong sổ).

- Trục dữ liệu: trong volume `onehub_pgdata` (AC-1, AC-3) · trong lớp ghi container (AC-2). [thước CE: hai trạng thái
  `check_du_lieu` phân biệt]
- Trục bản lùi: vắng trước hạn giữ · vắng sau hạn giữ (AC-1) · một bản dừng đúng · một bản đang chạy · một bản dừng sai
  restart · hai bản bản tên nhỏ đang chạy · hai bản bản tên lớn đang chạy · hai bản đều dừng đúng (AC-3). [thước CE: hai
  thuộc tính bộ đọc xem — `State.Status`, `RestartPolicy.Name` — cùng số bản, vị trí bản sai và mốc hạn giữ]
- Trục đường gom: không container khớp · có container khớp (AC-4, qua docker thật).
- Cross-cutting: không lùi hồ sơ `db-vao-volume` (AC-5).

## Out of scope

- Sửa `docs/ops/db-volume.md`, `docs/ops/runtime-map.md` (ngoài ranh giới hàng; câu hiện có vẫn đúng ở ca còn bản lùi).
- Xoá bản lùi `one-invest-db-cu-20261029` — việc Mạnh duyệt sau 05/11.
- Các Known limits khác của `db-vao-volume` (Ngoài-1…15 trừ Ngoài-4).

## Notes

- Không có bề mặt UI → không design-pass, không đặc tả UX, không eval ui-check (sổ quyết định).
- S3 chạy làn ghim lại của hồ sơ `db-vao-volume` trên cây sau vòng (`repin-lane.mjs --slug db-vao-volume --write`, cần
  lượt `ghim-lai` của đợt); E8 đọc kết quả lượt ấy. Phải gộp trước 05/11/2026 16:20 giờ VN (hạn giữ bản lùi).
