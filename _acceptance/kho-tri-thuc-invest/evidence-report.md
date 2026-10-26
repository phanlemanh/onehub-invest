---
schema_version: 2
feature_slug: kho-tri-thuc-invest
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: fb54ee395f3f65d21538c069c59c257374ce510a
human_signoff:
---

# Evidence Report: kho-tri-thuc-invest

Vòng verify 1 chạy trên cây `fb54ee3` (nhánh `claude/tri-thuc-onehub-9979b7`, merge-base với origin/main là `6b0afe76`).
Cây sạch lúc chạy. Kit acceptance-gate 2.34.0, Node v24.21.0, DB local :5433 tới được (bộ quét tầng A đọc
`source_registry`). Kho riêng `~/dev/onehub-invest-tri-thuc` chỉ được đọc; các đột biến E5 chạy trên bản clone trong
`mktemp -d` và đã tự xoá. Worktree tạm của E8 cũng đã gỡ: `git worktree list` không còn mục lạ. Phiên chấm không viết
mã này. Cả tám eval đạt `expected`, kể cả các vế should-fire và should-NOT-fire. Mỗi lệnh chạy dưới 10 giây với
timeout công cụ 600 s, không lệnh nào bị ngắt.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: kho-tri-thuc-invest-E1-r1-20261026T072835Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_khai
  verified_at: 2026-10-26T07:28:35Z
  output: |
    khối: {"noi":null,"congKhai":true,"kho":{"ten":"onehub-invest-tri-thuc","duong":"../onehub-invest-tri-thuc","remote":"https://github.com/phanlemanh/onehub-invest-tri-thuc.git"},"loi":[],"canhBao":[]}
    ok   cong_khai: true
    ok   kho: ten/duong/remote đúng
    ok   không khai noi (gốc là kho riêng)
    ok   bộ đọc của kit: 0 lỗi
    ok   gốc tri thức = /Users/manhphan/dev/onehub-invest-tri-thuc (cạnh checkout chính /Users/manhphan/dev/onehub-invest)
    ok   kho riêng trên GitHub: PRIVATE
    KHAI OK
  note: chạy từ worktree, gốc vẫn giải về cạnh checkout chính, đúng như AC-1 đòi.

- eval: E2
  run_id: kho-tri-thuc-invest-E2-r1-20261026T072840Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_ban_chep
  verified_at: 2026-10-26T07:28:40Z
  output: |
    ok   trùng byte: scripts/tri-thuc-khoa.cjs
    ok   trùng byte: scripts/tri-thuc-nguon.cjs
    ok   trùng byte: scripts/tri-thuc.mjs
    ok   trùng byte: scripts/tri-thuc-tra.cjs
    ok   trùng byte: scripts/can-cu-s1.cjs
    ok   trùng byte: scripts/luat-san-pham.cjs
    ok   trùng byte: skills/acceptance/references/tri-thuc-template.md
    ok   danh sách chép của kit 2.34.0 có 7 tệp tri_thuc
    BAN-CHEP OK

- eval: E3
  run_id: kho-tri-thuc-invest-E3-r1-20261026T072845Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_lint
  verified_at: 2026-10-26T07:28:45Z
  output: |
    tri thức: 12 trang, 12 raw, 0 lỗi
    ok   lint xanh 12/12/0
    ok   kho riêng không có thay đổi chưa commit
    ok   kho riêng: mọi commit đã đẩy
    LINT OK

- eval: E4
  run_id: kho-tri-thuc-invest-E4-r1-20261026T072851Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_rang_phu
  verified_at: 2026-10-26T07:28:51Z
  output: |
    ok   pham-vi-bo-sung-2310.md: xanh, 0 lỗi
    ok   pham-vi-cam-mau-2310.md: xanh, 0 lỗi
    ok   pham-vi-giao-dien-2310.md: xanh, 0 lỗi
    ok   pham-vi-nen-tang-2310.md: xanh, 0 lỗi
    ok   pham-vi-observability-2510.md: xanh, 0 lỗi
    ok   pham-vi-ops-noi-that-2410.md: 0 lỗi nguồn; còn đúng 3 lỗi có từ trước (OM1, OM2, YC9c)
    ok   pham-vi-phan-loai-2310.md: xanh, 0 lỗi
    ok   pham-vi-san-pham-sau-2310.md: xanh, 0 lỗi
    ok   pham-vi-tu-van-hanh-2510.md: xanh, 0 lỗi
    ok   pham-vi-zcode-2310.md: xanh, 0 lỗi
    ok   đủ 10 bản phạm vi
    RANG-PHU OK
  note: phiên chấm đếm thêm, mỗi bản phạm vi có đúng một dòng `nguon:`.

- eval: E5
  run_id: kho-tri-thuc-invest-E5-r1-20261026T072900Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_dot_bien
  verified_at: 2026-10-26T07:29:00Z
  output: |
    ok   đối chứng: răng phủ bản nguyên vẹn xanh
    ok   đối chứng: lint bản nguyên vẹn xanh
    ok   M1 băm lệch → đỏ [nguon-lech]
    ok   M2 nguồn chữ tự do → đỏ [nguon-khong-phai-trang]
    ok   M3 trỏ raw → đỏ (không phải trang wiki)
    ok   M4 raw sửa một byte → lint đỏ [raw-bi-sua]
    ok   M5 trang đợt bỏ mã A0.2 → lint đỏ [ma-khong-co-trang]
    ok   N1 không có kho riêng → răng phủ rc 0, cảnh báo «không đọc được ở đây»
    ok   N1 lint thoát 3 (không đọc được ở đây), kèm lệnh clone
    DOT-BIEN OK
  note: should-fire đạt (M1–M5 đều đỏ). Should-NOT-fire đạt: thiếu kho riêng thì răng phủ không đỏ, lint trả mã 3.
    Đột biến chạy trên clone tạm trong `mktemp -d`, kho riêng thật không bị chạm.

- eval: E6
  run_id: kho-tri-thuc-invest-E6-r1-20261026T072919Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_rieng_tu
  verified_at: 2026-10-26T07:29:19Z
  output: |
    ok   kho công khai: không tệp nguon.md hay TRI-THUC.md nào
    ok   2026-10-26-audit-hien-trang/2026-10-23-hien-trang-va-lo-trinh.md: trùng một bản của docs/audit/2026-10-23-hien-trang-va-lo-trinh.md trên origin/main
    … (24 dòng ok «trùng một bản … trên origin/main» khác cho raw loại tep-kho)
    ok   2026-10-26-kenh-tin-9/issue-9-kenh-tin.md (issue): 0 tên nguồn thật
    ok   2026-10-26-lat-ocp1/lat-ocp1-huong-tiep-can-2610.md (tep-may): 0 tên nguồn thật
    ok   2026-10-26-lien-lan/lien-lan-vong-mo-2410.md (tep-may): 0 tên nguồn thật
    ok   2026-10-26-lien-lan/BOARD.md (tep-may): 0 tên nguồn thật
    ok   2026-10-26-quyet-dinh-manh/quyet-dinh-manh-2310-2610.md (phien): 0 tên nguồn thật
    ok   2026-10-26-spl-ops-cloud/runtime-map.md: trùng một bản của docs/ops/runtime-map.md trên origin/main
    RIENG-TU OK
  note: should-NOT-fire đạt, không có dòng «có tên nguồn thật» hay «kho công khai có tệp tri thức». Kho riêng có
    12 thư mục raw (8 tep-kho, 2 tep-may, 1 issue, 1 phien). Phiên chấm so thêm: mọi tệp trong từng thư mục raw đều có
    trong danh sách của `nguon.md` nên không tệp nào lọt khỏi bộ quét, và kho công khai không có thư mục `raw/` hay
    `wiki/` nào.

- eval: E7
  run_id: kho-tri-thuc-invest-E7-r1-20261026T073024Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_khong_cham
  verified_at: 2026-10-26T07:30:24Z
  output: |
    ok   .claude/settings.json: không đổi so với nền 6b0afe76
    bản ghi: scope local, 2.34.0
    ok   installed_plugins.json: tri-thuc scope local cho /Users/manhphan/dev/onehub-invest
    ok   settings.local.json (gitignored) bật tri-thuc
    ok   settings.local.json bị git bỏ qua
    KHONG-CHAM OK

- eval: E8
  run_id: kho-tri-thuc-invest-E8-r1-20261026T073035Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_scope
  verified_at: 2026-10-26T07:30:35Z
  output: |
    ok   tệp đổi: 34 tệp, đều trong danh sách khai
    ok   bản phạm vi: chỉ dòng nguon đổi
    ok   product-map --check: khớp
    ok   check-lo-trinh static: không FAIL mới so với nền (2 FAIL có từ trước)
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Lệnh chạy hết 1,9 giây. Phiên chấm đã kiểm lại vì sao
    nhanh: tự chạy `check-lo-trinh.sh static` thì mất 0,5 giây, ra 2 dòng răng phủ đỏ có từ trước (phan-loai, cam-mau,
    do cảnh báo mốc OM1/OM2). Như vậy hai lượt chạy (HEAD và nền) là thật. Diff 34 tệp gồm config, 7 tệp kit, 10 bản
    phạm vi (mỗi bản đổi đúng 1 dòng), BOI-CANH, ROADMAP, hồ sơ này, PRODUCT-MAP và LO-TRINH.

Network truth: không có eval `ui-check` nào. Cả tám eval đều là `script`, không có đường mạng: n-a (driver).

## Known limits

- E1 đọc khối `tri_thuc` bằng bản chép `scripts/tri-thuc-khoa.cjs` trong kho chứ không gọi bản của kit. Hai bản trùng byte nhờ E2, nên gộp hai eval lại mới đủ ý AC-1.
- E3 gọi thẳng `tri-thuc.mjs --kiem` của kit thay vì lệnh `/tri-thuc:kiem`. Đây là cùng bộ lint nhưng không đi qua lớp lệnh của gói.
- E4 nhận ra «3 lỗi có từ trước» bằng cách so chữ của dòng lỗi. Probe không chạy lại trên main để chứng minh ba lỗi đó đã có sẵn ở đó.
- E5 chỉ đột biến một bản phạm vi (cam-mau). M3 bắt theo chữ thông báo «không phải trang wiki» chứ không theo một mã lỗi dạng `[...]`. Vế N1 của lint chỉ kiểm mã thoát 3: dòng ok có ghi «kèm lệnh clone» nhưng probe không kiểm có lệnh clone thật trong đầu ra.
- E6 tìm tệp tri thức trong kho công khai chỉ theo tên `nguon.md` và `TRI-THUC.md`. Phiên chấm phải tự kiểm thêm rằng không có thư mục `raw/` hay `wiki/`. Bộ quét tên nguồn chỉ quét raw loại phien/issue/tep-may, không quét 12 trang wiki và `TRI-THUC.md` của kho riêng (đúng phạm vi AC-6, xem Ngoài hợp đồng).
- E7 chỉ so `.claude/settings.json` với merge-base của nhánh (`6b0afe76`). origin/main đã tiến tới `31d80ff`.
- E8: bộ lọc «chỉ dòng nguon đổi» bỏ sót các dòng đổi bắt đầu bằng `-` hoặc `+` (ví dụ gạch đầu dòng markdown) vì mẫu `^[-+][^-+]`. Phiên chấm đã chạy lại bằng bộ lọc chặt hơn: không có dòng nào khác ngoài `nguon:`. Chú thích đầu `scope.sh` ghi «AC-9», trong khi tiêu chí là AC-8.

## Ngoài hợp đồng

- Phiên chấm chạy thêm bộ quét tầng A của hồ sơ (chỉ đọc) lên các trang wiki và `TRI-THUC.md` của kho riêng: 6 chỗ trúng trong 5 tệp, gồm `TRI-THUC.md` (S02), `wiki/nen/nen-chung.md` (S02, S03), `wiki/nen/quyet-dinh.md` (S02), `wiki/dot/zcode-2310.md` (S01), `wiki/dot/bo-sung-2310.md` (S03). Ngữ cảnh (đã che tên) là những cụm như «an toàn S03», «S02 và S08 chỉ nội bộ», «job S01 nightly». Đó chính là những tên đã có trong tệp công khai: cùng bộ quét trên `AGENTS.md` cho S01×4, S02×5, S03×4, S04×1, S06×1, và trên `docs/ROADMAP.md` cho S02×12, S03×11. Vì vậy đây không phải lộ mới. Nhưng trang tóm của kho riêng (nằm trên GitHub) chưa che tên theo đúng mức của raw. Mạnh quyết có cần che không; AC-6 không đòi.

## Analyst

Non-discriminating evals: không đo baseline ở vòng này nên không xác định được.

Baseline khong do:
- E1–E8: mọi probe nằm ở `_acceptance/kho-tri-thuc-invest/probes/`, và cả thư mục đó lẫn khối `tri_thuc` trong config
  cùng 7 tệp kit đều chưa có trên cây diffBase `6b0afe76`. Chạy trên cây cũ chỉ chứng minh probe không tồn tại. Sức
  phân biệt của bộ eval nằm ở E5: đối chứng xanh, rồi 5 đột biến đều đỏ đúng mã.

## Variance

none — mọi eval là tất định và chạy một lượt.

## Iterations

Round 1: E1–E8 đều đạt trên `fb54ee3`. PASS, chờ người ký.
