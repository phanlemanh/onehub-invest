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
| `com.oneinvest.cloud-sync` (`scripts/cloud-sync.sh`) | DB tắt hẳn: thoát ≠ 0 · DB chập chờn: **có thể 0** | còn lỗ — xem dưới |

- **Tìm nguyên nhân trong log:** chotot/apify in một dòng `JOB FAIL [<job>] bước <bước> mã <n>` ra stderr cho mỗi
  bước hỏng (`grep 'JOB FAIL' pipeline/logs/chotot.log`). Bộ chạy bước: `scripts/lib/job-step.sh`.
- **Còn nuốt lỗi, đang chờ:**
  - Đoạn **nạp** của `chotot-daily.sh` (`import-chotot` không kiểm mã) và `apify-facebook-daily.sh`
    (`import-airbnb … || true`, state vẫn nhảy qua snapshot hỏng) — làn ZCode, yêu cầu `P3-1` của đợt
    `dot0-cam-mau`. Bản vá cùng loại cho `zalo-import-daily.sh` (P1.5) nằm trên nhánh `zcode/audit-p1-resilience`.
  - `cloud-sync.sh`: khi DB chập chờn (rớt lúc `sync-cloud`, lên lại trước `push-ops-facts`) job vẫn thoát 0;
    `push-ops-facts.mjs` viết cứng chuỗi kết nối, bỏ qua `DATABASE_URL`. Hai tệp thuộc `t3_paths` — hàng T3 riêng
    `P3-3` (Mạnh chọn ở Cổng Phạm vi AU3).
- **Cảnh báo khi DB sập** không đến từ job: đó là lớp L5b của `scripts/zalo-watchdog.sh` (ZC3, làn ZCode, nhánh
  `zcode/audit-p1-resilience`, chờ Mạnh ký). Job chỉ nói thật bằng mã thoát.
- **Kiểm:** `node --test scripts/job-exit.test.mjs` — không tắt DB chung; tệp chạy job chạy trong cây tạm với
  `node`/`docker` giả, bước thật chạy trong hộp cát (`scripts/lib/job-exit-sandbox.mjs`) chặn mọi kết nối trừ một
  cổng canh. Hai ca `todo` (mã `P3-3`) là lỗ cloud-sync — hiện trong đầu ra cho tới khi hàng T3 vá.
