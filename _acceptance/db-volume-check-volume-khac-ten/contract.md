---
schema_version: 1
feature: Tự kiểm live của DB local đo đủ bốn nhánh dữ liệu, gồm volume khác tên
slug: db-volume-check-volume-khac-ten
owner: phanlemanh@gmail.com
risk_tier: T2      # scripts/db-volume-check.sh + hồ sơ — không chạm t3_paths
surfaces: [ops]
status: verified
design_doc: _acceptance/db-volume-check-volume-khac-ten/design.md
approved_by: Mạnh
approved_at: 2026-10-29
---

# Acceptance Contract: db-volume-check-volume-khac-ten

## Context

Ngoài-10 và Ngoài-11 của hồ sơ `db-volume-live-ban-lui`; Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng ngày 29/10.
Tự kiểm của `bash scripts/db-volume-check.sh live` không có ô nào thử nhánh «dữ liệu nằm trong volume khác tên» (cũng
không có ô nào thử nhánh «không đọc được data_directory») của `check_du_lieu`. Ai sửa nhầm nhánh ấy thành xanh thì tự
kiểm vẫn ĐẠT, và dữ liệu có thể nằm sai chỗ mà không ai được cảnh báo.

## Criteria

- AC-1: Given `docker inspect one-invest-db` thật, mount đổi thành volume `db_pgdata` gắn `/var/lib/postgresql` (chứa
  `data_directory`) và bản lùi ở trạng thái xanh (một bản `exited`/`no`, sau hạn giữ), When tự kiểm của `live` chạy bộ đọc
  `o_live` trên fixture ấy, Then ô đỏ với dòng ghim `FAIL data_directory <dd> nằm trong volume db_pgdata (cần
  onehub_pgdata)`.
- AC-2: Given cùng bản lùi xanh, When tự kiểm chạy `o_live` trên bốn trạng thái dữ liệu (đúng volume · volume khác tên ·
  lớp ghi container · không đọc được `data_directory`), Then mỗi ô khớp chiều đã viết trước kèm thông điệp ghim (xanh
  `PASS data_directory <dd> dưới mount volume onehub_pgdata` · đỏ AC-1 · đỏ `FAIL data_directory nằm trong lớp ghi
  container` · đỏ `FAIL không đọc được data_directory của one-invest-db`), và đếm đủ: `PASS nhánh dữ liệu đủ 4 ô`. Ô
  «không đọc được» lấy `data_directory` qua đúng hàm đọc mà `live` dùng, trỏ vào một container không tồn tại — không
  viết tay chuỗi rỗng.
- AC-3: Given một bản sao `db-volume-check.sh` mà nhánh «volume khác tên» bị sửa từ `fail` thành `pass`, When chạy
  `mutation`, Then `live-selftest` của bản sao đỏ với dòng ghim `ô dữ liệu khac-ten lẽ ra đỏ`, còn `live-selftest` của
  bản lành xanh với `PASS nhánh dữ liệu đủ 4 ô`; sed không đổi byte nào thì `mutation` đỏ.
- AC-4: Given cây sau vòng, When chạy `live`, `static`, `mutation`, `tap-duot`, Then tất cả thoát 0. Không lùi:
  ma trận cũ vẫn `PASS ma trận đủ 16 ô`, phần «máy này» xanh, sáu dòng đỏ ghim cũ của `mutation` còn nguyên.
- AC-5: Given cây sau vòng, When chạy làn ghim lại của hai hồ sơ đã ký `db-vao-volume` và `db-volume-live-ban-lui`, Then
  mỗi hồ sơ có một dòng `repin` mới, mọi suite và mọi eval máy đều exit 0, và `verified_commit` bằng `sha` của dòng ấy.

## Coverage

- Trục dữ liệu: đúng volume · volume khác tên · lớp ghi container · không đọc được `data_directory` (AC-1, AC-2).
  [thước CE: bốn nhánh `if/elif/else` + nhánh rỗng của `check_du_lieu` trong `scripts/db-volume-check.sh`]
- Trục phép đo: ô thật (AC-2) · bản sao bộ đọc bị phá (AC-3) · bản lành (AC-3).
- Cross-cutting: không lùi ma trận 16 ô và các thước khác của cùng tệp (AC-4); hai hồ sơ đã ký không lùi (AC-5).

Không chạy `morphological-scan`: không gian là bốn nhánh của một hàm, đã liệt kê trọn trong design (xem entry `descope`
«bỏ coverage-scan» trong sổ).

## Out of scope

- Nhánh con «mount đúng bằng `data_directory`» (`Destination == dd`) của bộ chọn mount — để Later.
- Ngoài-6 và Ngoài-12 của `db-volume-live-ban-lui` (ô «hai bản đều dừng đúng» chỉ ghim một bản): đã ghi Known limits.
- Ghép trục dữ liệu bốn giá trị vào ma trận 16 ô (thành 32 ô): đổi lời AC-4 đã ký của `db-volume-live-ban-lui`.

## Notes

- Không có bề mặt UI → không design-pass, không đặc tả UX, không eval ui-check (sổ quyết định).
- S3 ghim lại `db-vao-volume` và `db-volume-live-ban-lui` trên cây sau vòng (lượt `ghim-lai` của đợt, `cham-tep` cho tệp hồ sơ
  của chúng); E8 đọc kết quả hai lượt ấy. Quan hệ «sha của lượt ghim lại chứa bản cuối của `db-volume-check.sh`» do lưới
  trước-merge (`scripts/pre-merge-check.sh`, chạy trong CI) chặn: tệp đổi sau `verified_commit` của hồ sơ đã ký là
  `VIOLATION evidence is stale` (gap-probe P1).
