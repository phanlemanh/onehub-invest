# Đồng bộ cloud nguyên tử (cloud-sync-atomic) — thiết kế

Ngày 2026-10-23 · Hạng T3 (`pipeline/sync-cloud.mjs` — dữ liệu rời máy) · Hồ sơ `_acceptance/cloud-sync-atomic/`

## Vấn đề (đo, chỉ đọc)

`pipeline/sync-cloud.mjs` chạy mỗi 15' (launchd `com.oneinvest.cloud-sync`): MỘT câu
`TRUNCATE <21 bảng> RESTART IDENTITY CASCADE` rồi nạp lại từng bảng qua PostgREST, 500 dòng/lần.
Một lượt ≈ 274k dòng / ~104MB JSON. Hậu quả đo được:

1. **Cửa sổ trống mỗi lượt.** 08:30 prod đọc `sale_offers` 0, `properties` 3.500, `v_ruler_p2` 0,
   `ref_calib_listings` 0; 08:37 đủ (9.845 / 8.270 / 238 / 54.507). Khoảng ~7' trong mỗi chu kỳ 15'
   `/dau-tu`, `/ops/deals`, `/api/v1/deals`, `/vn/**` đọc thấy rỗng hoặc thiếu. Lượt gãy giữa chừng
   (22/10: PGRST204) để cloud trống tới khi có lượt lành — 15 giờ.
2. **Xoá dữ liệu người dùng.** `saved_markets.area_id → areas` mang `ON DELETE CASCADE`; TRUNCATE
   CASCADE `areas` xoá sạch `saved_markets` mỗi lượt (cloud đang 0 dòng). «Lưu khu vực» trên prod mất.
3. **Ngày lệch một ngày.** node-pg đọc cột `date` thành `Date` nửa đêm giờ máy (+07) → JSON
   `…T17:00:00Z` → cloud lưu ngày hôm trước. `nights` local 2026-10-01…2027-09-30, cloud
   2026-09-30…2027-09-29; cùng lỗi ở `market_metrics.month`, `listings.last_seen`,
   `listing_stats.first_night/last_night`, `airdna_future_daily.date`.

## Ràng buộc kênh

- Máy này không tới được Postgres cloud (không IPv6, middlebox cắt TLS 5432/6543) — chỉ HTTPS 443:
  Management API (`/database/query`, chạy SQL bất kỳ, MỘT kết nối mỗi lời gọi) và PostgREST.
- Management API trả 413 khi thân > ~2,5–4MB (đo: 2,5MB 201, 4MB 413), không nhận gzip.
- Một giao dịch không thể trải qua nhiều lời gọi HTTP → mọi việc «tráo» phải nằm trong MỘT lời gọi.
- PostgREST chỉ phơi schema `public`; bảng mới trong `public` mặc định cấp `anon` toàn quyền
  (`pg_default_acl`) → không đặt bảng tạm ở `public`.

## Phương án đã cân

| Lối | Vì sao loại / chọn |
|---|---|
| A. Bảng tạm `public._stage_*` qua PostgREST rồi tráo | Bảng mới ở `public` được cấp `anon` (RLS tắt) → dữ liệu `sale_offers` lộ qua anon key trong lúc chờ; PostgREST cần nạp lại schema cache mỗi khi tạo bảng. Loại. |
| B. Đổi tên bảng (`ALTER TABLE … RENAME`) | View `v_ruler_p2*` bám OID bảng cũ — sau khi tráo view vẫn đọc bảng cũ; FK ngoài (saved_markets) cũng bám bảng cũ. Loại. |
| C. TRUNCATE + nạp trong một giao dịch | TRUNCATE không MVCC-safe (giao dịch đọc có snapshot cũ thấy rỗng) và khoá ACCESS EXCLUSIVE chặn mọi lần đọc; vẫn xoá `saved_markets` theo CASCADE. Loại. |
| **D. Bảng tạm jsonb ở schema riêng `sync_stage` (không phơi qua PostgREST, không cấp anon) nạp qua Management API; MỘT lời gọi chứa giao dịch DELETE + INSERT** | Đọc đồng thời thấy dữ liệu cũ tới đúng lúc COMMIT rồi thấy trọn dữ liệu mới (MVCC, khoá ROW EXCLUSIVE không chặn SELECT). Chọn. |

## Thiết kế (lối D)

**Một lần, qua migration đánh số** (`db/migrations/NNN_sync_stage.sql`, số xin ở sổ chung; AGENTS.md
luật 2 «Schema chỉ đổi qua migration mới»): schema `sync_stage` + bảng
`sync_stage.rows(run_id text, tbl text, payload jsonb, staged_at timestamptz default now())` và
`sync_stage.swaps(run_id text primary key, read_at timestamptz, swapped_at timestamptz)`,
`REVOKE ALL … FROM public` và từ `anon`/`authenticated` khi role tồn tại (local không có hai role
này). Áp lên Supabase prod do **Mạnh chạy** theo `docs/ops/cloud-sync-atomic.md`. Script KHÔNG chạy
DDL nào trên cloud nữa (bỏ cả TRUNCATE).

**Mỗi lượt** (`run_id` = thời điểm + 6 hex ngẫu nhiên):

1. Đọc catalog cloud (một lời gọi chỉ đọc): cột từng bảng đích (bỏ cột generated), khoá chính, FK.
   Tính kế hoạch bằng hàm thuần:
   - thứ tự topo theo FK giữa các bảng FILL (cha trước con khi INSERT, con trước cha khi DELETE);
   - bảng **giữ-chỗ** = bảng FILL bị một bảng NGOÀI FILL tham chiếu (hiện: `areas` ← `saved_markets`)
     → nạp kiểu UPSERT theo khoá chính rồi xoá dòng không còn ở local; bảng còn lại → thay trọn.
2. Đọc local trong MỘT giao dịch `REPEATABLE READ READ ONLY` (mọi bảng cùng một snapshot — pipeline
   có thể đang DELETE+INSERT bảng metrics), ghi `read_at` = giờ mở giao dịch. Bộ phân tích kiểu riêng của client: `date`/`timestamp`/mảng của chúng giữ nguyên
   chuỗi Postgres (hết lệch ngày). Cột lấy: bảng mang dữ liệu người bán (`sale_offers`, `sellers`,
   `properties`) chỉ gửi cột trong danh sách CHO PHÉP tường minh (cột mới mặc định không lên, WARN
   «cột chưa duyệt»), trừ thêm `PII_EXCLUDE` (lớp chặn thứ hai, giữ hình dạng cho test tĩnh);
   `sale_offers.seller_ref` gửi dạng `source || ':' || <dãy số cuối>` (không có số → NULL) — chỉ còn
   mã S0x và số, không tiền tố nguồn. Trước khi nạp, payload ba bảng được soát ở local với danh sách
   tên/định danh nguồn đọc từ `source_registry` local (không gửi danh sách này đi đâu) — trúng là dừng.
   Bảng khác: mọi cột − `PII_EXCLUDE`. Cột local không có ở cloud → in WARN «lệch schema» (không gãy lượt); cột chỉ cloud có
   → để mặc định của cloud.
3. Nạp vào `sync_stage.rows` theo mẻ ≤ ~1,8MB thân SQL (dòng lớn nhất hiện 1,19MB — `areas`
   geometry), song song 3 mẻ, thử lại 429/5xx có lùi. Dollar-quote mang thẻ ngẫu nhiên của lượt,
   dừng nếu dữ liệu chứa thẻ.
4. **Chặn tụt** (trước tráo, chỉ đọc cloud): bảng FILL nào ở local còn dưới 50% số dòng đang có trên
   cloud → dừng, thoát ≠ 0, không tráo (local đang dựng dở). Ngưỡng là hằng trong code.
5. **Tráo — một lời gọi:** `BEGIN; SET LOCAL statement_timeout; pg_advisory_xact_lock(<hằng>)`
   (hai lượt chồng nhau xếp hàng, không đan xen) → từ chối nếu `sync_stage.swaps` đã có lượt
   `read_at` muộn hơn lượt này (lượt cũ không đè lượt mới) → kiểm số dòng đã nạp đúng bằng số đọc
   ở local cho từng bảng (`RAISE EXCEPTION` nếu lệch — chặn tráo khi mẻ thiếu) → DELETE các bảng thay-trọn (con
   trước) → UPSERT bảng giữ-chỗ → INSERT các bảng thay-trọn (cha trước) → xoá dòng giữ-chỗ không còn
   ở local (FK `saved_markets` CASCADE theo — Hỏi-2) → ghi `sync_stage.swaps` → xoá staging của lượt →
   `COMMIT`. Lỗi bất kỳ → rollback toàn bộ, cloud giữ dữ liệu lượt trước. Móc thử (chỉ tham số của
   `syncOnce`, không có biến môi trường): `swapPause` chèn `pg_sleep` giữa DELETE và INSERT.
6. Đường lỗi bắt được (nạp hay tráo gãy) → xoá staging theo `run_id` của mình rồi thoát ≠ 0 kèm pha.
   Đầu mỗi lượt dọn staging bỏ dở của lượt chết (`staged_at` > 2 giờ). Cloud chưa có `sync_stage`
   → dừng ở pha catalog, không gửi DDL.
7. Leak gate như cũ + vế mới: `anon`/`authenticated` không có USAGE trên `sync_stage`; mọi
   `sale_offers.seller_ref` trên cloud NULL hoặc khớp `^S0[1-9]:[0-9]+$` (đọc giá trị về máy rồi so).
8. In thời gian từng pha (đọc catalog · đọc local · nạp staging · tráo · gate) và tổng.

`FILL`, `PII_EXCLUDE`, `RENAME` giữ nguyên hình dạng (test tĩnh `sync-pii*.test.mjs` đọc chúng).
Hàm thuần (kế hoạch, chia mẻ, dựng SQL tráo) xuất ra để test; `main()` chỉ chạy khi gọi trực tiếp.
Lõi `syncOnce({ local, exec })` nhận `exec(sql)` — thật: Management API; thử: một DB Postgres mô
phỏng cloud trên :5433 (dựng từ schema local, đổi tên `airdna_*`→`ref_calib_*`, thêm `saved_markets`).

## Đo

- Thước mô phỏng `pipeline/scripts/check-cloud-sync.mjs <ca>` (hai DB tạm trên :5433 — «local
  mô phỏng» chép bảng FILL từ local để được sửa, «cloud mô phỏng» đổi tên `ref_calib_*`, thêm
  `users`/`saved_markets`, role `anon`/`authenticated` + default ACL như cloud; không gọi cloud): luồng
  đọc đếm lặp ≤100ms trong suốt lượt sync, móc thử giữ giao dịch tráo mở 2s; chiều đỏ cùng fixture:
  bộ nạp TRUNCATE kiểu cũ và SQL tráo gửi từng câu tự COMMIT. Các ca: atomic · fail · fidelity ·
  keep · pii · stage · overlap · allow (một ca ↔ một eval).
- Lượt thật (sau khi Mạnh áp SQL `sync_stage`): `scripts/cloud-sync-watch.mjs` truy vấn CHỈ ĐỌC
  cloud mỗi ~2s trong lúc một lượt sync chạy, ghi min/max từng bảng → bằng chứng «không lúc nào 0».

## Ngoài thiết kế

- `source_registry` lên cloud: ADR-0007 ghi «`source_registry` (mapping A↔B + metadata vòng đời)
  không commit, không sync cloud, không rời máy local»; cột `real_name`, `source_ids` là Tầng A;
  `/api/v1/ops/coverage` còn đọc `airbnb_snapshots` (raw, cloud luôn trống) → có bảng cũng vô
  nghĩa. Coverage trên cloud cần một aggregate theo mã S0x — việc riêng.
- RLS tắt + `anon` có SELECT trên mọi bảng `public` cloud (kể cả `users`, `sessions`): rủi ro bảo
  mật thật, việc riêng — đã báo phiên điều phối.
- Bỏ qua bảng không đổi (dấu vân tay) để giảm tải: chưa cần khi một lượt vừa trong 15'.

## Câu hỏi cho người (Cổng Phạm vi)

- **Luật `sale_offers` — đã chốt (a)**, Mạnh 2026-10-23: «Định danh người bán trên tin rao (tên, SĐT,
  ID tài khoản) là TẦNG C — công khai, được lên cả cổng Invest. Tầng A chỉ còn: tên nguồn thật (kể cả
  lẫn trong giá trị cột), hồ sơ người dùng app, user_events/user_profile, review_queue.» Văn bản luật ở
  nhánh `docs/spl-nguoi-ban-cong-khai`. Hệ quả cho vòng này: `seller_ref` chuẩn hoá về `<S0x>:<số>`
  (giá trị hằng không số → NULL), soát tên nguồn trong payload ba bảng người bán trước khi gửi;
  `PII_EXCLUDE` giữ nguyên (mở cột là việc sản phẩm riêng).
- **Hỏi-1 — sửa lệch ngày trong vòng này.** Khuyên làm: cùng đường đọc vòng này viết lại, có thước
  md5. Hệ quả người dùng thấy: mọi ngày trên prod dịch +1 về đúng ngày local ngay lượt đầu.
- **Hỏi-2 — area biến mất khỏi local.** Khuyên: xoá trên cloud, `saved_markets` trỏ nó xoá theo FK
  CASCADE (schema đã khai), kèm chặn tụt 50%. Lối khác: không bao giờ xoá area trên cloud (chỉ
  upsert) — mục đã lưu an toàn nhưng phường đã gộp đọng lại trên prod.
