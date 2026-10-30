# Review findings: s03-null-byte (round 1)

## Trong hợp đồng

- **F1 (thấp, không chặn) — `probes/scope.sh` không ràng buộc dòng THÊM, nên lỏng hơn AC-6.** AC-6 đòi «không chạm
  nhánh Airbnb, S08, OSM hay `airbnb_snapshots`». Probe chỉ lọc dòng XOÁ: vế «dòng xoá ngoài đường S03» và vế «chạm nhánh
  khác» đều chỉ grep các dòng `^-`. Với dòng thêm, probe chỉ đếm. Thử trên clone trong scratchpad (`339079cd`,
  `origin/main` ghim `3c928be7`):
  - M1: thêm thuần một dòng `it.payload = stripNullBytes(it.payload);` vào nhánh `airbnb-listing` → **SCOPE OK**
    (lọt).
  - M2: thay tham số `stg_abnb_listings` → bị bắt «dòng xoá ngoài đường S03».
  - M3: thay `JSON.stringify(manifest)` của `airbnb_snapshots` → bị bắt.
  - M4: thêm tệp lạ `pipeline/import-s08-row.mjs.bak` → bị bắt «tệp ngoài phạm vi».
  - M5: sửa `pipeline/import-s08-row.mjs` → bị bắt.

  Không chặn vì cây thật vẫn đúng AC-6. Phiên chấm đã đối chiếu tay đủ 22 dòng thêm trong `pipeline/import-airbnb.mjs`.
  Có 13 dòng thuộc khối `stripNullBytes` (hunk `@@ -44,0 +45,14 @@`, ngay sau `DB_URL`, nằm ngoài mọi nhánh nguồn). 9
  dòng còn lại thay đúng 9 tham số của INSERT `stg_zalo_posts` (hunk `@@ -199,2` và `@@ -202,7`). Gợi ý cho bên làm, nếu
  muốn probe có răng ở vòng sau: thêm một vế kiểm mọi hunk của importer chỉ rơi vào khối `stripNullBytes` hoặc khoảng
  dòng của INSERT `stg_zalo_posts`. Phiên chấm không sửa probe.

## Ngoài hợp đồng

không có

## Đã soát, không phải finding

Phạm vi soát: `git diff 3c928be7...339079cd`. Gồm commit `835cdf3f` của ZCode, hồ sơ `93cee479`, merge origin/main,
hai tệp máy sinh và khối `s03nb_*` của `config.yaml`. Merge-base trùng origin/main.

- **Đủ tham số chuỗi của INSERT `stg_zalo_posts`.** INSERT có 13 tham số. Cả 9 tham số lấy từ `it.payload` / `mediaFiles`
  ($3, $4, $6–$12) đều qua `stripNullBytes`, kể cả hai cột jsonb (lọc TRƯỚC `JSON.stringify`). Nếu lọc sau thì `\0` thành
  chuỗi thoát `\u0000`, và jsonb cũng từ chối. Bốn tham số không lọc là `$1 it.sourceId`, `$2 manifest.snapshotId`,
  `$5 it.fetchedAt` và `$13 manifest.finishedAt`.
- **`it.sourceId` / `it.fetchedAt` không lọc: rủi ro thấp, và để nguyên là đúng.** Quét chỉ đọc toàn bộ 1.368 snapshot
  S03 từ mốc `…042737822` trở đi (10.993 item): 11 snapshot có U+0000, và cả 11 chỉ ở `payload.text`. Không ca nào ở
  `sourceId`, `fetchedAt` hay manifest. `sourceId` là khoá upsert `post_id`: nếu lặng lẽ bỏ ký tự trong khoá thì có thể
  gộp nhầm hai bài, nên để Postgres báo lỗi to là cách an toàn hơn. `fetchedAt` vào cột `timestamptz`, chuỗi có `\0`
  không parse được đằng nào cũng hỏng. Hai trường manifest (`snapshotId`, `finishedAt`) đã đi qua INSERT
  `airbnb_snapshots` trước đó. Lọc manifest thuộc «Out of scope» và chưa có ca nào.
- **Không đổi hành vi ngoài việc bỏ U+0000 (với dữ liệu JSON thật).** Số, `null`, `undefined` giữ nguyên.
  `it.payload?.text ?? ""` vẫn rơi về `""`. Media vắng vẫn ra chuỗi `"null"` như cũ. Phần upsert `ON CONFLICT` không đổi.
  Có một khác biệt lý thuyết: khoá `__proto__` bị rơi, vì `out["__proto__"] = …` đổi prototype thay vì tạo khoá. Thử
  `stripNullBytes(JSON.parse('{"__proto__":{…},"k":1}'))` ra `{"k":1}`. Quét 7.211 tệp items S03 trên đĩa: 0 tệp có khoá
  `"__proto__"`. Collector không sinh khoá này, nên đây không phải finding.
- **Bản sửa trúng đúng lỗi thật.** Snapshot `hanoi__zalo-agent__2026-10-29T042737822` có 4 item, U+0000 chỉ ở
  `payload.text` của 1 item. DB local có đúng 4 dòng của snapshot này. Tôi so md5 của `text` trong DB với md5 của text gốc
  đã bỏ U+0000 cho từng `post_id`: 4/4 khớp. Phần còn lại giữ nguyên, đúng ý AC-2 trên dữ liệu thật. Vì importer cũ không
  nạp nổi chuỗi có `\0` (E3), dòng của snapshot này chỉ có thể đến từ một importer đã lọc. 19 dòng «sau mốc» thuộc 5
  snapshot kế tiếp (`…042837824` → `…043237828`). Phần nạp bù ~1.360 snapshot còn lại là việc triển khai sau gộp, hợp
  đồng đã khai Out of scope.
- **Probe fixture/baseline kiểm đúng điều contract nói.** Fixture có U+0000 ở text, `senderName`, `group`, media lồng
  hai tầng (`media[0].url`, `media[0].meta.cap`) và `meta.mediaFiles`. Nó so cả dòng đã lọc, kể cả `media_files[0].snapshotId`,
  và nạp hai lần trên DB tạm. Importer không có nhánh «đã nạp thì bỏ qua», nên lượt 2 thật sự đi qua `ON CONFLICT`.
  Baseline lấy importer ở merge-base bằng `git show`, đặt tạm trong `pipeline/` để import tương đối chạy được, trap xoá
  sau lượt (đã kiểm: không còn `.import-airbnb-base-*`). Nó đòi đúng chuỗi lỗi Postgres về 0x00. Cả hai probe đều xoá DB
  tạm `s03nb_<pid>` (đã kiểm `pg_database`: 0 DB còn sót).
- **Test đơn vị chạy trong CI**: `pipeline/package.json` có glob `scripts/*.test.mjs`.
- **`config.yaml`** chỉ thêm năm khoá `s03nb_*` và một dòng chú thích. Hai tệp máy sinh khớp
  `node scripts/product-map.mjs --root . --check` tại `339079cd`.
- **`real.sh` so `snapshot_id >` theo thứ tự chữ.** Các mã cùng tiền tố `hanoi__zalo-agent__` và mốc thời gian cùng độ
  dài, nên thứ tự chữ trùng thứ tự thời gian.
