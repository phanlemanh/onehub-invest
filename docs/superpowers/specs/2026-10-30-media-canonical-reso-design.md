# NH1 — Ảnh tin canonical theo RESO Media (`media-canonical-reso`)

> Hàng NH1 của `docs/plan/lo-trinh.json`, cắt ngày 30/10 (lượt `doc-tin-anh-3010`). Gộp A3 của báo cáo 29/10.
> Căn cứ: `docs/research/anh-tin-rao-va-scorecard-truong-2910.md` §1, §4 · `docs/research/s03-boc-tach-cau-truc-3010.md`
> §9.1–9.2 · ADR-0011 (RESO-first) · ADR-0013 (tin = `Property`, ảnh = `Media`) · `docs/architecture/reso-khung-phan-loai.md`.
> Nguồn gọi bằng mã: S03 nhóm chat cộng đồng · S05 nhóm mạng xã hội (đang dừng) · S06 rao vặt công khai.

## 1. Vấn đề

Đo ngày 29–30/10 trên DB máy thu:

- S06: 27.358 tin ở bảng nạp có mảng ảnh (99,9%, trung bình 6,5 ảnh/tin). `sale_offers` không có cột ảnh,
  `transform-chotot.mjs` không chuyển ảnh đi đâu. `/ops/review` và `/ops/data-flow` đọc ảnh bằng cách nối
  `sale_offers.post_ids` vào `stg_zalo_posts`, mà `post_ids` của tin S06 luôn rỗng. Vì vậy **0% tin S06 hiện ảnh**,
  kể cả ở máy thu. Hồ sơ tin S06 còn ghi «Chưa gắn được ảnh: S06 chưa lưu khoá nối ngược tin → quảng cáo».
- S03: mỗi trang tự nối bài gốc để lấy ảnh (`buildOfferImages` ở `app/src/lib/ops/review-media.ts`, chép lại truy vấn ở
  `app/src/lib/data-flow-queries.ts`). Không có bảng nào ở bậc canonical giữ ảnh của tin.
- Đo lại 30/10: tin S06 sống 27.733, mỗi tin nối được về đúng một dòng bảng nạp qua
  `originating_system_key = list_id` (khoá chính của bảng nạp). Không bài nào thuộc hai tin sống.

Hai hàng sau cần ảnh ở một chỗ: TV9 (ảnh thu nhỏ lên cloud) và AP1 (ảnh đại diện của căn).

## 2. Thiết kế

### 2.1 Bảng `media` (migration 053)

Theo resource **Media** của RESO DD 2.1, mỗi dòng là một ảnh khác nhau của một tin:

| Cột | RESO DD 2.1 | Ghi chú |
|---|---|---|
| `media_key` | `MediaKey` | `md5(resource_record_key ‖ '|' ‖ coalesce(local_file, media_url))`. Ổn định qua các lượt nạp |
| `resource_record_key` | `ResourceRecordKey` | `offer_id`, FK tới `sale_offer_records`. `ResourceName = Property` ngầm hiểu: bảng chỉ chứa ảnh của tin |
| `originating_system_name` | `OriginatingSystemName` | mã `S0x`, không phải tên nguồn thật |
| `originating_system_resource_record_key` | `OriginatingSystemResourceRecordKey` | `post_id` (S03/S05) hoặc `list_id` (S06) |
| `media_url` | `MediaURL` | URL gốc, chỉ http(s). **Tầng A**: URL S06 mang tên miền nguồn |
| `media_order` | `Order` | thứ tự hiển thị: ảnh đã tải trước, rồi URL gốc |
| `local_file` | — (`dd: null`) | `<snapshotId>/media/<tên>`: ảnh đã tải vào raw snapshot của máy thu |
| `media_modification_timestamp` | `MediaModificationTimestamp` | đổi khi nội dung dòng đổi |

`MediaCategory = Photo` cũng ngầm hiểu, cùng cách `LivingAreaUnits = sqm` ở `sale_offers`. Khi có loại media khác
(video, mặt bằng) thì thêm cột kèm lookup. Ràng buộc: `media_url` khớp `^https?://` hoặc NULL; có ít nhất một trong
`media_url` và `local_file`; `local_file` khớp đúng khuôn mà route `/api/zalo-media` nhận; `media_order ≥ 0`.

`local_file` không có tương đương trong DD. Đây không phải trường miền nghiệp vụ mà là con trỏ tới kho thô của máy
thu, giống `phuong_raw`: khai trong `pipeline/mappings.yaml` với `dd: null`, `rationale`, `checked_on`. Bên ghi đổ một
dòng DQ `media:local-file` cho từng nguồn mỗi lượt (điều kiện 6 của ADR-0011).

**Chỉ ở máy thu.** Bảng không vào `FILL` của `sync-cloud.mjs`. Leak gate đếm `media` như các bảng `stg_*`: bảng có ở
cloud mà có dòng thì là vi phạm. Migration 053 không cần áp lên Supabase. Trên cloud, loader gặp 42P01 và trả `{}`, như
hôm nay.

### 2.2 Bên ghi — `pipeline/transform-media.mjs`

- Chạy theo nguồn: `node transform-media.mjs S06`, `node transform-media.mjs S03 S05`. `scripts/chotot-daily.sh` gọi
  sau `transform-chotot`, `scripts/zalo-import-daily.sh` gọi sau `transform-zalo`, đều bằng `job_run` nên lỗi lên
  `job_runs` như mọi bước.
- Một giao dịch mỗi lượt, có `pg_advisory_xact_lock` riêng. Bên ghi dựng tập dòng muốn có từ tin **sống** của các nguồn
  được gọi. Dòng mới hay dòng đổi thì upsert theo `media_key`; dòng không đổi thì giữ nguyên dấu thời gian. Dòng của
  đúng các nguồn ấy mà không còn sinh ra thì xoá: bài gom sang tin khác, tin nghỉ, ảnh bị gỡ. Nguồn khác không bị chạm.
- S06: mảng `images.images` (hoặc `images` khi là mảng) của dòng `stg_chotot_ads` có `list_id = originating_system_key`.
  Giữ thứ tự, bỏ trùng và bỏ URL không phải http(s). Không có `local_file`, vì máy thu không tải ảnh S06.
- S03/S05: hàm thuần `mediaRowsFromPosts` trong `pipeline/media-rows.mjs` dựng dòng từ các bài theo thứ tự `post_ids`,
  theo **đúng luật ghép đã ký** của `buildOfferImages` (AC-5 hồ sơ `review-media-backend`):
  1. Ảnh đã tải trước: entry `media_files` không lỗi, có `file`, snapshot (của entry, hoặc của bài) và `file` hợp lệ
     theo đúng hai regex của `zalo-media.ts`. URL gốc của chúng coi như đã có.
  2. Rồi tới URL gốc theo thứ tự bài: entry lỗi hoặc tham số hỏng, rồi cột `media` cũ. Bỏ trùng, chỉ http(s).
  Bên ghi lưu mọi ảnh. Trần 12 ảnh mỗi tin là việc của bên đọc.
- Hai regex hợp lệ có hai bản (TS ở app, JS ở pipeline). Một test chung so hai bản trên cùng ma trận chuỗi, bản nào
  lệch thì đỏ.

### 2.3 Bên đọc — app

- `review-media.ts`: thêm `loadOfferMedia(offerIds, query)` (một truy vấn trên bảng `media`, theo `resource_record_key`
  và `media_order`) và `buildMediaImages(rows, evidenceImageUrl?)`, cùng đầu ra `ReviewImage[]` (local dạng
  `/api/zalo-media?snapshot=…&file=…`, `expiring` theo host, bỏ trùng, tối đa 12). `loadReviewMedia` đọc qua hai hàm
  này. Luật quyền giữ nguyên: không phải admin thì `{}` và không truy vấn; bảng vắng (42P01) thì `{}`; lỗi DB khác vẫn
  ném. `buildOfferImages` giữ nguyên, là thước đối chiếu.
- `data-flow-queries.ts`: `loadFlowMedia` đọc cùng `loadOfferMedia`, **có cả S06**.
- `record-sheet.tsx`: bỏ nhánh «Chưa gắn được ảnh: S06…». Tin S06 đi cùng dải ảnh `ReviewPhotos` như S03. Câu «S06 chưa
  lưu khoá nối ngược tin → bài» ở mục Bài gốc giữ nguyên, vì nó nói về bài gốc chứ không nói về ảnh.
- **Tương đương**: với cùng các bài, `buildMediaImages(mediaRowsFromPosts(bài))` phải bằng TRỌN
  `buildOfferImages(bài)` (src, origin, expiring). Test chạy trên mọi ca của AC-5 đã ký, cộng ca trùng URL, ca tham số
  hỏng và ca 13 ảnh.

### 2.4 Thay tiêu chí đã ký (Hỏi-1)

NH1 đổi hai điều mà hai hồ sơ đã ký đang ghim theo chiều ngược: nguồn ảnh của loader (bảng bài → bảng `media`) và ảnh
S06 (vắng → có). Khuyến nghị: khai các ô cũ `status: not-run` kèm `superseded_by` (khuôn EVAL-THAY-BOI 2.24) trong PR
ký của NH1. Mỗi ô cũ trỏ tới tiêu chí của NH1 đo lại đúng điều nó từng đo:

| Ô cũ | Đo gì | Thay bởi |
|---|---|---|
| `review-media-backend/E6` | khoá theo id thẻ, một truy vấn (truy vấn giả trả dòng bài) | `media-canonical-reso#AC-5` |
| `review-media-backend/E7` | không phải admin → `{}`; bảng `stg_zalo_posts` vắng → `{}` | `media-canonical-reso#AC-5` |
| `review-media-backend/E8` | roundtrip DB: bài trong giao dịch → `loadReviewMedia` | `media-canonical-reso#AC-7` |
| `ops-dong-chay-df0/E15` | bộ nạp ảnh dòng chảy: S06 vắng khoá, ghép từ bài | `media-canonical-reso#AC-6` |
| `ops-dong-chay-df0/E16` | hồ sơ tin S06 ghi đúng câu «chưa gắn được ảnh» | `media-canonical-reso#AC-6` |
| `transform-zalo-boc-job-run/E1` | job đêm S03 gọi đúng ba bước import-airbnb → transform-zalo → refresh-bait-gap | `media-canonical-reso#AC-10` |
| `transform-zalo-boc-job-run/E6` | mọi lời gọi `node` giả của job đêm S03 nằm trong ba nhãn | `media-canonical-reso#AC-10` |

Hai ô cuối thêm ở S3 theo Hỏi-3 (Mạnh chọn lối B, 30/10): bước đêm `transform-media` làm job S03 thành bốn bước, nên
lời «ba bước» của hai ô ấy không còn đúng; AC-10 của NH1 đo trọn dãy bốn bước và ca bước ảnh hỏng. `job-bao-loi-that`
không bị thay: lời tiêu chí của nó chỉ đòi «khớp đúng dãy viết trước», nên chỉ dãy viết trước trong
`scripts/job-exit.test.mjs` thêm bước mới.

`review-media-backend/E5` (luật ghép `buildOfferImages`) không bị thay: nó vẫn chạy và còn thành thước đối chiếu của
AC-3. Lối khác là giữ đường đọc bài song song với bảng mới. Cái giá là hai nguồn sự thật cho cùng một dải ảnh, và S06 vẫn
không có ảnh ở đường cũ.

### 2.5 Thử ở đâu

Migration 053 và mọi phép đo chạm DB chạy trên DB thử `oneinvest_p2_media` (`bash db/db-thu.sh oneinvest_p2_media`).
053 không áp lên `oneinvest` :5433 trước khi gộp. Test chặn `current_database() = 'oneinvest'` khi DB đó chưa có bảng
`media`. Sau khi gộp, bước triển khai do giám sát giao: `pg_dump`, áp 053 lên :5433, chạy `transform-media.mjs` một
lần, rồi xoá DB thử.

## 3. Không gian phép đo (quét hình thái, preset test-matrix + risk-premortem)

Trục:

- **Nguồn × trạng thái ảnh**: S03 đã tải · S03 tải lỗi · S03 chỉ URL cũ · S03 tham số hỏng · S05 URL có hạn · S06 có
  ảnh · S06 không ảnh · tin không bài. [thước CE: các nhánh của `buildOfferImages` + hai dạng `images` của bảng nạp S06]
- **Bậc**: ghi bảng · đọc Hàng duyệt · đọc hồ sơ tin · cloud. [thước CE: dòng chảy §2]
- **Lượt**: lần đầu · chạy lại không đổi · bài gom sang tin khác · tin nghỉ · nguồn khác chạy. [thước CE: luật PL14
  không xoá tin; khoá dính `offer-key.mjs`]
- **Vai**: admin · ops · khách. [thước CE: `isAdmin` ở hai loader]

Core thành AC-2…AC-7 và AC-9. Later: ảnh của `properties` (AP1), ảnh thu nhỏ lên cloud (TV9), media-yield trong
scorecard (C2b). Never: đẩy URL ảnh lên cloud (tầng A), sửa tải ảnh S03 (làn ZCode, ZC9), gộp tin chỉ-ảnh (PL28).

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: admin mở `/ops/review` → thẻ so khớp có tin S06 → dải ảnh hai bên có ảnh (điểm ra: bấm ảnh mở hộp phóng to).
  Admin mở `/ops/data-flow` → bấm một tin S06 → hồ sơ tin, mục «Ảnh tin» hiện dải ảnh.
- Biên: tin không có ảnh nào thì «không có ảnh» (dải ảnh sẵn có). Vai không phải admin thì không có dải ảnh, giữ nguyên
  câu «Ảnh tin chỉ hiện cho quản trị viên.». Trên cloud giữ câu «Ảnh tin chỉ xem ở máy thu.».
- Lỗi & quay lại: URL gốc hết hạn → ô «Ảnh hỏng» của dải ảnh sẵn có. Không thêm đường lỗi mới.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Hàng duyệt `/ops/review` | quyết thẻ duyệt, có ảnh làm bằng chứng | thanh bên Ops / thẻ kế |
| Hồ sơ tin (sheet của `/ops/data-flow`) | xem một tin và nguồn gốc của nó | bảng «Tin mới nhất» / đóng sheet |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-ho-so-tin-co-anh-s06 | Hồ sơ tin | dải ảnh «Tin», tối đa 12 ảnh của tin S06 | bấm ảnh để phóng to |
| ST-ho-so-tin-khong-anh | Hồ sơ tin | «không có ảnh» (S03, S05 hay S06 không ảnh) | đọc phần còn lại của hồ sơ |
| ST-ho-so-tin-khong-admin | Hồ sơ tin | «Ảnh tin chỉ hiện cho quản trị viên.» | không có |
| ST-ho-so-tin-cloud | Hồ sơ tin (cloud) | «Ảnh tin chỉ xem ở máy thu.» | mở máy thu nếu cần xem ảnh |
| ST-hang-duyet-the-s06 | Hàng duyệt | dải ảnh «Tin A»/«Tin B» có ảnh S06 | so ảnh rồi quyết thẻ |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Không có hành vi mới. Trần 12 ảnh mỗi tin, ảnh đã tải đứng trước, giữ như hôm nay.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `ReviewPhotos` | dùng | dải ảnh + hộp phóng to sẵn có của Hàng duyệt; NH1 chỉ đổi dữ liệu |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: không đổi IA. Hai màn đã là danh sách → chi tiết (bảng tin → sheet, hàng thẻ → thẻ); NH1 chỉ đổi nguồn dữ liệu
của dải ảnh, nên không cần tra mẫu.
<!-- UX-SPEC-TEMPLATE>>> -->

## 4. Ngoài phạm vi

- Ảnh đại diện của căn (`properties.photos`, AP1), ảnh thu nhỏ lên cloud (TV9), media-yield trong scorecard (C2b).
- Sửa tải ảnh S03 lỗi (ZC9, làn ZCode), gộp tin chỉ-ảnh vào tin chữ (PL28).
- Đọc chữ trong ảnh bằng model (luật 11: đo trước khi build).
