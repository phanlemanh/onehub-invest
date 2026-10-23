# Audit hiện trạng onehub-invest và đề xuất lộ trình (2026-10-23)

> Đo lúc 12:37–13:00 (+07) ngày 23/10/2026, **chỉ đọc**: SELECT trên DB local :5433 và Supabase
> `smqpqiigzulwpmrsrhci`, GET trên Vercel/HTTP, đọc log/launchd/git. Không ghi dữ liệu, không đổi cấu hình,
> không đụng cấu hình gateway thu S03. Ảnh chụp ở `assets/2026-10-23/`: tên nguồn thật và email người dùng app đã
> che, ảnh lớn trong dashboard đã phủ; tên/SĐT người bán để nguyên (tầng C, ADR-0007 sửa đổi 23/10).
> `/ops/review` chỉ chụp phần đầu trang vì nội dung `review_queue` là tầng A.
>
> **Chưa xem được:** cổng Ops trên prod (không trình duyệt nào có phiên đăng nhập prod, cần Mạnh đăng
> nhập) · Supabase dashboard (không có phiên). Ops local xem bằng dev server chạy từ worktree audit (main
> `f9a8430`) trên DB local dùng chung.
>
> Căn cứ: hiến pháp ROADMAP §1, quyết định §3 (không hỏi lại). Lộ trình ở §6 đặt **khớp** với review kiến
> trúc phân loại/enrich (`docs/architecture/classification-enrich-review.md` và bản phạm vi
> `docs/plan/pham-vi-phan-loai-2310.md` trên nhánh `claude/review-kien-truc-phan-loai-6df0fd`, chưa có PR).
> Audit này không lặp lại các mã việc PL1–PL31 của đợt đó.

## 1. Tóm tắt 10 dòng

1. Hai ngày 22–23/10 merge **23 PR** (#1–#24, #9 là issue kênh tin; 410 commit), chạm đủ các mảng: prod Vercel mới, sync cloud nguyên tử (038, đang chạy từ 05:44Z), enrich qua đề xuất + hậu kỳ (033/036/039), siết cổng Ops, B1/B3 UI, branch protection.
2. **Prod đang phục vụ dữ liệu giả:** `/api/v1/deals` công khai trả 30 deal, **29 là tin mock** của S03. Trên cloud 1.020/1.102 tin S03 là mock, 153 tin mang `bait_gap`. Số ROADMAP §2.5 tính cả tin giả.
3. **037 chưa áp lên Supabase:** RLS 0/37 bảng, anon SELECT được 37/37. `sessions` có **17 phiên còn hạn, token lưu thô**: ai có anon key là chiếm được phiên `/ops` prod.
4. **Project Vercel cũ `app` vẫn chạy công khai** code 22/10 (trước vá cổng). `/deals` mở cho mọi người, hiện tên nguồn thật (tầng A) và nội dung tin nội bộ.
5. **Giám sát báo sai:** DB local sập khoảng 8 giờ đêm 22→23/10 nhưng mọi job vẫn exit 0, watchdog vẫn «ok». `check-freshness` báo 8 dòng quá hạn giả và không theo dõi S05/S06. `audit-all` có 2 PASS giả, trong đó backup thực ra **chưa cài**.
6. Ranh giới Hà Nội hỏng: **33 khu vực cấp tỉnh** gắn dưới `vn-hanoi`, 19 listing gán sai. Ảnh prod cho thấy bản đồ Hà Nội trải cả nước, bảng phường có «Tỉnh Phú Thọ», «Tỉnh Hưng Yên».
7. Vận hành mong manh: không có sổ migration (local lẫn cloud), 038 từng áp vào DB local trước khi merge, compose không khai `restart:`, collector :9210 chạy tay không KeepAlive, S05 đứng từ 21/10 (lỗi 402).
8. CI chỉ chạy `gate` và `ui-lint`. **Không có typecheck/test/build** của app, pipeline, agent, collector, data-api. data-api không có bản deploy nào chạy được (2 lần ERROR, domain 404).
9. Phần chạy tốt: Invest prod trả 200 và hiện số thật cho Hà Nội/TP.HCM, Ops đóng mặc định (307 → `/login`), sync nguyên tử swap mất 12 giây, lint `onehub-ui` giảm từ **138/31 xuống 85/21 file**, 19 hồ sơ `_acceptance` đều PASS và khớp lúc merge.
10. Đề xuất: **Đợt 0 cầm máu** (037, tắt project cũ, rút mock, giám sát nói thật, backup) → **Đợt 1** là đợt phân loại `phan-loai-2310` cộng sửa ranh giới và CI → **Đợt 2** cổng Invest I1–I6 trên dữ liệu đã sạch. Có 8 câu cần Mạnh quyết (§7).

## 2. Bảng hiện trạng

Trạng thái: ✅ đạt · ⚠️ lệch nhẹ · ❌ lệch nặng.

### 2.1 Prod

| # | Mục | Số đo | Lệnh / cách đo | TT | Ảnh |
|---|---|---|---|---|---|
| P1 | Deploy prod `onehub-invest` | READY mới nhất `90c712f` (PR #22). Bản #20, #23 CANCELED vì Ignored Build Step (không đổi `app/`), đúng thiết kế | Vercel `list_deployments target=production` | ✅ | [dash-02](assets/2026-10-23/dash-02-vercel-deployments.png) · [dash-01](assets/2026-10-23/dash-01-vercel-onehub-invest.png) |
| P2 | Lỗi runtime 24h | `ECONNREFUSED 127.0.0.1:5433` ×39 (00:10–01:19Z, trước khi có `DATABASE_URL`, đã hết) · `source_registry does not exist` ×1 ở `/api/v1/ops/coverage` | `get_runtime_errors since=24h` | ⚠️ | — |
| P3 | Trang Invest | `/` `/vn` `/vn/hanoi` `/vn/hcmc` `/vn/hanoi/listings` `/vn/hanoi/dau-tu` `/yield` `/so-sanh` `/phuong-phap` đều 200. `/vn/hanoi` mất 2,7s, `/dau-tu` 3,6s. Không có skeleton treo | `curl -w %{http_code}` + chụp ego-browser (chờ 5s) | ✅ | [home](assets/2026-10-23/prod-01-home.png) · [finder](assets/2026-10-23/prod-02-finder-vn.png) · [hà nội](assets/2026-10-23/prod-03-market-hanoi.png) · [listing](assets/2026-10-23/prod-05-listings-hanoi.png) · [đầu tư](assets/2026-10-23/prod-06-dau-tu-hanoi.png) · [yield](assets/2026-10-23/prod-07-yield.png) · [hcm](assets/2026-10-23/prod-08-market-hcmc.png) |
| P4 | Trang thị trường chưa có dữ liệu | Đà Nẵng: KPI hiện «0 ₫» thay vì trạng thái trống, trục biểu đồ ghi **«T1/70 – T1/70»** (mốc epoch), biểu đồ rỗng | ảnh | ❌ | [đà nẵng](assets/2026-10-23/prod-09-market-danang.png) |
| P5 | Bản đồ + bảng phường Hà Nội | Bản đồ phủ cả nước; bảng «Phường nổi bật» và Finder có «Tỉnh Phú Thọ», «Tỉnh Hưng Yên» | ảnh + §2.2 L8 | ❌ | [hà nội](assets/2026-10-23/prod-03-market-hanoi.png) · [finder](assets/2026-10-23/prod-02-finder-vn.png) |
| P6 | Cổng Ops prod | `/ops` `/ops/review` `/ops/deals` → 307 `/login?next=…`; `/saved` → 307; `/api/v1/ops/coverage` 401 khi không token. **Nội dung Ops prod chưa xem được** | `curl` + ảnh | ✅ / chưa xem | [login](assets/2026-10-23/prod-10-ops-login-redirect.png) |
| P7 | `/api/v1/deals` công khai | 200, 30 dòng toàn S03. Đối chiếu `post_ids` trên cloud: **29/30 là tin mock** | `curl` + `SELECT … post_ids::text LIKE '%mock%'` | ❌ | [api](assets/2026-10-23/prod-12-api-deals-public.png) |
| P8 | `/api/v1/markets` | 34 thị trường, 2 có listing (hanoi 267, hcmc 241). Cần Thơ `marketScore` 97,14 với 0 listing, đứng trên Hà Nội 93,59 | `curl` | ⚠️ | — |
| P9 | Tên nguồn trên cổng Invest | Dòng phụ đề, khung «Số liệu lấy từ đâu?» và chân trang ghi tên nguồn S01 thật, một bộ dữ liệu mở và S04. Lệch bảng tầng ADR-0007 (tầng A), nhưng giấy phép S04 đòi ghi công → cần quyết (Q4) | `curl … \| grep` + ảnh (đã che) | ⚠️ | [home](assets/2026-10-23/prod-01-home.png) |
| P10 | Project Vercel cũ `app` | **Vẫn sống**: prod `c6eea64` (22/10). `/deals` 200 công khai, trang có tên nguồn thật (S03 ×62, S05 ×2, S06 ×2) và nội dung tin; `/register` 200; `/api/v1/deals` 200 | `curl` + Vercel dashboard | ❌ | [deals cũ](assets/2026-10-23/prod-11-old-project-deals-public.png) · [dash-03](assets/2026-10-23/dash-03-vercel-old-app.png) |
| P11 | data-api `onehub-data-api` | 2 deployment đều ERROR (19–20/10), «No Production Deployment», domain 404 | Vercel + `curl` | ❌ | [dash-04](assets/2026-10-23/dash-04-vercel-data-api.png) |
| P12 | Supabase RLS / quyền anon | RLS 0/37 bảng public; anon SELECT 37/37 + 4 view. Advisor: `rls_disabled_in_public` ×37, `security_definer_view` ×2, `extension_in_public`, `st_estimatedextent` anon/auth ×3. **037 chưa áp** | `pg_class.relrowsecurity` + `has_table_privilege('anon',…)` + `get_advisors security` | ❌ | — |
| P13 | `sessions` / `users` cloud | 17 / 1. Cả 17 phiên còn hạn, phiên mới nhất tạo 22/10 09:10Z → `DELETE FROM sessions` chưa làm | `SELECT count(*) … WHERE expires_at > now()` | ❌ | — |
| P14 | Số dòng cloud | sale_offers 12.615 (P1 1.220 / P2 11.395; S06 11.395 · S03 1.102 · S05 118) · properties 10.870 · property_offers 11.438 · listings 508 · sellers 1.043 · areas 372 · nights 179.945 · ref_calib_listings 54.507 · v_ruler_p2_area 154 · DB 183 MB. **Khớp local từng bảng** | `count(*)` | ✅ | — |
| P15 | Tin mock trên cloud | S03: 1.020 dòng `post_ids` dạng `mock-…` (first_seen 18–21/10), 153 có `bait_gap_pct`; 82 tin thật | `GROUP BY seller_ref IS NOT NULL` | ❌ | — |
| P16 | Luật cột khi lên cloud | `listing_url` có giá trị 0/12.615 (đúng luật); `seller_ref` dạng `S0x:số` | `count(*) FILTER` | ✅ | — |
| P17 | Sync nguyên tử (038) | Có schema `sync_stage`. Lượt launchd 05:44Z: 282.640 dòng / 21 bảng, stage 80s, **swap 12s**, gate 19s. `ops_heartbeat.pushed_at` 05:29Z | `sync_stage.swaps` + `pipeline/logs/cloud-sync.log` | ✅ | — |
| P18 | `saved_markets` | 0 dòng (trước #24 bị TRUNCATE CASCADE mỗi 15′; từ #24 giữ được) | `count(*)` | ⚠️ theo dõi | — |
| P19 | Sổ migration cloud | `list_migrations` = [] (không có bảng theo dõi) | Supabase MCP | ⚠️ | — |
| P20 | Branch protection `main` | check `gate` + `ui-lint`, admin không vượt, cấm force, 0 review, strict=false | `gh api …/protection` | ✅ | — |
| P21 | CI | Chỉ `acceptance-gate` (product-map + pre-merge-check) và `ui-lint`. Không typecheck/test/build module nào | `.github/workflows/*.yml` | ⚠️ | — |

### 2.2 Local

| # | Mục | Số đo | Lệnh / cách đo | TT | Ảnh |
|---|---|---|---|---|---|
| L1 | Bảng canonical | sale_offers 12.615 · listings 508 · properties 10.870 · sellers 1.043 · areas 372 · enrichment_proposals queued 4 / applied 2 / superseded 2 · review_queue: entity_match pending 11 + rejected 1, agent_output pending 4 | `docker exec one-invest-db psql` trong `BEGIN READ ONLY` | ✅ | — |
| L2 | `stg_*` | stg của S03 2.242 (`media_files` có giá trị **0** dòng, cột `media` cũ 370) · stg của S06 12.723 · stg_calendar 11,3 triệu · stg đêm của S01 259.515 | `count(*)` | ⚠️ (035 chưa có dữ liệu) | — |
| L3 | Migration local | 035/036/039 đã áp. 037 là no-op (không có role anon). **038 áp vào DB dùng chung từ nhánh chưa merge** (giờ đã merge), nên 039 áp trước 038. Không có bảng theo dõi migration | dò hàm, schema, FK `confdeltype` | ⚠️ | — |
| L4 | Độ tươi (DB) | S01 hanoi 19/10, hcmc 18/10 (≈5 ngày, dưới SLO 8 ngày) · S02 22/10 12:13Z · S03 stg 23/10 05:00Z · S04 19/10 · **S05 21/10 11:00Z (đứng)** · S06 stg 23/10 01:34Z | `max(ts)` theo nguồn | ⚠️ | — |
| L5 | `check-freshness.mjs` | exit 1, 8 dòng «chưa có snapshot», **cả 8 báo giả** (S02 không ghi vào bảng snapshot của S01; S04 đã `completed`; ghép chéo mọi nguồn × thành phố). S05/S06 không có SLO | `node scripts/check-freshness.mjs` | ❌ | [/ops local](assets/2026-10-23/local-20-ops.png) |
| L6 | `audit-all.sh` | 28 PASS · 6 FAIL · 2 LIMITED. FAIL thật: heartbeat 1/2 tài khoản S03, coverage cloud 500. FAIL giả: 4 trang `/ops` gọi `:3000` (app ở `:3456`). **PASS giả**: membership S03 và backup (lỗi `grep -c … \|\| echo 0`). Thực tế 0 job backup | `bash scripts/audit-all.sh` (đọc trước, chỉ đọc) | ❌ | — |
| L7 | DB container | healthy, khởi động 23/10 05:38 (+07). Trước đó **sập khoảng 8 giờ** (≈21:25 22/10 → 05:38 23/10, sau khi colima khởi động lại). Restart policy `unless-stopped` đặt tay; `db/docker-compose.yml` không khai `restart:` | `docker inspect` + log job | ❌ | — |
| L8 | Khu vực | 172 area con của `vn-hanoi`, `ST_Extent` = BOX(102.14 7.69, 114.86 23.39) tức cả nước. 25 area tên «Tỉnh…», **33 area cấp tỉnh/thành** gắn làm submarket Hà Nội, 19 listing gán vào đó. Đà Nẵng 0 submarket. 377 offer chưa gán area (S03 331, S05 46) | `ST_Extent`, `count(*)` | ❌ | [hà nội local](assets/2026-10-23/local-03-market-hanoi.png) · [đà nẵng local](assets/2026-10-23/local-09-market-danang.png) |
| L9 | cloud-sync (24h) | 96 lượt: 60 ok · **34 lỗi PGRST204** (cloud thiếu cột `sale_offers.bathrooms`, mỗi lượt lỗi làm trống bảng cloud tới lượt sau) · 1 DB sập · 1 không rõ. Từ 05:44Z chạy bản nguyên tử, ok | `pipeline/logs/cloud-sync.log` | ⚠️ (đã sửa bằng #24) | — |
| L10 | Job launchd | Mọi job last exit 0. S06 05:30 hỏng bước nạp (DB sập), nạp lại tay 08:29–08:34. S03 00:00 hỏng (27 ECONNREFUSED). S05: 5 lần **402 khi khởi chạy actor** + 27 ECONNREFUSED. S02 19:05 ok. S01 tuần chưa có lượt launchd nào (plist tạo 20/10). smoke 20:00 ok | `launchctl list/print` + log | ❌ (exit 0 che lỗi) | — |
| L11 | Tiến trình phụ thuộc | `com.oneinvest.collector-api` và `com.oneinvest.kev` có plist nhưng **không nạp**. Collector :9210 chạy tay từ 21/10, không KeepAlive (trái runtime-map). kev-gate KeepAlive ok, 0 lỗi | `launchctl list`, `ps` | ❌ | — |
| L12 | Watchdog S03 | 251 lượt «ok»/24h, có khoảng hở 17:54–21:29 22/10. 13 dòng cảnh báo (10 KILL L3b chiều 22/10, 2 KILL «patch biến mất» 21:19/21:24), sau đó sạch. Panel `/ops/collections` local ghi L4 «Hỏng · chạy cuối: —», có thể do dev chạy từ worktree không có `pipeline/logs` (cần kiểm trên checkout chính/prod) | log watchdog (chỉ đọc) + ảnh | ⚠️ | [thu thập](assets/2026-10-23/local-24-ops-collections.png) |
| L13 | Cổng lọc S03 hôm nay | 411/1.047 tin qua cổng, 636 bị chặn (≈61%) | ảnh `/ops/collections` | ⚠️ (review L06 / PL Kev thành nhãn) | [thu thập](assets/2026-10-23/local-24-ops-collections.png) |
| L14 | Ops local (UI) | Trang Ops trả nội dung, không lỗi, không skeleton treo. `/ops` ghi «4/14 đạt SLO, 2 quá hạn, 8 chưa có» trong khi `/ops/collections` ghi «5/6 nguồn trong SLO», **hai trang mâu thuẫn**. `/ops/deals` local: 3/4 thẻ đầu là tin mock. Review: 15 chờ, 1 từ chối | chụp ego-browser (phiên ops local có sẵn) | ⚠️ | [ops](assets/2026-10-23/local-20-ops.png) · [review](assets/2026-10-23/local-21-ops-review.png) · [deals](assets/2026-10-23/local-22-ops-deals.png) · [quality](assets/2026-10-23/local-23-ops-quality.png) · [sources](assets/2026-10-23/local-25-ops-sources.png) |
| L15 | Invest local so với prod | Cùng số, cùng bố cục với prod (dùng chung dữ liệu). Cùng các lỗi P4/P5 | ảnh | — | [home](assets/2026-10-23/local-01-home.png) · [finder](assets/2026-10-23/local-02-finder-vn.png) · [listing](assets/2026-10-23/local-05-listings-hanoi.png) · [yield](assets/2026-10-23/local-07-yield.png) |

### 2.3 Repo

| # | Mục | Số đo | Lệnh / cách đo | TT |
|---|---|---|---|---|
| R1 | PR | 23 PR merged (#9 là issue), 0 mở. #24 merge 05:41Z, checkout chính đã ở `f9a8430` | `gh pr list --state all` | ✅ |
| R2 | `_acceptance/` | 19 hồ sơ PASS. `git diff verified_commit..head` (trừ docs/md): 0 tệp lệch ở cả 19. Ngoại lệ hợp luật: `dev-ops-account` merge máy-thông chưa ký; hồ sơ media stg S03 (T3, PR #13) `gate1_skipped`. Hồ sơ `collector-graceful-shutdown` (nhánh chưa merge) vòng 1 REJECT | đọc frontmatter + diff | ✅ |
| R3 | Lint `onehub-ui` | **85 vi phạm / 21 file** (82 baseline + 3 disable có lý do, 0 mới), so với 138/31 ngày 22/10. Ops 22 (review-card 20, ops/deals 2); Invest + dùng chung 60/17 file | `npm run lint:ui-report` | ✅ |
| R4 | Route tiếng Việt | Còn `/so-sanh`, `/phuong-phap`, `[market]/dau-tu`, chưa có redirect; `/deals → /ops/deals` là `permanent: false` | `app/next.config.ts`, cây `app/src/app` | ⚠️ (để đợt I*) |
| R5 | Migration trên main | 030–039 liên tục, không trùng. Không nhánh treo nào giữ số | `ls db/migrations` | ✅ |
| R6 | Nhánh treo | `zcode/<worklist S01>` (+7), `zcode/audit-p1-resilience` (+2), `zcode/kev-nhan` (+1), `zcode/collector-graceful-shutdown` (+3): **chỉ có ở local**, không remote, không PR. `claude/review-kien-truc-phan-loai-6df0fd` (+15, không remote, xung đột `docs/ROADMAP.md`, có đụng `.claude/settings.json`). ~45 nhánh đã merge chưa dọn | `git worktree list`, `merge-base` | ⚠️ |
| R7 | Merge không qua PR | 3 merge `zcode/*` thẳng vào main 05:42–05:50 ngày 23/10, trước khi bật protection | `git log --merges` | ⚠️ (đã chặn từ nay) |
| R8 | ROADMAP lệch thực tế | §4 lệch 9 mục (M-3b, P-A2, P-A3, A, B1, B3, BĐ, V7, N1 còn ghi chờ ký/PR mở trong khi đã merge). §2.5 tính cả tin mock. §4 N2 ghi «S05 active ✅», §2.3 ghi paused, thực tế đứng (402). `CONTEXT-PRODUCT.md` §5 còn ghi SĐT là tầng A | đối chiếu git | ❌ |

## 3. Đã làm (22–23/10, đối chiếu git log)

23 PR merged vào `main` (sha ở `gh pr list`). Phân nhóm:

| Mảng | PR | Kết quả đo được hôm nay |
|---|---|---|
| Prod mới | #15 runtime-map Vercel · #18 ops ingest trỏ prod mới | `onehub-invest.vercel.app` 200, hnd1, env đủ, ops-facts đẩy mỗi 15′ (P1, P17) |
| Sync cloud | #24 nguyên tử (038) | Swap 12s, khớp từng bảng với local, `saved_markets` không còn bị xoá (P14, P17) |
| Bảo mật | #5 siết cổng Ops · #20 037 khoá anon/RLS · #23 bỏ ask rộng + branch protection | Ops đóng mặc định (P6); protection bật (P20); **037 chưa áp** (P12) |
| Cổng và SPL | #3 `/deals` → `/ops/deals` · #4 gỡ ảnh S02 khỏi `/listing` · #19 người bán là tầng C | Invest không còn deal và ảnh S02; **project cũ vẫn phục vụ bản trước vá** (P10) |
| Enrich | #14 enrich qua đề xuất (033) · #21 hậu kỳ (036/039) | Đề xuất sống qua nạp lại (FK RESTRICT ở local), có hoàn tác kèm audit; 639/644 chưa hoàn tác (F6 của review) |
| Hàng duyệt | #16 backend ảnh tin · #22 ảnh trên thẻ `/ops/review` | Thẻ có ảnh (đã xem local) |
| Dữ liệu | #11 view ruler (034) · #13 `media_files` stg S03 (035) | Ruler 154 phường; `media_files` 0 dòng (L2) |
| UI | #2 chuẩn ReUI phần A · #12 B3 biểu đồ · #17 B1 cổng Ops · #6 bản đồ đích Invest | Lint 138/31 → 85/21 (R3); shell Ops mới (ảnh L14) |
| Quy trình | #1 tài khoản ops thử · #7 khoá config · #8 CONTEXT.md · #10 luật tin Claude↔ZCode | Máy tự đăng nhập dev được; từ vựng UI chuẩn |

## 4. Kế hoạch chưa làm (đã kiểm lại)

| Việc | Nguồn | Hiện trạng đo | Ghi chú |
|---|---|---|---|
| Áp 037 lên prod + `DELETE FROM sessions` | `docs/ops/supabase-lock-anon-rls.md` | ❌ chưa (P12, P13) | Việc của Mạnh, đã có runbook |
| Kiểm RLS/anon trong leak gate | ghi chú cloud-sync | chưa | Nên làm ngay sau 037 |
| Ngoài-4 sync: client tráo lỗi → COMMIT bảng rỗng | hồ sơ cloud-sync-atomic | chưa (theo ghi chú phiên; chưa đọc code) | — |
| Coverage cloud `/api/v1/ops/coverage` | runtime-map | ❌ 500 khi có token (lỗi runtime 01:28Z) | Bảng `source_registry` có cột tầng A nên không lên nguyên bảng |
| Ngoài-4 enrich: thẻ chờ không dựng lại căn cứ | `_acceptance/enrich-hau-ky` | chưa | Đi vào C2.3/C3.1 của review |
| Đề xuất S03 bị CASCADE xoá trước 039 | ghi chú enrich | đã chặn từ 039 (RESTRICT ở local); phần đã mất vẫn mất | — |
| Hoàn tác 639/644 | Hỏi-2 enrich-hau-ky | chưa (`applied` = 2) | Nằm trong F6 của review, Mạnh đã đồng ý thứ tự |
| `group_name` trong data-api `/v1/deals` | — | chưa kiểm code; data-api không có bản chạy (P11) | Gắn với Q7 |
| Đưa liên hệ người bán trở lại Invest | ADR-0007 sửa đổi | chưa, còn chờ quyết | Nên chờ L19 dọn mock xong, tránh hiện SĐT giả |
| UI B5 (`/ops/deals` + gỡ baseline) | ROADMAP Track 6 | chưa | — |
| UI I1–I6 (đổi slug + redirect trước) | ROADMAP Track 6 | chưa | 3 route tiếng Việt, 0 redirect (R4) |
| Dựng lại `/ops/review` theo solution-agents-5 | B1 Task 12 | chưa (review-card 20 vi phạm) | **Gộp vào C3.1 «thẻ duyệt v2»** của review, không làm riêng |
| mapcn cho bản đồ | BĐ lượt 2 | chưa | Làm trong I1–I3, sau khi sửa ranh giới (L8) |
| docker-compose `restart:` | — | chưa (L7) | — |
| check-freshness theo nguồn thật | — | chưa (L5) | — |
| reassign-areas Đà Nẵng | — | chưa; **thêm**: 33 khu vực tỉnh dưới `vn-hanoi` (L8) | — |
| dq-truthful-coverage | — | chưa kiểm | — |
| Lỗ T1-escape của kit | kit | chờ kit ra bản; onehub chỉ chép lớp CI | Không tự sửa kit |
| Code ReUI Pro trên repo public | — | Mạnh hoãn | Không đề xuất |
| Review kiến trúc phân loại/enrich | worktree `review-kien-truc-phan-loai-6df0fd` | tài liệu 909 dòng chờ duyệt; FRAMING đã duyệt; chưa push, chưa PR, xung đột ROADMAP | Cần PR sớm (Q5) |

**Bổ sung từ audit (chưa có trong danh sách):**

| Việc | Căn cứ |
|---|---|
| Rút tin mock khỏi canonical + cloud + `/api/v1/deals` | P7, P15 · đã có mã PL1/PL2 (L19a/b) trong đợt phân loại |
| Tắt/xoá project Vercel cũ `app` | P10 · runtime-map ghi «Mạnh tự xoá được» từ 09:40 |
| Giám sát nói thật: job exit ≠ 0 khi DB không tới, cảnh báo DB sập, `audit-all` hết PASS giả | L5–L7, L10 · hiến pháp §1.4 |
| Backup tuần V1 (nợ cũ nhất, thực tế 0 job) | L6 |
| Nạp plist collector-api / kev (KeepAlive) | L11 · làn ZCode (`install-*`) |
| Sổ migration (local + cloud) | L3, P19 |
| CI chạy typecheck + test các module | P21 |
| data-api: deploy lại hoặc ghi rõ hoãn | P11 |
| S05: lỗi 402 khi khởi chạy actor | L10 · ROADMAP N2 ghi sai |
| Trạng thái trống Đà Nẵng («0 ₫», trục «T1/70») + `marketScore` khi 0 listing | P4, P8 |
| Hai trang Ops mâu thuẫn về SLO; panel watchdog «Hỏng» | L12, L14 |
| `media_files` 0/2.242 dòng; heartbeat 1/2 tài khoản S03 | L2, L6 · làn ZCode |
| Beacon `POST /api/v1/user-events` trả 401 cho khách | ghi chú B3 |
| ROADMAP §2.5/§4 và CONTEXT-PRODUCT §5 lệch thực tế | R8 |
| Dọn ~45 nhánh đã merge, worktree `dreamy-mirzakhani` | R6 |

## 5. Rủi ro theo mức

| Mức | Rủi ro | Số đo | Hệ quả nếu để |
|---|---|---|---|
| 🔴 Nghiêm trọng | Anon key đọc được `sessions` (token thô), `users`, `ref_calib_*` (dữ liệu S02 chỉ để hiệu chuẩn theo ToS) | P12, P13 | Chiếm phiên `/ops` prod; lộ dữ liệu S02 trái ToS (hiến pháp §1.1) |
| 🔴 Nghiêm trọng | Prod công khai phục vụ deal giả | P7: 29/30 · P15: 1.020 tin, 153 bait | Nhà đầu tư thấy «giảm 50%» trên tin không có thật; mọi số đo P1 (bait gap, parser F1) sai |
| 🔴 Nghiêm trọng | Project cũ `app` công khai `/deals` với tên nguồn thật | P10 | Tầng A rời máy, đang chạy trên internet (hiến pháp §1.3) |
| 🟠 Cao | Giám sát không thấy sự cố | L5–L7, L10: DB sập 8 giờ, job exit 0, watchdog «ok» | Mất lượt thu mà không ai biết; vi phạm §1.4 «observability là điều kiện ra quyết định» |
| 🟠 Cao | Không backup, DB local là nơi duy nhất giữ tầng A và quyết định người | L6, L7 | Một lần hỏng đĩa là mất `review_queue`, `ops_audit`, hồ sơ user |
| 🟠 Cao | Ranh giới khu vực sai | L8, P5 | Xếp hạng phường và bản đồ Invest sai; mọi chỉ số theo phường của Hà Nội lẫn tỉnh khác |
| 🟠 Cao | Migration không có sổ, có áp lệch thứ tự | L3, P19 | Không biết DB nào đang ở trạng thái nào; dễ lặp sự cố «cloud thiếu cột» (34 lượt PGRST204) |
| 🟡 Trung bình | CI không test module nào | P21 | T1/T2 máy-thông chỉ dựa vào `/verify` cục bộ |
| 🟡 Trung bình | data-api không chạy | P11 | Kênh «máy đọc qua API» trong CONTEXT-PRODUCT chỉ là giấy |
| 🟡 Trung bình | S05 đứng từ 21/10 | L4, L10 | Mất tín hiệu P1 thứ hai; ROADMAP ghi «active» |
| 🟡 Trung bình | Tên nguồn trên Invest | P9 | Lệch ADR-0007; nhưng gỡ hết thì có thể sai giấy phép S04 |
| 🟡 Trung bình | Nhánh chỉ có ở local (4 zcode + review, 28 commit) | R6 | Mất việc nếu máy hỏng; review tụt sau main, xung đột ngày càng lớn |
| 🟢 Thấp | Trạng thái trống Đà Nẵng, điểm Cần Thơ, 3 route tiếng Việt, ROADMAP lệch, beacon 401, nhánh chưa dọn | P4, P8, R4, R8 | Chất lượng và niềm tin, không mất dữ liệu |

## 6. Đề xuất lộ trình

Nguyên tắc sắp xếp: (1) chặn rò và dữ liệu giả trước mọi thứ (hiến pháp §1.3, §1.2); (2) làm giám sát nói thật
trước khi đo nền, vì đợt phân loại chọn hướng (a) «đo trước rồi mới xây» (review Q11), mà số đo chỉ đáng tin khi
nhìn thấy được lượt thu hỏng; (3) không xây UI mới trên dữ liệu còn bẩn (§1.8 «đo trước khi build»).

### Đợt 0 — Cầm máu (1–2 ngày, chạy trước hoặc song song phần đầu đợt phân loại)

| # | Việc | Lý do (số đo) | Phụ thuộc | Tầng | Ai |
|---|---|---|---|---|---|
| 0.1 | Áp 037 theo runbook + `DELETE FROM sessions` trên cloud | P12, P13 | Không (đã ký) | — (triển khai) | Mạnh |
| 0.2 | Thêm phép kiểm RLS/anon vào leak gate của sync (đỏ khi anon còn SELECT) | Chặn tái phát sau 037 | 0.1 | T2 | Claude |
| 0.3 | Tắt hoặc xoá project Vercel `app` | P10 | Không (ingest đã trỏ prod mới) | — | Mạnh |
| 0.4 | PL1 + PL2 của đợt phân loại (importer bỏ snapshot thử; canonical không còn tin mock, dọn có audit) chạy **đầu tiên**; sync kế tiếp tự dọn cloud | P7, P15 · review §0.3 «làm trước mọi việc đo» | PL1 làn ZCode, PL2 Claude | T2 / T3 (theo review) | ZCode + Claude |
| 0.5 | Tạm đóng `/api/v1/deals` công khai cho tới khi PL2 xong (đổi sang yêu cầu token ops, hoặc trả rỗng) | P7 | Q3 | T2 | Claude |
| 0.6 | Giám sát nói thật: job thoát ≠ 0 khi DB không tới; cảnh báo DB sập (đã có kênh watchdog); `check-freshness` theo nguồn thật (S02 bảng riêng, bỏ S04 `completed`, thêm SLO S05/S06); sửa 2 PASS giả + cổng `:3456` trong `audit-all`; `/ops` và `/ops/collections` dùng chung một nguồn số SLO | L5–L7, L10, L14 | Không | T2 | Claude (bước thu trong `*-daily.sh` báo ZCode) |
| 0.7 | Bền vận hành: `restart: unless-stopped` trong compose; nạp plist collector-api + kev | L7, L11 | Không | T1 (compose) · làn ZCode (plist) | Claude + ZCode |
| 0.8 | Backup tuần V1 | L6 | Q6 (BACKUP_DIR, BACKUP_PASS) | T2 | Claude |
| 0.9 | Đồng bộ ROADMAP §2.5/§4, CONTEXT-PRODUCT §5 với thực tế (sau khi review kiến trúc vào main, tránh xung đột) | R8 | PR review kiến trúc | T1 | Claude |

### Đợt 1 — Đợt phân loại `phan-loai-2310` + nền dữ liệu (1–2 tuần)

Phần lõi là **bản phạm vi của review kiến trúc** (PL1–PL31: lát Vinhomes Ocean Park 1, tập nhãn, số nền Wilson,
lớp phát biểu, thẻ duyệt v2, Kev thành nhãn, độ tươi p50 ≤ 10′, lớp model qua AI Gateway). Audit không chia lại
các việc đó, chỉ thêm điều kiện từ số đo và các việc **không chồng file**:

| # | Việc | Lý do (số đo) | Phụ thuộc | Tầng |
|---|---|---|---|---|
| 1.1 | Điều kiện vào đợt: đo nền chỉ bắt đầu sau 0.4 (hết mock) và 0.6 (giám sát đúng). Lát chỉ dùng S03 + S06, vì S05 đứng | L4, L10, P15 | Đợt 0 | — |
| 1.2 | Sửa ranh giới khu vực: gỡ 33 area cấp tỉnh khỏi `vn-hanoi`, gán lại 19 listing, dựng submarket Đà Nẵng, rồi chạy 300 + 400 (bẫy kỹ thuật #5) | L8, P5 | Không đụng `asset_nodes` (C1.5 của review là cấp toà/trục/căn) | T3 (đổi dữ liệu canonical) |
| 1.3 | Sổ migration: bảng ghi migration đã áp ở local và cloud; `/verify` hoặc leak gate so số với `db/migrations/` | L3, P19, 34 lượt PGRST204 | Không | T3 (`db/`) |
| 1.4 | CI chạy typecheck + test: app, pipeline, agent, data-api (collector báo ZCode) | P21 | Không | T2 |
| 1.5 | Coverage cloud: đẩy bản đã gọt tầng A của registry (mã + trạng thái + độ tươi) qua ops-facts, không đẩy nguyên bảng | P2 | 0.1 | T2 |
| 1.6 | data-api: deploy lại theo Q7, kèm `group_name` nếu vẫn cần | P11 | Q7 | T2 |

### Đợt 2 — Cổng Invest trên dữ liệu đã sạch (2–3 tuần)

| # | Việc | Lý do (số đo) | Phụ thuộc | Tầng |
|---|---|---|---|---|
| 2.1 | I1–I6 theo bản đồ đích đã chốt (đổi slug + 301 trước: `/so-sanh`, `/phuong-phap`, `/dau-tu` → `/yield`; `/deals` chuyển `permanent: true`), mapcn cho bản đồ | R3: còn 60 vi phạm ở Invest; R4 | 1.2 (ranh giới đúng thì bản đồ mới đúng) | T2 |
| 2.2 | Trong I1/I2: trạng thái trống thật cho thị trường 0 listing (bỏ «0 ₫», sửa trục «T1/70»); `marketScore` không xếp thị trường 0 listing lên đầu | P4, P8 | 2.1 | T2 |
| 2.3 | B5: `/ops/deals` + gỡ baseline (phải rỗng). `/ops/review` đi theo C3.1 của review | R3 | C3.1 | T2 |
| 2.4 | Đưa «độ chắc + bậc» từng căn lên Invest (C3.5 của review) và liên hệ người bán (nếu Mạnh chọn đưa lại) | ADR-0007 sửa đổi | Đợt 1 có số nền | T2 |
| 2.5 | G4 khai thác sau mua (P-B, comps giá đêm) | North star giai đoạn 4 «chưa có» | Dữ liệu S01 đã sẵn | T2 |

Các mục để sau, có chủ đích (ROADMAP đã ghi): A6, M5 pgvector, P-C advisor chat, G-2.5 pHash.

## 7. Câu Mạnh cần quyết

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| Q1 | Áp 037 + xoá `sessions` hôm nay theo runbook? (hồ sơ đã ký, chỉ còn bước chạy) | Có, ngay sau một lượt sync `leak gate PASS` |
| Q2 | Project Vercel cũ `app`: xoá hẳn hay chỉ tạm dừng? | Xoá: không còn gì trỏ tới, và bản đang chạy lộ tầng A |
| Q3 | Trong lúc chờ PL2 dọn mock: tạm đóng `/api/v1/deals` công khai? Và về lâu dài API này có nên công khai không, khi trang `/deals` đã vào `/ops`? | Đóng ngay (yêu cầu token ops); quyết công khai lại sau khi Invest có «độ chắc» (2.4) |
| Q4 | Tên nguồn S01/S04 và một bộ dữ liệu mở đang ghi trên Invest: thêm ngoại lệ «ghi công theo giấy phép» vào ADR-0007, hay đổi sang nhãn tầng C («Tự thu», «Địa giới mở»)? | Ngoại lệ hẹp cho ghi công S04 và bộ dữ liệu mở theo giấy phép; S01 đổi sang «Tự thu» |
| Q5 | Đợt 0 chạy trước, hay song song với PL1/PL2? Và review kiến trúc mở PR khi nào (đang chỉ có ở local, xung đột ROADMAP)? | Song song (khác file); mở PR review ngay để 0.9 và đợt 1 dựa trên đó |
| Q6 | Backup V1: cung cấp `BACKUP_DIR` + `BACKUP_PASS` (nợ cũ nhất)? | Có, trước khi chạy PL2 (ghi DB) |
| Q7 | data-api: deploy lại công khai, hay ghi rõ hoãn và gỡ khỏi CONTEXT-PRODUCT? | Hoãn tới sau đợt 1 (chưa có dữ liệu sạch để phục vụ) |
| Q8 | S05 (lỗi 402 khi khởi chạy actor từ 21/10): nạp lại credit, hay đưa về paused và sửa ROADMAP N2? | Paused cho tới khi đợt 1 có số nền S03, rồi đo giá trị biên của S05 |

## Phụ lục — lệnh đo chính

```bash
# Local (chỉ đọc)
docker exec one-invest-db psql -U oneinvest -d oneinvest -c "BEGIN READ ONLY; SELECT source, price_tier, count(*) FROM sale_offers GROUP BY 1,2; ROLLBACK;"
node scripts/check-freshness.mjs; echo "exit=$?"
bash scripts/audit-all.sh
launchctl list | grep -i oneinvest
docker inspect one-invest-db --format '{{.HostConfig.RestartPolicy.Name}} {{.State.StartedAt}}'
# Prod
curl -s -o /dev/null -w '%{http_code}\n' https://onehub-invest.vercel.app/vn/hanoi
curl -s https://onehub-invest.vercel.app/api/v1/deals | jq '.data | length'
# Supabase (execute_sql, chỉ SELECT)
#   SELECT relname, relrowsecurity, has_table_privilege('anon', oid, 'select') FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r','v');
#   SELECT count(*) FILTER (WHERE post_ids::text LIKE '%mock%') FROM sale_offers WHERE source = 'S03';
cd app && npm run lint:ui-report
gh api repos/phanlemanh/onehub-invest/branches/main/protection
```
