# Review findings: chotot-khong-lui (round 1)

Phạm vi đọc: `git diff origin/main...HEAD -- pipeline/` tại `71322cd` (`pipeline/import-chotot.mjs` +26/−21,
`pipeline/scripts/chotot-khong-lui-noi-dung.test.mjs` +27). Đọc thêm các nơi gọi importer: `scripts/chotot-daily.sh`,
plist `com.oneinvest.chotot` (launchd gọi `/Users/manhphan/dev/one-invest/scripts/chotot-daily.sh`, tức đường symlink),
`scripts/check-freshness.test.mjs`, các harness `giu-captured-at`, `au3-nap-bao-loi`, `audit-p1-resilience`,
`importer-bo-qua-du-lieu-thu`. Mọi phép thử chạy trên bản chép trong scratchpad và DB tạm `acc_ckl_probe_*` (pg_dump -s,
xoá khi xong). Dấu DB oneinvest trước và sau phiên giống hệt nhau: `stg_chotot_ads` 17810 dòng, md5 `15ababbf…`;
`airbnb_snapshots` 2466 dòng; không còn DB `acc_*` nào sót lại.

## Trong hợp đồng

Không có finding nào gắn được vào AC. E1–E8 đều đạt; xem evidence-report.md.

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- Guard `main()` khi chạy qua symlink. Bản chép HEAD được trỏ tới bằng một symlink thư mục tạm, dựng y như
  `~/dev/one-invest → onehub-invest`. Chạy `/bin/bash <symlink>/scripts/chotot-daily.sh` với collect, transform, refresh
  và resolve thay bằng stub, DATABASE_URL trỏ DB tạm: thoát 0, log có «✅ 1 ads», DB tạm có 1 dòng. Như vậy importer
  thật sự chạy `main()` khi đi qua đường của launchd. Các đường khác cũng nạp đủ 1 dòng: gọi thẳng
  `node <symlink>/pipeline/import-chotot.mjs`, symlink trỏ thẳng vào tệp, và đường tương đối với cwd là thư mục symlink.
  Khi `import { UPSERT_SQL }` từ module, `main()` không chạy và DB không có dòng nào. Trỏ DB vào cổng không ai nghe qua
  đường symlink: dòng `❌ ECONNREFUSED — connect ECONNREFUSED 127.0.0.1:59999`, thoát khác 0. Vòng thử lại của
  `chotot-daily.sh` (grep ECONNREFUSED) vẫn nhận được lỗi này. Guard giống hệt guard của `import-airbnb.mjs:281` và
  `dq-enum-vocab.mjs:71`.
- Hai snapshot khác nhau cùng mốc thu: bản nạp sau thắng, vì WHERE dùng `>=`. Hợp đồng đã chấp nhận điều này, và E3 đo
  được (giá 1250000000).
- Snapshot cũ chứa một tin CHƯA có trong bảng thì vẫn được thêm, kèm `captured_at` của snapshot cũ. Đây là đường INSERT,
  WHERE không chạm tới. Lúc đó chưa có bản mới hơn nên đúng. Tin đã có bản mới trong cùng lượt nạp vẫn giữ bản mới
  (probe N3: 770001 giá 1200000000).
- `airbnb_snapshots` vẫn `ON CONFLICT DO UPDATE SET manifest`, không đổi `collected_at`, nên bất biến
  `captured_at = collected_at` vẫn giữ. E1–E3 đều in dòng bất biến ok.
- Chỉ `import-chotot.mjs` ghi `stg_chotot_ads`. `restore-captured-at.mjs` chỉ UPDATE `captured_at = collected_at` và không
  bị WHERE mới chi phối. Fixture của `check-freshness.test.mjs` tự INSERT vào schema tạm.

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Manifest thiếu `finishedAt` sinh dòng `captured_at` NULL, và từ vòng này dòng đó đóng băng vĩnh viễn**
  Người dùng thấy gì: Hiện chưa ai thấy. Nếu có một snapshot S06 thiếu `finishedAt`, ví dụ snapshot dựng tay hay nạp bù, thì tin trong đó nằm ở `stg_chotot_ads` với `captured_at` NULL. Mọi snapshot mới hơn về sau không cập nhật được giá, tiêu đề hay nội dung của tin đó nữa, và importer vẫn báo thành công.
  Căn cứ: `import-chotot.mjs:115` truyền thẳng `manifest.finishedAt` (thiếu thì thành NULL; tham số NULL tường minh đè `DEFAULT now()` của cột), và `airbnb_snapshots.collected_at` cho phép NULL. Sau đó `WHERE EXCLUDED.captured_at >= stg_chotot_ads.captured_at` so với NULL nên luôn chặn. Probe N2 trên DB tạm: nạp manifest thiếu finishedAt, thoát 0, dòng có `captured_at` NULL; nạp tiếp snapshot 2026-10-22 thì trên HEAD dòng vẫn «không finishedAt», giá 900000000, còn trên main nội dung tiến lên «mới», giá 1200000000. Hợp đồng chỉ chấp nhận «dòng CŨ có captured_at NULL» (không còn sau 2510-7). Đây là đường SINH dòng NULL mới. `collect-chotot.mjs:116` luôn ghi `finishedAt` nên xác suất thấp.
  file: `pipeline/import-chotot.mjs`
  severity: low
  Đề xuất: new-contract (importer từ chối manifest thiếu `finishedAt` và báo lỗi, hoặc thêm `stg_chotot_ads.captured_at IS NULL OR …` vào WHERE; làn ZCode, lời giao riêng)

- **Log «✅ N ads → stg_chotot_ads» đếm cả những tin mà WHERE đã chặn**
  Người dùng thấy gì: Người vận hành nạp bù một snapshot cũ thấy log báo nạp đủ N tin, trong khi thực ra không dòng nào đổi. Log không cho biết bao nhiêu tin bị giữ nguyên vì đã có bản mới hơn.
  Căn cứ: `import-chotot.mjs:118` đếm `n++` cho mỗi item, không đọc `rowCount` của lệnh upsert. Trước vòng này mọi item đều ghi nội dung nên số đếm đúng. Từ vòng này, lệnh bị WHERE chặn có `rowCount` bằng 0 mà vẫn được đếm. Ở E1, lượt nạp cũ sau mới vẫn thoát 0 và dòng không đổi.
  file: `pipeline/import-chotot.mjs`
  severity: low
  Đề xuất: known-limits (muốn rõ hơn thì in thêm «M tin giữ bản mới hơn» theo `rowCount`)

- **Guard `main()` im lặng không chạy khi node được gọi với `--preserve-symlinks-main`**
  Người dùng thấy gì: Hiện không có. Nếu sau này launchd hoặc một tệp bọc đặt `NODE_OPTIONS=--preserve-symlinks-main`, importer gọi qua `~/dev/one-invest` sẽ thoát 0 mà không nạp gì và không in dòng nào. Lỗi kiểu im lặng này khó thấy trong log đêm.
  Căn cứ: Guard so `realpathSync(argv[1])` với `fileURLToPath(import.meta.url)`, nhưng chỉ realpath một vế. Probe G5 với `NODE_OPTIONS=--preserve-symlinks-main` qua đường symlink: thoát 0, đầu ra trống, DB tạm có 0 dòng. Trong kho không chỗ nào dùng cờ này (đã `git grep`). `import-airbnb.mjs` và `dq-enum-vocab.mjs` có cùng guard từ trước, nên đây là nếp có sẵn được chép sang.
  file: `pipeline/import-chotot.mjs`
  severity: low
  Đề xuất: known-limits (muốn chặt hơn thì realpath cả hai vế, sửa đồng loạt ba tệp)

## Known limits

- Dòng cũ có `captured_at` NULL không bao giờ được cập nhật. Hợp đồng đã chấp nhận điều này. DB oneinvest hiện có 0
  dòng như vậy. Probe N1 xác nhận hành vi: trên HEAD dòng giữ nguyên bản cũ, còn trên main nội dung vẫn tiến nhưng
  `captured_at` kẹt NULL. OOC-1 là đường sinh thêm dòng NULL mới.
- Hai snapshot khác nhau cùng mốc thu: bản nạp sau thắng. Hợp đồng đã chấp nhận.
- Dữ liệu đã bị lùi trước vòng này không được khôi phục. Hợp đồng đã chấp nhận.
- `import-airbnb` giữ luật LEAST của 2410-1. Hợp đồng đã chấp nhận.
