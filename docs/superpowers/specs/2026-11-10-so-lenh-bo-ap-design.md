# Sổ lệnh và bộ áp (TV4 `so-lenh-bo-ap`) — thiết kế

Ngày 2026-11-10 · Hàng TV4 (T3) của `docs/plan/lo-trinh.json`, mốc TVM1 · Đứng trên ADR-0015 (accepted 26/10), TV1
`quyen-bon-vai-mot-cho` và TV2a `vong-doi-nguon` (đều đã ký) · Ô cơ hội: `_acceptance/so-lenh-bo-ap/opportunity.md`
(Mạnh «Build cả bốn», 10/11).

## Bài toán

Hôm nay không có đường nào từ cloud xuống máy thu (G4): mọi thao tác ghi chỉ chạy khi ngồi ở máy thu. ADR-0015 chốt
đường lệnh kéo một chiều: cloud chỉ ghi **Lệnh** có khuôn; máy thu kéo lệnh đã duyệt về bằng **token máy theo tên**
scope `ops:pull`, kiểm, áp đúng một lần, rồi báo kết quả kèm giá trị trước/sau qua đường `push-ops-facts` đã có.

Hàng này dựng nền đó với **hai loại lệnh đầu**: `source.pause` và `source.resume`. Màn bấm trên `/ops` là hàng TV4b;
đơn vị thu S05/S06 là TV5; S03 qua cấu hình gateway là TV6.

## Các mảnh

```
CLOUD (Vercel + Supabase)                                   MÁY THU
POST /api/v1/ops/change-requests        (phiên ops/admin)   pipeline/ops-apply.mjs (launchd 60″)
POST /api/v1/ops/change-requests/[id]/decide   (admin)        0 phanh ~/.oneinvest/ops-apply.dung → thoát 0
GET  /api/v1/ops/change-requests        (viewer: danh sách    1 GET …/pull (token máy ops:pull)
     + mốc máy thu kéo lần cuối)                              2 kiemLenh (hàm thuần)
GET  /api/v1/ops/change-requests/pull   (token máy) ◀──kéo──  3 SELECT … FOR UPDATE → before, tiền điều kiện
     approved → queued, ghi last_used_at                      4 INSERT sổ áp ON CONFLICT DO NOTHING + UPDATE
POST /api/v1/ops/ingest  kind=change_request_results ◀──────  5 kiểm sau áp (isRunnable) — hỏng thì ROLLBACK
     (token máy ops:pull) queued → applied|failed|reverted    6 node push-ops-facts.mjs --chi-lenh <tệp kết quả>
```

### Dữ liệu — migration 091 (sổ SO-MIGRATION cấp 10/11)

| Bảng | Ở đâu | Cột chính |
|---|---|---|
| `change_requests` | cloud (nguồn) | `id uuid`, `type` (CHECK 14 loại của ADR-0015 §4), `target text`, `payload jsonb`, `status` (CHECK 9 trạng thái của ADR §5), `requested_by`, `approved_by`, `idempotency_key text UNIQUE NOT NULL`, `before jsonb`, `after jsonb`, `result jsonb`, `inverse_of uuid`, mốc `created_at · decided_at · queued_at · finished_at` |
| `machine_tokens` | cloud | `name text PK`, `token_hash text UNIQUE` (sha256 hex), `scopes text[]`, `created_at`, `revoked_at`, `last_used_at` |
| `change_request_applies` | máy thu (sổ áp) | `idempotency_key text PK`, `change_request_id uuid`, `type`, `target`, `outcome` (`applied · failed · reverted`), `before`, `after`, `detail`, `applied_at` |
| `ops_heartbeat` | cloud (đã có, chưa có migration) | `id text PK`, `payload jsonb`, `pushed_at timestamptz` — `CREATE TABLE IF NOT EXISTS` đúng khuôn cloud đang chạy |
| `ops_audit` | cả hai (khuôn 018) | `CREATE TABLE IF NOT EXISTS` đúng khuôn 018 — route lệnh trên cloud ghi nhật ký cùng giao dịch, không giả định cloud đã có bảng (gap-probe P1) |

- Không FK sang `source_registry` (cloud không có bảng ấy); tệp chạy không lỗi trên cả lược đồ kiểu máy thu lẫn kiểu
  cloud. Trạng thái `applying` chỉ sống ở máy thu trong giao dịch; cloud đi `queued → applied|failed|reverted`.
- Có role `anon` (Supabase) → khối `DO` thu quyền `anon`/`authenticated` và bật RLS cho bốn bảng (khuôn 037). Local không
  có `anon` → bỏ qua.
- Bảng không vào `CLOUD_ALLOW` của `sync-cloud`: không bảng local nào được chép lên.

### Cloud — route

- **Tạo** `POST /api/v1/ops/change-requests` `{type, target, payload, idempotency_key?}`: chạy cùng hàm kiểm khuôn
  (bản TS, test chẵn với bản `.mjs`); loại chưa có bộ áp → 400; `source.pause` cần vai `ops`, `source.resume` cần
  `admin` (§3.5, §4.8 #4); lưu `status = submitted`; một dòng `ops_audit` actor `user:<id>` cùng giao dịch. Bearer chung
  → 403. `idempotency_key` vắng thì máy sinh uuid.
- **Duyệt/từ chối** `POST …/[id]/decide` `{decision: approve|reject, note?}`: vai `admin`; chỉ từ `submitted`; lệnh
  nhắm `S03` cần người duyệt khác người gửi (409 khi trùng). Một dòng audit cùng giao dịch.
- **Danh sách** `GET /api/v1/ops/change-requests`: vai `viewer`; trả lệnh mới nhất trước kèm `last_pull_at` = mốc dùng
  cuối của token còn hiệu lực có `ops:pull` (null khi chưa kéo lần nào). Đây là dữ liệu để TV4b hiện «Máy thu chưa nhận
  lệnh từ HH:MM»; route không bao giờ trả `applied` cho lệnh chưa có kết quả từ máy thu.
- **Kéo** `GET …/pull`: chỉ token máy (`app/src/lib/token-may.ts`: băm sha256 header, khớp `machine_tokens` chưa thu hồi,
  có scope). Trả lệnh `approved` và `queued` (chưa có kết quả), cũ trước; chuyển `approved → queued` + `queued_at`; ghi
  `last_used_at`. Phiên người, bearer chung, token thu hồi, thiếu scope → 401/403 và không đổi gì.
- **Kết quả** qua `POST /api/v1/ops/ingest` với `kind: "change_request_results"`: nhánh này đòi token máy `ops:pull`
  (bearer chung → 403), KHÔNG ghi `ops_heartbeat`; mỗi kết quả khớp `id` + `idempotency_key` của một lệnh `queued` thì
  chuyển sang `applied|failed|reverted`, ghi `before/after/result/finished_at`, một dòng audit actor `machine:<tên token>`;
  không khớp hoặc đã xong thì bỏ qua và đếm. Bản tin thường (không `kind`) giữ y hành vi cũ.

### Máy thu — bộ áp

- `pipeline/lib/lenh.mjs`: `LOAI_LENH` (14), `LOAI_CO_BO_AP` (2), `KHOA_CAM` (mười một khoá Zalo của ADR §7),
  `kiemLenh(cmd)` thuần → `{ok, ly_do}`; `apLenh(client, cmd, {kiemSau})` → kết quả.
  - `kiemLenh`: loại trong `LOAI_CO_BO_AP`; `target` khớp `^S\d{2}$`; payload chỉ có khoá cho phép (`reason`,
    `resume_when` cho pause; rỗng cho resume); `reason` không trống; khoá cấm ở BẤT KỲ độ sâu nào trong lệnh → từ chối,
    gọi tên khoá.
  - `apLenh` trong một giao dịch: `INSERT INTO change_request_applies … ON CONFLICT DO NOTHING` (0 dòng → đọc dòng sổ
    cũ, trả lại kết quả cũ, không UPDATE); `SELECT status, reason, resume_when FROM source_registry WHERE code = $1 FOR
    UPDATE`; tiền điều kiện (pause: nguồn `active`; resume: nguồn `paused`; không có dòng → `failed`); UPDATE; kiểm sau
    bằng `docTrangThai` + `isRunnable` của TV2a; hỏng → ROLLBACK rồi ghi dòng sổ `reverted` trong giao dịch mới;
    `ops_audit` actor `machine:ops-apply` cùng giao dịch áp.
- `pipeline/ops-apply.mjs`: phanh → kéo → mỗi lệnh `kiemLenh`/`apLenh` → gom kết quả → `push-ops-facts.mjs --chi-lenh`
  ngay trong lượt (không chờ chu kỳ 15′). Cloud không trả lời → thoát 2, không đổi gì. Token đọc từ
  `~/.oneinvest/cloud.env` biến `OPS_MACHINE_TOKEN` (không in ra).
- `pipeline/push-ops-facts.mjs --chi-lenh <tệp>`: dựng `{pushedAt, kind, results}`, chạy bộ soát tầng A
  (`guardValues` với tên nguồn thật từ `source_registry`) — trúng thì không gửi, thoát 1; gửi tới `INGEST_URL` bằng token
  máy. Đường thường không đổi.
- `scripts/cap-token-may.mjs --name <tên> --scope ops:pull`: sinh token, in MỘT lần ra stdout, chỉ lưu băm vào DB trỏ
  bởi `DATABASE_URL`; `--thu-hoi <tên>` đặt `revoked_at`. Cấp token thật cho cloud là việc của người (ADR-0015 «Việc của
  người»).
- `pipeline/cron/com.oneinvest.ops-apply.plist`: `StartInterval` 60; viết trong PR, KHÔNG nạp (Hỏi-2).

## Không gian đã quét (morphological-scan, preset test-matrix)

Chân sản phẩm: ADR-0015, `docs/research/ops-tu-van-hanh-nguon-saas.md` §3.1–3.6 [SUY-TỪ-REPO]. Chân ngành: đường kéo
ra ngoài của [NGÀNH: GitHub Actions self-hosted runner] (máy tự hỏi việc qua HTTPS đi ra, token đăng ký riêng từng
máy) và khoá chống lặp [NGÀNH: Stripe Idempotency-Key] (cùng khoá trả lại cùng kết quả, không làm lần hai).

- Trục A — lệnh × tiền điều kiện: pause nguồn active · pause nguồn đã paused · resume nguồn paused · resume nguồn active ·
  nguồn retired/completed · nguồn không có · loại ngoài danh sách · payload có khoá cấm [thước CE: ma trận viết trước
  của AC-5, AC-7]
- Trục B — ai xưng danh: viewer · ops · admin · owner · bearer chung · token máy đủ scope · token thiếu scope · token
  thu hồi · không gì [thước CE: bảng vai §3.5 + ADR §2]
- Trục C — chặng của lệnh: tạo · duyệt/từ chối · kéo · áp · báo kết quả · hiện trạng thái [thước CE: máy trạng thái
  ADR §5]
- Trục D — sự cố: bình thường · kéo lặp mười lần · hai bộ áp cùng lúc · báo kết quả hỏng giữa chừng · kiểm sau áp hỏng ·
  máy thu tắt · phanh bật [thước CE: bat_khi của hàng + ngành]
- Cắt ngang: nhật ký người thật cùng giao dịch; tầng A không lên cloud; migration chạy được cả hai khuôn DB.

**Core** (vào hợp đồng): A đủ 8 giá trị với pause/resume; B đủ 9 giá trị trên các route chạm; C đủ sáu chặng; D đủ bảy.
**Later**: nút «đóng băng thay đổi» của owner (TV4b); lệnh đảo tự sinh từ một lệnh đã áp (hàng màn TV4b dùng chung
đường tạo lệnh); xoay token tự động. **Never**: cloud gọi vào máy thu (ADR-0015 loại); lệnh tự do «sửa JSON» (ADR §4).

## Hai câu hỏi cho Mạnh (sổ S1)

- Hỏi-1 (khó đảo): áp 091 lên DB máy thu và Supabase sau gộp, mỗi nơi một lời duyệt; vòng này chỉ chạy trên DB thử.
- Hỏi-2: P4 viết plist mới trong làn ZCode theo tên (ZCode đang vắng), không nạp launchd tới khi có token máy.

## Rủi ro đã biết

- Nhịp ≤ 5′ trên máy thật chỉ đo được sau khi nạp plist và cấp token (UAT của ô cơ hội); vòng này chứng một lượt bộ áp
  gửi kết quả ngay trong lượt, không chờ chu kỳ 15′.
- Sửa `app/src/lib/ops-access.ts` và route `ingest` chạm vật của hồ sơ đã ký TV1, ON22 — lưới trước-gộp có thể đòi ghim
  lại các hồ sơ ấy.
