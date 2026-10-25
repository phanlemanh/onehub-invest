# Runtime Map — môi trường vận hành một-hub (chốt 2026-10-22)

> Truy nguyên sự cố: file này là bản đồ THẬT của mọi tiến trình/binary/log
> liên quan thu thập. Sửa khi đổi môi trường.

## Bảng chân lý 5 thành phần

| Thành phần | Vai trò CHỐT | Vẫn cần? | Ghi chú vận hành |
|---|---|---|---|
| **OpenClaw headless gateway** (launchd `ai.openclaw.gateway`, runtime `~/.openclaw/runtime/2026.10.5…`) | **CANONICAL** — chạy zalouser provider (poll Zalo ~10′/lần), hooks, đã chứng minh tự polling | ✅ DUY NHẤT | KeepAlive; log ×2: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (console) + `~/Library/Logs/openclaw/gateway.log` (đầy đủ — **grep cái này!**) |
| OpenClaw Desktop (/Applications) | Không cần cho vận hành — headless làm được tất | ❌ (user được phép remove) | Không cài thêm Login Items |
| ~/dev/openclaw (source 4.4G) | **Tham chiếu source để vá plugin** (đang đứng nhánh `fix/zalouser-plugin-hooks` = v2026.10.5 + port pluginHooks) | ✅ GIỮ (dev) | KHÔNG chạy production từ đây |
| Zalo PC app / Zalo Web (Chrome) | **KHÔNG liên quan thu thập** — provider zca-js poll server Zalo trực tiếp bằng session QR-link | ❌ | Tiện cá nhân của user, muốn dùng thì dùng |
| Kev :8009, collector :9210, MTPLX :8000 | Hạ tầng phụ thuộc hook | ✅ | launchd KeepAlive đã có |

## Chuỗi tin Zalo (đúng như đã verify)

```
zca-js poll Zalo server (session QR-link, mỗi ~10′)
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

- **Đo không được thì nói ra**: khối hỏng là `{measured_at, error: "không đo được: …"}`, không bao giờ 0, mảng rỗng hay
  «Ổn»; các khối khác vẫn gửi. Lớp lockdown không kiểm được là `null` từng lớp. Soi khô ở máy thu:
  `node pipeline/push-ops-facts.mjs --kho` → dòng `khối: freshness đo được · jobs … · …` + `ops-facts khô: sạch, 0 chỗ chặn`.
- **Hai bản khớp**: `ops-local.mjs` (bên ghi) và hàm app (`app/src/lib/ops-queries.ts`) giữ khớp bằng
  `app/tests/ops-facts-so-tong-hop.test.tsx` — sửa định nghĩa ở một bên thì sửa cả bên kia.
- **Đọc trên cloud**: `readOpsFacts()` (`app/src/lib/ops-facts.ts`) trả `state` `none` (chưa có dòng) · `fresh` (≤ 45′) ·
  `stale` (> 45′, kèm `measuredAt` lần đẩy cuối); từng khối có `state` riêng theo `measured_at` của khối, khối lỗi là
  `error`. Hằng `FACTS_STALE_MS` (45′ = 3 lượt cloud-sync) chỉ ở tệp này — đổi chu kỳ cloud-sync thì đổi hằng.
  Trang hiện số: ON3 (/ops, /ops/collections), ON23 (lockdown), AU12 (độ phủ).
- Bản tin đi qua bộ soát tầng A (mục trên): tên nguồn thật trong khối nào cũng làm lượt đẩy dừng (`FACTS CHẶN … blocks.<khối>…`).
- Bảng snapshot đọc không được thì `sourceRuns` cũ vẫn gửi vai trò từng mã, số lần chạy để `null` (chưa đo).

### Ba trang Ops trên cloud đọc gì (ON3 `o-kpi-chi-do-local`, 24/10)

`getCloudOpsView()` (`app/src/lib/ops-cloud.ts`) gói `readOpsFacts()` thành dữ liệu trang; chỉ chạy khi `isLocalOnlyView()`.

| Trang | Ô / vùng | Nguồn trên cloud | Khi không có số |
|---|---|---|---|
| `/ops` | bốn ô độ phủ + lưới «Độ tươi theo nguồn» | khối `freshness` | ô «—» + «Chưa có số», lưới rỗng |
| `/ops/collections` | Sức khoẻ nguồn, lưới nguồn | `freshness` + `sourceRuns` | «—» |
| `/ops/collections` | Bản ghi 24h | `records24h` | «—» |
| `/ops/collections` | Lockdown | (ON23 sẽ đọc khối `lockdown`) | «—» + «Chưa kiểm được trên máy chủ» |
| `/ops/collections` | vùng còn lại (luồng, Cần chú ý, Zalo, xoay vòng…) | — không dựng trên cloud | một Alert «Phần còn lại của trang chưa có số trên máy chủ» |
| `/ops/review` | số thẻ chờ theo loại | `reviewQueue` (chỉ số đếm) | «—»; thẻ chi tiết vẫn chỉ ở máy local |

- Dòng «Số đo lúc <giờ VN> (GMT+7) từ máy thu» dưới tiêu đề khi có bản tin (`FactsStamp`, `components/ops/facts-status.tsx`).
- Bản tin cũ quá 45′: Alert vàng «Máy thu không đẩy số từ …», ô số mờ, không badge xanh nào (`FactsStaleAlert`).
- Chưa có bản tin (hoặc bảng `ops_heartbeat` chưa có): một Alert «Chỉ đo ở máy thu», mọi ô «—» — không bao giờ 0 hay «Ổn».
- Thử ở máy local như cloud: `node scripts/ops-cloud-proto.mjs --mode none|fresh|stale` in `VERCEL=1 DATABASE_URL=…` (lược đồ
  `ops_cloud_proto`, không có bảng tầng A/thô) để chạy dev server cổng khác; dọn bằng `--drop`.
- Trên cloud `/ops/collections` chỉ dựng vùng đọc bản tin (hàng ô số + lưới sức khoẻ nguồn + lưới job khi đã có bản tin);
  luồng 7 ngày, Cần chú ý, lockdown, ống S03, xoay vòng, nhóm S03 gom về một Alert «Phần còn lại của trang chưa có số trên máy chủ» và trang không
  truy vấn bảng thô (`MACHINE_ONLY_REGIONS` trong `collections-view.tsx`). ON4/ON23 đưa dần các vùng ấy lên bằng khối bản tin.

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
  chạy tay) thấy cấu hình đổi và tự tạo lại container theo file mới, cùng policy; DB gián đoạn vài giây,
  dữ liệu nằm trong volume `oneinvest_pgdata` nên không mất.
- Giới hạn:
  - Cần đăng nhập macOS: LaunchAgent chỉ chạy trong phiên người dùng, máy khởi động lại mà chưa ai đăng
    nhập thì colima và DB chưa lên.
  - `docker stop one-invest-db` có chủ đích thì container KHÔNG tự bật lại sau lần Docker khởi động kế
    tiếp — đúng nghĩa `unless-stopped`; bật lại bằng `docker start one-invest-db`.
  - Bằng chứng «Docker khởi động lại → DB lên lại» đo trên Docker riêng tạm; chưa diễn tập trên colima của
    máy (dừng cùng lúc DB và các container dự án khác). Diễn tập là việc Mạnh chọn giờ làm tay; agent không
    tự khởi động lại colima hay Docker của máy. Diễn tập xong chạy lại lệnh `live`.

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

## Job đêm báo lỗi thật (chốt 2026-10-23, `_acceptance/job-bao-loi-that/`, hàng AU3)

Đêm 22→23/10 DB local sập ~8 giờ mà `launchctl` ghi mọi job «last exit 0». Từng bước xử lý (`pipeline/*.mjs`)
vốn đã thoát 1 khi không tới DB; lỗ ở tệp chạy job không `set -e`: bước giữa hỏng, bước cuối lành (DB lên lại
giữa chuỗi) thì launchd thấy 0.

| Job launchd | Khi một bước DB hỏng | Ghi chú |
|---|---|---|
| `com.oneinvest.chotot` (`scripts/chotot-daily.sh`) | thoát ≠ 0 (mã của bước hỏng đầu) | đoạn transform chạy đủ các bước như cũ rồi mới thoát |
| `com.oneinvest.apify-facebook` (`scripts/apify-facebook-daily.sh`) | thoát ≠ 0 (mã của bước hỏng đầu) | như trên |
| `com.oneinvest.airdna-daily` (`scripts/airdna-daily.sh`) | thoát ≠ 0, dừng tại bước hỏng | `set -euo pipefail` từ trước |
| `com.oneinvest.collector` (→ `pipeline/finalize-hanoi.sh`) | thoát ≠ 0, dừng tại bước hỏng | `set -euo pipefail` từ trước |
| `com.oneinvest.cloud-sync` (`scripts/cloud-sync.sh`) | thoát ≠ 0 (mã của bước hỏng đầu) | hai bước luôn chạy cả hai: `push-ops-facts` (nhịp tim `/ops`) vẫn chạy khi `sync-cloud` hỏng (AU13) |

- **Tìm nguyên nhân trong log:** chotot/apify/cloud-sync in một dòng `JOB FAIL [<job>] bước <bước> mã <n>` ra stderr
  cho mỗi bước hỏng (`grep 'JOB FAIL' pipeline/logs/chotot.log`; cloud-sync: `JOB FAIL [cloud-sync] bước sync-cloud mã 1`
  hoặc `… bước push-ops-facts …` — `grep 'JOB FAIL' pipeline/logs/cloud-sync.log`). Bộ chạy bước:
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
