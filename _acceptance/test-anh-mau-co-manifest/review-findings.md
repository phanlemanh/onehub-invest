# Review findings: test-anh-mau-co-manifest (round 1)

Phạm vi đọc: `git diff origin/main...HEAD` tại d00d0f2 (merge-base = origin/main 1807624). Ba tệp test đổi:
`scripts/job-exit.test.mjs` (+5/−1), `scripts/nap-ts-order.test.mjs` (+4/−1), `scripts/zalo-import-job.test.mjs` (+2).
Đọc đối chiếu cổng manifest ở hai tệp bọc `scripts/zalo-import-daily.sh:66-77`, `scripts/apify-facebook-daily.sh:75-86`,
cùng ca canh cổng `scripts/au3-nap-bao-loi/acceptance.mjs` (chế độ `mo-coi`). Baseline đo trên worktree tách rời tạm tại
origin/main trong scratchpad (đã gỡ); không chạm `collector/snapshots` thật.

## Trong hợp đồng

(không có finding nào map được vào AC — E1–E3 đều đạt; xem evidence-report.md)

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- Không nới khẳng định: diff ba tệp không xoá hay sửa dòng nào chứa `assert`, `seq`, `expected` hay tên ca. Ba dòng bị
  xoá chỉ là dòng `mkdirSync` cũ, được tách thành `mkdirSync` cộng một dòng `writeFileSync(manifest.json)`.
- Manifest `'{}'` đủ cho cổng: hai tệp bọc chỉ kiểm `[ ! -f "$SNAP/manifest.json" ]`, không đọc nội dung. Trong ba bộ
  test, bước nạp `import_one` là bản giả (shim), nên không importer thật nào đọc manifest rỗng này. Hai tệp bọc khác mà
  job-exit dựng ảnh mẫu (`chotot-daily.sh`, `airdna-daily.sh`) không nhắc `manifest`, nên thêm tệp này ở đó là vô hại.
- Không mất khả năng bắt cổng manifest: ba bộ này vốn không canh cổng. Chúng canh thứ tự nạp theo mốc, ma trận tác vụ
  Zalo và dãy lời gọi. Cổng có ca canh riêng là `node scripts/au3-nap-bao-loi/acceptance.mjs mo-coi` (khoá config
  `snt_mo_coi`). Ca đó dựng thư mục thiếu manifest có chủ ý (trẻ, già, `.partial`) và không bị diff này đụng. Phiên chấm
  chạy lại nó trên HEAD và được `MO-COI PASS`.
- `job-exit.test.mjs` chỉ ghi manifest cho thư mục dưới `collector/snapshots/`. Các thư mục khác trong `dirs` (`pipeline/logs`, `db`)
  không bị thêm tệp.
- Gốc đỏ đúng như hợp đồng mô tả: trên origin/main, các ca đỏ đều vì tệp bọc dừng chuỗi và thoát khác 0 trước khi nạp.
  Nhật ký gồm «script phải xanh», «job thoát …», «JOB FAIL … thấy 0 dòng», lời gọi `[]`. Đó là đúng nhánh «thiếu
  manifest, <30′». Cây HEAD chỉ khác main ở ba dòng ghi manifest nên mọi ca xanh lại nhờ chính các dòng đó.

## Ngoài hợp đồng

không có

## Known limits
