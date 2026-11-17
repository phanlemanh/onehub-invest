---
schema_version: 1
feature: Lượt chấm S4 và ghim lại chạy bộ test scripts/ theo đúng lệnh job CI, chỉ những tệp có tập đọc chạm diff của nhánh
slug: suite-scripts-vao-luot-cham
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-11-17T05:53:19Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-17-suite-scripts-vao-luot-cham-design.md
---

# Acceptance Contract: suite-scripts-vao-luot-cham

## Context

Ba PR đã ký đỏ ở ô CI `scripts` sau chữ ký (#471 `s05-khoa-nap`, #472 `db-thu` DT-AC-7, `toa-s09-hai-khu-vao-danh-ba`
`ops-local-dong-bang` DBS-AC-6) vì `feature_loop.suite_keys` không có bộ `scripts/*.test.mjs`. Giám sát quyết hướng 17/11:
lệnh theo đúng job CI `scripts`, chọn test theo từng tệp, ba rào an toàn. Vùng cả-suite phủ 14 thư mục gốc (279 đường) nên
bọc cả suite thì gần như không bao giờ bỏ qua; giá cố định của tập luôn chạy đo được ≈ 23 giây. Căn cứ: design doc.

## Criteria

### AC-1 — Lệnh suite tương đương job CI scripts, đo trên phần tử và trên đầu ra
Given job `scripts` trong `.github/workflows/ci-test.yml`,
When rút mọi bước `run`, khoá `env` và `services.*.image` của job thành ma trận,
Then mỗi phần tử có đúng một dòng viết trước: «tương đương: <phần của lệnh suite>» hoặc «miễn: <lý do>» (checkout,
setup-node, `npm ci` miễn vì worktree chấm đã có `node_modules`); các bước tương đương là `node --check` mọi `.mjs`,
`scripts/ci-db-init.mjs` trên DB trống, `NODE_OPTIONS` từ `scripts/lib/ci-can-du-lieu.mjs scripts` với `CI=true`,
`node --test`. Ảnh DB của job bằng ảnh của DB mà lệnh suite dựng DB trống trên đó, và bản chính Node trùng. Workflow có
phần tử mới chưa có dòng → đỏ gọi tên phần tử. Đo đầu ra thật: chạy lệnh suite trên một tệp cố định thì DB mà test nối tới
là DB vừa dựng (không phải `oneinvest`), và danh sách ca bị bỏ bằng danh sách của `ci-bo-qua.json` cho module `scripts`.

### AC-2 — Chọn theo từng tệp: tập đọc chạm diff thì chạy, không chạm thì bỏ
Given một kho thử có hai tệp `scripts/a.test.mjs` (đọc `pipeline/x.mjs`) và `scripts/b.test.mjs` (đọc `app/y.ts`),
When diff của nhánh chỉ đổi `pipeline/x.mjs`,
Then bộ chọn trả đúng `scripts/a.test.mjs`, không có `b`; diff đổi cả hai thì trả cả hai; diff đổi chính một tệp test thì tệp
đó được chọn; dòng in nêu tệp được chọn và tệp kích hoạt.

### AC-3 — Tệp đọc kho động thì luôn chạy, theo ma trận đọc tay đủ 43 tệp
Given 43 tệp `scripts/*.test.mjs` của kho và một ma trận viết TRƯỚC mã bằng cách đọc tay từng tệp cùng các tệp nó gọi
(không sinh từ bộ phát hiện), mỗi tệp một dòng «động: <lối, dòng>» hoặc «tĩnh» hoặc «chỉ đọc tạm»,
When bộ phát hiện phân loại theo gốc của lời đọc — đọc kho động gồm `readdirSync`/`readdir`/glob/`git ls-files`/
`execSync` chạy `find` hay `grep` hay `git`, đường ghép bằng template literal có biểu thức, `import()` với đối số không
literal, đặt gốc ở thư mục kho; gốc ở thư mục tạm, `tmpdir()`, HOME giả thì không tính,
Then kết quả bằng ma trận ở cả 43 dòng (đúng 43 assert, mỗi assert gọi tên tệp); bảy tệp đã đếm 17/11 (`db-thu`,
`design-floor-vung`, `don-hex-tho`, `ops-local-dong-bang`, `s05-slo`, `suite-neu-doi`, `zalo-import-job`) nằm trong tập
động, năm tệp chỉ đọc tạm (`bo-worktree`, `install-cron-chi`, `job-step-thoi-luong`, `sao-luu-ngoai-may`,
`ui-capture-login`) thì không. Chiều đỏ: mỗi lối nhận diện một bản sao tắt lối ấy, phép đo đỏ gọi tên tệp lọt.

### AC-4 — Rào trọn bộ cho hạ tầng chung và node --check
Given diff chạm một tệp hạ tầng chung — `scripts/lib/**`, `db/migrations/**`, `scripts/ci-db-init.mjs`,
`scripts/ci-bo-qua.json`, `.github/workflows/ci-test.yml`, hay `package.json`/`package-lock.json` của `app`, `pipeline`,
`agent` (job cài ba module đó; script mượn `pg` từ `app`),
When bộ chọn chạy,
Then nó trả trọn 43 tệp kèm lý do gọi tên tệp hạ tầng; ma trận viết trước một assert cho mỗi tệp hạ tầng. Đối chứng: một
tệp `scripts/` thường và `scripts/lib-khac/x.mjs` thì không trọn bộ. Với mọi diff, kể cả khi không tệp nào được chọn,
bước `node --check` vẫn chạy.

### AC-5 — Tập đọc là bao đóng qua chủ thể, đo trên đường chọn từng tệp
Given tệp test gọi chủ thể bằng tên tệp trần cùng thư mục (`path.join(HERE, "x.sh")`), và chủ thể lại nhắc tệp mã khác,
When tính tập đọc,
Then tập đọc là bao đóng: mọi tệp mã được nhắc bằng literal (kể cả tên trần cùng thư mục) được thêm và quét tiếp. Kho thử
`a.test.mjs → x.sh → pipeline/y.mjs`: diff chỉ sửa `y.mjs` thì `a` được chọn với lý do «tập đọc»; đối chứng: diff sửa tệp
không ai nhắc thì `a` không được chọn. Đo trên kho thật: cả 15/15 tệp `scripts/*.test.mjs` có chủ thể cùng thân tên đều
có chủ thể trong tập đọc (trước vá 12/15 — lọt `cap-token-may`, `dung-worktree-cham`, `sao-luu-ngoai-may`), và với mỗi tệp
ấy, diff chỉ sửa chủ thể thì đúng tệp test đó được chọn với lý do «tập đọc», không qua rào. S4V-AC-5 vẫn xanh.

### AC-6 — Tái hiện hai lần đỏ thật
Given đỉnh trước-vá của #471 (`5b02c3de`, cha của `8d5b75b1`) và đỉnh của #472 (`f3fecd5f`), mỗi đỉnh so với merge-base
của nó với main,
When chạy bộ chọn và lệnh suite của HEAD với `--root` trỏ worktree tạm của đỉnh cũ (đỉnh cũ chưa có bộ chọn mới),
Then ở `5b02c3de` bộ chọn chọn `scripts/s05-khoa-nap.test.mjs` và lệnh đỏ đúng ca (5) của tệp ấy; ở `f3fecd5f` bộ chọn chọn
`scripts/db-thu.test.mjs` và lệnh đỏ đúng ca DT-AC-7. Probe in sha của bộ chọn đã chạy và lý do chọn của từng tệp.

### AC-7 — Nhánh chỉ đổi app/src chọn ít hơn hẳn trọn bộ, có ngưỡng
Given một nhánh tạm chỉ đổi đúng tệp `app/src/lib/ops/registry/doc.ts`,
When chạy lệnh suite scripts trên máy yên,
Then số tệp được chọn ≤ 15 (trọn bộ 43), tập chọn chứa đủ tập luôn chạy, và số giây của lượt ≤ 40% số giây trọn bộ đo
cùng máy cùng lúc; probe in cả ba số.

### AC-8 — Không chắc thì chạy trọn bộ
Given không giải được gốc so sánh (ref gốc vắng, không phải kho git) hoặc diff rỗng,
When bộ chọn chạy,
Then nó trả trọn bộ, dòng in nêu lý do; `SUITE_NEU_DOI=chay` ép trọn bộ.

### AC-9 — Cấu hình: tám suite, lệnh cũ nguyên byte
Given `_acceptance/config.yaml`,
When đọc,
Then `feature_loop.suite_keys` có tám key (bảy key cũ thêm `executors.suite.scripts`); `executors.test.scripts` và mọi
`executors.test.*`, `executors.script.portal_static` giữ nguyên byte so với gốc nhận main; S4V-AC-6 và probe
`cau-hinh-khong-doi.sh` của hồ sơ s4-suite-theo-vung kiểm tám key và vẫn xanh.

### AC-10 — Hồi quy
Given cây sau khi sửa,
When chạy `node --test scripts/*.test.mjs`,
Then thoát 0.

## Coverage

Trục (preset test-matrix cho «bộ chọn test theo từng tệp»):
- Lối của một tệp test: tập đọc tĩnh · đọc kho động · đọc thư mục tạm · chủ thể cùng thư mục · chính tệp test trong diff.
  [AC-2, AC-3, AC-5] — thước: 43 tệp `scripts/*.test.mjs` thật, đếm 17/11.
- Trạng thái diff: chạm tập đọc · không chạm · chạm `scripts/lib/**` · chạm `db/migrations/**` · rỗng · không giải được gốc.
  [AC-2, AC-4, AC-8]
- Lệnh: chuỗi bước của job CI `scripts`. [AC-1]
- Dữ liệu thật: hai lần đỏ đã xảy ra · nhánh chỉ đổi app/src. [AC-6, AC-7]
- Cấu hình: tám suite · lệnh cũ nguyên byte. [AC-9]

Core → AC-1…AC-10. Later: chọn theo từng ca trong tệp; lần đỏ thứ ba (`toa-s09-hai-khu-vao-danh-ba`, DBS-AC-6 ở
`ops-local-dong-bang` — tệp này thuộc tập luôn chạy nên đã bị rào (a) phủ). Never: bỏ qua khi không xác định được diff hay
tập đọc.

## Out of scope

- Tối ưu tệp test nặng — giám sát xét riêng nếu giá cố định vượt 5 phút.
- Sửa kit (`repin-lane.mjs`, `s4-args.mjs`) hay workflow CI.
- Đổi vùng của bảy suite cũ.

## Notes
