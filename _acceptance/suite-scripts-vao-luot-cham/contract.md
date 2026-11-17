---
schema_version: 1
feature: Lượt chấm S4 và ghim lại chạy bộ test scripts/ theo đúng lệnh job CI, chỉ những tệp có vùng khai tay chạm diff của nhánh
slug: suite-scripts-vao-luot-cham
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-11-17T06:01:18Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-17-suite-scripts-vao-luot-cham-design.md
---

# Acceptance Contract: suite-scripts-vao-luot-cham

## Context

Ba PR đã ký đỏ ở ô CI `scripts` sau chữ ký (#471 `s05-khoa-nap`, #472 `db-thu` DT-AC-7, `toa-s09-hai-khu-vao-danh-ba`
`ops-local-dong-bang` DBS-AC-6) vì `feature_loop.suite_keys` không có bộ `scripts/*.test.mjs`. Giám sát quyết 17/11: lệnh
theo đúng job CI `scripts`; chọn test theo từng tệp bằng một **tệp khai vùng viết tay** (`scripts/suite-scripts-vung.json`)
làm nguồn sự thật — không phân tích luồng tự động, vì xét an toàn trên bao đóng thì 20–34/43 tệp phải luôn chạy (đo 17/11);
ba rào trọn bộ; ca canh tệp chưa khai. Căn cứ: design doc, P3-208.

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

### AC-2 — Chọn theo tệp khai: vùng chạm diff thì chạy, không chạm thì bỏ
Given tệp khai cho `scripts/a.test.mjs` vùng `["pipeline/x.mjs"]`, `scripts/b.test.mjs` vùng `["app/**"]`, `scripts/c.test.mjs`
là `"luon"`,
When diff của nhánh chỉ đổi `pipeline/x.mjs`,
Then bộ chọn trả `a` và `c`, không có `b`; diff đổi `app/y.ts` thì trả `b` và `c`; diff đổi chính `scripts/b.test.mjs` thì `b`
được chọn; diff chỉ đổi tệp không vùng nào phủ thì chỉ trả tập `"luon"`; dòng in nêu tệp được chọn và lý do («vùng: <tệp
diff>», «luôn», «tệp test trong diff»).

### AC-3 — Tệp khai đủ, đúng hình; tệp chưa khai thì đỏ và coi là luôn chạy
Given `scripts/suite-scripts-vung.json` và các tệp `scripts/*.test.mjs` của kho,
When chạy ca canh,
Then mọi tệp test có đúng một dòng khai; mỗi giá trị là `"luon"` hoặc danh sách glob không rỗng; không dòng nào trỏ tệp
test đã mất. Chiều đỏ trên bản sao tệp khai: bỏ một dòng → ca đỏ gọi tên tệp thiếu, và bộ chọn coi tệp ấy là `"luon"`; thêm
dòng cho tệp không tồn tại → đỏ gọi tên; giá trị là mảng rỗng → đỏ gọi tên.

### AC-4 — Rào trọn bộ cho hạ tầng chung và node --check
Given diff chạm một tệp hạ tầng chung — `scripts/lib/**`, `db/migrations/**`, `scripts/ci-db-init.mjs`,
`scripts/ci-bo-qua.json`, `.github/workflows/ci-test.yml`, `scripts/suite-scripts-vung.json`, hay
`package.json`/`package-lock.json` của `app`, `pipeline`, `agent`,
When bộ chọn chạy,
Then nó trả trọn bộ kèm lý do gọi tên tệp hạ tầng; ma trận viết trước một assert cho mỗi tệp hạ tầng. Đối chứng: một
tệp `scripts/` thường và `scripts/lib-khac/x.mjs` thì không trọn bộ. Với mọi diff, kể cả khi không tệp nào được chọn,
bước `node --check` vẫn chạy.

### AC-5 — Tệp khai khớp ma trận đọc tay
Given ma trận đọc tay 43 tệp (`_acceptance/suite-scripts-vao-luot-cham/ma-tran.json`, viết trước tệp khai),
When so tệp khai với ma trận,
Then tệp đọc kho liệt kê không khoanh được (theo ma trận) là `"luon"`, mọi tệp khác có vùng; với mỗi tệp test có chủ thể
cùng thân tên (15 tệp), vùng khai chứa chủ thể; vùng của `scripts/db-thu.test.mjs` phủ tệp test của ba bộ (`app/tests/**`,
`app/probes/**`, `pipeline/**/*.test.mjs`, `agent/tests/**`) và tệp chúng import, mà không phải «cả kho». Đối chứng: bản
sao tệp khai bỏ chủ thể của một tệp → đỏ gọi tên tệp ấy.

### AC-6 — Tái hiện hai lần đỏ thật
Given đỉnh trước-vá của #471 (`5b02c3de`, cha của `8d5b75b1`) và đỉnh của #472 (`f3fecd5f`), mỗi đỉnh so với merge-base
của nó với main,
When chạy bộ chọn và lệnh suite của HEAD với `--root` trỏ worktree tạm của đỉnh cũ (đỉnh cũ chưa có bộ chọn mới),
Then ở `5b02c3de` bộ chọn chọn `scripts/s05-khoa-nap.test.mjs` và lệnh đỏ đúng ca (5) của tệp ấy; ở `f3fecd5f` bộ chọn chọn
`scripts/db-thu.test.mjs` và lệnh đỏ đúng ca DT-AC-7. Probe in sha của bộ chọn đã chạy và lý do chọn của từng tệp.

### AC-7 — Nhánh chỉ đổi app/src chạy trong 120 giây
Given một nhánh tạm chỉ đổi đúng tệp `app/src/lib/ops/registry/doc.ts`,
When chạy lệnh suite scripts trên máy yên,
Then phần `node --test` của tập chọn hết ≤ 120 giây; probe in số tệp chọn, số giây của lượt và số giây trọn bộ đo cùng máy.

### AC-8 — Không chắc thì chạy trọn bộ
Given không giải được gốc so sánh (ref gốc vắng, không phải kho git) hoặc diff rỗng, hoặc không đọc được tệp khai,
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

Trục (preset test-matrix cho «bộ chọn test theo tệp khai»):
- Dòng khai của một tệp test: vùng glob · `"luon"` · thiếu dòng · dòng thừa · mảng rỗng. [AC-2, AC-3] — thước: 43 tệp
  `scripts/*.test.mjs` thật, ma trận đọc tay 17/11.
- Trạng thái diff: chạm vùng · không chạm · chạm hạ tầng chung · chính tệp test · rỗng · không giải được gốc. [AC-2, AC-4, AC-8]
- Nội dung tệp khai so với thật: chủ thể cùng thân tên · tệp liệt kê kho · vùng của db-thu. [AC-5]
- Lệnh: phần tử của job CI `scripts` · đầu ra thật. [AC-1]
- Dữ liệu thật: hai lần đỏ đã xảy ra · nhánh chỉ đổi app/src. [AC-6, AC-7]
- Cấu hình: tám suite · lệnh cũ nguyên byte. [AC-9]

Core → AC-1…AC-10. Later: sinh nháp vùng cho tệp test mới bằng bộ quét (người vẫn duyệt); lần đỏ thứ ba
(`toa-s09-hai-khu-vao-danh-ba`, DBS-AC-6 ở `ops-local-dong-bang` — tệp này `"luon"` trong ma trận). Never: bỏ qua khi
không xác định được diff hay tệp khai.

## Out of scope

- Phân tích luồng tự động để tính vùng (giám sát loại 17/11: vượt một ngày, sai là bỏ qua giả).
- Tối ưu tệp test nặng — giám sát xét riêng.
- Sửa kit (`repin-lane.mjs`, `s4-args.mjs`) hay workflow CI.
- Đổi vùng của bảy suite cũ.

## Notes
