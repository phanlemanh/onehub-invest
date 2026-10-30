# Review findings: check-s08-harness (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC — 4/4 eval đạt `expected` trên `291440bc`, kể cả các vế should-NOT-fire)

## Ngoài hợp đồng

không có

## Đã soát, không phải finding

Phạm vi soát vòng 2: `git diff 9733d2c0...291440bc`. Gồm một dòng ở `pipeline/scripts/check-s08-inventory.mjs`, khối
`cs8h_*` ở `_acceptance/config.yaml`, hồ sơ này, và hai tệp máy sinh `PRODUCT-MAP.md`, `LO-TRINH.html`. Trọng tâm là
commit `291440bc`, nới AC-4 cho hai tệp máy sinh.

- **Độ nới của AC-4 không quá mức.** Regex mới neo `^…$`, có dấu chấm thoát, nên chỉ khớp đúng hai tên ở gốc kho. Tôi thử
  trên clone trong scratchpad: tám tệp giả dạng đều bị bắt là «tệp ngoài phạm vi». Đó là `app/PRODUCT-MAP.md`,
  `docs/plan/LO-TRINH.html`, `PRODUCT-MAP.md.bak`, `xPRODUCT-MAP.md`, `LO-TRINHxhtml`, `PRODUCT-MAPxmd`,
  `_acceptance/check-s08-harnessX/a.md` và `_acceptance/other-slug/contract.md`. Sửa mã sản phẩm
  (`pipeline/import-s08-row.mjs`) vẫn đỏ. Phần cho phép cũ (`_acceptance/check-s08-harness/.*`, `config.yaml`) không đổi.
- **Nội dung hai tệp máy sinh không được AC-4 xét.** Sửa tay `PRODUCT-MAP.md` vẫn ra SCOPE OK. Đây là hệ quả có chủ ý
  của việc cho phép theo tên tệp. Nội dung được CI giữ bằng `product-map.mjs --check` trong `acceptance-gate.yml`, và hai
  tệp có trong `t1_skip_globs`. Tôi đã chạy `--check` sau khi ghi `machine-cleared`: cả hai tệp khớp bản sinh. Diff của
  hai tệp so với main chỉ là mục `check-s08-harness`. Tại `291440bc` (status `implemented`), `--check` lệch đúng mục này
  ở bucket «Đang làm» và «Đã giao». Sinh lại trên bản chép cho thấy không có mục nào khác lệch. Chỗ lệch hết khi status về
  lại `machine-cleared`.
- Khuôn cho phép giống tiền lệ `test-scripts-sau-87-90` AC-6 (cùng hai tên, cũng xét theo tên tệp).
- `config.yaml` được cho phép trọn tệp từ vòng 1. Diff thật chỉ là ba khoá `cs8h_*` và một dòng chú thích, không đổi cấu
  hình khác.
- Ý tiêu chí giữ nguyên: diff thực chất vẫn là một dòng danh sách chép. Bốn tệp nguồn được chép và `lib/` trên HEAD giống
  hệt origin/main `9733d2c0`. Baseline E1–E2 đo lại trên main mới vẫn đỏ, HEAD xanh.
- Các ghi nhận vòng 1 vẫn đúng và không phải finding. `scope.sh` lọc dòng diff bằng `^[+-][^+-]`. Danh sách chép tĩnh sẽ
  vỡ lại nếu chuỗi nạp thêm import tương đối (hợp đồng đã khai đây là ngoài phạm vi). Ca DB của `sync-pii.test` chỉ đọc.
- Hạ tầng chấm: symlink `pipeline/node_modules` không bị git coi là untracked trong lúc E1–E3 chạy. Dù vậy, symlink đã
  gỡ trước E4 để danh sách tệp không phụ thuộc điều đó.
