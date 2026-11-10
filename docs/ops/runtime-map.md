# Runtime Map — môi trường vận hành một-hub (chốt 2026-10-22)

> Truy nguyên sự cố: file này là bản đồ THẬT của mọi tiến trình/binary/log
> liên quan thu thập. Sửa khi đổi môi trường.

## Bảng chân lý 5 thành phần

| Thành phần | Vai trò CHỐT | Vẫn cần? | Ghi chú vận hành |
|---|---|---|---|
| **OpenClaw headless gateway** (launchd `ai.openclaw.gateway`, runtime `~/.openclaw/runtime/2026.10.5…`) | **CANONICAL** — chạy zalouser provider (giữ kết nối dài tới server Zalo, tin tới ngay — đo 05/11, xem mục «Mã album S03»), hooks | ✅ DUY NHẤT | KeepAlive; log ×2: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (console) + `~/Library/Logs/openclaw/gateway.log` (đầy đủ — **grep cái này!**) |
| OpenClaw Desktop (/Applications) | Không cần cho vận hành — headless làm được tất | ❌ (user được phép remove) | Không cài thêm Login Items |
| ~/dev/openclaw (source 4.4G) | **Tham chiếu source để vá plugin** (đang đứng nhánh `fix/zalouser-plugin-hooks` = v2026.10.5 + port pluginHooks) | ✅ GIỮ (dev) | KHÔNG chạy production từ đây |
| Zalo PC app / Zalo Web (Chrome) | **KHÔNG liên quan thu thập** — provider zca-js giữ kết nối dài tới server Zalo bằng session QR-link | ❌ | Tiện cá nhân của user, muốn dùng thì dùng |
| Kev :8009, collector :9210, MTPLX :8000 | Hạ tầng phụ thuộc hook | ✅ | launchd KeepAlive đã có |

## Chuỗi tin Zalo (đúng như đã verify)

```
zca-js listener (kết nối dài, session QR-link; tin tới ngay, không theo nhịp — đo 05/11)
→ zalouser monitor (core gateway bundle)
→ [MENTION GATE]  ← ĐIỂM CHẾT: requireMention=true drop tin THƯỜNG
   │                  TRƯỚC khi hook thấy (log "drop no mention")
→ processMessage → internal hook "oneinvest-zalo-pipe" → Kev → :9210
→ (song song) agent auto-reply turn —-layer nguy hiểm
```

## Bài học 2 sự cố + 1 mù (2026-10-20→22)

1. Sự cố 1: bindings kích agent reply → xoá bindings.
2. Sự cố 2: bindings=[] chưa đủ — auto-reply channel vẫn turn → requireMention=true.
3. MÙ hôm nay: requireMention=true **đồng thời giết thu thập** (drop trước
   hook) — watchdog báo "an toàn" vì 0 turn, nhưng thực chất 0 TIN. Watchdog
   phải cảnh báo "collection starved": linked + groups bật mà 0 tin/24h.

## Fix ĐÃ LÀM (2026-10-22 tối): port pluginHooks từ WhatsApp sang zalouser

Port chuẩn thay hot-patch `__pregate` (bản vá tay dist 22/10 trưa đã gỡ bỏ):
commit `568ed825b` nhánh `fix/zalouser-plugin-hooks` ở `~/dev/openclaw`
(đứng trên v2026.10.5, chưa push — chờ PR upstream tuỳ chọn).

1. Source: `extensions/zalouser/src/monitor.ts` phát plugin hook + internal
   hook "message:received" SAU admission (nhóm allowlist + sender được phép)
   TRƯỚC mention gate + control-command drop; tin rỗng (media-only) không
   return sớm; `SuppressMessageReceivedHooks` chặn phát đôi đường sau gate.
   `config-schema.ts` khai `pluginHooks.messageReceived` (zod strip key lạ —
   khác WhatsApp đọc root config lỏng, zalouser đọc `account.config` nên
   PHẢI khai báo schema).
2. Build + cài (bẫy đã trả giá): `node --import ./scripts/tsx.mjs
   scripts/build-all.mts` fail sớm ở canvas UI (không liên quan) → build riêng
   zalouser qua driver gọi `buildPluginNpmRuntime` → thay cả dir
   `~/.openclaw/extensions/zalouser/dist/` (giữ node_modules/plugin.json ở
   ngoài) → **PHẢI sửa tay `openclaw.plugin.json`**: thêm `pluginHooks` vào
   `channelConfigs.zalouser.schema.properties` (schema JSON nhúng, root có
   `additionalProperties:false`) → `openclaw plugins registry --refresh` →
   `openclaw config validate`. Không sửa thì gateway crash-loop
   "config validity changed" (exit 1) vì schema cũ từ chối key mới.
3. Config: `channels.zalouser.pluginHooks.messageReceived=true`; 3 nhóm mới
   (4268…, 9016…, 2802…) `requireMention=false→true` (nguồn gốc chuỗi KILL
   L3b 20:44–20:59 và sự cố agent turn 17:59).
4. Watchdog `scripts/zalo-watchdog.sh` cập nhật theo: L1b checks marker mới
   (`pluginHooks` + `SuppressMessageReceivedHooks` trong `.setup/monitor-*.mjs`)
   thay marker hot-patch cũ; L3b đóng lỗ `enabled` (bắt mọi
   `requireMention=false` tường minh).
5. Verify 22/10 ~21:30: tin thường chảy tới hook (Yeshomes `post 202
   accepted=1 media=1`; Grand Park N1 tới hook, Kev skip p=0.48); agent 0 turn
   mới; turn bị gián đoạn 17:59 được restart-recovery chạy xong (stopReason=stop)
   và KHÔNG gửi tin nào; watchdog 21:29/21:34 "ok".

## Mã album S03 (`_acceptance/ma-album-s03/`, chốt 06/11)

Bài ảnh S03 giữ khoá album (`group_layout_id`, `id_in_group`, tổng ảnh) từ extension tới cột stg, để biết ảnh nào
cùng một bài và đo ảnh rơi. Hồ sơ T3: hợp đồng và Notes là nguồn gốc của mọi điều kiện dưới đây.

**Số đo 05/11 (thay ghi chép nhịp 10 phút cũ).** Tin tới theo kết nối dài, không theo nhịp: 3 ngày qua 99% bài có
`captured_at - posted_at` dưới 60 giây, 0 bài từ 11 phút trở lên; 8.000 dòng `post 202` gần nhất cách nhau tối đa
451 giây. Khung 2–4 giờ có 0,007 bài/giây nhưng bài tới theo cụm: 90 giây tính từ một bài có trung bình 3,42 bài,
tối đa 13. Nên đứt 30–90 giây có thể mất trọn một album. Log có 2 lần listener đóng mã 3003 (26/10, 27/10), cả hai
tự khởi động lại sau khoảng 6 giây.

**Chuỗi tin sau bản vá.**

```
listener kênh S03 (content.params có khoá album)
→ monitor của extension: thêm MỘT mục canonical.media chỉ chứa albumMeta
→ admission → plugin hook + internal hook (toInternalMessageReceivedContext chép nguyên mục media)
→ handler.js: tách albumMeta, mục đó không tính thành ảnh
→ API collector :9210 → RawItem.meta.albumMeta, manifest kênh S03 schemaVersion 6
→ bộ nạp → stg (cột album_meta, migration 077) → pipeline/do-anh-roi-s03.mjs
```

Mục `media` là mượn trường có nghĩa khác. **Mỗi lần nâng runtime OpenClaw phải chạy lại phép thử bộ chiếu**
`node --test collector/openclaw/tests/ma-album/mapper-runtime.test.mjs` (AC-2) trước khi khởi động lại gateway.

**Vết bản vá.** `collector/openclaw/ma-album-s03-extension.patch` áp lên `568ed825b` ra đúng mã đã build; kiểm bằng
`bash collector/openclaw/tests/ma-album/kiem-patch.sh`. Build extension theo khuôn 22/10 ở mục «Fix ĐÃ LÀM» bước 2;
script `collector/openclaw/tests/ma-album/chay-extension.sh` chạy test album, build và soát dist có `albumMeta`.

**Thứ tự triển khai** — chỉ sau khi Mạnh ký hai cổng, PR đã gộp, bộ canh đã vá (đếm `transcript_events`) đang chạy:

1. Sao lưu DB, áp 077 theo lời duyệt riêng của Mạnh. Bộ nạp mới chịu được DB chưa có 077 (in `WARN … album_meta`),
   nên gộp mã không phải chờ bước này.
2. Build và khởi động lại API collector (:9210).
3. Sao lưu rồi cài handler, extension theo `docs/ops/runbook-openclaw-hook.md` mục «Mã album».
4. Tiền kiểm `node --test collector/openclaw/tests/ma-album/tien-kiem.test.mjs`: đỏ là không được khởi động lại.
   Ghi hai dòng `E7_MOC_TRANSCRIPT`, `E7_MOC_CFG_SHA` nó in ra làm mốc cho lệnh phán lùi.
5. Khởi động lại gateway trong khung 2–4 giờ của đêm đã sẵn sàng, bằng lời giao triển khai riêng (merge ≠ đang chạy).

**Kiểm hai phía sau khởi động lại** (ghi vào XONG của lời giao triển khai): `transcript_events` mọi agent không tăng
so với mốc tiền kiểm (dòng timing chỉ in với lượt chậm nên không đủ); có `starting … provider` rồi tin chảy tới hook
(`post 202`) sau mốc khởi động; trong 1 giờ có ít nhất 1 item snapshot mang `meta.albumMeta`; bộ canh `ok`. Bộ nạp
chạy lúc 00:00 nên chưa kiểm được ở stg trong khung đó.

**Phán lùi.** `node collector/openclaw/tests/ma-album/phai-lui.mjs <mốc.json>` (mốc từ tiền kiểm cộng `batLuc` =
giờ bật gateway). Kết quả:

- `dung-goi-Manh` (thoát 3, ưu tiên cao nhất): `transcript_events` tăng, kể cả lượt nhanh không có dòng timing;
  hoặc bộ canh báo bất cứ gì ngoài mất marker. Dừng, **không bật lại**, gọi Mạnh.
- `lui-bat-lai` (thoát 2): tiến trình không lên hoặc thoát lại trong 2 phút; bộ canh chỉ báo mất marker; listener
  đóng trong 15 phút đầu; listener đóng mà sau 2 phút chưa có `starting … provider`; hết lượt auto-restart;
  30 phút không có `post 202`.
- KHÔNG lùi với dạng log 26/10, 27/10 (đóng 3003 ngoài 15 phút đầu, tự nối lại sau khoảng 6 giây) và với
  29 phút không có `post 202`.

**Phạm vi lùi.** Chỉ extension và handler: chép bản sao lưu đè lại, khởi động lại một lần. 077, snapshot, `album_meta`
đã ghi, bộ nạp, API collector KHÔNG lùi. Bộ nạp cũ từ chối `schemaVersion` 6, nên revert PR phải kèm cách xử snapshot
đã ghi. Diễn tập lùi trên gateway thử tách biệt: `bash collector/openclaw/tests/ma-album/dien-tap-lui.sh` (06/11:
lùi 9 giây, PID và log gateway thật không đổi).

**Ai canh.** Phiên ZCode nhận lời giao triển khai chạy lệnh phán lùi và canh tới hết 30 phút đầu; bộ canh launchd
chạy mỗi 5 phút; điều phối liên làn đọc XONG và kiểm hai phía; `dung-goi-Manh` thì chỉ Mạnh quyết bật lại.

**Đo ảnh rơi.** `node pipeline/do-anh-roi-s03.mjs [--den <ISO>] [--gio 24]` — chỉ đọc. Khoá gom = hội thoại + người gửi
+ `group_layout_id`; tỉ lệ = nhóm thiếu / nhóm có tổng từ 2; thiếu 2,0% không cảnh báo, trên 2% cảnh báo, trên 5%
báo dừng mở rộng (ngưỡng tạm, chốt lại sau 24 giờ đo đầu). Không tính thiếu: nhóm tổng 1, nhóm mới dưới 10 phút,
album vắt qua ranh cửa sổ. In kèm số `post 202` so với số item snapshot. DB chưa có 077 thì in `CHUA-AP-077`.

**Chưa đo.** Không có nguồn đối chứng để đếm tin mất trong lúc đứt (cận từ số đo trên: tối đa 13 bài trong 90 giây).
Phiên thật của tài khoản thu không diễn tập được (hai kết nối có thể đá nhau, mã 3003). Test chặn theo nhóm của
extension không chạy được trong môi trường dev (thiếu exports test của plugin-sdk ở chính `568ed825b`). Chặng
monitor → hook với bản build mới chỉ chứng minh được sau khởi động lại. Thời gian giữ khoá thật lúc khởi động.

## Vercel — prod của app/ (chốt 2026-10-23)

Không ghi bí mật ở đây. Giá trị gốc nằm ở `~/.oneinvest/cloud.env` (chmod 600).

| Mục | Giá trị |
|---|---|
| Project | `onehub-invest` (`prj_8yL9qkwndG39LNjVTEnXzBAxMjnc`), team `phanlemanh-8330s-projects` |
| Git | `phanlemanh/onehub-invest`, nhánh prod `main` (merge → deploy production tự động) |
| Root / framework | `app` · Next.js · Node 24.x · Fluid compute |
| Domain prod | `onehub-invest.vercel.app` (chưa có domain riêng) |
| Vùng hàm | `hnd1` Tokyo, cùng vùng Supabase `ap-northeast-1`. Nguồn chính: `app/vercel.json` `regions`; mặc định project cũng đặt `hnd1` |
| Env Production | `DATABASE_URL` (= `POOLER_TX`, pooler transaction :6543, sensitive) · `OPS_API_TOKEN` (= `CLOUD_OPS_API_TOKEN`, sensitive) · `RENAME_REFCALIB=1` |
| Env Preview | Không có — preview không nối DB prod (API ops có ghi). Preview trả 500 là đúng thiết kế |
| `OPS_EMAILS` | Bỏ trống — vào /ops chỉ theo `users.role` admin/ops trên DB cloud |
| Bảo vệ truy cập | Vercel Authentication «Standard» (`all_except_custom_domains`): domain prod công khai; URL từng deployment + preview cần đăng nhập Vercel. /ops còn cổng đăng nhập của app |
| Ignored Build Step | `git diff --quiet "${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}" HEAD -- . 2>/dev/null \|\| exit 1` (chạy trong `app/`): exit 0 = bỏ build khi app/ không đổi so với bản deploy thành công gần nhất; mọi lỗi git (SHA không có trong clone nông) → exit 1 = vẫn build. Thiếu `\|\| exit 1` thì Vercel coi exit 128 là deploy ERROR. Build app không đọc file ngoài app/ |

- Biến sensitive không đọc lại được (`vercel env pull` trả rỗng). Đổi giá trị: pipe từ
  `cloud.env` vào `vercel env add <KEY> production --project onehub-invest --sensitive --force`.
- Triệu chứng thiếu `DATABASE_URL`: runtime error `ECONNREFUSED 127.0.0.1:5433` (app rơi về DB local).
- Redeploy bằng tay (sau khi đổi env): `vercel redeploy <url bản production MỚI NHẤT> --target production`.
  Lấy url từ danh sách deploy production, đừng lấy bản cũ hơn — redeploy bản cũ là rollback code.
- API ops đọc bảng chưa có trên cloud (vd `/api/v1/ops/coverage` → `source_registry`) trả 500 trên
  cloud — lỗi dữ liệu/schema cloud, không phải cấu hình Vercel.
- Project cũ `app` (alias `app-lilac-one-49.vercel.app`, repo cũ `one-invest`) ngừng deploy
  từ 22/10. `pipeline/push-ops-facts.mjs` (`INGEST_URL`) và `scripts/audit-all.sh` (`CLOUD`) phải
  trỏ sang domain mới trước khi tắt project cũ.

## Vận hành lâu dài

- Sau fix: không cần mở app nào; reboot → launchd tự dậy toàn chuỗi.
- Watchdog v3: (a) grep "drop no mention" tăng bất thường = cấu hình lệch
  — CÒN NỢ; (b) collection-starved alert — ĐÃ CÓ (L4c); (c) check patch còn
  nguyên — ĐÃ CÓ (L1b checks marker `pluginHooks` từ 22/10 tối).
- User dọn (tuỳ chọn): remove OpenClaw Desktop app; giữ ~/dev/openclaw
  tới khi PR upstream xong.

## Leak gate kiểm anon của sync cloud (chốt 2026-10-23, `_acceptance/leak-gate-kiem-anon/`)

- `pipeline/sync-cloud.mjs` dừng lượt (pha `gate`, exit 1) khi role anon/authenticated SELECT được quan hệ nào trong
  `public` của Supabase, chừa ba quan hệ PostGIS. Dòng log và cách gỡ: `docs/ops/supabase-lock-anon-rls.md` mục
  «Leak gate kiểm anon». Soi prod chỉ đọc: `node pipeline/sync-cloud.mjs --kiem-anon`.

## Một bộ soát tầng A cho mọi đường lên cloud (chốt 2026-10-24, `_acceptance/soat-tang-a-moi-duong-len-cloud/`)

Hai đường đưa dữ liệu rời máy — `pipeline/sync-cloud.mjs` (bảng → Supabase) và `pipeline/push-ops-facts.mjs` (bản tin
`ops_heartbeat`) — đi qua MỘT bộ soát tầng A: `pipeline/lib/tier-a-guard.mjs` (`guardValues`, lõi khớp tên dùng chung với
bộ che `mask-source-names` của ON7). Danh sách tên đọc từ `source_registry` local và không rời máy; mọi dòng báo chỉ
nêu đường + mã `S0x`, không bao giờ in tên.

- **`push-ops-facts` chặn bản tin còn tên thật.** Dựng xong bản tin → soát mọi giá trị chuỗi (trừ `zaloGroups[i].name`
  — tên nhóm S03 là tầng C). Trúng thì KHÔNG gửi, thoát 1, stderr mỗi chỗ một dòng
  `FACTS CHẶN [tầng A] <đường JSON> <S0x>` (vd `FACTS CHẶN [tầng A] jobs[0].lastLine S02`); không đọc được danh sách tên thì
  chặn luôn với dòng `FACTS CHẶN [tầng A] không có danh sách tên để soát (source_registry) — không gửi`. Tìm:
  `grep 'FACTS CHẶN' pipeline/logs/cloud-sync.log` (đi kèm `JOB FAIL [cloud-sync] bước push-ops-facts mã 1`).
  Việc phải làm: đường JSON chỉ chỗ đổ tên — sửa bên ghi cho chỗ đó (che bằng `maskSourceNames`, đổi sang mã `S0x`, hay
  bỏ trường); không nới bộ soát. Dòng «không có danh sách tên» → kiểm DB local và bảng `source_registry`. Soi khô (không
  gửi, không cần token): `node pipeline/push-ops-facts.mjs --kho` → `ops-facts khô: sạch, 0 chỗ chặn` hoặc các dòng chặn.
- **Tên tài khoản thu là tầng A (Hỏi-1 = A, Mạnh chốt 24/10).** Bản tin gửi `zaloAccounts[i].name = null`; bộ soát chặn
  bản tin còn tên với dòng `FACTS CHẶN [tầng A] zaloAccounts[<i>].name tên tài khoản thu`. `/ops/sources` trên cloud hiện
  mã tài khoản (`accountId`); tên chỉ thấy ở máy thu.
- **Leak gate của `sync-cloud` thêm hai phép soát** (`piiColumnLeaks`, chạy cả TRƯỚC khi gửi — pha `gate`, trước khi
  đọc local và tráo — lẫn sau tráo): (1) cột của `sale_offers`, `sellers`, `properties` trên cloud phải nằm trong
  `CLOUD_ALLOW` — lệch thì `cột ngoài danh sách cho phép: <bảng>.<cột>`, kể cả cột đang rỗng; (2) `user_events`,
  `user_profile`, `review_queue` có ở cloud thì phải rỗng — có dòng thì `bảng tầng A có dòng: <bảng>=<n>`. Dòng log:
  `SYNC FAIL [gate] … LEAK GATE FAIL (trước khi gửi): …`; lượt dừng, cloud giữ số cũ. Phạm vi cột theo Hỏi-2 = A: chỉ ba
  bảng có `CLOUD_ALLOW` — các bảng sync khác không có danh sách cột (PROXY). Gỡ: cột thừa trên cloud → Mạnh `ALTER TABLE
  … DROP COLUMN` trên Supabase (luật 2: agent không sửa DB prod), hoặc thêm cột vào `CLOUD_ALLOW` nếu đó là cột được
  duyệt lên cloud; bảng tầng A có dòng → điều tra ai ghi, xoá dòng trên cloud. Soi prod chỉ đọc:
  `node pipeline/sync-cloud.mjs --kiem-cot` (mã 1 khi có vi phạm) — **chạy trước khi merge NT2**: schema cloud dựng tay,
  còn cột thừa (vd `properties.photos`, `sale_offers.seller_phone`) thì mọi lượt sync dừng ở pha gate.

## Sổ đơn vị thu (chốt 2026-10-26, `_acceptance/so-nhom-mot-noi/`, PL12)

- Bảng `collection_units` (048) là sổ chung của mọi đơn vị thu; `source_groups` là view gồm mọi dòng với cột cũ — script
  thu S05/S06, `ha-bung-het-han`, `che-do-thu`, `isRunnable` không đổi. Sổ KHÔNG lên cloud (không có trong `sync-cloud`).
- Đưa S03 và S02 vào sổ: `node pipeline/sync-don-vi.mjs [--chi S02|S03]` ở máy thu. S03 đọc `~/.openclaw/openclaw.json`
  CHỈ ĐỌC (biến `ONEHUB_GATEWAY_CONFIG` để trỏ tệp khác), không gọi lệnh gateway; nhóm tắt → tạm dừng «tắt ở gateway»,
  nhóm biến mất → tạm dừng «không còn ở gateway» (giữ mã). Tệp thiếu/hỏng → thoát 1, sổ không đổi. Chạy lại không đổi gì.
- Sau khi gộp: áp 048 lên DB local (`/new-migration` bước 5) rồi chạy `sync-don-vi` một lần.
- Nhóm S03 đăng ký hai lần: `node pipeline/don-nhom-hai-lan.mjs` chỉ in, `--ghi` chuyển dòng phụ sang «Đã gỡ», giữ dòng và mã, ghi `ops_audit`;
  `--hoan-lai --ghi` trả về trạng thái cũ. Chỉ chạy `--ghi` trên DB local máy thu khi Mạnh nói rõ.

## Số tổng hợp Ops lên cloud (chốt 2026-10-24, `_acceptance/ops-facts-so-tong-hop/`, ADR-0014)

Mỗi lượt `scripts/cloud-sync.sh` (15′), `pipeline/push-ops-facts.mjs` đẩy thêm khoá `blocks` gồm năm khối số tính ở máy
local; mỗi khối mang `measured_at` (lúc khối đo xong). Khoá cũ của bản tin giữ nguyên.

| Khối | Nội dung | Định nghĩa |
|---|---|---|
| `freshness` | `rows`: mã, thành phố, tuổi, SLO, trạng thái | `scripts/lib/freshness.mjs` — đúng số `check-freshness` in |
| `jobs` | `items`: mọi job launchd khai trong `pipeline/cron/` có mặt trong `launchctl list` — `id` (nhãn đã che S0x), `pid`, `lastExit`, `running`, `lastLogAt` (mốc ghi tệp log plist khai) | `scripts/lib/ops-local.mjs` `readLaunchdJobs` |
| `lockdown` | `layers` (bảy lớp, `ok` true/false/null), `lastWatchdogAt`, `agentTurnsToday` | `readLockdown` — bản .mjs của `getLockdownStatus` (ON2) |
| `records24h` | `bySource`: số snapshot 24 giờ theo mã | `readRecords24h` — bản .mjs của `items24h` trong `getSourceFeedHealth` |
| `reviewQueue` | `byType` (thẻ `pending` theo `item_type`), `total` — chỉ số đếm | `readReviewQueue` |
| `dataFlow` (DF1) | `windows.{7d,30d,all}`: phần tổng hợp của /ops/data-flow (`sources` · `days` · `groups` · `shortStay` · `mix` · `enrichPending`); `measured_at` = `computed_at` cũ nhất của bảng | `pipeline/sql/600_data_flow.sql` → bảng `data_flow_snapshot` (migration 051, chỉ ở máy thu), `readDataFlow` chở nguyên |

- **Đo không được thì nói ra**: khối hỏng là `{measured_at, error: "không đo được: …"}`, không bao giờ 0, mảng rỗng hay
  «Ổn»; các khối khác vẫn gửi. Lớp lockdown không kiểm được là `null` từng lớp. Soi khô ở máy thu:
  `node pipeline/push-ops-facts.mjs --kho` → dòng `khối: freshness đo được · jobs … · …` + `ops-facts khô: sạch, 0 chỗ chặn`.
- **Hai bản khớp**: `ops-local.mjs` (bên ghi) và hàm app (`app/src/lib/ops-queries.ts`) giữ khớp bằng
  `app/tests/ops-facts-so-tong-hop.test.tsx` — sửa định nghĩa ở một bên thì sửa cả bên kia.
- **Đọc trên cloud**: `readOpsFacts()` (`app/src/lib/ops-facts.ts`) trả `state` `none` (chưa có dòng) · `fresh` (≤ 45′) ·
  `stale` (> 45′, kèm `measuredAt` lần đẩy cuối); từng khối có `state` riêng theo `measured_at` của khối, khối lỗi là
  `error`. Hằng `FACTS_STALE_MS` (45′ = 3 lượt cloud-sync) chỉ ở tệp này — đổi chu kỳ cloud-sync thì đổi hằng.
  Trang hiện số: ON3 (/ops, /ops/collections), ON23 (lockdown), ON5 (luồng 7 ngày), ON4 (nhóm S03), AU12 (độ phủ).
- Bản tin đi qua bộ soát tầng A (mục trên): tên nguồn thật trong khối nào cũng làm lượt đẩy dừng (`FACTS CHẶN … blocks.<khối>…`).
- **DF1 sau khi gộp**: áp `db/migrations/051_data_flow_snapshot.sql` lên DB local. Trước đó bước `refresh-data-flow` báo
  `JOB FAIL [cloud-sync] bước refresh-data-flow mã 1` mỗi lượt và khối `dataFlow` ghi «không đo được» (sync-cloud và
  push-ops-facts vẫn chạy). Lượt cloud-sync kế làm tươi bảng; trang /ops/data-flow trên cloud hiện số từ lượt đẩy kế.
- Bảng snapshot đọc không được thì `sourceRuns` cũ vẫn gửi vai trò từng mã, số lần chạy để `null` (chưa đo).

### Ba trang Ops trên cloud đọc gì (ON3 `o-kpi-chi-do-local`, 24/10)

`getCloudOpsView()` (`app/src/lib/ops-cloud.ts`) gói `readOpsFacts()` thành dữ liệu trang; chỉ chạy khi `isLocalOnlyView()`.

| Trang | Ô / vùng | Nguồn trên cloud | Khi không có số |
|---|---|---|---|
| `/ops` | bốn ô độ phủ + lưới «Độ tươi theo nguồn» | khối `freshness` | ô «—» + «Chưa có số», lưới rỗng |
| `/ops/collections` | Sức khoẻ nguồn, lưới nguồn | `freshness` + `sourceRuns` | «—» |
| `/ops/collections` | Bản ghi 24h | `records24h` | «—» |
| `/ops/collections` | Khoá an toàn (ô + lưới) | `lockdown` (ON23; tươi/cũ theo chính khối) | ô «—» + «Chưa kiểm được trên máy chủ», lưới 8/8 «Chỉ kiểm ở máy thu» (vàng) — khối lỗi cũng vậy |
| `/ops/collections` | Máy móc: Kev gate, collector API | lớp «Cổng Kev :8009» / «Cổng nhận tin :9210» của `lockdown` (ON23) — cùng trạng thái với Khoá an toàn | «Chưa kiểm được» |
| `/ops/collections` | Bảng nhóm S03: «đang bật N nhóm», «Vào bảng thô» theo nhóm | `s03` (ON4; N = hợp nhóm bật hiệu dụng mọi tài khoản, chỉ tên nhóm — không mã nhóm) | bảng không dựng, «nhóm S03» ở lại Alert gom; nhóm thiếu số tin vào «—», thiếu tên «Nhóm chưa có tên» |
| `/ops/collections` | vùng còn lại (luồng, Cần chú ý, Zalo, xoay vòng…) | — không dựng trên cloud | một Alert «Phần còn lại của trang chưa có số trên máy chủ» |
| `GET /api/v1/ops/coverage` | độ tươi từng nguồn × thành phố (máy đọc: audit-all, smoke) | khối `freshness` (AU12; `state` fresh/stale theo chính khối, `source: "facts"`; máy thu `source: "local"`, `state: "live"`) | `200`, `state: "none"`, `rows: null`, `note: «Chỉ đo ở máy thu»` — không `[]`, không 500 |
| `/ops/review` | số thẻ chờ theo loại | `reviewQueue` (chỉ số đếm) | «—»; thẻ chi tiết vẫn chỉ ở máy local |

- Dòng «Số đo lúc <giờ VN> (GMT+7) từ máy thu» dưới tiêu đề khi có bản tin (`FactsStamp`, `components/ops/facts-status.tsx`).
- Bản tin cũ quá 45′: Alert vàng «Máy thu không đẩy số từ …», ô số mờ, không badge xanh nào (`FactsStaleAlert`).
- Chưa có bản tin (hoặc bảng `ops_heartbeat` chưa có): một Alert «Chỉ đo ở máy thu», mọi ô «—» — không bao giờ 0 hay «Ổn».
- Thử ở máy local như cloud: `node scripts/ops-cloud-proto.mjs --mode none|fresh|stale` in `VERCEL=1 DATABASE_URL=…` (lược đồ
  `ops_cloud_proto`, không có bảng tầng A/thô) để chạy dev server cổng khác; dọn bằng `--drop`.
- Trên cloud `/ops/collections` chỉ dựng vùng đọc bản tin (hàng ô số + lưới sức khoẻ nguồn + lưới khoá an toàn + lưới job khi
  đã có bản tin); luồng 7 ngày, Cần chú ý, ống S03, xoay vòng, nhóm S03 gom về một Alert «Phần còn lại của trang chưa có số trên máy chủ» và trang không
  truy vấn bảng thô (`MACHINE_ONLY_REGIONS` trong `collections-view.tsx`). ON4/ON5 đưa dần các vùng ấy lên bằng khối bản tin.
- «Nhóm bật» một định nghĩa (ON4): `effectiveEnabledGroups` (`app/src/lib/zalo-admin.ts`) ↔ `readS03Allowlist`
  (`scripts/lib/ops-local.mjs`) — kế thừa cấp ngoài khi tài khoản không khai `groups`, bỏ `enabled:false`/`allow:false`, hợp
  mọi tài khoản; dùng cho trang Thu thập máy thu, khối `s03` và `zaloAccounts[].enabledGroups` (badge trang Nguồn).
- Danh sách 8 lớp khoá an toàn một chỗ: `LOCKDOWN_LAYERS` (`app/src/lib/ops-queries.ts`) — bên ghi `readLockdown` (`scripts/lib/ops-local.mjs`)
  phải giữ đúng thứ tự và chữ; `--mode mixed` của `ops-cloud-proto.mjs` dựng khối đủ true / false / null để chụp ảnh.

## DB local tự khởi động (chốt 2026-10-23, `_acceptance/db-tu-khoi-dong/`)

Sự cố gốc (audit L7): tối 22/10 colima khởi động lại, `one-invest-db` không có restart policy nên nằm chết
khoảng 8 giờ; sáng 23/10 policy được đặt tay. Từ vòng này policy nằm trong `db/docker-compose.yml`:
`restart: unless-stopped`.

Chuỗi tự khởi động khi máy khởi động lại:

```
đăng nhập macOS → LaunchAgent homebrew.mxcl.colima (RunAtLoad, `colima start -f`)
→ VM colima → dockerd → one-invest-db (restart: unless-stopped khai trong db/docker-compose.yml)
```

- Kiểm (chỉ đọc, chạy lúc nào cũng được): `bash scripts/check-db-autostart.sh live` — policy của container
  đang chạy, `RunAtLoad` của LaunchAgent colima, và LaunchAgent đang nạp. Thước còn `static`, `diff`,
  `mutation`, `restart` (khởi động lại dockerd trong một Docker riêng tạm, không đụng DB thật),
  `cleanup`, `live-selftest`.
- Triển khai sau merge: KHÔNG cần tạo lại container ngay — container đang sống đã mang `unless-stopped`
  (đặt tay 23/10). Lần `docker compose up -d` kế tiếp (`scripts/setup.sh`, `scripts/migrate-export.sh` hay
  chạy tay) thấy cấu hình đổi và tự tạo lại container theo file mới, cùng policy; DB gián đoạn vài giây.
  (Sửa 29/10: câu cũ ghi «dữ liệu nằm trong volume `oneinvest_pgdata` nên không mất» là SAI — volume ấy gắn sai
  chỗ và rỗng, dữ liệu nằm trong lớp ghi container. Xem mục «DB local trong volume» ngay dưới.)
- Giới hạn:
  - Cần đăng nhập macOS: LaunchAgent chỉ chạy trong phiên người dùng, máy khởi động lại mà chưa ai đăng
    nhập thì colima và DB chưa lên.
  - `docker stop one-invest-db` có chủ đích thì container KHÔNG tự bật lại sau lần Docker khởi động kế
    tiếp — đúng nghĩa `unless-stopped`; bật lại bằng `docker start one-invest-db`.
  - Bằng chứng «Docker khởi động lại → DB lên lại» đo trên Docker riêng tạm; chưa diễn tập trên colima của
    máy (dừng cùng lúc DB và các container dự án khác). Diễn tập là việc Mạnh chọn giờ làm tay; agent không
    tự khởi động lại colima hay Docker của máy. Diễn tập xong chạy lại lệnh `live`.

## DB local trong volume `onehub_pgdata` (2026-10-29, `_acceptance/db-vao-volume/`)

Ảnh kartoza để dữ liệu ở `/var/lib/postgresql/<major>/main`; compose trước 29/10 gắn volume ở
`/var/lib/postgresql/data` nên volume rỗng và ~3,7 GB nằm trong lớp ghi container. Compose mới gắn volume có tên
`onehub_pgdata` ở `/var/lib/postgresql`, project `onehub-db`. Sổ tay đầy đủ (sao lưu, khôi phục, chuyển, lùi, tar
lạnh, hạn giữ bản lùi): `docs/ops/db-volume.md`.

- Kiểm (chỉ đọc): `bash scripts/db-volume-check.sh live` — `data_directory` nằm dưới mount volume `onehub_pgdata`, bản
  lùi `one-invest-db-cu-*` đang dừng.
- Sao lưu: `bash scripts/db-sao-luu.sh` → `$HOME/onehub-backups/db/<UTC>/` (chỉ đĩa máy này — có tầng A).
- Trong 7 ngày giữ bản lùi: không chạy `docker compose` từ checkout/worktree còn compose cũ (project `db`) — nó có thể
  xoá bản lùi.

## Transform S03/S05 và migration enrich (chốt 2026-10-23, `_acceptance/enrich-hau-ky/`)

- Từ vòng enrich-hau-ky, `transform-zalo.mjs` / `transform-fb.mjs` KHÔNG còn `DELETE FROM sale_offers`
  toàn nguồn: ghi qua `pipeline/lib/write-offers.mjs` (upsert + hàm SQL `reconcile_stale_offers`).
  Code này dừng có tên («chưa áp migration 039») trên DB chưa có hàm đó, và từ chối lượt nạp rỗng.
- **Thứ tự triển khai sau merge**: áp `036_revert_enrichment.sql` rồi `039_enrichment_proposals_retain.sql`
  lên DB local :5433 TRƯỚC lượt `zalo-import-daily.sh` / `apify-facebook-daily.sh` kế tiếp. Không lên
  cloud (bảng đề xuất, `ops_audit`, `review_queue` không thuộc `FILL`).
- Khoá ngoại `enrichment_proposals.offer_id` là RESTRICT: script nào xoá `sale_offers` còn đề xuất mà
  không qua `reconcile_stale_offers` sẽ lỗi 23503 — đúng thiết kế, đừng đổi lại CASCADE.
- Hoàn tác một giá trị enrich đã áp: `cd agent && npx tsx scripts/enrich-revert.ts --ids <id,…> --actor
  hitl:<tên> --reason "<lý do>" [--dry]` (chỉ người; ghi `ops_audit enrich:revert`).
- Đề xuất của tin biến mất hẳn được chụp ở `ops_audit` action `enrich:retire` (không có đoạn tin, không
  thông tin người bán); khôi phục khi tin quay lại: `INSERT INTO enrichment_proposals SELECT * FROM
  jsonb_populate_recordset(NULL::enrichment_proposals, <detail->'proposals'>)`.

## Phát biểu + phân xử năm cột phân loại (PL15, `_acceptance/phat-bieu-va-phan-xu/`, migration 045)

- Năm cột `property_type`, `bedrooms`, `bathrooms`, `street_raw`, `block_raw` của tin chỉ do hàm SQL `resolve_offer_fields`
  dựng từ bảng phát biểu chỉ-thêm `field_assertions` (kèm `field_provenance`). Transform S03/S05/S06, `apply_enrichment`,
  `revert_enrichment` ghi phát biểu rồi gọi phân xử; không đường nào ghi thẳng năm cột (bộ quét
  `pipeline/lib/scan-canonical-write.mjs`, cả hàm sống trong DB).
- **Cổng «chưa cắt chuyển»**: khi `ops_audit` chưa có dòng `phat-bieu:cat-chuyen`, phân xử — và mọi transform tin rao,
  lệnh enrich, nút duyệt thẻ enrich — dừng với thông điệp «phân xử: chưa cắt chuyển». Job đỏ có tên, không mất ô.
- **Cửa sổ áp** (giám sát 27/10): áp 045 lên :5433 chỉ trong cửa sổ yên — ngoài job đêm và ngoài lượt sync-cloud — và
  báo giám sát trước. Đo trên bản chép (27/10): áp 045 tổng 23 ms (câu lâu nhất 3 ms) giữ AccessExclusive trên bảng tin;
  rủi ro là lệnh DDL phải CHỜ lượt đọc dài (sync-cloud đọc vài phút) và trong lúc chờ chặn mọi lượt đọc mới — áp bằng
  `psql -1 -v ON_ERROR_STOP=1` kèm `SET lock_timeout = '5s'` (hết hạn thì thử lại sau, không chờ). Cắt chuyển thật đo
  4,5 giây trong một giao dịch (50.278 phát biểu legacy), chỉ khoá dòng.
- **Thứ tự triển khai sau merge** (DB local :5433): `git pull` checkout chính → áp `045_phat_bieu_va_phan_xu.sql` (nếu
  chưa áp) → `node pipeline/vocab.mjs --check-db` (khớp sổ) → `node pipeline/phat-bieu-cat-chuyen.mjs --thu` (xem bảng trước/sau, 0 lệch) → `node
  pipeline/phat-bieu-cat-chuyen.mjs` (thật, COMMIT khi 0 lệch) → rồi mới tới lượt nạp đêm kế. Mạnh chọn giữ giá trị cũ
  thành phát biểu `legacy` (PL15 Hỏi-2, 26/10).
- Không lên cloud: `field_assertions` không thuộc `FILL`, `field_provenance` không thuộc `CLOUD_ALLOW` — cloud không đổi lược
  đồ ở vòng này.
- Thước: `node pipeline/scripts/dung-lai-canonical.mjs` (xoá năm cột rồi dựng lại, giao dịch ROLLBACK) và `--nguon-goc`.

## Danh bạ vật thể toà · trục · căn trên máy thu (2026-11-08, `_acceptance/dung-danh-ba-may-thu/`, DB1b)

- **Lệnh:** `node pipeline/danh-ba-vat-the.mjs` (dựng toà · trục · căn từ danh mục S08 đã nối khu). Ghi DB máy thu
  `oneinvest` chỉ khi có `--db-that`; lần dựng đầu (máy thu chưa có toà) còn phải có `--sao-luu <tệp pg_dump không rỗng>`
  làm trước — thiếu thì lệnh thoát 2, không ghi. DB thử `oneinvest_<việc>` ghi không cần cờ.
- **Không có đường ghi ra ngoài máy:** đích là máy chủ khác (đám mây, máy khác, kể cả URL `localhost` mang `?host=` hay
  `PGHOST` trỏ đi chỗ khác) luôn bị từ chối, có cờ hay không. Đây là rào an toàn của lệnh ghi: dữ liệu lên cloud chỉ đi
  qua đường đồng bộ có kiểm (`sync-cloud`).
- **Chạy đêm:** bước `danh-ba-vat-the` nằm trong `pipeline/refresh-bait-gap.mjs` (job `zalo-import` 00:00, `chotot`
  05:30 và 14:00, `apify-facebook`), chạy SAU bait gap + danh bạ Người trong giao dịch riêng. Nó chỉ giữ tươi các khu đã
  có toà (khu, hoặc cha của phân khu), không bao giờ dựng lần đầu hay lan sang khu mới, không ghi chủ đầu tư. Chưa áp 082
  → «danh-ba-vat-the: bỏ qua — DB chưa áp 082»; chưa có toà → «… bỏ qua — chưa dựng lần đầu». Bước hỏng → job đỏ, stderr
  `danh-ba-vat-the: …`, danh bạ Người của lượt đó vẫn đã commit.
- **Cloud:** ở bản này ba bảng `buildings`, `stacks`, `units` chưa đồng bộ lên cloud — đó là phạm vi của vòng DB1b, không
  phải luật (Mạnh 08/11 mở thông tin dự án khỏi luật nội bộ; văn bản sửa ở hàng DA0).
- **Đo sau lần dựng đầu:** `node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the-that.itest.mjs` — ca
  `DBM-AC-8` so số toà, trục, căn từng khu giữa máy thu và bản chép chỉ đọc; chạy lại `--db-that` phải ra `khoa_moi` 0.

## Job đêm báo lỗi thật (chốt 2026-10-23, `_acceptance/job-bao-loi-that/`, hàng AU3)

Đêm 22→23/10 DB local sập ~8 giờ mà `launchctl` ghi mọi job «last exit 0». Từng bước xử lý (`pipeline/*.mjs`)
vốn đã thoát 1 khi không tới DB; lỗ ở tệp chạy job không `set -e`: bước giữa hỏng, bước cuối lành (DB lên lại
giữa chuỗi) thì launchd thấy 0.

| Job launchd | Khi một bước DB hỏng | Ghi chú |
|---|---|---|
| `com.oneinvest.chotot` (`scripts/chotot-daily.sh`) | thoát ≠ 0 (mã của bước hỏng đầu) | đoạn transform chạy đủ các bước như cũ rồi mới thoát |
| `com.oneinvest.apify-facebook` (`scripts/apify-facebook-daily.sh`) | thoát ≠ 0 (mã của bước hỏng đầu) | như trên |
| `com.oneinvest.zalo-import` (`scripts/zalo-import-daily.sh`) | thoát ≠ 0 (mã của bước hỏng đầu) | `transform-zalo` + `refresh-bait-gap` bọc `job_run` (hồ sơ `transform-zalo-boc-job-run`); đoạn nạp làn ZCode giữ nguyên |
| `com.oneinvest.airdna-daily` (`scripts/airdna-daily.sh`) | thoát ≠ 0, dừng tại bước hỏng | `set -euo pipefail` từ trước |
| `com.oneinvest.collector` (→ `pipeline/finalize-hanoi.sh`) | thoát ≠ 0, dừng tại bước hỏng | `set -euo pipefail` từ trước |
| `com.oneinvest.cloud-sync` (`scripts/cloud-sync.sh`) | thoát ≠ 0 (mã của bước hỏng đầu) | bốn bước luôn chạy hết: `ha-bung-het-han` (máy hạ chế độ thu Bùng quá hạn → Duy trì, ghi `ops_audit`, hồ sơ `che-do-thu-tren-ops`) → `sync-cloud` → `refresh-data-flow` (`pipeline/refresh-data-flow.mjs` chạy `pipeline/sql/600_data_flow.sql`, làm tươi `data_flow_snapshot` — DF1; hỏng thì khối `dataFlow` cũ dần) → `push-ops-facts` (nhịp tim `/ops`, vẫn chạy khi bước trước hỏng — AU13) |

- **Tìm nguyên nhân trong log:** chotot/apify/cloud-sync in một dòng `JOB FAIL [<job>] bước <bước> mã <n>` ra stderr
  cho mỗi bước hỏng (`grep 'JOB FAIL' pipeline/logs/chotot.log`; cloud-sync: `JOB FAIL [cloud-sync] bước sync-cloud mã 1`
  hoặc `… bước push-ops-facts …` — `grep 'JOB FAIL' pipeline/logs/cloud-sync.log`; zalo-import: `JOB FAIL [zalo-import-daily]
  bước transform-zalo mã 1` — `grep 'JOB FAIL' pipeline/logs/zalo-import.log`). Bộ chạy bước:
  `scripts/lib/job-step.sh` (`job_run` — chạy tiếp, giữ mã hỏng đầu tiên).
- **Còn nuốt lỗi, đang chờ:**
  - Đoạn **nạp** của `chotot-daily.sh` (`import-chotot` không kiểm mã) và `apify-facebook-daily.sh`
    (`import-airbnb … || true`, state vẫn nhảy qua snapshot hỏng) — làn ZCode, yêu cầu `P3-1` của đợt
    `dot0-cam-mau`. Bản vá cùng loại cho `zalo-import-daily.sh` (P1.5) nằm trên nhánh `zcode/audit-p1-resilience`.
- **Đã vá (P3-3, AU13 `cloud-sync-bao-loi-that`, 24/10):** `cloud-sync.sh` trước đây thoát 0 khi DB chập chờn
  (`sync-cloud` hỏng, `push-ops-facts` lành). `push-ops-facts.mjs` nay nối DB theo `DATABASE_URL`, vắng biến (như plist
  hiện nay) thì dùng chuỗi kết nối cũ tới `localhost:5433`.
- **Cảnh báo khi DB sập** không đến từ job: đó là lớp L5b của `scripts/zalo-watchdog.sh` (ZC3, làn ZCode, nhánh
  `zcode/audit-p1-resilience`, chờ Mạnh ký). Job chỉ nói thật bằng mã thoát.
- **Kiểm:** `node --test scripts/job-exit.test.mjs` — không tắt DB chung; tệp chạy job chạy trong cây tạm với
  `node`/`docker` giả, bước thật chạy trong hộp cát (`scripts/lib/job-exit-sandbox.mjs`) chặn mọi kết nối trừ một
  cổng canh (11 bước, gồm `push-ops-facts`). Không còn ca `todo` — hai ca `P3-3` đã thành ca thật ở AU13.

## Bộ tra hồ sơ người bán S03 (`_acceptance/link-nguoi-ban-s03/`, migration 080)

Người bán S03 không để lại số vẫn liên hệ được qua username công khai trên kênh chat (CONTEXT «Username người bán»). Bộ tra chạy
**trong gateway đang nối**, chỉ đọc, có trần, tự dừng khi kênh phản ứng. Mạnh chọn 06/11: «Qua gateway, gộp album» — cài cùng lần
khởi động lại của `ma-album-s03`, không có lần khởi động lại riêng.

**Một phiên, cấm đăng nhập thứ hai.** Bộ tra chỉ lấy API của bộ nghe tin đang nối; không có bộ nghe tin thì đặt tệp chặn
`khong-co-phien` và không gọi gì. Không đi qua hàm bọc tự tạo client hay tự đăng nhập lại bằng cookie đã lưu, không `login`,
`loginQR`, không tạo client, không ghi tệp phiên — kể cả để thử. Lời gọi API mới duy nhất là `getUserInfo`; không gửi tin, thả cảm
xúc, gõ phím, đã xem, kết bạn, đọc danh bạ hay `requestOldMessages`; không mở cổng mạng. Mỗi hồ sơ trả về chỉ giữ `userId` và
`username`, mọi trường khác (SĐT, tên, ảnh, ngày sinh) bỏ ngay khi nhận.

**Trần** (hằng `TRAN` của bộ tra, sàn hợp đồng AC-1 — trần bảo thủ tự đặt, chưa có nguồn ngoài):

| Trần | Giá trị |
|---|---|
| Mã mỗi lời gọi | ≤ 20 |
| Cách lời trước | ≥ 60 giây, mốc ghi ra đĩa nên đúng cả qua lần khởi động lại bộ nghe tin |
| Lời mỗi ngày | ≤ 30 |
| Khung giờ | 01:00–05:00 giờ VN |
| Hết giờ một lời | 15 giây — dừng cả lượt, kết quả về muộn bị bỏ |
| Lượt thử | đúng 1 lời: ≤ 20 mã + 2 mã đối chứng, có dấu đã thử |

**Thư mục việc** `S03_LOOKUP_DIR` (env của gateway; bỏ trống = bộ tra tắt). Nằm ngoài `~/.openclaw` và ngoài `snapshots/`:
`yeu-cau.json` (`{mas, doi_chung}`), `yeu-cau.da-xu.json` (tệp đã xử, lượt lớn), `chan.txt` (tệp chặn: một mã lý do, không chép
thông điệp thô), `da-thu.txt` (dấu đã thử), `luot-lon.txt` (điều khiển lượt lớn), `moc-60s.txt`, `dem-<ngày>.txt`,
`spool-ho-so.jsonl` (kết quả chờ khi collector không nhận).

**Đường dữ liệu.** Bộ tra → collector `POST /s03-ho-so` → snapshot S03 riêng nguồn `s03-ho-so`, kind `ho-so` (ghi mới, không sửa;
mỗi dòng: mã tài khoản, username hoặc rỗng, loại, thời điểm lấy — DATA-CONTRACT) → bộ nạp → `stg_s03_ho_so` (080; thiếu 080 thì bộ
nạp in `CHUA-AP-080`, không đánh dấu snapshot hồ sơ đã nạp) → bước đêm `buocDem` của `refresh-bait-gap.mjs` gọi `ghiLienLacHoSo`
(`pipeline/lib/lien-lac-ho-so.mjs`) → liên lạc `chat_profile`, luật `s03_ho_so_theo_tai_khoan`, lớp `fact`, phương pháp
`source_field` trong `party_contacts`. Đọc dòng mới nhất mỗi mã (`stg_s03_ho_so_moi_nhat`); username đổi thì rút liên lạc cũ lý do
`doi-username`, lần tra mới ra `khong-username` hay `khong-tim-thay` thì rút lý do `bo-username`; `khong-ro` không đổi gì. Bước này
không thêm bí danh, không gộp Người, không đụng liên lạc `sdt` hay `sale_offers`. **Không lên cloud**: `stg_s03_ho_so` và
`party_contacts` chỉ ở máy thu; hiện link là hồ sơ sau.

**Bốn loại kết quả mỗi mã:** `co-username` · `khong-username` · `khong-ro` (nhóm hồ sơ không đổi, không có username) ·
`khong-tim-thay`.

**Lượt thử** (sau khởi động lại 30 phút ổn theo lệnh phán lùi, không cùng phút khởi động lại):
1. `node pipeline/lap-yeu-cau-ho-so.mjs` — chỉ đếm, không ghi; đọc số «đủ điều kiện».
2. `node pipeline/lap-yeu-cau-ho-so.mjs --out "$S03_LOOKUP_DIR/yeu-cau.json"` — 20 mã người bán có từ 3 tin, mọi tin không có số,
   Người không có liên lạc hay bí danh SĐT (kể cả Người theo SĐT đã nối), chưa tra trong 30 ngày (tính cả snapshot hồ sơ chưa nạp);
   cộng 2 mã đối chứng là người đã gửi tin trong 24 giờ. Lệnh in số đếm, không in mã.
3. Lời gọi chạy ở nhịp kế trong khung 01:00–05:00. Canh 30 phút: dòng đóng bộ nghe tin, PID gateway, số `post 202`.
4. Đọc kết quả: chỉ số đếm bốn loại + kết quả hai mã đối chứng. Đối chứng phải tìm thấy hồ sơ với đúng `userId` đã gửi; ra
   `khong-tim-thay` hay `userId` khác thì bộ tra đặt `khac-khong-gian-ma` — mã tài khoản trong stg không cùng không gian mã của
   hàm tra, dừng hẳn.
5. Báo số đếm cho Mạnh. **Lượt lớn chỉ Mạnh bật** bằng giá trị người đặt trong `luot-lon.txt` (không có mặc định); lượt lớn vẫn giữ
   mọi trần trên, mỗi tệp yêu cầu xử một lần (đổi tên `yeu-cau.da-xu.json`).

**Tệp chặn** (`chan.txt` còn đó thì 0 lời gọi tới khi người xoá):

| Mã | Nghĩa | Xử |
|---|---|---|
| `khong-co-phien` | không có bộ nghe tin đang nối | kiểm gateway (watchdog), không đăng nhập thêm; xoá tệp khi bộ nghe tin nối lại |
| `http-401`, `http-429`, `rate-limit`, `loi-may-chu`, `loi-la` | kênh từ chối hay lỗi — dừng sau đúng lời gây lỗi, không thử lại | báo Mạnh; không xoá trong ngày |
| `het-15s` | lời không trả trong 15 giây | báo Mạnh; xem log gateway quanh giờ gọi |
| `listener-dong-sau-goi` | bộ nghe tin đóng, lỗi hay bộ canh báo trong 30 phút sau một lời — bộ tra in `dung-goi-Manh` | **dừng gọi, báo Mạnh**; không xếp vào dạng 26/10; chỉ Mạnh quyết gọi lại |
| `khac-khong-gian-ma` | mã đối chứng không tìm thấy hay `userId` lệch | dừng hẳn; cần hồ sơ riêng về không gian mã |
| `sai-khuon-yeu-cau` | tệp yêu cầu rỗng, sai khuôn, mã không toàn chữ số | lập lại tệp bằng `lap-yeu-cau-ho-so.mjs`, rồi xoá tệp chặn |

**Tắt bộ tra không cần khởi động lại:** xoá `yeu-cau.json` hoặc đặt `chan.txt` (bộ tra kiểm hai tệp ngay trước mỗi lời). Lùi mã bộ tra
đi cùng phạm vi lùi extension của mã album. Bộ tra dừng vì lỗi không đóng hay khởi động lại bộ nghe tin; handler vẫn nhận tin.

**Giá nếu kênh khoá phiên:** mất thu S03 tới khi Mạnh quét QR lại; dữ liệu đã thu không mất. Lượt thử một lời ở giờ im giảm xác
suất, không đưa về 0.

**Chưa đo:** tỉ lệ người bán có username; `sender_id` lưu ở stg có cùng không gian mã của hàm tra không (lượt thử đo bằng 2 mã đối
chứng); kênh có coi lời tra hồ sơ người lạ là bất thường không; trần an toàn thật của kênh (60 giây, 30 lời/ngày, khung 01:00–05:00
là trần bảo thủ tự đặt).
