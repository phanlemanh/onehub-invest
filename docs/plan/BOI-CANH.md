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
cần ký, T3 phải ký); branch protection main (gate + ui-lint).

**Còn chờ Mạnh** — và hàng nó chặn:

| Câu | Nguồn | Chặn |
|---|---|---|
| ADR-0013 kiến trúc «tin → căn» (≈ review Q2, Q3, Q4) | PR #27 · review §4 | PL14–PL18, PL24 |
| Review Q5, Q9, Q10, Q11 (§0.2 F đề xuất trả lời từ nguyên lý) | review §4, §0.2 F | PL21, PL3/PL23, PL26 |
| Review Q7 subtype, Q8 tìm mua/thuê | review §4 | PL6 (từ vựng), PH5, SH12 |
| F1 lát đầu = Vinhomes Ocean Park 1 (đề xuất) · F4 độ tươi · F7 giờ công giữ bậc | review §0.3 | PL10–PL13, PL20, PL22 |
| M1–M4 lớp model | review §0.4 | PH4, PL29–PL31 |
| Audit Q1–Q8 (áp 037, xoá project `app`, khoá deals, tên S01/S04, BACKUP_*, data-api, S05) | `docs/audit/2026-10-23-hien-trang-va-lo-trinh.md` | AU2, AH1, AH2, SH2, §5 |
| Tên nhóm Zalo / tên tài khoản thu: tầng A hay C | khảo sát nền 23/10 | NT2, AH2 |
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
| Lint | Baseline 82 vi phạm / 19 tệp (đo 23/10); ROADMAP Track 6 còn ghi 85 — AU8 sửa |

## 5. Ra khỏi kho — việc của người (không thành hàng; luật kit 17/10, ADR 0026)

| Việc | Ai | Sau / mở khoá |
|---|---|---|
| Áp 037 lên Supabase theo runbook → `check-supabase-lock.sh cloud` → `DELETE FROM sessions` (audit Q1) | Mạnh | đã merge PR #20; trước AU1 |
| Xoá/dừng project Vercel `app` cũ (audit Q2) | Mạnh | ngay |
| Cấp `BACKUP_DIR` + `BACKUP_PASS` (audit Q6) | Mạnh | mở AH1 |
| S05: nạp credit Apify hay chuyển paused (audit Q8) | Mạnh | — |
| Quyết data-api deploy hay hoãn (audit Q7) | Mạnh | mở AH2 |
| Tuỳ chọn: chuyển khoá Supabase publishable/secret, đổi mật khẩu người dùng duy nhất | Mạnh | sau áp 037 |
| Dọn tồn đọng F6: hoàn tác 639/644 (đã dry-run, chờ «chạy revert» ở phiên liên làn), bác thẻ 159/161, áp lại quyết định ghép căn `ops_audit` 4 | Mạnh (+ phiên liên làn) | trước đợt phân loại |
| Gắn nhãn G1/G2 (~400 tin), G3 (150 cặp), G0 (400 tin cổng) cho lát | Mạnh + đội nhãn | sau PL7; mở PH2, PH3 |
| Chẩn đoán + khôi phục heartbeat tài khoản S03 thứ hai; quét lại QR nếu phiên hết | ZCode / Mạnh | — |
| Triển khai sau merge: cài plist collector API (sau ZC2, ZC4) · cài job airbnb nightly (sau ZC5) · cài hook Kev vào `~/.openclaw` (sau PL4) | ZCode qua lời giao liên làn | merge ≠ đang chạy |
| Áp migration mới lên DB local sau mỗi merge có `db/migrations/` (sổ `SO-MIGRATION.md`) | phiên liên làn | trước lượt nạp đêm kế |
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

## 7. Hoãn có chủ đích (không cắt)

A6 advisor/compaction · M5 pgvector · P-C advisor chat · G-2.5 pHash ảnh (audit §6). Code ReUI Pro trên repo
public: Mạnh hoãn quyết — không đề xuất sửa `tools/sync-public.sh` (rủi ro ghi nhận ở khảo sát nền 23/10).
