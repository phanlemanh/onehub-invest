---
schema_version: 1
feature: Một lệnh chạy trọn bộ test scripts/ theo đúng các bước job CI, ngoài khoá s4, ghi dòng tóm tắt vào run-log hồ sơ
slug: suite-scripts-vao-luot-cham
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-17T06:19:01Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-17-suite-scripts-vao-luot-cham-design.md
---

# Acceptance Contract: suite-scripts-vao-luot-cham

## Context

Ba PR đã ký đỏ ở ô CI `scripts` sau chữ ký (#471 `s05-khoa-nap`, #472 `db-thu` DT-AC-7, `toa-s09-hai-khu-vao-danh-ba`
`ops-local-dong-bang` DBS-AC-6) vì lượt chấm không chạy lưới mà CI chạy. Giám sát quyết 17/11 (đổi phán sau số đo của
S3): **không** chọn test theo từng tệp — xét an toàn trên bao đóng thì 20–34/43 tệp phải luôn chạy, và tệp khai tay là phép
phán tay trên ~100 script dễ sai. Thay bằng một lệnh chạy TRỌN bộ theo đúng bốn bước CI, chạy NGOÀI khoá s4 ở bước chạy khô
trước khi xin chấm và sau mỗi lần nhận main chạm `scripts/**`; giám sát đưa lệnh vào LUAT.md và bước soát trước gộp.
`suite_keys` giữ bảy key. Căn cứ: design doc.

## Criteria

### AC-1 — Lệnh tương đương job CI scripts, đo trên phần tử và trên đầu ra
Given job `scripts` trong `.github/workflows/ci-test.yml`,
When rút mọi bước `run`, khoá `env` và `services.*.image` của job thành ma trận,
Then mỗi phần tử có đúng một dòng viết trước: «tương đương: <phần của lệnh>» hoặc «miễn: <lý do>» (checkout, setup-node,
`npm ci` miễn vì worktree đã có `node_modules`); các bước tương đương là `node --check` mọi `.mjs`, `scripts/ci-db-init.mjs`
trên DB trống, `NODE_OPTIONS` từ `scripts/lib/ci-can-du-lieu.mjs scripts`, `node --test scripts/*.test.mjs`, và lệnh chạy
chúng nguyên văn từ tệp workflow. Ảnh DB của job bằng ảnh của server nơi lệnh dựng DB trống, bản chính Node trùng. Workflow
có phần tử mới chưa có dòng → đỏ gọi tên phần tử. Đầu ra thật: test nối tới DB vừa dựng (không phải `oneinvest`), thấy
`CI=true`, và danh sách ca bị bỏ bằng danh sách của `ci-bo-qua.json` cho module `scripts`.

### AC-2 — Dòng tóm tắt máy đọc được, ghi vào run-log hồ sơ, DB luôn được dọn
Given lệnh chạy xong (xanh hay đỏ) hoặc bị ngắt,
When đọc đầu ra và hồ sơ,
Then dòng cuối của stdout là một JSON `{"kind":"scripts-ci","ts","sha","exit","tests","pass","fail","giay"}`; với `--ho-so
<slug>` cùng dòng ấy được nối vào `_acceptance/<slug>/run-log.jsonl`; `--ho-so` trỏ hồ sơ không tồn tại → thoát 2, không
ghi gì; DB trống của lượt không còn sau khi lệnh thoát, kể cả khi bị SIGTERM (thoát 143).

### AC-3 — Tái hiện lần đỏ #471
Given worktree tạm của đỉnh `5b02c3de` (cha của bản vá `8d5b75b1`),
When chạy lệnh của HEAD với `--root` trỏ worktree ấy,
Then lệnh thoát khác 0 và ca «(5) bước thu lỗi → dòng ghim JOB FAIL…» của `scripts/s05-khoa-nap.test.mjs` nằm trong danh
sách đỏ.

### AC-4 — Tái hiện lần đỏ #472
Given worktree tạm của đỉnh `f3fecd5f`,
When chạy lệnh của HEAD với `--root` trỏ worktree ấy,
Then lệnh thoát khác 0 và có ca DT-AC-7 của `scripts/db-thu.test.mjs` trong danh sách đỏ.

### AC-5 — Cây đang chấm thì xanh
Given cây của nhánh (đã nhận main),
When chạy lệnh,
Then lệnh thoát 0 và dòng tóm tắt có `"fail":0`.

### AC-6 — Cấu hình lượt chấm không đổi
Given `_acceptance/config.yaml`,
When so với gốc nhận main,
Then `feature_loop.suite_keys` vẫn bảy key, mọi `executors.test.*` và `executors.script.portal_static` của gốc nguyên byte;
S4V-AC-6 và probe `cau-hinh-khong-doi.sh` của hồ sơ s4-suite-theo-vung xanh mà không sửa.

### AC-7 — Hồi quy
Given cây sau khi sửa,
When chạy `node --test scripts/*.test.mjs`,
Then thoát 0.

## Coverage

Trục:
- Phần tử job CI `scripts`: bước run · env · ảnh services · bước miễn. [AC-1] — thước: job `scripts` hiện hành của ci-test.yml.
- Kết cục của lệnh: xanh · đỏ · bị ngắt · hồ sơ không tồn tại. [AC-2, AC-3, AC-4, AC-5]
- Dữ liệu thật: hai lần đỏ đã xảy ra · cây hiện tại. [AC-3, AC-4, AC-5]
- Cấu hình lượt chấm: bảy suite · lệnh cũ nguyên byte. [AC-6]

Core → AC-1…AC-7. Later: lần đỏ thứ ba (`toa-s09-hai-khu-vao-danh-ba`, DBS-AC-6). Never: chọn test theo từng tệp (loại
17/11, số đo 20–34/43 tệp luôn chạy).

## Out of scope

- Chọn test theo từng tệp, bằng bộ quét hay tệp khai tay (giám sát loại 17/11).
- Đưa suite scripts vào `feature_loop.suite_keys` — lệnh chạy ngoài khoá s4.
- Sửa `pre-merge-check.sh`, tệp chép từ kit, workflow CI; ghi LUAT.md (giám sát ghi).

## Notes

**Cách đọc dòng `scripts-ci` trong run-log của một hồ sơ.** Lệnh `node scripts/suite-neu-doi.mjs --chay-scripts --ho-so <slug>`
nối một dòng `{"kind":"scripts-ci","ts":"<ISO>","sha":"<40-hex>","exit":<n>,"tests":<n>,"pass":<n>,"fail":<n>,"giay":<n>}`.
Hồ sơ đủ điều kiện xin chấm (và giám sát gộp) khi dòng `scripts-ci` MỚI NHẤT có `exit` bằng 0 và `sha` bằng đỉnh nhánh,
hoặc `git diff --name-only <sha> HEAD` chỉ ra tệp trong `_acceptance/` (chính việc commit dòng run-log đã đổi đỉnh — cùng
luật với bộ canh bằng chứng cũ của kit). Có tệp ngoài `_acceptance/` đổi sau `sha` → cây đã đổi sau lượt chạy khô, chạy
lại. Lệnh chạy ngoài khoá s4, không đụng DB `oneinvest`.

**Số đo 17/11 (máy đang có lượt chấm của P2):** tái hiện #471 đỏ đúng ca (5) của `s05-khoa-nap`, `fail` 1, 63,4 giây; tái
hiện #472 đỏ đúng DT-AC-7 của `db-thu`, `fail` 1, 72,2 giây; chạy khô trên nhánh @c71fe276 xanh, 524 ca, 517 đạt, 0 hỏng,
93 giây; hồi quy `node --test scripts/*.test.mjs` trên DB máy thu xanh, 547 ca, 545 đạt, 2 bỏ qua, 1.151 giây. Chạy theo
cách CI (DB trống, bỏ ca cần dữ liệu thật) nhanh hơn ~12 lần so với chạy trên DB máy thu.

**Vòng 1 (17/11 07:06Z, REJECT E5, E7 — do tải máy).** E5 đỏ JST-AC-8 của `job-step-thoi-luong` (ngưỡng ≤ 1 giây đo đồng hồ,
đo được 2,6 giây khi tải 9–10; chạy riêng lúc 08:13Z xanh). E7 đỏ KDM-AC-3 của `kiem-tin-rao-gan-khu-vuc` (lượt db-thu bị ngắt,
mã 143). Baseline main 5508f620 của chính lượt chấm đỏ cả hai lệnh; cả hai tệp ngoài diff. Hệ quả cho cách dùng: dòng
`scripts-ci` đỏ ở ca đo giờ khi máy đang chấm nặng thì chạy lại lúc máy yên trước khi coi là lỗi. Vòng 2 sửa tám lỗi review
(DB mồ côi, SIGHUP, dropdb lỗi, cờ thiếu giá trị, `bash -e`, ba chỗ đo chỉ âm tính) và đổi E1, E2 sang probe `co-ca.sh` (đếm
ca «✔ <mẫu>», vì `--test-name-pattern` không khớp ca nào vẫn thoát 0 trên gốc).
