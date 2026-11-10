# S4 chạy suite theo vùng đổi + dựng worktree chấm (thiết kế)

Hàng `s4-suite-theo-vung` (dãy P3, T2, không mã lộ trình — giám sát giao 10/11 ~14:00Z, Mạnh duyệt «Làm cả hai» ở phiên
giám sát). Ranh giới hàng: `_acceptance/config.yaml`, `scripts/suite-neu-doi.mjs`, `scripts/dung-worktree-cham.sh`, hai
tệp test, `_acceptance/s4-suite-theo-vung/**`.

## 1. Vấn đề (số của giám sát, 10/11)

- Khoá `s4` của đợt bận liên tục từ 01:12Z: 19 lượt, trung bình 40′. Mỗi lượt S4 và mỗi lượt ghim lại chạy đủ sáu
  suite toàn kho (`feature_loop.suite_keys`: agent, app, app_ui, pipeline, ui_lint_rules, portal_static) — app_ui một
  mình 11–12′ — dù hàng chỉ đổi một module.
- Nhiều lượt hỏng giả vì worktree mới thiếu tệp gitignored: `.env`, `node_modules`, `app/.next/dev/types` (tsc của app
  đọc `.next/dev/types/**/*.ts`). Sổ hồ sơ trước: `s06-hai-luot-ngay-gop-main#d-20261031T170041Z-6` (S4 r1 BLOCKED vì
  worktree thiếu node_modules).

## 2. Cách làm

**(1) `scripts/suite-neu-doi.mjs <tên-suite> -- <lệnh>`** — bọc lệnh suite:
- Tập tệp đổi = `git diff --name-only <merge-base origin/main HEAD> HEAD` ∪ `git diff --name-only HEAD` (cây làm việc,
  đã/ chưa stage) ∪ `git ls-files --others --exclude-standard`. Biến `SUITE_NEU_DOI_BASE` thay merge-base (test).
- Vùng mỗi suite là bảng tĩnh `VUNG` trong tệp (glob: `x/**` = tiền tố, còn lại khớp nguyên đường). Tệp đổi khớp vùng →
  chạy `bash -c <lệnh>` từ gốc kho, in `suite-neu-doi: chạy <tên> — đổi <tệp> (+N tệp trong vùng)`, trả đúng mã thoát
  (tín hiệu → 128 + số). Không khớp → in `suite-neu-doi: bỏ qua <tên>: không đổi <tóm tắt vùng> (N tệp đổi ngoài vùng)`,
  thoát 0, không chạy lệnh.
- Bảo thủ khi không chắc — CHẠY: không giải được merge-base / git lỗi; suite không có trong bảng; không tệp đổi nào
  (ngoài `_acceptance/`) thuộc vùng của bất kỳ suite nào (chưa có thay đổi mã — chính là lúc đường nền chạy đầu vòng,
  nhánh mới có hồ sơ, tài liệu thiết kế, kế hoạch; cần nền đủ sáu suite); `SUITE_NEU_DOI=chay`.
- Đường có đoạn `node_modules` bị loại khỏi tập tệp đổi — symlink do `dung-worktree-cham.sh` nối hiện ra như tệp chưa
  theo dõi (mẫu `.gitignore` `node_modules/` chỉ khớp thư mục thật).
- Bảng vùng (đo 10/11 bằng quét đường dẫn literal + bao đóng import của từng module — import chéo dày: app nhập
  ~50 tệp pipeline, agent nhập pipeline và app):

  | Suite | Vùng |
  |---|---|
  | app, app_ui | `app/**` `agent/**` `pipeline/**` `scripts/**` `db/**` `data-api/**` `CONTEXT.md` `.claude/skills/onehub-ui/**` `docs/architecture/**` `docs/product/**` `docs/ops/**` `_acceptance/tap-nhan-mau-ocp1/**` |
  | ui_lint_rules | `app/**` `db/**` `CONTEXT.md` `.claude/skills/onehub-ui/**` |
  | pipeline | `pipeline/**` `db/**` `scripts/**` `agent/**` `app/**` `collector/src/**` `collector/docs/**` `collector/scripts/**` `data-api/src/**` `tools/**` `CONTEXT.md` `LO-TRINH.html` `docs/ROADMAP.md` `docs/ops/**` + 7 thư mục `_acceptance/<hồ sơ>/` mà test pipeline đọc |
  | agent | `agent/**` `db/**` `pipeline/**` `scripts/**` `docs/ops/**` + 4 tệp app (`app/src/lib/ops/review-can-cu.ts`, `app/src/lib/vocab.generated.ts`, hai test thẻ duyệt) + `_acceptance/config.yaml` `_acceptance/chon-model-theo-o/**` `_acceptance/the-ghep-can-tin-roi-kho/**` |
  | portal_static | `app/**` `db/**` `scripts/check-portal-compliance.mjs` + bốn cổng `scripts/check-{ops-tier-a,deals-api,api-surface,mcp-tools}.mjs` + `scripts/lib/{ops-visible-strings,tier-a-source-names}.mjs` + `pipeline/lib/mask-source-names.mjs` |

  `db/**` có mặt ở mọi suite dùng DB của riêng lượt (`db/db-thu.sh`) — đổi migration kéo cả app. `docs/ROADMAP.md` và
  `LO-TRINH.html` NẰM trong vùng pipeline (DV1-AC-8 đọc ROADMAP, `so-nhom.itest` đọc LO-TRINH) dù gần như hàng nào cũng sửa
  chúng — câu giao đòi bảng vùng bảo thủ (sổ d-3). Hệ quả đo: suite pipeline chạy ở hầu hết lượt; phần cắt được nằm ở agent
  (hàng giao diện), ui_lint_rules, portal_static (hàng không chạm app), app/app_ui (hàng chỉ collector).
- **Test canh phủ**: quét mọi chuỗi đường dẫn literal (`"../x"`, `"pipeline/…"`, `"db/migrations"`…) trong tệp mã của
  module, đệ quy theo cạnh import ra ngoài module; mỗi đường tồn tại trong kho phải nằm trong vùng của suite, trừ danh
  sách ngoại lệ có lý do. Giới hạn: đường ghép mảnh bằng `join(ROOT, "a", "b")` không bắt được — CI vẫn chạy đủ suite trên
  mọi PR (`ci-test.yml`: «chạy trên MỌI PR (không lọc paths)»), nên nhánh chính không mất lưới — TRỪ portal_static: CI
  không chạy `check-portal-compliance.mjs`, nên vùng của nó phải phủ đủ (S4 r1: thiếu bốn cổng nạp bằng `./`, và
  `db/**` vì `tier-a-source-names.mjs` rút tên nguồn từ migration). Phép quét giải cả literal `./x` theo thư mục tệp.

**(2) `_acceptance/config.yaml`**: thêm `executors.suite.<tên>` = `node scripts/suite-neu-doi.mjs <tên> -- '<lệnh cũ>'`
cho sáu suite; `feature_loop.suite_keys` trỏ sang key mới. `executors.test.*`, `executors.script.portal_static` giữ
nguyên từng byte — eval của hồ sơ đã ký đang trỏ vào chúng.

**(3) `scripts/dung-worktree-cham.sh <worktree> [--khong-tsc]`**:
- Checkout chính = mục đầu của `git worktree list --porcelain` (`DUNG_WT_CHINH` thay, cho test). Đích là chính nó → thoát
  2 «không dựng vào checkout chính».
- `.env`: tệp chưa theo dõi mà `.worktreeinclude` khớp (`git ls-files -o -i --exclude-from=.worktreeinclude`, bỏ
  `node_modules`) chép sang khi đích chưa có; không ghi đè; chỉ in đường, không in nội dung.
- `node_modules`: mỗi thư mục có `package.json` (sâu ≤ 2) mà đích thiếu `node_modules` và checkout chính có → symlink;
  `package-lock.json` hai bên lệch → in cảnh báo.
- `app/.next/dev/types`: thiếu → `next typegen` (khi `app/node_modules/.bin/next` có) rồi chép `.next/types` sang
  `.next/dev/types`; không được thì chép từ checkout chính; vẫn không → in thiếu.
- `package-lock.json` của worktree lệch checkout chính → KHÔNG nối thư mục đó (gói thiếu/khác; `npm ci` qua symlink sẽ ghi
  vào checkout chính, nơi launchd chạy), in «lock lệch: <thư mục>», bỏ kiểm tsc, thoát 3.
- Cuối: `cd app && npx tsc --noEmit` → in «tsc: xanh» hoặc «tsc: đỏ (N dòng lỗi)» kèm 5 dòng đầu; đỏ thì thoát 1.
- Chạy lại không đổi gì (mỗi bước bỏ qua khi đã có).

## 3. Ngoài vòng

- Không sửa kit (`repin-lane.mjs`, `s4-args.mjs`) — bọc ở tầng lệnh của kho. Không ghi `LUAT.md` đợt (giám sát ghi).
- Không đổi CI.

## Đặc tả UX

Không chạm giao diện (dòng sổ `bỏ đặc-tả-UX`).
