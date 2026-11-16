# S03 lên nhanh — nấc 1 (s03-len-nhanh-nac-1) — thiết kế

Ngày 10/11/2026 · dãy N1 · hạng T3 (`scripts/cloud-sync.sh` nằm trong `t3_paths`).

## 1. Vì sao

Mạnh chốt «Chuyển nấc 1» ngày 10/11, sau báo cáo «thu và xử lý tin chạy liên tục» (bản chép ở thư mục ghi chú của giám
sát, `chay-lien-tuc-phan-tich-20261110.md`). Hôm nay bài S03 tới cloud mất p50 khoảng 10 giờ: thu → snapshot gần thời
gian thực (p50 0,5′), nhưng snapshot → `stg_zalo_posts` chờ lượt nạp 00:00. Nấc 1 gồm ba việc:

1. ZCode: `zalo-import` chạy mỗi 15′ trong 7–22h, giữ lượt 00:00 (plist, làn ZCode — ngoài hàng này).
2. Claude: lượt ban ngày không enrich, câu SQL của chuỗi đặt `lock_timeout` ngắn — việc (b) của hàng này.
3. Claude: dời các bước đo khỏi `cloud-sync.sh` sang một job chạy mỗi giờ — việc (c) của hàng này.

Đích: p95 đăng → `sale_offers` ≤ 20′, đăng → cloud ≤ 60′ trong 7–22h.

## 2. Số đo trước khi bật (việc a — đã làm 10/11)

DB thử `oneinvest_n1_nac1` (chép DB chung 10/11, `stg_zalo_posts` 114.569 bài), máy rảnh:

| Bước | Lượt 1 | Lượt 2 |
|---|---|---|
| `transform-zalo.mjs` | 62,4 s (ghi 5.278 tin) | 45,9 s |
| `transform-media.mjs S03 S05` | 7,5 s | — |
| `refresh-bait-gap.mjs` | 6,1 s | — |
| Tổng | ≈ 76 s | |

Dưới ngưỡng 5′ mà giám sát đặt, nên LT2 (transform tăng dần) chưa cần cho nấc 1. Chưa đo dưới tải: giờ sáng
`resolve-properties` lượt 05:30 chạy gần 3 giờ trên cùng DB — phần đụng khoá do `lock_timeout` ở việc (b) lo.

## 3. Việc (b) — lượt nạp nhanh đặt `lock_timeout`, đụng khoá thì bỏ lượt (`scripts/zalo-import-daily.sh`, nửa dưới)

**Dựng trên hàng `s03-nap-nhanh`.** Hàng liên làn `s03-nap-nhanh` (nhánh `feat/s03-nap-nhanh`, máy thông, gộp TRƯỚC hàng
này) đã thêm cờ `--luot-nhanh` (export `S03_LUOT_NHANH=1`), plist `com.oneinvest.s03-nap-15phut` chạy 61 mốc 15′ trong
7–22h, khoá nạp bận thì bỏ lượt và thoát 0, và cho lượt nhanh dừng ngay sau refresh-bait-gap — không đọc gộp, không
enrich. Hàng này viết trên main SAU khi hàng ấy gộp (gộp `origin/main` trước khi code phần b) và dùng lại đúng cờ ấy,
không dựng cơ chế nhận lượt song song. Bản thiết kế trước (sổ ngày `zalo-import-ngay.state`, lượt đủ đầu ngày) bỏ.

Phần nạp (trên dòng «Từ đây trở xuống là làn Claude») không đổi một byte so với bản sau khi `s03-nap-nhanh` gộp.

**`lock_timeout` cho ba bước transform của lượt nhanh.** Khi `S03_LUOT_NHANH=1`, ngay trước transform-zalo:
`export PGOPTIONS="${PGOPTIONS:+$PGOPTIONS }-c lock_timeout=${S03_NHANH_LOCK_TIMEOUT:-10s}"`. Bước nạp đã xong trước đó
nên không nhận. Lượt 00:00 (không cờ) không đặt — nó là lượt chuẩn của ngày, chờ khoá như hôm nay. `node-postgres` và
`psql` đều đọc `PGOPTIONS`. `transform-zalo` (BEGIN…COMMIT) và `transform-media` (BEGIN + khoá advisory) giữ một giao
dịch mỗi lượt nên đụng khoá là ROLLBACK trọn. `refresh-bait-gap` thì KHÔNG: phần bait gap chạy tự-commit từng câu —
câu đầu đặt `bait_gap_pct = NULL` cho mọi tin P1 rồi câu sau mới tính lại. Đụng khoá giữa hai câu là để NULL tới lượt sau;
hai lượt chạy cùng lúc (lượt nhanh S03 và job S06 14:00 — rủi ro review PR #404 chuyển sang) xen nhau trên cùng dòng.

**Khoá chung cho refresh-bait-gap — tách sang hàng `bait-gap-mot-giao-dich` (T2, gộp trước, N1-58).** `buocDem` khi chạy riêng (không `savepoint`) bọc `refreshBaitGap` trong
BEGIN … COMMIT, câu đầu là `pg_advisory_xact_lock(hashtext('refresh-bait-gap'))` (cùng kiểu khoá theo tên như
`danh-ba-vat-the`); giao dịch danh bạ Người ngay sau cũng lấy khoá ấy. Khi chạy trong giao dịch của người gọi
(`savepoint: true` — test, thước nạp lại) chỉ lấy khoá, không mở giao dịch. Ba job gọi bước này (`zalo-import-daily`,
`chotot-daily`, `apify-facebook-daily`) tự xếp hàng; lượt nhanh có `lock_timeout` thì chờ tối đa 10 giây rồi bỏ lượt,
job khác chờ như thường. Đổi lại: giao dịch bait gap giữ khoá dòng P1 vài giây thay vì từng câu.

**Đụng khoá → bỏ lượt (Hỏi-2, khuyến nghị).** Ở lượt nhanh, bước transform nào hỏng mà đầu ra có `lock timeout` hay
`55P03` thì in `BỎ LƯỢT [zalo-import-daily] bước <nhãn>: đụng khoá — lượt sau làm` lên stderr và không tính vào mã thoát;
bước hỏng vì lý do khác vẫn `JOB FAIL … mã <n>` và job thoát ≠ 0. Số lượt nhanh liền có bỏ lượt đếm ở
`pipeline/logs/zalo-import-bo-luot.state`; lượt thứ 8 liền (khoảng 2 giờ) in `JOB FAIL [zalo-import-daily] đụng khoá 8
lượt liền` và thoát 75, để khoá kẹt cả ngày không thành sự cố im. Lượt nhanh không bỏ bước nào, hay lượt 00:00, đặt lại
về 0. Mỗi sáng `resolve-properties` lượt 05:30 giữ DB tới khoảng 08:30 — trùng khoảng 6 lượt 15′ đầu ngày, dưới ngưỡng 8;
job S06 14:00 (refresh-bait-gap cùng `UPDATE sale_offers`, rủi ro review của `s03-nap-nhanh` đã ghi) cũng đi đường này.

## 4. Việc (c) — job đo mỗi giờ (`scripts/cloud-sync-do.sh` mới) và cờ tự nhận trong `cloud-sync.sh`

`scripts/cloud-sync-do.sh` chạy bảy bước đo theo đúng thứ tự hiện có trong `cloud-sync.sh`: `trang-thai-chao` →
`bac-du-lieu --write` → `do-danh-ba-sdt --write` → `do-the-duyet --write` → `mau-soat-cuon-chieu` →
`do-hang-ngay --write` → `do-lam-giau --write`. Dùng `job_run` (mã thoát = mã hỏng đầu tiên). Cuối lượt, CHỈ khi không
bước nào lỗi chạy (mã 0 — dòng kiểm `fail` không đổi mã), ghi dấu `pipeline/logs/cloud-sync-do.last` (giây epoch): dấu
nghĩa là «job giờ đã chạy trọn». Khoá thư mục `pipeline/logs/cloud-sync-do.lock` (ghi PID, khoá của PID đã chết thì gỡ)
để hai lượt không chồng — lượt chồng in `bỏ lượt: lượt đo trước còn chạy` và thoát 0.

`cloud-sync.sh` giữ bốn bước đầu (`ha-bung-het-han`, `sync-cloud`, `refresh-data-flow`, `push-ops-facts`) luôn chạy.
Bảy bước đo đứng sau một cờ tự nhận: dấu `cloud-sync-do.last` tươi (dưới 2 giờ, biến `CLOUD_SYNC_DO_TUOI_GIAY`, mặc định
7200) → bỏ bảy bước, in `bước đo: job giờ chạy lúc <giờ>, bỏ trong lượt này`; dấu vắng hoặc cũ → chạy bảy bước như
hôm nay, dưới cùng khoá `cloud-sync-do.lock` — khoá đang giữ bởi PID sống thì bỏ bảy bước với dòng `bước đo: lượt đo khác
đang chạy`. Hai bên không bao giờ chạy bảy bước chồng nhau.

Vì sao một PR (Hỏi-3, khuyến nghị) với cờ tự nhận chứ không hai PR: bước đo chỉ được rời `cloud-sync.sh` khi job giờ đã chạy thật (lời giám
sát). Cờ tự nhận đổi đúng lúc job giờ chạy trọn lần đầu, không cần ai bật tay, và tự lùi về chạy trong `cloud-sync.sh`
nếu job giờ chết hơn 2 giờ. Hai PR thì PR hai phải chờ người nhìn job giờ rồi mới gộp — thêm một lượt người, và mất lối
lùi.

Thứ tự phụ thuộc giữ nguyên trong job giờ: `trang-thai-chao` trước ảnh chụp bậc (vị từ B5), `bac-du-lieu` trước DO1.
Số đo lên cloud ở lượt `sync-cloud` kế như hôm nay; trễ tối đa thêm một giờ thay vì 15′.

Plist launchd cho job giờ (`StartInterval 3600`, chạy `scripts/cloud-sync-do.sh`) là làn ZCode: giao qua liên làn sau
gộp, triển khai theo tin GIAO riêng.

Hàng `do-lam-giau` (08/11) từng chốt «không thêm job launchd riêng» cho bước đo; nấc 1 của Mạnh (10/11) thay lựa chọn ấy.

## 5. Hai câu hỏi cho Mạnh ở Cổng Phạm vi

- (Hỏi-1 cũ — bỏ enrich ban ngày — đã rút: hàng `s03-nap-nhanh` chốt lượt nhanh không enrich.)
- Hỏi-2: đụng khoá — khuyến nghị bỏ lượt, JOB FAIL khi bỏ 8 lượt liền; lối khác: JOB FAIL mỗi lần, hoặc im hẳn.
- Hỏi-3: một PR cờ tự nhận (dấu ghi cuối lượt chạy trọn, chung khoá) — khuyến nghị; lối khác: hai PR.

## 6. Ngoài phạm vi

- Plist launchd của job đo mỗi giờ — làn ZCode. Lượt nạp nhanh 15′ (cờ, plist, bỏ đọc gộp và enrich) — hàng `s03-nap-nhanh`.
- LT2 transform tăng dần, LT3 đường nóng 5′, LT4 sync tăng dần, LT5 đọc gộp lô 15′ (báo cáo chạy liên tục).
- Cảnh báo trên `/ops` khi bỏ lượt liên tục; trần thời gian mỗi lượt.
- Đo p95 đăng → `sale_offers` / cloud sau khi bật: đo sau khi ZCode triển khai lịch 15′ (LT8).

## 7. Rủi ro đã nghĩ

- `PGOPTIONS` chỉ đặt cho ba bước transform của lượt nhanh; phần nạp của ZCode và lượt 00:00 không đổi hành vi khoá.
- Thứ tự gộp: hàng này code phần (b) sau khi `s03-nap-nhanh` gộp; phần (c) độc lập, viết được ngay.
- Bốn bộ test job nạp hiện có (`zalo-import-job`, `enrich-buoc-job`, `zalo-import-job-lan`, `s03-nap-nhanh`) giữ nguyên
  lời hứa; bộ mới chỉ thêm ô cho `PGOPTIONS` và bỏ lượt.
