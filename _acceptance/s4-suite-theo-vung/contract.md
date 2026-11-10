---
schema_version: 1
feature: Lượt chấm S4 và ghim lại chỉ chạy suite có vùng bị nhánh đổi, và một lệnh dựng worktree chấm đủ .env, node_modules, kiểu của app
slug: s4-suite-theo-vung
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-11-10T14:42:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-10-s4-suite-theo-vung-design.md
---

# Acceptance Contract: s4-suite-theo-vung

## Context

Hàng giám sát giao 10/11 (Mạnh duyệt «Làm cả hai»): khoá S4 của đợt bận liên tục từ 01:12Z, 19 lượt trung bình 40′,
vì mỗi lượt chạy đủ sáu suite toàn kho dù hàng chỉ đổi một module; nhiều lượt hỏng giả vì worktree thiếu `.env`,
`node_modules`, `app/.next/dev/types`. Thiết kế: `docs/superpowers/specs/2026-11-10-s4-suite-theo-vung-design.md`.

## Criteria

### AC-1 — Suite không có vùng bị đổi thì bỏ qua
Given nhánh mà diff (merge-base với origin/main tới HEAD, cộng cây làm việc và tệp chưa theo dõi) có tệp mã nhưng không
tệp nào trong vùng của suite,
When chạy `node scripts/suite-neu-doi.mjs <suite> -- <lệnh>`,
Then lệnh không chạy, in đúng một dòng `suite-neu-doi: bỏ qua <suite>: không đổi …`, thoát 0.

### AC-2 — Suite có vùng bị đổi thì chạy và trả đúng mã
Given diff có ít nhất một tệp trong vùng của suite (đã commit, chưa commit, hoặc chưa theo dõi),
When chạy lệnh bọc,
Then lệnh chạy từ gốc kho, dòng in nêu tệp kích hoạt, mã thoát bằng mã của lệnh (0 thì 0, 3 thì 3); `node_modules` nối
bằng symlink không bao giờ tính là tệp đổi.

### AC-3 — Đổi migration hay pipeline kéo cả app
Given diff chỉ đổi một tệp `db/migrations/*.sql`, hoặc chỉ một tệp `pipeline/lib/*.mjs`,
When quyết cho sáu suite,
Then đổi migration làm chạy app, app_ui, ui_lint_rules, pipeline, agent (bỏ qua portal_static); đổi pipeline làm chạy
app, app_ui, pipeline, agent (bỏ qua ui_lint_rules, portal_static); đổi chỉ `collector/src/*.ts` hoặc chỉ `docs/ROADMAP.md`
thì chỉ pipeline chạy.

### AC-4 — Không chắc thì chạy
Given một trong: không giải được merge-base (ref gốc vắng), git lỗi, tên suite không có trong bảng, không tệp đổi nào ngoài
`_acceptance/` thuộc vùng của bất kỳ suite nào (vd chỉ hồ sơ + tài liệu thiết kế + kế hoạch), diff rỗng, hoặc biến
`SUITE_NEU_DOI=chay`,
When chạy lệnh bọc,
Then lệnh chạy, dòng in nêu đúng lý do.

### AC-5 — Bảng vùng phủ mọi đường dẫn mã tham chiếu
Given bảng vùng trong `scripts/suite-neu-doi.mjs`,
When quét chuỗi đường dẫn literal trong tệp mã của từng module, đệ quy theo cạnh import ra ngoài module,
Then mọi đường tồn tại trong kho nằm trong vùng của suite, trừ danh sách ngoại lệ có tên và lý do; thêm một tham chiếu mới
ra ngoài vùng làm phép quét đỏ gọi tên tệp.

### AC-6 — Cấu hình trỏ lệnh bọc, lệnh cũ không đổi
Given `_acceptance/config.yaml`,
When đọc,
Then có `executors.suite.<tên>` cho đúng sáu suite của `suite_keys` cũ, mỗi lệnh là `node scripts/suite-neu-doi.mjs <tên> --
'<lệnh cũ nguyên văn>'`; `feature_loop.suite_keys` trỏ đúng sáu key đó; mọi `executors.test.*` và
`executors.script.portal_static` giữ nguyên từng byte so với origin/main lúc mở vòng.

### AC-7 — Dựng worktree chấm
Given checkout chính có `.env` và `app/.env.local` chưa theo dõi, `node_modules` ở app và pipeline, `app/.next/dev/types`,
và một worktree mới thiếu cả ba,
When chạy `bash scripts/dung-worktree-cham.sh <worktree> --khong-tsc`,
Then hai tệp env được chép nguyên nội dung, tệp chưa theo dõi không khớp `.worktreeinclude` không được chép, tệp env có
sẵn ở đích không bị ghi đè, `node_modules` là symlink về checkout chính, `.next/dev/types` có mặt; chạy lần hai không đổi
gì; đích là checkout chính thì thoát 2 không ghi; `package-lock.json` của một thư mục lệch checkout chính thì thư mục đó
không được nối, in «lock lệch: <thư mục>», thoát 3 và `node_modules` của checkout chính không đổi; không cờ thì in dòng
kiểm tsc và thoát theo kết quả.

### AC-8 — Hồi quy
Given bộ test `scripts/*.test.mjs`,
When chạy,
Then xanh.

## Coverage

Trục (preset test-matrix cho «lệnh bọc suite»):
- Trạng thái diff: tệp trong vùng (commit · chưa commit · chưa theo dõi) · tệp ngoài vùng · chỉ `_acceptance/` · rỗng ·
  không giải được gốc. [AC-1, AC-2, AC-4]
- Suite: sáu suite của `suite_keys` · tên lạ. [thước CE: `feature_loop.suite_keys` hiện hành — AC-3, AC-4, AC-6]
- Nguồn vùng: import chéo đo được · ngoại lệ có tên. [AC-5]
- Worktree: thiếu cả ba · có sẵn một phần · là checkout chính. [AC-7]

Core → AC-1…AC-8. Later: đọc vùng từ bản đồ import sinh tự động. Never: bỏ qua suite khi không xác định được diff.

## Out of scope

- Sửa kit (`repin-lane.mjs`, `s4-args.mjs`) hay CI (`ci-test.yml` vẫn chạy đủ suite trên mọi PR).
- Ghi luật đợt (`LUAT.md`) — giám sát ghi.

## Notes

- Đường ghép mảnh bằng `join(ROOT, "a", "b")` nằm ngoài tầm phép quét AC-5 — lưới cho chỗ hở là CI chạy đủ suite.
