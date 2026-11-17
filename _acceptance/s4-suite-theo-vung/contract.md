---
schema_version: 1
feature: Lượt chấm S4 và ghim lại chỉ chạy suite có vùng bị nhánh đổi, và một lệnh dựng worktree chấm đủ .env, node_modules, kiểu của app
slug: s4-suite-theo-vung
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: machine-cleared
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
bằng symlink không bao giờ tính là tệp đổi. Tệp bị `git mv` RA KHỎI vùng cũng kéo suite: diff đọc với `--no-renames`
nên đường NGUỒN hiện ra, không bị git gộp vào một dòng đổi tên chỉ mang đường đích (thêm ở S4 r3, xem sổ).

### AC-3 — Đổi migration hay pipeline kéo cả app
Given diff chỉ đổi một tệp `db/migrations/*.sql`, hoặc chỉ một tệp `pipeline/lib/*.mjs`,
When quyết cho sáu suite,
Then đổi migration làm chạy cả bảy suite (portal_static đọc tên nguồn từ `db/migrations` — sửa ở S4 r1, xem sổ); đổi
pipeline làm chạy app, app_ui, pipeline_a, pipeline_b, agent (bỏ qua ui_lint_rules, portal_static); đổi chỉ
`collector/src/*.ts` hoặc chỉ `docs/ROADMAP.md` thì chỉ pipeline_a và pipeline_b chạy.

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
Then có `executors.suite.<tên>` cho đúng bảy suite của `suite_keys` cũ, mỗi lệnh là `node scripts/suite-neu-doi.mjs <tên> --
'<lệnh cũ nguyên văn>'`; `feature_loop.suite_keys` trỏ đúng bảy key đó; mọi `executors.test.*` và
`executors.script.portal_static` giữ nguyên từng byte so với origin/main lúc nhận main (vòng 3: 775d2661). Khoá
`executors.test.*` do hàng KHÁC thêm sau mốc đó không tính là lệch — thước chỉ soi dòng bị xoá hay sửa.

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
- Suite: bảy suite của `suite_keys` (pipeline tách hai nửa `pipeline_a`, `pipeline_b` dùng chung vùng) · tên lạ. [thước CE: `feature_loop.suite_keys` hiện hành — AC-3, AC-4, AC-6]
- Nguồn vùng: import chéo đo được · ngoại lệ có tên. [AC-5]
- Worktree: thiếu cả ba · có sẵn một phần · là checkout chính. [AC-7]

Core → AC-1…AC-8. Later: đọc vùng từ bản đồ import sinh tự động; kiểm lại có cần dựng `.next/dev/types` không khi
`.next/types` đã có (P2 đo 16/11: chỉ `next typegen`, không `.next/dev/types`, giữ `next-env.d.ts` đã commit → tsc và
lint đều mã 0 — hàng này chép và cộng một cấp «../» nên không dính lỗi nối liên kết tượng trưng của P2, nhưng bước
dựng có thể thừa). Never: bỏ qua suite khi không xác định được diff.

## Out of scope

- Sửa kit (`repin-lane.mjs`, `s4-args.mjs`) hay CI (`ci-test.yml` vẫn chạy đủ suite trên mọi PR).
- Ghi luật đợt (`LUAT.md`) — giám sát ghi.

## Notes

- Đường ghép mảnh bằng `join(ROOT, "a", "b")` nằm ngoài tầm phép quét AC-5 — lưới cho chỗ hở là CI chạy đủ suite, TRỪ
  portal_static (CI không chạy `check-portal-compliance.mjs`): vùng của nó liệt kê tay từng tệp nó nạp.
- Ngoài-2 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Khi dựng worktree chấm theo nhánh dự phòng, một số tệp kiểu có thể trỏ sai chỗ mà script vẫn báo thành công; lỗi chỉ lộ ra sau đó ở bước kiểm kiểu với thông báo khó hiểu. — `scripts/dung-worktree-cham.sh`
- Ngoài-3 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Hồ sơ nghiệm thu ghi số ô kiểm khác với số thực chạy, người chấm vòng sau có thể hiểu nhầm phạm vi kiểm; chức năng không bị ảnh hưởng. — `_acceptance/s4-suite-theo-vung/evals.yaml`
- Ngoài-4 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Nếu danh sách tệp cần chép hỏng, worktree chấm có thể thiếu .env mà script vẫn báo xong, làm lượt chấm hỏng giả khó đoán nguyên nhân. — `scripts/dung-worktree-cham.sh`
- Ngoài-5 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Nếu chép tệp môi trường thất bại giữa chừng, worktree thiếu .env nhưng lượt dựng vẫn được coi là thành công. — `scripts/dung-worktree-cham.sh`
- Ngoài-6 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Phép kiểm cấu hình có thể báo xanh cho một lệnh cũ thực ra không còn tồn tại, nên một sửa đổi trong tương lai có thể lọt mà không ai thấy. — `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`
- Ngoài-7 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Phép tự kiểm của probe dùng dữ liệu gõ tay nên không chứng minh bắt được việc ai đó đổi lệnh thật; nó vẫn xanh khi lệnh thật đã khác. — `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`
- Ngoài-8 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Hồ sơ nghiệm thu ghi sai số ô kiểm (24 thay vì 28), người chấm đọc có thể bối rối nhưng công cụ chạy đúng. — `_acceptance/s4-suite-theo-vung/evals.yaml`
- Ngoài-9 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Nếu máy chấm tình cờ có sẵn một biến môi trường riêng, bài kiểm có thể chạy trên thư mục thật thay vì thư mục thử và báo đỏ khó hiểu. — `scripts/dung-worktree-cham.test.mjs`
- Ngoài-10 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Khi có tệp bị xoá trên đĩa mà chưa commit, bài kiểm vùng phủ sẽ báo lỗi khó hiểu thay vì nói rõ nguyên nhân. — `scripts/suite-neu-doi.test.mjs`
- Ngoài-11 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Sửa một dòng chú thích ở nơi khác có thể làm kiểm tự động đỏ, khiến người làm mất thời gian dò nguyên nhân. — `scripts/suite-neu-doi.test.mjs`
- Ngoài-12 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Gõ sai tên cờ thì lệnh dựng vẫn chạy bước kiểm kiểu tốn vài phút thay vì báo lỗi ngay. — `scripts/dung-worktree-cham.sh`
- Ngoài-13 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Sau khi đã dựng app trong thư mục chấm, chạy lại lệnh dựng có thể nối nhầm thư mục sinh sang checkout chính, làm kết quả kiểm kiểu lẫn sản phẩm dựng của nhánh khác. — `scripts/dung-worktree-cham.sh`
- Ngoài-14 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Khi bước sinh kiểu hỏng, lệnh vẫn báo thành công và có thể dùng kiểu cũ, nên kiểm kiểu có thể xanh hoặc đỏ sai. — `scripts/dung-worktree-cham.sh`
- Ngoài-15 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Hồ sơ nghiệm thu còn ghi số cũ sáu suite ở vài chỗ, dễ gây hiểu nhầm cho người đọc. — `_acceptance/s4-suite-theo-vung/evals.yaml`
- Ngoài-16 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Một tham chiếu viết kiểu rút gọn từ module này sang module khác có thể lọt khỏi phép kiểm vùng phủ, khiến lượt chấm bỏ sót suite. — `scripts/suite-neu-doi.test.mjs`
- Ngoài-17 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Nếu ai đó dời khối cấu hình sai chỗ, bài kiểm vẫn xanh nhưng bước ghim lại sẽ hỏng, chỉ lộ ra khi chạy thật. — `scripts/suite-neu-doi.test.mjs`
- Ngoài-18 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Bài kiểm dựng worktree dùng dữ liệu giả quá khớp nên có thể không bắt được lỗi với kiểu thật. — `scripts/dung-worktree-cham.test.mjs`
- Ngoài-19 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Bài kiểm vế chạy lại không đổi gì khá yếu nên có thể xanh dù thông điệp thay đổi. — `scripts/dung-worktree-cham.test.mjs`
- Ngoài-20 (máy định tuyến 2026-11-17, đề xuất S4 known-limits): Ba tài liệu ghi ba con số khác nhau cho cùng một ma trận kiểm, dễ làm người đọc nghi ngờ. — `_acceptance/s4-suite-theo-vung/evals.yaml`
