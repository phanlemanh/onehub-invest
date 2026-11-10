---
schema_version: 1
feature: Thước E4 của hồ sơ đã ký app-test-chiu-song-song đếm đúng ba ca LDR theo tên thay vì tổng ca xanh của tệp test, thước phạm vi E5 neo khoảng commit của nhánh gốc, rồi ghim lại hồ sơ ấy bằng làn máy
slug: thuoc-song-song-dem-theo-ten-ca
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
design_doc: docs/superpowers/specs/2026-11-09-thuoc-song-song-dem-theo-ten-ca-design.md
approved_by: Mạnh
approved_at: 2026-11-10
---

# Acceptance Contract: thuoc-song-song-dem-theo-ten-ca

## Context

Giám sát mở hàng ở P4-161 (09/11): E4 của hồ sơ đã ký `app-test-chiu-song-song` (`probes/song-song.mjs lib`) đòi
`ℹ pass 3` trên trọn `pipeline/scripts/luoc-do-rieng.test.mjs`, nhưng tệp nay có 5 ca trên main và 9 ca ở nhánh
`khoa-nguon-nghi-khi-ddl-sua`. Lưới trước-gộp trên main (09/11) đã báo hồ sơ ấy hoá cũ vì tệp test trong `paths` của E4
đổi sau `verified_commit`; PR nào chạm tệp của hồ sơ phải ghim lại nó. Lượt ghim chạy cả E5 (`probes/pham-vi.sh`), mà E5 so
merge-base của nhánh đang đứng nên đỏ ở mọi nhánh sau nhánh gốc. Đổi thước của hồ sơ đã ký nên qua Cổng Phạm vi của Mạnh.

## Criteria

- **AC-1** — Given `luoc-do-rieng.test.mjs` có ca ngoài ba ca LDR của AC-4 cũ (bản main: 5 ca), When chạy
  `song-song.mjs lib`, Then chỉ ba ca mang đúng ba tên ấy chạy (`--test-name-pattern` neo `^(…)$`), mỗi tên có dòng
  `✔ <tên>`, đầu ra có `ℹ pass 3` và `ℹ fail 0`, probe in `# ca theo tên: 3/3` rồi `LIB OK` và thoát 0; tập tên ca chạy trong đầu ra bằng
  đúng ba tên (so với mọi tên ca rút từ tệp đang đứng). Executor `atss_lib` chạy trên DB thử (`db-thu.sh`).
- **AC-2** — Given bản chép tạm `.dot-<pid>` của tệp test đổi tên một trong ba ca, When probe chạy bản ấy (đối chứng trong
  probe), Then bộ kiểm đỏ với `CA LDR VANG: «<tên cũ>»` gọi đúng tên bị đổi; bản chép tạm bị xoá.
- **AC-3** — Given bản chép tạm thêm một ca `LDR` xanh ngoài danh sách vào cuối tệp test, When probe chạy bản ấy, Then bộ kiểm
  vẫn xanh 3/3 và tên ca thêm không có trong đầu ra (thước không đếm tổng); ca thêm mang tên `<tên ca 1> phụ` cũng không
  chạy (bộ lọc neo đủ tên); mọi bản chép tạm bị xoá, kể cả khi một đối chứng ném lỗi.
- **AC-4** — Given ba bản đột biến cũ của thư viện (giữ 33033, bỏ ràng buộc, dãy dùng chung), When chạy cùng bộ lọc ba tên,
  Then mỗi bản đỏ với đúng thông điệp ghim cũ; tệp thật không đổi (so băm trước/sau).
- **AC-5** — Given `probes/pham-vi.sh` neo `a86804f7..2070958c` (điểm rẽ và đầu nhánh gốc của PR #267), When chạy ở nhánh
  này, Then in `PHAM VI OK`, thoát 0, danh sách tệp `ok …` bằng đúng `git diff --name-only a86804f7 2070958c`, hai đối chứng
  cũ vẫn in; khi một commit neo không có trong kho thì thoát 2 với thông điệp gọi tên commit; hai commit neo là tổ tiên
  của `origin/main` (PR #267 gộp bằng merge commit `fcc42f9c`).
- **AC-6** — Given hai probe đã sửa, When ghim lại `app-test-chiu-song-song` bằng `repin-lane.mjs --write`, Then run-log của
  hồ sơ ấy có dòng `kind: repin` với năm eval E1–E5 mã 0, `verified_commit` = `sha` của dòng ấy, và
  `pre-merge-check.sh . --base <merge-base>` (phạm vi diff của PR) không còn VIOLATION nào — kể cả hồ sơ khác bị kéo vào vì
  tệp PR chạm.
- **AC-7** — Given nhánh so merge-base, When liệt kê tệp đổi, Then chỉ có: hai probe của `app-test-chiu-song-song`, run-log và
  evidence-report của nó (diff chỉ dòng ghim của làn máy), hồ sơ này, `_acceptance/config.yaml`, design doc,
  `PRODUCT-MAP.md`, `LO-TRINH.html`; `contract.md`, `evals.yaml`, `decisions.jsonl` của hồ sơ đã ký không đổi; đối chứng: một
  tệp ngoài danh sách → `NGOAI PHAM VI`.

## Coverage

Bỏ quét hình thái bằng dòng sổ descope «bỏ coverage-scan — …» (hai probe, mỗi probe một hành vi). Trục tự kê để người soát:

| Trục | Giá trị | AC |
|---|---|---|
| Tệp test | đúng ba ca · có ca thêm (5 trên main, 9 ở nhánh khoá-nguồn) · một ca đổi tên | AC-1 · AC-1, AC-3 · AC-2 |
| Chiều đỏ của thư viện | giữ 33033 · bỏ ràng buộc · dãy dùng chung | AC-4 |
| Thước phạm vi | khoảng neo xanh · commit neo vắng · tệp ngoài vùng | AC-5 · AC-5 · AC-5 (đối chứng cũ) |
| Ghim lại | năm eval + suite xanh · lưới trước-gộp sạch trên phạm vi PR · E4 cũ chạy DB thử | AC-6 · AC-6 · AC-1 |
| Phạm vi hàng | tệp đổi · hồ sơ đã ký không đổi chữ | AC-7 |

## Out of scope

- Sửa `contract.md`, `evals.yaml` hay chữ ký của `app-test-chiu-song-song`: chữ AC-4 và E4 vẫn đúng với thước mới.
- Lượt ghim lại các hồ sơ đã ký khác đang hoá cũ (ngoài `app-test-chiu-song-song`).
- Ca `KN-` của `khoa-nguon-nghi-khi-ddl-sua` (hàng đang gác) — thước mới không đếm chúng, hàng ấy tự đo.

## Notes

- Không migration, không route, không mã sản xuất.
- Lượt ghim lại xin lượt `ghim-lai` của đợt trước khi chạy.
