# NH1 media-canonical-reso — Kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ảnh của mọi tin S03/S05/S06 nằm ở bảng `media` (RESO Media) ở máy thu, và `/ops/review`, `/ops/data-flow` đọc ảnh từ bảng này, nên tin S06 có ảnh.

**Architecture:** Migration 053 thêm bảng `media`. `pipeline/transform-media.mjs` dựng lại ảnh của tin sống theo nguồn trong một giao dịch, dùng hàm thuần trong `pipeline/media-rows.mjs`, và chạy bằng `job_run` sau transform mỗi nguồn. Ở app, `review-media.ts` có thêm `loadOfferMedia` và `buildMediaImages`; hai loader đọc qua chúng. Bảng không lên cloud: không vào `FILL`, leak gate đếm.

**Tech Stack:** PostgreSQL/PostGIS (DB thử `oneinvest_p2_media` trên :5433), Node `.mjs` + `pg` (pipeline), Next.js 16 + TypeScript, `node --test` (pipeline) và `node --import tsx --test` (app).

**Spec:** `docs/superpowers/specs/2026-10-30-media-canonical-reso-design.md` · hợp đồng `_acceptance/media-canonical-reso/contract.md` · evals `_acceptance/media-canonical-reso/evals.yaml`.

**Thi công:** tuần tự trong phiên (Native), đã chọn khi giao việc.

## Global Constraints

- Mọi lệnh chạm DB trỏ `DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media`. Không áp 053 lên `oneinvest` trước khi gộp. Test và probe dừng khi `current_database() = 'oneinvest'` mà DB đó chưa có bảng `media`.
- Nguồn chỉ gọi bằng mã S0x. Không ghi tên hay tên miền nguồn thật vào mã mới, comment, test hay tài liệu (kho công khai). Fixture URL dùng host trung tính (`img.example.test`), riêng URL có hạn dùng host trong `EXPIRING_HOST` sẵn có.
- Migration: tệp mới `db/migrations/053_media.sql`, idempotent, có header theo `.claude/rules/migrations.md` và dòng `KHÔNG sync cloud`.
- Tám cột của bảng `media` đúng design §2.1: `media_key`, `resource_record_key`, `originating_system_name`, `originating_system_resource_record_key`, `media_url`, `media_order`, `local_file`, `media_modification_timestamp`.
- Khuôn `local_file`: `<snapshotId>/<file>`, trong đó snapshotId khớp `^[A-Za-z0-9][A-Za-z0-9_.:-]*$`, file khớp `^media/[A-Za-z0-9][A-Za-z0-9_.-]*$`, và không có `..` (hai regex của `app/src/lib/ops/zalo-media.ts`).
- `media_key = md5(resource_record_key || '|' || coalesce(local_file, media_url))`.
- Trần 12 ảnh mỗi tin (`MAX_IMAGES_PER_OFFER`) chỉ áp ở bên đọc.
- Không sửa `pipeline/transform-zalo.mjs` hay `pipeline/lib/**` (vùng của N1, dãy P1).
- `_acceptance/config.yaml`: chỉ thêm dòng executor của NH1, không sửa dòng có sẵn (P2-91). Hai `evals.yaml` của hồ sơ đã ký: chỉ chuyển E6, E7, E8 (`review-media-backend`) và E15, E16 (`ops-dong-chay-df0`) sang `status: not-run` + `superseded_by` (khuôn EVAL-THAY-BOI), không đổi chữ eval nào khác.
- UI theo luật ReUI của `AGENTS.md`: chỉ bỏ một nhánh chữ, không thêm màu hay khoảng cách mới.

## Review Focus

1. Một lượt S06 thật có khoảng 190 nghìn dòng: bên ghi phải chia lô dưới trần 65.535 tham số của Postgres. Probe AC-7 chạy trên toàn bộ dữ liệu (Task 6).
2. `chotot-daily` và `zalo-import-daily` chạy chồng giờ: khoá `pg_advisory_xact_lock` xếp hàng hai lượt, và lượt S06 không xoá dòng S03. Ca «nguồn khác không bị chạm» ở Task 2 kèm ca chạy hai nguồn nối tiếp.
3. snapshotId có dấu `:` hoặc `.` (khuôn cho phép): CHECK của 053 phải nhận, `..` thì từ chối (Task 1).
4. Phần tử `images` của bảng nạp không phải chuỗi (null, object): bên ghi bỏ, không ném lỗi (Task 2, ca dòng nạp thật + ca rác).
5. Tin S06 ở thẻ `entity_match` cũ có `evidence.image_url`: ảnh evidence đứng cuối và không trùng ảnh từ bảng (Task 4, NH-AC-5).

---

### Task 1: Migration 053 và DB thử

**Files:**
- Create: `db/migrations/053_media.sql` (theo skill `/new-migration`)
- Create: `pipeline/scripts/media-canonical.itest.mjs` (các ca NH-AC-1; Task 2 thêm ca)

**Interfaces:**
- Produces: bảng `media` (tám cột, PK `media_key`, FK `resource_record_key → sale_offer_records(offer_id)`, index `(resource_record_key, media_order)` và `(originating_system_name)`). Helper trong itest: `withTx(fn)` (BEGIN … ROLLBACK) và `guardDb()`.

- [ ] **Bước 1:** Dựng DB thử: `bash db/db-thu.sh oneinvest_p2_media`. Kỳ vọng: in `db-thu: oneinvest_p2_media dựng xong`.
- [ ] **Bước 2:** Viết các ca itest.
  - `NH-AC-1 chốt DB`: `guardDb()` ném `DATABASE_URL trỏ DB oneinvest dùng chung` khi `current_database() = 'oneinvest'` và `to_regclass('public.media')` null. Ca này chạy hàm guard trên tham số giả, không nối tới `oneinvest`.
  - `NH-AC-1 053 chạy hai lần`: trong giao dịch, đọc tệp 053 và `query` hai lần; `information_schema.columns` của `media` cho đúng tám tên theo thứ tự.
  - `NH-AC-1 ràng buộc`: mỗi lệnh INSERT sau bị từ chối, và thông điệp chứa đúng tên ràng buộc ghim trong ca: `media_url = 'javascript:x'`; dòng có cả hai `NULL`; `local_file = 'a/../media/x.jpg'`; `local_file = 'snap/x.jpg'`; `media_order = -1`; `resource_record_key = 'khong-co'`. Đối chứng dương: dòng có `media_url` https và `local_file = 'hcmc__zalo-agent__2026-10-23T000000/media/1.jpg'` (offer lấy từ một `sale_offer_records` có thật) vào được. Mỗi lệnh chạy trong SAVEPOINT riêng.
- [ ] **Bước 3:** Chạy `cd pipeline && DATABASE_URL=…/oneinvest_p2_media node --test scripts/media-canonical.itest.mjs`. Kỳ vọng: FAIL vì chưa có tệp 053.
- [ ] **Bước 4:** Viết 053 bằng `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`, tên ràng buộc đặt tường minh (`media_url_http`, `media_has_source`, `media_local_file_shape`, `media_order_nonneg`). Áp lên DB thử: `docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest_p2_media -v ON_ERROR_STOP=1 < db/migrations/053_media.sql`, hai lần.
- [ ] **Bước 5:** Chạy lại itest. Kỳ vọng: PASS. Phá thử: đổi `media_url_http` thành `true` trong một bản sao 053, áp trong giao dịch, ca ràng buộc phải đỏ gọi tên `media_url_http`.
- [ ] **Bước 6:** Commit `feat(db): 053 bảng media theo RESO Media (NH1)`.

Phục vụ E1 · independent: false

### Task 2: Bên ghi — `media-rows.mjs` + `transform-media.mjs`

**Files:**
- Create: `pipeline/media-rows.mjs` (thuần, không import `pg`)
- Create: `pipeline/transform-media.mjs`
- Modify: `pipeline/scripts/media-canonical.itest.mjs` (ca NH-AC-2, NH-AC-4)

**Interfaces:**
- Consumes: bảng `media` (Task 1).
- Produces:
  - `SNAPSHOT_ID: RegExp`, `MEDIA_FILE: RegExp` — chép nguyên hai regex của `zalo-media.ts`.
  - `mediaKey(offerId: string, localFile: string|null, url: string|null): string` (md5 hex).
  - `mediaRowsFromPosts(offerId: string, source: string, posts: {post_id, snapshot_id, media, media_files}[]): MediaRow[]`
  - `mediaRowsFromAd(offerId: string, listId: string, images: unknown): MediaRow[]`
  - `MediaRow = {media_key, resource_record_key, originating_system_name, originating_system_resource_record_key, media_url, media_order, local_file}`
  - `runTransformMedia(client, sources: string[]): Promise<{rows: number, inserted: number, updated: number, deleted: number, local: number}>`. Script CLI: `node transform-media.mjs S06` / `S03 S05`; thiếu nguồn thì chạy cả ba.

- [ ] **Bước 1:** Viết ca itest, mỗi ca BEGIN … ROLLBACK, tự dựng `sale_offer_records`, `stg_chotot_ads`, `stg_zalo_posts` tối thiểu bằng cột bắt buộc có thật của bảng:
  - `NH-AC-2 S06`: tin A `{images:[u1,u2,u1,'ftp://x']}` cho 2 dòng (order 0, 1); tin B `[u3]` cho 1 dòng; tin C không ảnh cho 0 dòng; `originating_system_resource_record_key = list_id`; `local_file` NULL; đúng một dòng `dq_check_results` mới (`check_name='media:local-file'`, `entity='S06'`).
  - `NH-AC-2 dòng bảng nạp thật`: rút một dòng `stg_chotot_ads` thật cho mỗi `jsonb_typeof` của `images` đang có, gắn vào tin dựng tay. Số dòng và thứ tự phải bằng danh sách URL http(s) khác nhau, tính bằng SQL `jsonb_array_elements_text` + `WITH ORDINALITY` + `DISTINCT ON`.
  - `NH-AC-4 chạy lại không đổi`: lượt hai cho cùng tập `media_key` và `media_modification_timestamp`; kết quả `{inserted:0, updated:0, deleted:0}`.
  - `NH-AC-4 bài gom sang tin khác`: chuyển `post_ids` p2 từ T1 sang T2, chạy lại; ảnh của p2 khoá theo T2, T1 không còn.
  - `NH-AC-4 tin nghỉ`: đặt `retired_at` cho tin thì còn 0 dòng của tin đó.
  - `NH-AC-4 nguồn khác không bị chạm`: chạy S03 rồi S06, so trọn cột các dòng S03 trước và sau.
  - Ca rác: phần tử `images` là null hay object thì bị bỏ, không ném.
- [ ] **Bước 2:** Chạy itest. Kỳ vọng: FAIL (chưa có module).
- [ ] **Bước 3:** Viết `media-rows.mjs` theo design §2.2.
  - Lượt 1: entry `media_files` không `error`, có `file`, snapshot (`entry.snapshotId ?? post.snapshot_id`) và `file` khớp hai regex, không có `..`. `local_file = snapshot + '/' + file`; URL gốc của entry đánh dấu đã có.
  - Lượt 2: theo thứ tự bài, entry không đạt lượt 1 rồi tới `media[].url`, chỉ http(s), bỏ URL đã thấy. Ở lượt 2 dòng có `media_url` và `local_file` NULL.
  - `media_order` tăng dần qua hai lượt.
  - `mediaRowsFromAd` nhận cả `{images:[…]}` lẫn mảng.
- [ ] **Bước 4:** Viết `runTransformMedia`.
  - `pg_advisory_xact_lock(53053)`. Đọc tin sống qua view `sale_offers`: S03/S05 bằng truy vấn nối `post_ids` của `review-media.ts`; S06 nối `stg_chotot_ads.list_id::text = originating_system_key`.
  - Nạp tập muốn có vào bảng tạm `ON COMMIT DROP` theo lô 5.000 dòng bằng `unnest`.
  - `INSERT … ON CONFLICT (media_key) DO UPDATE … WHERE (…) IS DISTINCT FROM (…)`, đặt `media_modification_timestamp = now()` khi đổi; `DELETE` dòng của các nguồn được gọi mà không có trong bảng tạm.
  - Mỗi nguồn ghi một dòng `dq_check_results`: `status 'pass'` khi có dòng, `'skip'` khi nguồn 0 tin; `detail` dạng `rows=… local=… offers_with_media=…`.
- [ ] **Bước 5:** Chạy itest. Kỳ vọng: PASS. Phá thử: đảo hai lượt trong `mediaRowsFromPosts` thì ca tương đương ở Task 4 đỏ; bỏ điều kiện nguồn ở `DELETE` thì ca «nguồn khác» đỏ.
- [ ] **Bước 6:** Commit `feat(pipeline): transform-media dựng bảng media từ bảng nạp (NH1)`.

Phục vụ E3, E5 · independent: false

### Task 3: Khai RESO và bước đêm

**Files:**
- Modify: `pipeline/mappings.yaml` (khối `media:` cạnh `canonical:`)
- Modify: `scripts/chotot-daily.sh` (sau dòng `transform-chotot`), `scripts/zalo-import-daily.sh` (sau dòng `transform-zalo`)
- Create: `pipeline/scripts/media-wiring.test.mjs` (không DB, nằm trong glob `npm test` của pipeline)

**Interfaces:**
- Consumes: tệp 053 (Task 1).

- [ ] **Bước 1:** Viết hai ca test.
  - `NH-AC-1 mappings khai bảng media`: đọc tên cột từ `CREATE TABLE` trong 053; mỗi cột có mục trong `mappings.yaml` `media.fields`; `dd` đúng field DD 2.1 như design §2.1; `local_file` có `dd: null`, `rationale`, `checked_on`; 053 có dòng `KHÔNG sync cloud`. Chiều đỏ: chép mappings sang thư mục tạm, xoá mục `media_order`, chạy hàm kiểm thì ném `thiếu cột media_order`.
  - `NH-AC-10 chạy hằng đêm`: mỗi script có đúng một dòng khớp `job_run <job> transform-media node "$ROOT/pipeline/transform-media.mjs" <nguồn>` và dòng đó đứng ngay sau dòng transform. Chiều đỏ: bản sao script đặt dòng media trước transform thì đỏ, gọi tên script.
- [ ] **Bước 2:** Chạy `cd pipeline && node --test scripts/media-wiring.test.mjs`. Kỳ vọng: FAIL.
- [ ] **Bước 3:** Thêm khối `media:` vào `mappings.yaml` (`table: media`, `dd_resource: Media`, `dd_version: "2.1"`, `checked_on: "2026-10-30"`, ghi chú `ResourceName = Property` và `MediaCategory = Photo` ngầm hiểu). Thêm hai dòng `job_run`: `chotot-daily transform-media … S06`, `zalo-import-daily transform-media … S03 S05`. Chạy `node pipeline/vocab.mjs --check`: phải exit 0.
- [ ] **Bước 4:** Chạy test. Kỳ vọng: PASS, kèm `cd pipeline && npm test` xanh.
- [ ] **Bước 5:** Commit `feat(pipeline): khai media RESO + bước đêm transform-media (NH1)`.

Phục vụ E2, E11 · independent: false

### Task 4: Bên đọc ở app

**Files:**
- Modify: `app/src/lib/ops/review-media.ts`, `app/src/lib/data-flow-queries.ts`, `app/src/components/ops/data-flow/record-sheet.tsx` (bỏ nhánh S06 ở mục «Ảnh tin»)
- Create: `app/tests/media-canonical.test.tsx`
- Modify: `app/tests/review-media.test.tsx` (bỏ ca AC-6/AC-7 của loader — đã thay bởi NH-AC-5; giữ ca AC-5 và `stripEvidenceImages`), `app/tests/ops-dong-chay.test.tsx` (bỏ hai ca DF-AC-10 — đã thay bởi NH-AC-6)

**Interfaces:**
- Consumes: `mediaRowsFromPosts`, `SNAPSHOT_ID`, `MEDIA_FILE` từ `../../pipeline/media-rows.mjs` (chỉ trong test).
- Produces:
  - `type MediaRow = { offer_id: string; media_url: string | null; local_file: string | null }`
  - `loadOfferMedia(offerIds: string[], query?: MediaRowQuery): Promise<Map<string, MediaRow[]>>`. SQL đọc `media`, `ORDER BY resource_record_key, media_order`.
  - `buildMediaImages(rows: MediaRow[], evidenceImageUrl?: unknown): ReviewImage[]`
  - `loadReviewMedia(items, user, query?)` và `loadFlowMedia(records, user, query?)` giữ chữ ký cũ, kiểu `query` đổi sang `MediaRowQuery`.

- [ ] **Bước 1:** Viết ca test.
  - `NH-AC-3 tương đương với buildOfferImages`: một ma trận ca viết trước (mọi ca AC-5 của `review-media.test.tsx`, cộng trùng URL giữa hai bài, entry thiếu snapshotId, snapshot có `..`, file ngoài `media/`, 13 ảnh). Mỗi ca kiểm `deepEqual(buildMediaImages(toMediaRows(mediaRowsFromPosts('o1','S03',bài))), buildOfferImages(bài))`. Assert số ca chạy bằng độ dài ma trận.
  - `NH-AC-3 hai bản regex`: ma trận chuỗi viết trước (hợp lệ, có `..`, có `/`, thiếu `media/`, ký tự lạ); kiểm hai bản regex cho cùng kết quả.
  - `NH-AC-5 …`: truy vấn giả đếm lời gọi, trả dòng `MediaRow`. Thẻ `entity_match` (offer_a S06, offer_b S03) + `agent_output` cho đúng 1 truy vấn, và SQL không chứa `stg_zalo_posts`; bên S06 ≥ 1 ảnh remote; bên S03 local trước, cắt ở 12, `image_url` cuối khi chưa có. Vai `ops`/`user`/khách nhận `{}` với 0 lời gọi; 42P01 nhận `{}`; lỗi khác ném. Đột biến bỏ `isAdmin` thì ca đỏ ghim `người không phải admin không được nhận ảnh`.
  - `NH-AC-6 nạp ảnh dòng chảy`: S03, S05, S06 đều có khoá; tin không ảnh nhận `[]`; vai và 42P01 như trên.
  - `NH-AC-6 hồ sơ tin S06`: jsdom theo khung của `ops-dong-chay.test.tsx`.
    - Bảng: 0 `<img>`.
    - Hồ sơ tin S06 có 2 ảnh: group `aria-label` bắt đầu `Ảnh` có 2 `<img>`, không có `Chưa gắn được ảnh`.
    - Media `[]`: `không có ảnh`.
    - Không admin: đúng `Ảnh tin chỉ hiện cho quản trị viên.`, 0 `<img>`, không có `không có ảnh`.
    - Cloud: đúng `Ảnh tin chỉ xem ở máy thu.`, 0 `<img>`.
    - Đối chứng: hồ sơ đọc nhầm tin đầu bảng thì đỏ.
- [ ] **Bước 2:** Chạy `cd app && node --import tsx --test tests/media-canonical.test.tsx`. Kỳ vọng: FAIL.
- [ ] **Bước 3:** Cài đặt các hàm.
  - `buildMediaImages`: lượt 1 lấy dòng có `local_file` dựng được bằng `snapshotMediaUrl(snap, file)` (tách ở dấu `/` đầu); lượt 2 lấy remote, gồm cả dòng có local hỏng, rồi tới `evidenceImageUrl`. Không trùng, tối đa 12.
  - `loadReviewMedia` và `loadFlowMedia` gọi `loadOfferMedia`. `loadFlowMedia` bỏ lọc nguồn.
  - `record-sheet.tsx` bỏ nhánh `record.source === "S06"` của mục «Ảnh tin».
  - Sửa comment đầu `review-media.ts` cho đúng nguồn mới.
- [ ] **Bước 4:** Chạy test mới, rồi `cd app && npm test && npx tsc --noEmit && npm run lint`. Kỳ vọng: xanh hết.
- [ ] **Bước 5:** Commit `feat(app): ảnh tin đọc từ bảng media, tin S06 có ảnh (NH1)`.

Phục vụ E4, E6, E7, E13 · independent: false (cần Task 2)

### Task 5: Leak gate đếm `media`

**Files:**
- Modify: `pipeline/sync-cloud.mjs` (`leakGate`: thêm `"media"` vào `checks`, kèm comment một dòng)
- Modify: `pipeline/sync-cloud.test.mjs` (ca `NH-AC-9 media không lên cloud`)

- [ ] **Bước 1:** Viết ca test.
  - `FILL` không chứa `media`.
  - `leakGate` với `exec` giả: `to_regclass('media')` có và đếm 3 dòng thì danh sách có `media=3`; null thì không có mục media; 0 dòng thì không có mục.
  - Quét `data-api/src` không có `FROM media` hay `media_url`.
  - Chiều đỏ: hàm kiểm FILL nhận bản FILL có thêm `media` thì ném `media không được vào FILL`.
- [ ] **Bước 2:** Chạy `cd pipeline && node --test sync-cloud.test.mjs`. Kỳ vọng: FAIL ở vế leak gate.
- [ ] **Bước 3:** Sửa `leakGate`.
- [ ] **Bước 4:** Chạy lại, kèm `cd pipeline && npm test`. Kỳ vọng: PASS.
- [ ] **Bước 5:** Commit `fix(sync-cloud): leak gate đếm bảng media (NH1)`.

Phục vụ E10 · independent: true

### Task 6: Probe đầu-cuối + executor

**Files:**
- Create: `app/scripts/media-roundtrip.ts`
- Delete: `app/scripts/review-media-roundtrip.ts` (E8 của `review-media-backend`, thay bởi NH1 AC-7 ở Task 7)
- Modify: `_acceptance/config.yaml` (chỉ thêm `executors.test.media_db`, `executors.test.media_app`, `executors.script.media_roundtrip`, `executors.script.media_khong_lui` — P2-91)

**Interfaces:**
- Consumes: `runTransformMedia` (Task 2, import từ `../../pipeline/transform-media.mjs`), `loadReviewMedia`, `loadFlowMedia` (Task 4).
- Produces: CLI `node --import tsx scripts/media-roundtrip.ts [--moi-the]`.

- [ ] **Bước 1:** Viết probe.
  - Chặn DB `oneinvest`; dừng khi số tin S06 có ảnh bằng 0.
  - Chạy `runTransformMedia` cho S03, S05, S06 hai lần, in `lượt hai: thêm 0 · xoá 0 · đổi 0`.
  - `loadFlowMedia` cho mọi tin S06 sống có ảnh ở bảng nạp, in `S06 hụt ảnh ở loader: <k>/<n>`.
  - So số dòng + `media_order` với danh sách SQL jsonb độc lập, in `S06 lệch số ảnh: <k>/<n>`; làm tương tự cho S03, in `S03 hụt ảnh đã tải ở loader: <k>/<m>`.
  - `loadReviewMedia` trên một thẻ `entity_match` có tin S06 (tạo trong giao dịch rồi ROLLBACK nếu DB thử chưa có), in `thẻ duyệt S06: <k> ảnh`, `hồ sơ tin S06: <k> ảnh`, `dọn: còn 0 dòng`.
  - Mọi số đạt thì in `ROUNDTRIP PASS` và exit 0; không đạt thì exit 1, gọi tên dòng hỏng.
  - `--moi-the` ghi bền một thẻ `entity_match` có tin S06 vào DB thử (không bao giờ vào `oneinvest`) và in id thẻ.
- [ ] **Bước 2:** Thêm bốn executor:
  - `media_db`: `cd pipeline && DATABASE_URL=${MEDIA_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media} node --test scripts/media-canonical.itest.mjs`
  - `media_app`: `cd app && node --import tsx --test tests/media-canonical.test.tsx`
  - `media_roundtrip`: `cd app && DATABASE_URL=${MEDIA_DB_URL:-…} node --import tsx scripts/media-roundtrip.ts`
  - `media_khong_lui`: `node _acceptance/media-canonical-reso/probes/khong-lui.mjs`
- [ ] **Bước 3:** Chạy `cd app && DATABASE_URL=…/oneinvest_p2_media node --import tsx scripts/media-roundtrip.ts`. Kỳ vọng: `ROUNDTRIP PASS`. Phá thử: trỏ `DATABASE_URL` vào `oneinvest` thì exit 1 với dòng chặn.
- [ ] **Bước 4:** Commit `test(media-canonical-reso): probe đầu-cuối trên DB thử + executor (NH1)`.

Phục vụ E8 · independent: false

### Task 7: Thay năm ô đã ký, probe không lùi, ROADMAP

**Files:**
- Modify: `_acceptance/review-media-backend/evals.yaml`. E6 và E7 thêm `status: not-run` + `superseded_by: media-canonical-reso#AC-5`; E8 thêm `superseded_by: media-canonical-reso#AC-7`.
- Modify: `_acceptance/ops-dong-chay-df0/evals.yaml`. E15 và E16 thêm `status: not-run` + `superseded_by: media-canonical-reso#AC-6`.
- Create: `_acceptance/media-canonical-reso/probes/khong-lui.mjs`
- Modify: `docs/ROADMAP.md` (chỉ dòng NH1 ở §2 as-built và §4)

- [ ] **Bước 1:** Sửa hai `evals.yaml` đúng khuôn EVAL-THAY-BOI, giữ nguyên mọi dòng khác (P2-91). Bảng «ô cũ → AC mới» đã nằm ở design §2.4.
- [ ] **Bước 2:** Viết `khong-lui.mjs`. Chạy `bash scripts/pre-merge-check.sh . --base origin/main` và tách dòng `VIOLATION`. Chỉ cho qua hai lớp: `human_signoff` trống của `media-canonical-reso`, và lỗi chuỗi `superseded_by` trỏ `media-canonical-reso#` vì hồ sơ thay chưa ký. Còn dòng nào khác, hoặc có `evidence is stale` cho slug khác, thì in nguyên văn và exit 1. Pre-merge không chạy được thì exit 2 và in «không đo được». Đạt thì in `KHÔNG LÙI PASS`.
- [ ] **Bước 3:** Ghim lại mọi hồ sơ đã ký mà pre-merge báo stale do vòng này. Xin lượt `ghim-lai`, chạy `repin-lane.mjs --slug … --write` qua `giu-nhip.mjs`, rồi chạy lại `khong-lui.mjs`. Kỳ vọng: `KHÔNG LÙI PASS`.
- [ ] **Bước 4:** Sửa ROADMAP dòng NH1.
- [ ] **Bước 5:** Commit `chore(media-canonical-reso): thay năm ô đã ký, probe không lùi, ROADMAP (NH1)`.

Phục vụ E12 · independent: false

### Task 8: Bản chạy cho ui-check (chuẩn bị S4)

**Files:**
- Modify: `.claude/launch.json` (thêm cấu hình `app-3462-nh1` có `DATABASE_URL` của DB thử và `SNAPSHOTS_DIR` của kho thô checkout chính). Tệp ngoài vùng, nên xin `cham-tep` trước.

- [ ] **Bước 1:** Xin `cham-tep` cho `.claude/launch.json`, rồi thêm cấu hình.
- [ ] **Bước 2:** Chạy `transform-media.mjs S03 S05 S06` trên DB thử, rồi `media-roundtrip.ts --moi-the` (ghi id thẻ). Mở bản chạy bằng `preview_start app-3462-nh1`; kiểm `/ops/review` và một hồ sơ tin S06 bằng `read_page` (không chụp; chụp là việc của E9).
- [ ] **Bước 3:** Đặt hợp đồng `status: implemented`, rồi vào S4.

Phục vụ E9 · independent: false
