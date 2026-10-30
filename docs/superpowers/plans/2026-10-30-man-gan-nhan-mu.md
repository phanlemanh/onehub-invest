# Kế hoạch thi công — man-gan-nhan-mu (PL7, T3)

> For agentic workers: thực thi tuần tự trong vòng chính (superpowers:executing-plans). Mỗi task xong phải chạy lệnh
> kiểm của task và lượt phá-thử của phép đo mới (cặp hai chiều cùng fixture, thông điệp ghim).

**Mục tiêu:** màn `/ops/labels` gắn nhãn mù chín trường cho tin S03 của lát OCP1, lưu ở máy thu, 20% gắn trùng, đo đồng
thuận từng trường và phút công. Hợp đồng: `_acceptance/man-gan-nhan-mu/contract.md` (duyệt 30/10). Thiết kế:
`docs/superpowers/specs/2026-10-30-man-gan-nhan-mu-design.md`.

**Chặn trước S3:** số migration (yêu cầu P4-82) và quyền thêm executor `mgn_*` vào `_acceptance/config.yaml` (P4-83).
Task 1 và Task 7 không bắt đầu khi chưa có hai trả lời này; các task khác viết được trước trên tên tệp tạm
`db/migrations/054_labels.sql` (liên làn cấp 30/10).

**DB:** mọi phép đo dùng DB thử `oneinvest_p4_mgn` (`bash db/db-thu.sh oneinvest_p4_mgn`); test app dùng lược đồ tạm như
`app/tests/quyen-bon-vai.test.tsx` (helper `tests/helpers/phien-thu.ts`). Không áp migration chưa gộp lên `oneinvest`.

## Task 1 — Migration hai bảng + view

- Files: `db/migrations/054_labels.sql`
- Nội dung: `eval_label_items` (item_id bigserial PK, lat, source_code, ref_id, text_hash, split CHECK dev|test,
  double_label, seed, sampled_at; UNIQUE (lat,text_hash), UNIQUE (lat,ref_id)); `eval_labels` (id, item_id FK
  ON DELETE CASCADE, labeler_id text, field CHECK chín trường, value text, not_stated bool, labeled_at; UNIQUE
  (item_id,labeler_id,field); CHECK not_stated ⇒ value IS NULL); view `eval_label_agreement` (lat, field, cap_du,
  khop, ti_le — cặp = tin double_label có đúng hai labeler đã gắn trường đó; khớp = cùng not_stated, hoặc cùng value;
  ti_le NULL khi cap_du = 0). Header «KHÔNG sync cloud (tầng A — gắn với users)». Idempotent.
- Verify: áp hai lần trên DB thử (`docker exec … psql -d oneinvest_p4_mgn`), rồi probe E1.
- Phục vụ: E1, E7 · independent: false (mọi task sau cần bảng)

## Task 2 — Lệnh lấy mẫu và lệnh đồng thuận (pipeline)

- Files: `pipeline/lib/eval-labels.mjs` (+ `pipeline/lib/eval-labels.test.mjs`), `pipeline/label-sample.mjs`,
  `pipeline/label-agreement.mjs`, `pipeline/CLAUDE.md` (hai dòng bảng script)
- `eval-labels.mjs`: `chonMau(posts, {n, seed, tiLeTrung: 0.2})` thuần (băm sha256 `seed + text_hash`, n nhỏ nhất,
  20% làm tròn đánh trùng theo băm phụ, dev/test theo bit băm, cân về lệch ≤ 1); `textHash(text)` = sha256 của
  `normText` (dùng `normText` của transform-zalo); `phutCong(rows)` thuần (bỏ khoảng > 10 phút).
- `label-sample.mjs --lat <l> --n <n> --seed <s> [--nhom-khop <regex>] [--thu]`: `loadStgPosts(client,"zalo")` (gạt post
  thử), lọc nhóm (mặc định lát `ocp1` = `ocp|ocean|masteri`, i), khử trùng theo text_hash, `INSERT … ON CONFLICT DO
  NOTHING`; in `chon`, `them`, `thieu`. `--thu` không mở giao dịch ghi.
- `label-agreement.mjs --lat <l> [--json]`: đọc view + `eval_labels.labeled_at` → dòng từng trường, `thap_nhat`,
  `phut_cong` theo người (id rút gọn, không email).
- Verify: `cd pipeline && node --test lib/eval-labels.test.mjs` (ma trận thuần chọn mẫu + phút công, có ca đỏ); probe
  E2, E7 trên DB thử.
- Phục vụ: E2, E7 · independent: false (cần Task 1)

## Task 3 — Quyền, chuẩn hoá, truy vấn và route ghi (app)

- Files: `app/src/lib/ops-access.ts` (thêm `label.write` {vai ops, bearer false}), `app/src/lib/labels-normalize.ts`
  (đổi tỷ/triệu → VND nguyên bằng số nguyên triệu, chữ NFC/trim/gộp khoảng/thường; kiểm miền bảy ca sai — trả lỗi theo
  trường), `app/src/lib/labels-queries.ts` (tinKe(userId, lat) — chỉ đọc `eval_label_items` + `stg_zalo_posts.text,
  group_name, posted_at`; ghiNhan(userId, itemId, values) trong giao dịch, `SELECT … FOR UPDATE` dòng tin, đếm người đã
  gắn, 409; tienDo; dongThuan (đọc view)), `app/src/app/api/v1/ops/labels/route.ts` (GET tin kế, POST ghi) — khuôn
  `api/v1/ops/review/[id]/decide`.
- Ba ô chọn lấy option từ `app/src/lib/vocab.generated.ts`; danh sách chín trường đặt ở một hằng duy nhất trong
  `labels-normalize.ts`, đặt sao cho lint từ vựng PL6 không đỏ (`node pipeline/vocab.mjs --lint`).
- Verify: `cd app && npx tsc --noEmit && node --import tsx --test tests/labels.test.tsx` (ca lưu chín trường, ma trận
  phân tin, ca đồng thời hai client, bảy ca sai, viewer/bearer); `node pipeline/vocab.mjs --lint`.
- Phục vụ: E4, E6, E9 · independent: false (cần Task 1)

## Task 4 — Màn `/ops/labels` (UI)

- Files: `app/src/app/ops/labels/page.tsx`, `app/src/components/ops/labels/` (labels-view, label-form, agreement-table,
  labels-skeleton), `app/src/components/shell/nav.tsx` (mục «Gắn nhãn», nhóm «Xử lý»).
- Theo đặc tả UX: chín trạng thái ST-labels-*; ReUI/onehub-ui (nạp skill `reui` rồi `onehub-ui` trước khi viết, kế hoạch
  bảy dòng của ReUI trong lời trình); `LocalOnlyAlert` khi `VERCEL=1`, không gọi truy vấn nhãn.
- Verify: `cd app && npx tsc --noEmit && npm run lint && node --import tsx --test tests/labels.test.tsx` (ca trạng thái,
  bảng đồng thuận); xem bằng mắt ở preview (sáng/tối/390 px) với DB thử; design-gate trên các tệp màn.
- Phục vụ: E3, E8, E10, E11 · independent: false (cần Task 3)

## Task 5 — Từ vựng và tài liệu cổng

- Files: `CONTEXT.md` (thuật ngữ «Gắn nhãn» slug `labels`, «Nhãn đánh giá»), `.claude/skills/onehub-ui/routes.md`,
  `docs/architecture/portals.md`.
- Verify: `cd app && npm run test:lint-rules` (route-slugs xanh).
- Phục vụ: E12 · independent: true (không chạm tệp task khác)

## Task 6 — Phép đo của hồ sơ

- Files: `_acceptance/man-gan-nhan-mu/probes/` — `_db.mjs` (nối DB thử, dựng/dọn lát `mgn-thu`), `migration.mjs`,
  `mau.mjs`, `mu.mjs`, `dong-thuan.mjs`, `seed.mjs` (lát ocp1 10 tin, 2 trùng, `GIA_TRI_MAU`), `doc-nhan.mjs`,
  `duong.sh`, `pham-vi.sh`.
- Mỗi probe in thông điệp ghim của evals.yaml và có lượt phá-thử (bản chép đột biến trong thư mục tạm) cho ra đúng chữ
  đỏ đã ghim.
- Verify: chạy từng probe trên DB thử, xanh; chạy lượt phá-thử, đỏ đúng chữ.
- Phục vụ: E1, E2, E5, E7, E12, E13 · independent: false (cần Task 1–5)

## Task 7 — Khai executor

- Files: `_acceptance/config.yaml` (chỉ thêm dòng: `test.mgn_app`, `script.mgn_migration|mgn_mau|mgn_mu|mgn_dong_thuan|
  mgn_duong|mgn_pham_vi`, `design.mgn_gate`) — chỉ sau khi P4-83 cấp quyền.
- Verify: `node <feature-loop>/scripts/s4-args.mjs` dựng được args cho mọi eval (không exit 2).
- Phục vụ: mọi eval · independent: false

## Thứ tự

Task 1 → Task 2 → Task 3 → Task 4 → (Task 5 song song được) → Task 6 → Task 7 → sàn thiết kế S3 → contract
`implemented` → S4.
