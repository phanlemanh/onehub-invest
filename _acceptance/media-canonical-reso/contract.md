---
schema_version: 1
feature: Ảnh của tin S03 và S06 nằm ở một bảng media canonical theo RESO Media nối với offer, và /ops/review, /ops/data-flow ở máy thu đọc ảnh từ bảng này
slug: media-canonical-reso
owner: phanlemanh@gmail.com
risk_tier: T3      # db/migrations/** (053) + pipeline/sync-cloud.mjs nằm trong t3_paths
surfaces: [ui, cli]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-30-media-canonical-reso-design.md
approved_by: Mạnh
approved_at: 2026-10-30
---

# Acceptance Contract: media-canonical-reso

## Context

Hàng NH1 của lộ trình, gộp A3 của báo cáo 29/10. Hôm nay 0% tin S06 hiện ảnh ở `/ops`, kể cả ở máy thu, dù 99,9% tin
S06 có ảnh ở bảng nạp, vì loader ảnh chỉ nối bài S03/S05 qua `post_ids`. Ảnh S03 thì mỗi trang tự nối bài gốc. Vòng
này dựng một bảng `media` theo resource Media của RESO DD 2.1 cho mọi nguồn, nối với tin (`offer_id`). Bên ghi là một
bước pipeline chạy sau transform của mỗi nguồn. Hai trang `/ops/review` và `/ops/data-flow` ở máy thu đọc ảnh từ bảng
này. Bảng chỉ ở máy thu: URL ảnh S06 mang tên miền nguồn (tầng A).

## Criteria

- AC-1: Given DB thử `oneinvest_p2_media` chưa có bảng `media`, When áp `db/migrations/053_media.sql` hai lần, Then lần
  hai thoát 0; bảng `media` có đúng tám cột của design §2.1; ràng buộc chặn `media_url` không phải http(s), dòng thiếu
  cả `media_url` lẫn `local_file`, `local_file` sai khuôn `<snapshot>/media/<tên>` (kể cả có `..`), `media_order` âm và
  `resource_record_key` không có trong `sale_offer_records`; đầu tệp có dòng «KHÔNG sync cloud»; `pipeline/mappings.yaml`
  khai bảng `media` với field RESO DD 2.1 của từng cột, còn `local_file` có `dd: null` kèm `rationale` và `checked_on`.
- AC-2: Given tin S06 sống mà dòng bảng nạp có `list_id = originating_system_key` mang ảnh ở dạng `{images:[…]}` hay
  dạng mảng, kể cả URL trùng và URL không phải http(s), When chạy `transform-media.mjs S06`, Then tin có đúng một dòng
  `media` cho mỗi URL http(s) khác nhau: `media_order` theo thứ tự mảng từ 0,
  `originating_system_resource_record_key = list_id`, `local_file` NULL. Tin S06 không có ảnh thì 0 dòng. Lượt ghi đúng
  một dòng `dq_check_results` `media:local-file` cho S06.
- AC-3: Given các bài của một tin S03/S05 theo thứ tự `post_ids`, mỗi bài có `media_files` (đã tải, tải lỗi, tham số
  hỏng, entry thiếu `snapshotId`) và/hoặc `media` cũ, When dựng dòng media bằng `mediaRowsFromPosts`, Then ảnh đã tải
  đứng trước với `local_file = <snapshot>/media/<tên>`, entry lỗi hay tham số hỏng rơi về `media_url`, không trùng. Trên
  mọi ca thử AC-5 của `review-media-backend`, cộng ca trùng URL giữa hai bài, ca tham số hỏng và ca 13 ảnh,
  `buildMediaImages(mediaRowsFromPosts(bài))` bằng trọn `buildOfferImages(bài)` (src, origin, expiring). Hai bản regex
  hợp lệ của snapshot và tên tệp (pipeline và app) cho cùng kết quả trên một ma trận chuỗi viết trước.
- AC-4: Given bảng `media` đã có dòng S03 và S06 từ một lượt trước, When chạy lại không đổi gì, Then số dòng,
  `media_key` và `media_modification_timestamp` không đổi. When một bài chuyển sang tin khác, Then ảnh của bài đi theo
  tin mới và tin cũ không còn dòng của ảnh đó. When một tin nghỉ (`retired_at` có giá trị), Then dòng `media` của nó bị
  xoá. When chạy cho S06, Then dòng S03 không bị chạm.
- AC-5: Given hàng duyệt có thẻ `entity_match` (`offer_a` là tin S06, `offer_b` là tin S03) và thẻ `agent_output`, When
  admin gọi `loadReviewMedia`, Then cả hàng tốn một truy vấn tới bảng `media` và kết quả khoá theo id thẻ. Bên S06 có ≥ 1
  ảnh từ `media_url`. Bên S03 có ảnh đã tải trước, rồi URL gốc mang `expiring` theo host, tối đa 12 ảnh, và
  `evidence.image_url` đứng cuối khi chưa có. Vai `ops`, `user` và khách nhận `{}` với 0 truy vấn. Bảng `media` vắng
  (42P01) thì `{}`. Lỗi DB khác vẫn ném.
- AC-6: Given bản ghi «Tin mới nhất» gồm tin S03, S05 và S06, When admin gọi `loadFlowMedia`, Then mỗi tin, kể cả S06,
  có mảng ảnh dựng từ bảng `media` bằng cùng `buildMediaImages`; tin không ảnh nhận `[]`; không phải admin nhận `{}` với
  0 truy vấn; 42P01 nhận `{}`. When mở hồ sơ tin S06 có ảnh, Then mục «Ảnh tin» có dải ảnh với đúng số `<img>` của tin
  đang mở, và không còn câu «Chưa gắn được ảnh: S06…». Tin S06 không ảnh ghi «không có ảnh». Bảng «Tin mới nhất» không có
  `<img>`. Vai không phải admin mở hồ sơ tin S06 thấy «Ảnh tin chỉ hiện cho quản trị viên.», và chế độ cloud thấy «Ảnh
  tin chỉ xem ở máy thu.»; cả hai ca có 0 `<img>` và không có chữ «không có ảnh». (cross-layer)
- AC-7: Given DB thử `oneinvest_p2_media` (bản chép DB máy thu, đã áp 053), When chạy `transform-media.mjs S03 S05 S06`
  hai lần rồi gọi `loadReviewMedia` và `loadFlowMedia` thật trên DB đó, Then ở đầu ra loader, không tin S06 sống nào có
  ≥ 1 URL http(s) ở bảng nạp mà nhận 0 ảnh. Với mọi tin S06 sống, số dòng `media` và thứ tự `media_order` bằng số URL
  http(s) khác nhau và thứ tự của chúng ở bảng nạp, tính độc lập bằng SQL jsonb mà không gọi bên ghi. Không tin S03 nào
  có ≥ 1 entry `media_files` hợp lệ mà loader trả 0 ảnh đã tải. Lượt hai thêm 0, xoá 0, đổi 0 dòng. Loader trả ≥ 1 ảnh
  cho một thẻ duyệt có tin S06 và một hồ sơ tin S06; DB thử chưa có thẻ như vậy thì tạo thẻ trong giao dịch rồi
  ROLLBACK. (cross-layer)
- AC-8: Given dev server của worktree chạy với `DATABASE_URL` của DB thử, đăng nhập tài khoản admin thử, When mở
  `/ops/review` ở một thẻ có tin S06, hồ sơ một tin S06 và hồ sơ một tin S03 có ảnh đã tải trên `/ops/data-flow`, Then cả
  ba chỗ có dải ảnh hiện ảnh thật, không phải ô «Ảnh hỏng». Ảnh chụp sáng ở khổ 1280.
- AC-9: Given `pipeline/sync-cloud.mjs` sau vòng, When đọc `FILL` và chạy `leakGate` với `exec` giả, Then `FILL` không
  có `media`; cloud có bảng `media` có dòng thì leak gate báo `media=<n>`; bảng vắng hay rỗng thì không báo. `data-api/`
  không nhắc tới bảng `media`.
- AC-10: Given bản chép nguyên `scripts/chotot-daily.sh` và `scripts/zalo-import-daily.sh` cùng `scripts/lib/job-step.sh`,
  chạy với `node` giả (ghi nhật ký lời gọi), When mọi bước lành, Then mỗi script có đúng một bước `job_run … transform-media`
  cho nguồn của nó (S06; S03 S05) và job thoát 0, không có dòng `JOB FAIL`. `chotot-daily` gọi đúng dãy collect-chotot →
  import-chotot → transform-chotot → transform-media → refresh-bait-gap → resolve-properties. `zalo-import-daily` gọi đúng
  thứ tự import-airbnb → transform-zalo → transform-media → refresh-bait-gap, và mọi lời gọi `node` giả của nó nằm trong bốn
  nhãn ấy. When bước `transform-media` hỏng, Then job thoát ≠ 0, stderr có đúng dòng `JOB FAIL [<job>] bước transform-media
  mã 1`, và các bước sau vẫn được gọi. When chạy các suite và làn ghim lại của mọi hồ sơ đã ký có tệp đo bị vòng chạm,
  Then mọi suite thoát 0, và mỗi hồ sơ ấy có dòng `repin` mới xanh, hoặc ô bị chạm được thay bởi một AC của hồ sơ này
  (Hỏi-1, Hỏi-3).

## Coverage

- Trục nguồn × trạng thái ảnh: S03 đã tải · S03 tải lỗi · S03 chỉ URL cũ · S03 tham số hỏng · S05 URL có hạn · S06 có
  ảnh · S06 không ảnh · tin không bài (AC-2, AC-3, AC-5, AC-6). [thước CE: các nhánh của `buildOfferImages` + hai dạng
  `images` của bảng nạp S06]
- Trục bậc: ghi bảng (AC-1…AC-4) · đọc Hàng duyệt (AC-5) · đọc hồ sơ tin (AC-6) · đầu-cuối trên dữ liệu thật (AC-7,
  AC-8) · cloud (AC-9). [thước CE: dòng chảy design §2]
- Trục lượt: lần đầu · chạy lại không đổi · bài gom sang tin khác · tin nghỉ · nguồn khác chạy (AC-4, AC-7). [thước CE:
  luật không xoá tin PL14 + khoá dính `offer-key.mjs`]
- Trục vai: admin · ops · khách (AC-5, AC-6). [thước CE: `isAdmin` ở hai loader]
- Cross-cutting: chạy hằng đêm và không lùi hồ sơ đã ký (AC-10).

## Đường đo

- «Tin S06 có ảnh ở bảng nạp thì thẻ duyệt hiện ≥ 1 ảnh»: số tin S06 hụt ảnh do probe AC-7 đếm trên bản chép DB máy
  thu; AC-8 nhìn bằng mắt.
- «Tin S03 có file local thì hiện ảnh»: số tin S03 hụt ảnh đã tải, cũng do probe AC-7 đếm; AC-8 nhìn.
- «Nạp lại hai lần không nhân dòng»: AC-4 (ca dựng) + AC-7 (lượt hai trên dữ liệu thật: thêm 0, xoá 0, đổi 0).
- «Sync cloud không đẩy URL ảnh, leak gate xanh»: vế luật do AC-9 chứng trong vòng. Vế số thật là leak gate của lượt
  sync đêm đầu tiên sau bước triển khai (áp 053 và chạy `transform-media.mjs` ở máy thu). Bước triển khai ghi số đó, và
  Cổng Giá trị đọc nó trước hết 02/11. Chưa có lượt sync nào thì vế ấy là CHƯA ĐO, không phải SỐNG.

## Out of scope

- Ảnh đại diện của căn (`properties.photos`, hàng AP1) và ảnh thu nhỏ lên cloud (TV9) — hai hàng đọc bảng này sau.
- Chỉ số media-yield trong scorecard đêm (C2b). Vòng này chỉ ghi một dòng DQ `media:local-file` mỗi nguồn.
- Sửa tải ảnh S03 lỗi http-500 (ZC9, làn ZCode) và gộp tin chỉ-ảnh vào tin chữ (PL28).
- Áp 053 lên Supabase: bảng chỉ ở máy thu.

## Notes

- Không chạy morphological-scan bằng skill riêng: không gian đã quét trong design §3 (preset test-matrix +
  risk-premortem), bốn trục và Core/Later/Never ghi ở đó.
- Mọi phép đo chạm DB chạy trên DB thử `oneinvest_p2_media`. 053 không áp lên `oneinvest` :5433 trước khi gộp; bước sau
  gộp (`pg_dump`, áp 053, chạy `transform-media.mjs` một lần, xoá DB thử) do giám sát giao.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-30:
  - Ngoài-1: probe «không lùi» bỏ qua mọi vi phạm của chính hồ sơ trừ «evidence is stale», rộng hơn lời E12; lưới trước-merge vẫn chặn các vi phạm ấy.
  - Ngoài-2: tệp bằng chứng mạng của bước chụp màn lượt 2 không còn ghi mã trả về của ảnh; ảnh chụp vẫn cho thấy ảnh hiện đúng.
  - Ngoài-3: bộ phân loại của probe «không lùi» chưa có ca thử chiều đỏ cho vi phạm lạ của chính hồ sơ.
  - Ngoài-4: ảnh tin S05 chỉ được dựng ở lượt đêm của job S03, không ngay sau job dựng tin S05; tin S05 mới có thể chưa có ảnh tới lượt đêm kế.
  - Ngoài-6: job S05 (apify-facebook-daily) không có bước dựng ảnh; khi bật lại S05, tin mới có thể «không có ảnh» tới khoảng 18 giờ.
  - Ngoài-7: chiều đỏ của ca tương đương NH-AC-3 không đo đúng đột biến đã khai (đảo thứ tự), chỉ so với một đầu vào khác.
  - Ngoài-8: chiều đỏ «ảnh phải thuộc đúng tin đang mở» chỉ đổi dữ liệu vào, không đổi component.
  - Ngoài-9: ca «hai bản regex» tự dựng lại luật trong test thay vì gọi hàm của bên ghi.
  - Ngoài-10: (trùng Ngoài-4, lượt 1) ảnh S05 dựng ở job zalo-import thay vì job dựng tin S05.
  - Ngoài-11: (trùng Ngoài-6, lượt 1) job S05 không gọi bước dựng ảnh.
  - Ngoài-12: nếu sau gộp quên áp 053 ở máy thu, Hàng duyệt và hồ sơ tin báo «không có ảnh» thay vì báo lỗi; bước triển khai sau gộp chặn chỗ này.
  - Ngoài-13: executor cũ review_media_roundtrip trong config.yaml còn trỏ tới tệp đã xoá; ai chạy nhầm sẽ gặp lỗi không tìm thấy tệp.
  - Ngoài-14: probe «không lùi» coi hồ sơ không còn lệnh nào (0/0) là xanh.
  - Ngoài-15: (trùng Ngoài-7) chiều đỏ NH-AC-3 không ghim thông điệp.
  - Ngoài-16: truy vấn giả trong test app bỏ qua câu SQL thật, nên thứ tự media_order ở bên đọc không được đo bằng test (probe đầu-cuối đo trên dữ liệu thật).
  - Ngoài-17: bộ phân loại của probe «không lùi» nhận dòng theo chuỗi con và chưa có đối chứng dương.
