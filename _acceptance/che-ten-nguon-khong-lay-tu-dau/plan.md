# Kế hoạch thi công — che-ten-nguon-khong-lay-tu-dau (S2, 18/11/2026)

Hạng T3 → Cổng 1.5 (Mạnh duyệt kế hoạch trước khi viết mã). Mọi bước tuần tự, một nhánh, một worktree. Thử trước, sửa sau
(mỗi bước: viết ca đỏ trên mã cũ → sửa → ca xanh). Không tên nguồn thật trong mã, test, hồ sơ.

## B1 — Migration 112 (AC-1)

`db/migrations/112_source_registry_match_whole.sql`: `ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS match_whole boolean
NOT NULL DEFAULT false`, kèm chú thích. Không lên cloud (bảng không trong FILL). Ca: `pipeline/scripts/source-name-entries.itest.mjs`
áp hai lần trên DB thử `oneinvest_suite_cten`.

## B2 — Lõi hai bản chép (AC-2)

`nameVariants(realName, { wholeOnly } = {})`: `wholeOnly` → chỉ tên đủ + viết liền. `findSourceNames` đọc `entry.wholeOnly`.
Bản pipeline và bản app sửa cùng một chỗ. `mask-source-names.cases.json`: thêm khả năng ca mang `names` giả (đã có cho ca rỗng)
và cờ; ca mới nguồn giả S90 (thương hiệu giả, tên miền nhãn đầu là từ chung) ở bốn dạng + đối chứng cờ vắng/false. Hai bộ chạy
bảng ca (`pipeline/scripts/ops-nhan-ma-nguon.test.mjs`, `scripts/ops-nhan-ma-nguon.test.mjs`) đọc cờ từ ca; thêm so mọi ca cũ
với bản lõi của origin/main.

## B3 — Hàm nạp dùng chung (AC-3)

`pipeline/lib/source-name-entries.mjs` — `docSourceNameEntries(client)` → `[{ code, realName, wholeOnly }]` gồm tên thật và
từng định danh. Thiếu cột (mã 42703) → đọc lại không cột, cờ false. Thiếu bảng (42P01) → []. Lỗi khác → ném (đóng chặt).
Bản app: `docSourceNameEntries` của `app/src/lib/source-roles.ts` đổi theo cùng luật (thêm định danh + cờ).
`tier-a-guard.entriesFromTokens` nhận cả chuỗi trần (cũ) lẫn `{ token, wholeOnly }`.

## B4 — Đường rời máy trước (AC-4)

- `pipeline/sync-cloud.mjs`: token lấy qua hàm nạp (giữ tham số `sourceTokens` cho test, nhận cả dạng mới); `scanSourceNames`
  và **`maskedSourceExpr`** (che giá trị phía SQL — đặt NULL cột mang tên nguồn) dùng cờ: dòng khai `match_whole` không sinh
  biến thể từ đầu. Không sửa chỗ này thì mọi giá trị chứa thương hiệu S16 (tên dự án, người bán) bị đặt NULL khi lên cloud.
  Thiếu token vẫn dừng «không soát được, không gửi».
- `pipeline/push-ops-facts.mjs`: hai câu đọc tên → hàm nạp.
- `pipeline/do-hang-ngay.mjs`: danh sách chuỗi cấm lấy qua hàm nạp (cùng tập token); rỗng vẫn dừng.

## B5 — Chỗ hiển thị Ops (AC-4)

`app/src/lib/offers-public.ts` (`sourceEntries`) và `app/src/lib/collections-queries.ts` (`registryForJobs`) → `docSourceNameEntries`
của bản app. collections-queries nay che thêm định danh (hôm nay chỉ tên thật) — che rộng hơn, không hẹp hơn.

## B6 — Thước trong vùng (AC-4)

`scripts/quet-ten-nguon-html.mjs` (phần đọc DB) và `scripts/lib/ops-local.mjs` (chỉ chỗ dựng `names` cho nhãn job) → hàm nạp.
Bốn thước ngoài vùng giữ nguyên, kê Known limits.

## B7 — Ca hành vi và đo (AC-4, AC-5, AC-6, AC-9)

- `pipeline/scripts/source-name-entries.itest.mjs`: ma trận bảy chỗ × ba ca + đóng chặt ba đường rời máy (E3, E4b, E4c).
- `pipeline/scripts/soat-tang-a.test.mjs`: soát mã bảy tệp + leak gate trên tải giả (E4a).
- `discovery/do-ban-chep.mjs` (E5, E6): bản chép DB máy thu `oneinvest_u1_cten`, áp 112, đặt S16 từ tệp cục bộ GS cấp, đếm bằng
  hàm nạp + lõi mới; chỉ in số; checksum ba bảng máy thu trước/sau.
- `probes/khong-ten-that.mjs` (E9): dò mọi biến thể gập của tệp cục bộ trên hồ sơ, test, bảng ca, đầu ra lượt chấm.

## B8 — Hồ sơ áp máy thu (AC-7)

`ap-may-thu/`: README năm bước; sao lưu `pg_dump -t source_registry` ra `~/onehub-backups/db/`; lệnh áp (112 rồi
`UPDATE source_registry SET real_name=:ten, source_ids=:ids, match_whole=true WHERE code='S16'` với giá trị đọc từ tệp cục bộ,
không chép); `lui.sql` khôi phục dòng S16 từ bản sao lưu rồi bỏ cột; kiểm sau (/ops/registry, một lượt sync-cloud thử, ca cấy).

## Kiểm cuối trước khi xin chấm

`/verify` các module đổi (app: tsc + lint; pipeline: test; scripts: suite kiểu CI); bảy eval chạy tay xanh.
