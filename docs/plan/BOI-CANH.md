# Bối cảnh lộ trình — đọc trước khi mở vòng một hàng

> Chỉ mục DUY NHẤT trỏ tới căn cứ của mọi hàng trong `docs/plan/lo-trinh.json` (trang `LO-TRINH.html`). Tệp này
> **không chứa việc** (việc ở lộ trình) và **không chứa quyết định gốc** (quyết định ở ROADMAP §3, ADR, FRAMING) —
> nó chỉ nói *đọc gì, ở đâu, cho hàng nào*, cộng những ghi chú khảo sát chưa có chỗ nào khác giữ. Lập 23/10 ở lượt
> cắt chung (PR cắt lượt chung). Cập nhật khi cắt đợt mới hoặc khi một quyết định ở §2 được chốt.

## 0. Cách dùng khi mở vòng hàng `<mã>`

1. Đọc §1 (nền chung, 5 tệp) — một lần mỗi phiên.
2. Tra hàng ở §3 theo đợt (`dot` của hàng) → đọc đúng các mục nguồn liệt ở đó.
3. Tra §4 xem hàng có ghi chú bổ sung (tiêu chí khảo sát đã tìm ra mà chưa nằm trong câu giao).
4. Tra §2 xem hàng có bị chặn bởi quyết định chưa chốt không — chặn thì hỏi Mạnh ở Cổng Phạm vi, không tự quyết.
5. Việc của người liên quan (§5) không làm thay; nêu nó ở «Ra khỏi kho» nếu vòng cần nó.
6. **Dẫn nguồn** (Mạnh duyệt 24/10): contract của mọi hồ sơ có một dòng `Căn cứ:` ở `## Context` — đường dẫn tài
   liệu + mục + mã có tiền tố, ví dụ `Căn cứ: docs/architecture/classification-enrich-review.md §4 RV-Q1, §2 RV-L06`.
   Tiền tố: `RV-` = review phân loại + enrich (Q1–Q12, L01–L20, C/Z/M), `AU-` = audit 23/10 (Q1–Q8, mục 0.x/1.x),
   `FR-` = FRAMING (D1–D6, F1–F7). Lý do: Q1 của review và Q1 của audit là hai câu khác nhau; mã trần không tra ngược được.

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
(24/10, sửa đổi ADR-0007, ROADMAP §3 mục 14); **S08 chỉ nội bộ như nguồn hiệu chuẩn** (24/10, ROADMAP §3 mục 15).

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
| `ops-noi-that-2410` (ON1–ON21, ZC7, ZC8, OH1–OH3, OM1–OM2) | `pham-vi-ops-noi-that-2410.md` | Bản phạm vi (mỗi dòng `OPS-n` đã chép tệp:dòng của lỗi); báo cáo audit Ops prod 24/10 chỉ ở máy local của Mạnh (`side-session-notes/…/audit-ops-prod-2410/BAO-CAO.md` — có tên nguồn thật, ảnh trang Thu thập có tên nhóm: không chép, không gửi lên kênh); `_acceptance/ops-prod-sap-source-registry/` (khuôn `LocalOnlyAlert`, `freshnessLocalOnly()`, Ngoài-2/3); `_acceptance/slo-mot-nguon/` (Ngoài-3 fmtAge); `pipeline/push-ops-facts.mjs`; ADR-0007 sửa đổi 24/10; `.claude/rules/zalo-safety.md` (ON2, ON14); `docs/architecture/classification-enrich-review.md` §0.4 RV-M2, §4 RV-Q4 (ON21) |

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
| ON2 ↔ ON4, ON5, ON7 ↔ AU12, NT2, AU13 | Bảy hàng T3 chung `pipeline/push-ops-facts.mjs` — chạy liền nhau, không song song. Thứ tự đề xuất: AU13 → ON2 (tín hiệu an toàn sai hai chiều) → ON4/ON5 → ON7 (nhãn job S0x) → NT2 (bộ soát tầng A đỏ ngay nếu nhãn còn tên thật) → AU12 |
| ON7 ↔ ON3 | Chung `components/ops/collections/collections-tiles.tsx` (ô KPI) — ON7 sau ON3 hoặc chạy liền; ON7 còn chạm cùng tệp với ON5, ON6, ON8, ON9, ON10, ON12 |
| ON2, ON3, ON5, ON6, ON8, ON13 ↔ UI11 | Cùng `components/ops/collections/*` và `overview-tiles.tsx` — không song song; UI11 (Skeleton/Empty) đứng sau AU6 và nên sau ON3 |
| ON9, ON10, ON12, ON13 | Cùng `/ops/quality` (`quality-tables.tsx`, `lib/queries.ts`) — chạy liền; ON9 đổi `dq-truthful-coverage.mjs` thì chạy liền NT7 |
| ON8 ↔ ON3, ON5 | ON8 đổi `lib/freshness.ts` (fmtAge) cùng ON3 và chia ngày VN mà ON5 cần — mở ON8 trước ON5 |
| ON11 ↔ PL26, UI10 | Chung `app/src/lib/deals.ts` (PL26 thước phường × loại) và trang `/ops/deals` (UI10) — không song song. UI10 nhận thêm hai tiêu chí của OH2 (câu người bán tầng C, báo cắt danh sách) |
| ON12 ↔ UI1 | Tiêu đề `/ops/review` chạy sau hàng nóng `ops-review-sources-500-tren-cloud` của dot0 và phối với UI1 (cùng trang) |
| ON16 ↔ PL33, ON2 | Chung `scripts/audit-all.sh` với PL33 và `lib/ops-queries.ts` với ON2 — chạy liền |
| ON17 ↔ ZC7 | ON17 đọc tín hiệu lần thu của ZC7 (làn ZCode) — mở sau khi ZC7 merge |
| ON18 → ZC8 | ZC8 (importer S08, làn ZCode) chỉ giao sau khi ON18 merge và 040 đã áp ở DB local (§5) |
| ON19 ↔ PL12; ON21 ↔ PL18 | ON19 thêm trường vào sổ nhóm của PL12; ON21 chung `agent/src/agents/context-resolver.ts` với PL18 |
| AU12 | Nhận thêm tiêu chí của OH3: thiếu facts thì `/api/v1/ops/coverage` trả cờ «chỉ đo ở local», không rows rỗng câm |
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

## 6. Thứ tự đề xuất (không ràng buộc — Mạnh chọn khi mở vòng)

Giới hạn 3–4 phiên song song. Đường găng là việc gắn nhãn (§5) và các quyết định §2.

1. **Cầm máu** (song song, không chờ kiến trúc): việc của Mạnh §5 dòng 1–2 · AU1, AU2, AU3, AU7 · NT4 sau AU2.
2. **Sạch dữ liệu**: PL1 → PL2 (mọi đo lường sau đó mới có nghĩa).
3. **Một buổi quyết định**: ADR-0013 + Q2–Q12 + F1/F4/F7 + M1–M4 → mở khoá PL6 trở đi.
4. **Giao diện nhanh, không phụ thuộc** (chen giữa): UI1 (trước PL3), UI2, UI3, UI4, UI5, UI7.
5. **Phân loại theo lát**: đo (PL6–PL9) ∥ căn gốc OP1 (PL10–PL13) → nền bền (PL4, PL5, PL14–PL19) → người + hiển thị (PL3, PL20–PL23, PL27).
6. **Sau AU9**: UI8, UI9, ZC5 → NT7.
7. **Đóng sổ**: UI17 sau mọi hàng giao diện.
8. **Ops nói thật** (`ops-noi-that-2410`, chen được vào bước 1): ON2 (lockdown) và ON14 (gỡ tài khoản) trước — tín hiệu
   an toàn Zalo; rồi ON3 → ON8 → ON7 (ô KPI, giờ, nhãn S0x) theo §4; ON19 → ON20 → ON21 sau PL12.

## 7. Hoãn có chủ đích (không cắt)

A6 advisor/compaction · M5 pgvector · P-C advisor chat · G-2.5 pHash ảnh (audit §6). Code ReUI Pro trên repo
public: Mạnh hoãn quyết — không đề xuất sửa `tools/sync-public.sh` (rủi ro ghi nhận ở khảo sát nền 23/10).
