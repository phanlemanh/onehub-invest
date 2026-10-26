# Bối cảnh lộ trình — đọc trước khi mở vòng một hàng

> Chỉ mục DUY NHẤT trỏ tới căn cứ của mọi hàng trong `docs/plan/lo-trinh.json` (trang `LO-TRINH.html`). Tệp này
> **không chứa việc** (việc ở lộ trình) và **không chứa quyết định gốc** (quyết định ở ROADMAP §3, ADR, FRAMING) —
> nó chỉ nói *đọc gì, ở đâu, cho hàng nào*, cộng những ghi chú khảo sát chưa có chỗ nào khác giữ. Lập 23/10 ở lượt
> cắt chung (PR cắt lượt chung). Cập nhật khi cắt đợt mới hoặc khi một quyết định ở §2 được chốt.

## 0. Cách dùng khi mở vòng hàng `<mã>`

> Từ 26/10 nguồn của mỗi bản phạm vi là trang đợt trong kho tri thức riêng `onehub-invest-tri-thuc` (khoá `nguon` = đường
> trỏ băm; ô mở việc tự ghi dòng «Nguồn:»). Bảng §3 dưới giữ làm chỉ mục đọc nhanh; nội dung tóm và tài liệu thô ghim băm
> ở kho riêng — máy không có bản clone thì `git clone https://github.com/phanlemanh/onehub-invest-tri-thuc.git ~/dev/onehub-invest-tri-thuc`.

1. Đọc §1 (nền chung, 5 tệp) — một lần mỗi phiên.
2. Tra hàng ở §3 theo đợt (`dot` của hàng) → đọc đúng các mục nguồn liệt ở đó.
3. Tra §4 xem hàng có ghi chú bổ sung (tiêu chí khảo sát đã tìm ra mà chưa nằm trong câu giao).
4. Tra §2 xem hàng có bị chặn bởi quyết định chưa chốt không — chặn thì hỏi Mạnh ở Cổng Phạm vi, không tự quyết.
5. Việc của người liên quan (§5) không làm thay; nêu nó ở «Ra khỏi kho» nếu vòng cần nó.
6. **Dẫn nguồn** (Mạnh duyệt 24/10): contract của mọi hồ sơ có một dòng `Căn cứ:` ở `## Context` — đường dẫn tài
   liệu + mục + mã có tiền tố, ví dụ `Căn cứ: docs/architecture/classification-enrich-review.md §4 RV-Q1, §2 RV-L06`.
   Tiền tố: `RV-` = review phân loại + enrich (Q1–Q12, L01–L20, C/Z/M), `AU-` = audit 23/10 (Q1–Q8, mục 0.x/1.x),
   `FR-` = FRAMING (D1–D6, F1–F7). `TVD-` = tài liệu Ops tự vận hành `docs/research/ops-tu-van-hanh-nguon-saas.md` (G1–G6, X1–X17, quyết định
   §4.8 #1–#8) — G1–G6 của tài liệu này khác G1–G6 của audit Ops 24/10. Lý do: Q1 của review và Q1 của audit là hai câu khác nhau; mã trần không tra ngược được.

## 1. Nền chung (mọi hàng)

| Chủ đề | Tệp có thẩm quyền |
|---|---|
| Mục đích, mục tiêu, thước đo, thang bậc B0–B5 / N0–N4 | `docs/product/FRAMING.md` |
| Bối cảnh sản phẩm một trang (người dùng, hai cổng, nguồn, SPL) | `docs/product/CONTEXT-PRODUCT.md` |
| Từ vựng chuẩn: nhãn UI, tên code, slug URL | `CONTEXT.md` |
| Hiến pháp kỹ thuật + quyết định đã chốt + «mỗi loại thông tin một chỗ» | `docs/ROADMAP.md` §0, §1, §3 · `AGENTS.md` |
| Luật theo đường dẫn (migration, cổng UI, PII/SPL, an toàn Zalo) | `.claude/rules/` |

## 2. Quyết định — đã chốt / còn chờ

**Đã chốt** (không hỏi lại): ROADMAP §3; FRAMING D1–D5 + thang bậc; review Q1 (Kev thành nhãn), F2, F3, F5, F6 thứ
tự; luật người bán trên tin rao = tầng C (PR #19, ADR-0007 sửa đổi); URL tiếng Anh toàn bộ; bản đồ đích Invest
(PR #6: block đích, app-shell-30, `/dau-tu` → `/yield`, mapcn); làn merge (≤3–4 phiên, T1/T2 máy-thông merge không
cần ký, T3 phải ký); branch protection main (gate + ui-lint); **tên nhóm S03 là tầng C, tên nguồn thật vẫn tầng A**
(24/10, sửa đổi ADR-0007, ROADMAP §3 mục 14); **S08 chỉ nội bộ như nguồn hiệu chuẩn** (24/10, ROADMAP §3 mục 15); **Ops trên cloud đọc số tổng hợp máy local tính
sẵn** (24/10, «Chọn A» cho câu «dashboard Ops trên prod không có dữ liệu vì dữ liệu tính số chỉ ở local» — ADR-0014,
ROADMAP §3 mục 16; loại B sync bản gọt và C tunnel; mở khoá ON22 → ON23, ON3, ON4, ON5, AU12; ON2 lockdown local tách ra chạy trước — Mạnh 24/10). **Ops tự vận hành kiểu SaaS** (25/10, ROADMAP §3 mục 18): đội làm từ xa
qua cloud bằng lệnh kéo một chiều; nội dung bài/ảnh/thẻ duyệt lên cloud cho vai ops, tên nguồn thật chỉ ở máy thu;
tám quyết định TVD-§4.8 (TV14 dùng model local — trả lời RV-M2 cho phần quy định ngữ cảnh; phần tiêu đề/mô tả của ON21
vẫn theo dòng RV-M2 dưới).

**Còn chờ Mạnh** — và hàng nó chặn:

| Câu | Nguồn | Chặn |
|---|---|---|
| ADR-0013 kiến trúc «tin → căn» (≈ review Q2, Q3, Q4) | PR #27 · review §4 | PL14–PL18, PL24 |
| Review Q5, Q9, Q10, Q11 (§0.2 F đề xuất trả lời từ nguyên lý) | review §4, §0.2 F | PL21, PL3/PL23, PL26 |
| Review Q7 subtype, Q8 tìm mua/thuê | review §4 | PL6 (từ vựng), PH5, SH12 |
| F1 lát đầu = Vinhomes Ocean Park 1 (đề xuất) · F4 độ tươi · F7 giờ công giữ bậc | review §0.3 | PL10–PL13, PL20, PL22 |
| M1–M4 lớp model | review §0.4 | PH4, PL29–PL31 |
| Audit Q1–Q8 (áp 037, xoá project `app`, khoá deals, tên S01/S04, BACKUP_*, data-api, S05) | `docs/audit/2026-10-23-hien-trang-va-lo-trinh.md` | AU2, AH1, AH2, SH2, §5 |
| Tên tài khoản thu: tầng A hay C (tên nhóm đã chốt C ngày 24/10) | khảo sát nền 23/10 | NT2, AH2 |
| RV-M2: tiêu đề/mô tả nhóm có được gửi model cloud | review §0.4 | ON21 |
| Sửa 012/031: ngoại lệ sửa migration đã commit hay baseline mới | `.claude/rules/migrations.md` | NT5 |
| Liên hệ người bán lên Invest (NĐ 13/2023) | ADR-0007 sửa đổi | SH1, SH3 |

## 3. Nguồn theo đợt

| Đợt | Bản phạm vi | Đọc trước khi mở vòng |
|---|---|---|
| `phan-loai-2310` (PL1–PL31, PH1–PH6) | `pham-vi-phan-loai-2310.md` | `docs/architecture/classification-enrich-review.md` §0–§0.4 (nguyên lý gốc, lát dọc, F1–F7, lớp model), §2 sổ lỗi theo mã L, §3 kiến trúc đích, §5 mã việc C/Z/M; ADR-0011 RESO-first; `docs/research/reso-standards.md`; PR #27 ADR-0013 khi đã merge |
| `cam-mau-2310` (AU1–AU12, AH1–AH2) | `pham-vi-cam-mau-2310.md` | audit 23/10 §3 hiện trạng, §4 rủi ro, §6 Đợt 0/1; `docs/ops/runtime-map.md`; `docs/ops/supabase-lock-anon-rls.md`; `docs/ops/cloud-sync-atomic.md` |
| `giao-dien-2310` (UI1–UI17, UH1–UH7) | `pham-vi-giao-dien-2310.md` | `.claude/skills/onehub-ui/` (SKILL, `routes.md` cột Block đích + Slug đích, `catalog.md`, `loop.md`, `data-color.md`, `copy-vi.md`); skill `reui`; `docs/architecture/invest-portal-ia.md`, `portals.md`; `_acceptance/invest-target-map/`; `docs/research/ui-baseline-2026-10.md` |
| `nen-tang-2310` (NT1–NT7, NH1–NH4) | `pham-vi-nen-tang-2310.md` | audit 23/10; `_acceptance/cloud-sync-atomic/` (Ngoài-4/5), `_acceptance/enrich-qua-de-xuat/` (Ngoài-4/7/8/9), `_acceptance/enrich-hau-ky/`, `_acceptance/ruler-p2-views-migration/` (Known limits 012/031); `pipeline/sync-cloud.mjs`, `pipeline/push-ops-facts.mjs`; ADR-0007 |
| `zcode-2310` (ZC1–ZC5, ZH1–ZH2) | `pham-vi-zcode-2310.md` | `collector/AGENTS.md`, `collector/docs/DATA-CONTRACT.md`; `docs/ops/runtime-map.md`; `docs/superpowers/plans/2026-10-21-coverage-worklist.md`; BOARD `~/dev/onehub-coord/BOARD.md`; kênh issue #9 — lời giao qua phiên điều phối liên làn |
| `san-pham-sau-2310` (SH1–SH14) | `pham-vi-san-pham-sau-2310.md` | ROADMAP §4 Track 1–4 (lịch sử); FRAMING §7 câu mở; review §4 Q8 |
| `bo-sung-2310` (ZC6, AU13, PL32, PL33) | `pham-vi-bo-sung-2310.md` | ZC6: `collector/AGENTS.md`, `collector/openclaw/handler.js`, `_acceptance/collector-graceful-shutdown/` (d-3 sai), `.claude/rules/zalo-safety.md` · AU13: `_acceptance/job-bao-loi-that/` (`scripts/lib/job-step.sh`), `scripts/cloud-sync.sh`, `pipeline/push-ops-facts.mjs` · PL32/PL33: hồ sơ `kev-thanh-nhan` (nhánh `claude/acceptance-kev-nhan`), `pipeline/backfill-zalo-media.mjs`, `scripts/audit-all.sh` |
| `ops-noi-that-2410` (ON1–ON22, ZC7, ZC8, OH1–OH3, OM1–OM2) | `pham-vi-ops-noi-that-2410.md` | `docs/adr/0014-ops-cloud-doc-so-tong-hop.md` (bảng trang → nguồn số, ngưỡng trễ 45′ — ON2–ON5, ON22, AU12); bản phạm vi (mỗi dòng `OPS-n` đã chép tệp:dòng của lỗi); báo cáo audit Ops prod 24/10 chỉ ở máy local của Mạnh (`side-session-notes/…/audit-ops-prod-2410/BAO-CAO.md` — có tên nguồn thật, ảnh trang Thu thập có tên nhóm: không chép, không gửi lên kênh); `_acceptance/ops-prod-sap-source-registry/` (khuôn `LocalOnlyAlert`, `freshnessLocalOnly()`, Ngoài-2/3); `_acceptance/slo-mot-nguon/` (Ngoài-3 fmtAge); `pipeline/push-ops-facts.mjs`; ADR-0007 sửa đổi 24/10; `.claude/rules/zalo-safety.md` (ON2, ON14); `docs/architecture/classification-enrich-review.md` §0.4 RV-M2, §4 RV-Q4 (ON21) |
| `tu-van-hanh-2510` (TV0–TV15, TVN1, TVN2, TV17 chờ; mốc TVM1–TVM3) | `pham-vi-tu-van-hanh-2510.md` | **Chung mọi hàng**: `docs/research/ops-tu-van-hanh-nguon-saas.md` §1 (bài toán, tiêu chí), §3.1 (lệnh kéo một chiều), §3.7 (ranh giới tầng A), §4.8 (quyết định), §5 (đối chiếu X1–X17); ADR-0014; ADR-0007 + sửa đổi; `docs/ops/runtime-map.md`; `docs/architecture/portals.md` (clearance, IA Ops). **Theo hàng** — TV0: §3.1, §3.7, §5.5, `CONTEXT.md` · TV1: §2.3 (quyền, nhật ký), §2.4 G3, §3.5, `app/src/lib/ops-access.ts`, `app/src/lib/api-surface.ts`, `db/migrations/018_ops_audit.sql` · TV2a, TV2b, TVN2, TV15: §2.1, §2.4 G1, §3.3, §3.4, runtime-map «Job đêm báo lỗi thật», `collector/AGENTS.md` · TV3a, TV3b, TV6, TVN1: §2.4 G6, §3.6, `.claude/rules/zalo-safety.md`, `scripts/zalo-watchdog.sh`, `_acceptance/nhom-moi-requiremention/` · TV4, TV4b, TV5, TV7, TV8: §3.1–§3.5, ADR-0015 (khi TV0 xong), `pipeline/push-ops-facts.mjs`, `pipeline/cron/` · TV9, TV10: §3.7, §3.8, §4.8 #3, `pipeline/sync-cloud.mjs` (`CLOUD_ALLOW`, `piiColumnLeaks`), `pipeline/lib/tier-a-guard.mjs`, runtime-map hai mục leak gate · TV11, TV12: §2.3 (độ phủ), §3.2 `market_coverage`, `CONTEXT.md` «Thị trường» · TV13, TV13b, TV13c: §3.8, `docs/research/hitl-review-queue.md`, `db/migrations/029_review_queue.sql` · TV14: §1.2, §3.2 `context_rules`, `docs/architecture/classification-enrich-review.md` §0.4 RV-M2, §4 RV-Q4, `collector/openclaw/handler.js`. PL12, ON20 (câu giao đã sửa 25/10): TVD-X1, TVD-X2 |

## 4. Ghi chú bổ sung khi mở vòng (khảo sát 23/10, chưa nằm trong câu giao)

| Hàng | Ghi chú |
|---|---|
| AU1 | Ba quan hệ PostGIS do `supabase_admin` làm chủ vẫn để anon đọc (Known limit của 037) — leak gate phải chừa chúng, không thì đỏ mãi |
| AU3 ↔ ZC3 | Ranh giới: AU3 = job pipeline/cron làn Claude báo lỗi thật; ZC3 = collector/hook/watchdog làn ZCode. Lớp L5b + P1.5 trên `zcode/audit-p1-resilience` là đầu vào cho AU3 |
| AU12 ↔ NT2 | Cùng `push-ops-facts.mjs` — chạy liền nhau, không song song |
| AH2 | Khi mở: thêm tiêu chí an toàn data-api trước deploy — khoá API chặn khi thiếu `DATA_API_KEYS` (`middleware/auth.ts`), bỏ JOIN `stg_zalo_posts` và các trường `senderName/groupName/mediaPath/postText` (`routes/deals.ts`), không đọc bảng `airdna_*`/S02 (ADR-0009), soát CORS `*` |
| PL3 | Known limits của `review-card-photos` + `review-media-backend`: ảnh local chưa từng hiện trên trang thật (0 dòng `media_files`), «Ảnh hỏng» mới chứng ở jsdom, loader không kiểm tệp có thật (tệp xoá → 404 thay vì về URL gốc). Chạy SAU UI1 (cùng `review-card.tsx`) |
| PL14, PL16 | Ca hồi quy Ngoài-4 enrich: thẻ chờ không dựng lại căn cứ khi tin chuyển sang offer kế (`_acceptance/enrich-hau-ky/contract.md`) |
| PL15 | 34 trace LLM đã ghi thẳng vào `sale_offers` (enrich-qua-de-xuat Out of scope) — tiêu chí «xoá rồi dựng lại canonical» phải gỡ giá trị không có phát biểu đỡ |
| PL4, ZC1 | Cùng nhánh `zcode/kev-nhan` được, hồ sơ tách slug (`kev-thanh-nhan`, `sourceid-tin-anh`) |
| ZC2 | Hồ sơ đã có trên nhánh `claude/acceptance-collector-graceful-shutdown-942e1d` (vòng 2 REJECT); có Known limits → Mạnh ký |
| UI1 | Sửa `routes.md` dòng `/ops/review`: lọc theo loại thẻ/bậc, bỏ «theo độ tin» (trái PL3) |
| UI4 | Hàng đầu tiên thêm redirect 301 vào `next.config.ts` — mẫu cho UI2, UI3 |
| UI6/UI8/UI9 | Hàng bản đồ chạy đầu tiên khai registry `@mapcn` trong `components.json` (chưa có) |
| ZC6 ↔ ZC4 | ZC6 (hook spool gửi lại) phải merge TRƯỚC ZC4: chuyển collector API sang launchd là một lần restart |
| AU13 ↔ NT2, AU12, AU1 | Chung `push-ops-facts.mjs` (NT2, AU12) và gần `cloud-sync.sh`/`sync-cloud.mjs` (AU1) — chạy liền nhau, không song song |
| PL32 | Merge trước hoặc cùng lúc triển khai hook Kev vào `~/.openclaw` (§5) — không thì media backfill bỏ qua snapshot v3 |
| PL33 ↔ AU5 | Chung `scripts/audit-all.sh` — mở PL33 sau khi AU5 merge |
| PL5 | Thêm tiêu chí đo dung lượng + thời gian transform-zalo/sync khi Zalo phình ×3 (mục chờ KH-KV3) |
| PL4 (`kev-thanh-nhan`) | Căn cứ bổ sung (hồ sơ đã ký chỉ ghi «Q1»): `classification-enrich-review.md` §4 RV-Q1, §2 RV-L06, §5 RV-Z1 + RV-C1.1 |
| ZC1 (`sourceid-tin-anh`) | Căn cứ bổ sung (hồ sơ đã ký chỉ ghi «L20»): `classification-enrich-review.md` §6 RV-L20 |
| ON22 → ON23, ON3, ON4, ON5, AU12 · ON2 trước | **Ràng buộc (ADR-0014)**: hàng nền ON22 (push-ops-facts đẩy số tổng hợp) merge TRƯỚC mọi hàng trang đọc số trên cloud; ON22 đứng trên NT2 (số đi qua bộ soát tầng A). ON9, ON10 không đứng trên ON22 — `dq_check_results`, `area_sources`, `ref_calib_*` đã sync |
| ON22, ON2, ON4, ON5, ON7 ↔ AU12, NT2, AU13 | Tám hàng T3 chung `pipeline/push-ops-facts.mjs` — chạy liền nhau, không song song. Thứ tự (từ ADR-0014): AU13 → ON7 (nhãn job S0x) → NT2 (bộ soát tầng A đỏ ngay nếu nhãn còn tên thật) → ON22 → ON2 (tín hiệu an toàn sai hai chiều) → ON4/ON5 → AU12 |
| ON7 ↔ ON3 | Chung `components/ops/collections/collections-tiles.tsx` (ô KPI) — từ ADR-0014 ON7 đi trước ON3 (ON3 đứng trên ON22 → NT2 → ON7), chạy liền; ON7 còn chạm cùng tệp với ON5, ON6, ON8, ON9, ON10, ON12 |
| ON2, ON3, ON5, ON6, ON8, ON13 ↔ UI11 | Cùng `components/ops/collections/*` và `overview-tiles.tsx` — không song song; UI11 (Skeleton/Empty) đứng sau AU6 và nên sau ON3 |
| ON9, ON10, ON12, ON13 | Cùng `/ops/quality` (`quality-tables.tsx`, `lib/queries.ts`) — chạy liền; ON9 đổi `dq-truthful-coverage.mjs` thì chạy liền NT7 |
| ON8 ↔ ON3, ON5 | ON8 đổi `lib/freshness.ts` (fmtAge) cùng ON3 và chia ngày VN mà ON5 cần — mở ON8 trước ON5 |
| ON11 ↔ PL26, UI10 | Chung `app/src/lib/deals.ts` (PL26 thước phường × loại) và trang `/ops/deals` (UI10) — không song song. UI10 nhận thêm hai tiêu chí của OH2 (câu người bán tầng C, báo cắt danh sách) |
| ON12 ↔ UI1 | Tiêu đề `/ops/review` chạy sau hàng nóng `ops-review-sources-500-tren-cloud` của dot0 và phối với UI1 (cùng trang) |
| ON16 ↔ PL33, ON2 | Chung `scripts/audit-all.sh` với PL33 và `lib/ops-queries.ts` với ON2 — chạy liền |
| ON17 ↔ ZC7 | ON17 đọc tín hiệu lần thu của ZC7 (làn ZCode) — mở sau khi ZC7 merge |
| ON18 → ZC8 | ZC8 (importer S08, làn ZCode) chỉ giao sau khi ON18 merge và 040 đã áp ở DB local (§5) |
| ON19 ↔ PL12; ON21 ↔ PL18 | ON19 thêm trường vào sổ nhóm của PL12; ON21 chung `agent/src/agents/context-resolver.ts` với PL18 |
| AU12 | Nhận thêm tiêu chí của OH3: thiếu facts thì `/api/v1/ops/coverage` trả cờ «chỉ đo ở local», không rows rỗng câm. Từ ADR-0014: route đọc khối độ tươi của ON22 (không sync bản registry gọt); facts cũ quá 45′ trả cờ stale |
| ON3 ↔ ON2, ON4, ON5 | ON3 dựng một lần dòng «Số đo lúc HH:MM (giờ VN) từ máy local» và Alert «Máy local không đẩy số từ …» (ADR-0014); ON2, ON4, ON5 dùng lại. ON3 còn nhận «N thẻ đang chờ» trên `/ops/review` cloud (QD2a) |
| TV2b ↔ AU3, PL1 | Cùng ba tệp `scripts/*-daily.sh` với `zcode/au3-nap-bao-loi` và `zcode/importer-bo-qua-du-lieu-thu` — mở sau khi cả hai merge; bước đầu của TV2b là lời giao `claudedp-2510-4` (S05 bỏ qua khi paused) — liên làn 25/10 |
| TVN2 ↔ AU3 | Tách tệp con trỏ trên nền khoá mkdir quanh `apify-daily.state` mà AU3 thêm |
| TV3b ↔ ON2 | Cùng `scripts/zalo-watchdog.sh` với nhánh `zcode/watchdog-l4b-history` (lời giao 2410-15) — mở sau khi nhánh đó merge; danh sách lớp chuẩn phải khớp bảng lockdown của ON2/ON23 |
| TV4 ↔ ON22…AU13 | Thêm TV4 vào chuỗi «chạy liền nhau» của `pipeline/push-ops-facts.mjs` (t3_paths) |
| TV7 ↔ ZC4, ZC5 | Cùng `pipeline/cron/*.plist` và `install-*`; TV16 (S08 ≤ 1 lần/tuần) là một preset của TV7, không thuộc ZC8 |
| TV9 ↔ ZC4, AU3 | Ảnh S03 cần collector API chạy thật dưới launchd (ZC4); ZC4 chờ AU3 merge (snapshot Zalo có mili-giây). Đổi `CLOUD_ALLOW` và luật «bảng tầng A trên cloud phải rỗng» cùng hàng, không nới tay |
| TV13 ↔ NT2 | Leak gate hiện chặn `review_queue` có dòng trên cloud — TV13 đổi luật đó trong cùng hàng; OH1 (chân trời) đóng khi TV13 giao |
| TV14 ↔ ZC7 | Nếu raw ghi `meta.rule_version`: gộp vào lần tăng `SNAPSHOT_SCHEMA_VERSION` kế tiếp (hằng chung mọi nguồn; v4 = S08, v5 = ZC7) — không tăng riêng. Phần hook sau lời giao `claudedp-2410-23` |
| TV7, ZC7 | `job_runs` theo định nghĩa «lần thu» của ZC7 — S03 chưa chốt (đẩy qua hook, không có lượt kéo); đừng khoá trước |
| UH7 ↔ TV4 | `/ops/console` (chân trời) mở lại bằng TV4 — TVD-X4 |
| UI13 ↔ TV1 | Trang `/ops/audit` nên mở sau TV1, không thì cột người làm là hằng số — TVD-X5 |
| Lint | Baseline 82 vi phạm / 19 tệp (đo 23/10); ROADMAP Track 6 còn ghi 85 — AU8 sửa |

## 5. Ra khỏi kho — việc của người (không thành hàng; luật kit 17/10, ADR 0026)

| Việc | Ai | Sau / mở khoá |
|---|---|---|
| Áp 037 lên Supabase theo runbook → `check-supabase-lock.sh cloud` → `DELETE FROM sessions` (audit Q1) | Mạnh | đã merge PR #20; trước AU1 |
| ~~Xoá/dừng project Vercel `app` cũ (audit Q2)~~ — Mạnh đã xoá 24/10 (ROADMAP V9) | Mạnh | xong |
| Cấp `BACKUP_DIR` + `BACKUP_PASS` (audit Q6) | Mạnh | mở AH1 |
| S05: nạp credit Apify hay chuyển paused (audit Q8) | Mạnh | — |
| Quyết data-api deploy hay hoãn (audit Q7) | Mạnh | mở AH2 |
| Tuỳ chọn: chuyển khoá Supabase publishable/secret, đổi mật khẩu người dùng duy nhất | Mạnh | sau áp 037 |
| Dọn tồn đọng F6: hoàn tác 639/644 (đã dry-run, chờ «chạy revert» ở phiên liên làn), bác thẻ 159/161, áp lại quyết định ghép căn `ops_audit` 4 | Mạnh (+ phiên liên làn) | trước đợt phân loại |
| Gắn nhãn G1/G2 (~400 tin), G3 (150 cặp), G0 (400 tin cổng) cho lát | Mạnh + đội nhãn | sau PL7; mở PH2, PH3 |
| Chẩn đoán + khôi phục heartbeat tài khoản S03 thứ hai; quét lại QR nếu phiên hết | ZCode / Mạnh | — |
| Triển khai sau merge: cài plist collector API (sau ZC2, ZC4) · cài job airbnb nightly (sau ZC5) · cài hook Kev vào `~/.openclaw` (sau PL4) | ZCode qua lời giao liên làn | merge ≠ đang chạy |
| Áp migration mới lên DB local sau mỗi merge có `db/migrations/` (sổ `SO-MIGRATION.md`) | phiên liên làn | trước lượt nạp đêm kế |
| Đăng ký S08 vào `source_registry` ở DB local — tên miền thật chỉ ở DB (mốc OM1) | phiên liên làn (Mạnh duyệt) | trước ZC8 |
| Đặt tiêu đề chuẩn + viết mô tả cho các nhóm đang thu (mốc OM2) | Người vận hành (Mạnh) | sau ON20; trước khi ON21 có giá trị thật |
| Đẩy nhánh `zcode/*` chỉ có ở local, dọn ~45 nhánh đã merge | ZCode + phiên làn merge | — |
| Xác nhận 037 bằng `node pipeline/sync-cloud.mjs --kiem-anon` sạch | phiên làn merge / Mạnh | mở TV9 (mốc TVM2) |
| Tạo bucket ảnh riêng tư trên Supabase; cấp token máy `ops:pull` | Mạnh | trước TV9; trước TV4 |
| Tạo tài khoản vai `ops`/`admin` thật; chỉ định trưởng vận hành | Mạnh | trước mốc TVM1 |
| Khởi động lại app Ops trên máy thu để #77 (`nhom-moi-requiremention`) có hiệu lực | Mạnh / phiên làn merge | ngay |
| Chủ tài khoản thu quét QR tại máy thu khi mất phiên (QR không lên cloud — TVD-§4.8 #2) | chủ tài khoản | theo sự kiện |

## 6. Thứ tự đề xuất (không ràng buộc — Mạnh chọn khi mở vòng)

Giới hạn 3–4 phiên song song. Đường găng là việc gắn nhãn (§5) và các quyết định §2.

1. **Cầm máu** (song song, không chờ kiến trúc): việc của Mạnh §5 dòng 1–2 · AU1, AU2, AU3, AU7 · NT4 sau AU2.
2. **Sạch dữ liệu**: PL1 → PL2 (mọi đo lường sau đó mới có nghĩa).
3. **Một buổi quyết định**: ADR-0013 + Q2–Q12 + F1/F4/F7 + M1–M4 → mở khoá PL6 trở đi.
4. **Giao diện nhanh, không phụ thuộc** (chen giữa): UI1 (trước PL3), UI2, UI3, UI4, UI5, UI7.
5. **Phân loại theo lát**: đo (PL6–PL9) ∥ căn gốc OP1 (PL10–PL13) → nền bền (PL4, PL5, PL14–PL19) → người + hiển thị (PL3, PL20–PL23, PL27).
6. **Sau AU9**: UI8, UI9, ZC5 → NT7.
7. **Đóng sổ**: UI17 sau mọi hàng giao diện.
8. **Ops nói thật** (`ops-noi-that-2410`, chen được vào bước 1): ON14 (gỡ tài khoản) trước — tín hiệu an toàn Zalo;
   chuỗi số trên cloud theo ADR-0014: ON2 (lockdown local, chạy trước) · AU13 → ON7 → NT2 → ON22 → ON23 (lockdown cloud) → ON3 → ON4/ON5 → AU12, ON8 trước ON5
   (§4); ON19 → ON20 → ON21 sau PL12.
9. **Tự vận hành** (`tu-van-hanh-2510`, ROADMAP §3 mục 18): TV0 chạy ngay (chỉ tài liệu) · mốc TVM1 (TV1 sau NT4,
   TV2a → TV2b sau AU3 + PL1, TV4 → TV4b → TV5 sau PL12) chen sau các hàng đợt 0 còn dở · TV11 song song TVM1 · TVM2
   khi `--kiem-anon` sạch và ZC4 chạy thật · TVM3 sau ON2, ZC4, ZC5, ZC7, PL3. Không mở dãy thứ năm — hàng TV nối vào
   P2/P3/P4 khi chuỗi hiện tại hết (phiên Điều phối 25/10).

## 7. Hoãn có chủ đích (không cắt)

A6 advisor/compaction · M5 pgvector · P-C advisor chat · G-2.5 pHash ảnh (audit §6). Code ReUI Pro trên repo
public: Mạnh hoãn quyết — không đề xuất sửa `tools/sync-public.sh` (rủi ro ghi nhận ở khảo sát nền 23/10).
