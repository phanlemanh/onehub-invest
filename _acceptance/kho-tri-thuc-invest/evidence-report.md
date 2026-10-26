---
schema_version: 2
feature_slug: kho-tri-thuc-invest
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: d15635b83044086184d4923c790a09c68559b3cb
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: kho-tri-thuc-invest

Vòng verify 2 chạy trên cây `b0b4c0a`, nhánh `claude/tri-thuc-onehub-9979b7`. Merge-base với origin/main là `31d80ff`,
trùng đầu `main` trên GitHub lúc chấm. Cây sạch. Kit acceptance-gate 2.34.0, Node v24.21.0, DB local :5433 tới được
(bộ quét tầng A đọc `source_registry`). Kho riêng `~/dev/onehub-invest-tri-thuc` đứng ở `7ecc5cd`, sạch, đã đẩy, và chỉ
được đọc. Các đột biến E5 chạy trên clone trong `mktemp -d` và đã tự xoá; worktree tạm của E8 đã gỡ. Phiên chấm không
viết mã này. Cả tám eval đạt `expected`, kể cả vế should-fire và should-NOT-fire. Mỗi lệnh xong dưới 6 giây với
timeout công cụ 600 s, không lệnh nào bị ngắt.

Vòng 1 → vòng 2: vòng 1 (`fb54ee3`) cũng PASS 8/8. Nhưng phiên chấm đã chạy thêm bộ quét tầng A lên trang tóm và
`TRI-THUC.md` của kho riêng (ngoài phạm vi AC-6 lúc đó) và thấy 6 chỗ tên nguồn thật trong 5 tệp. Mạnh quyết sửa
(`decisions.jsonl` `d-20261026T073327Z-1`). Những gì đổi giữa hai vòng:
- 5 trang và `TRI-THUC.md` đã che tên bằng mã S0x (kho riêng `7ecc5cd`). Băm trang đổi nên dòng `nguon` của
  `pham-vi-bo-sung-2310` và `pham-vi-zcode-2310` được cập nhật.
- AC-6 mở rộng: quét cả trang wiki và `TRI-THUC.md`, và kiểm «không đường nào dưới raw/ hay wiki/» trong kho công khai.
- `scope.sh` sửa chú thích sang AC-8 và lọc dòng diff chặt hơn.
- Nhánh đã gộp origin/main `31d80ff`; PRODUCT-MAP và LO-TRINH được sinh lại.
Vì cây đổi nên chấm lại cả tám eval.

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
  run_id: kho-tri-thuc-invest-E1-r2-20261026T073447Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_khai
  verified_at: 2026-10-26T07:34:47Z
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
  run_id: kho-tri-thuc-invest-E2-r2-20261026T073448Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_ban_chep
  verified_at: 2026-10-26T07:34:48Z
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
  run_id: kho-tri-thuc-invest-E3-r2-20261026T073448Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_lint
  verified_at: 2026-10-26T07:34:48Z
  output: |
    tri thức: 12 trang, 12 raw, 0 lỗi
    ok   lint xanh 12/12/0
    ok   kho riêng không có thay đổi chưa commit
    ok   kho riêng: mọi commit đã đẩy
    LINT OK

- eval: E4
  run_id: kho-tri-thuc-invest-E4-r2-20261026T073450Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_rang_phu
  verified_at: 2026-10-26T07:34:50Z
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
  note: bo-sung và zcode vẫn xanh sau khi băm trang đổi, tức đường trỏ băm mới khớp trang đã che tên. Mỗi bản phạm vi
    có đúng một dòng `nguon:`.

- eval: E5
  run_id: kho-tri-thuc-invest-E5-r2-20261026T073451Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_dot_bien
  verified_at: 2026-10-26T07:34:51Z
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
    Kho riêng thật không bị chạm.

- eval: E6
  run_id: kho-tri-thuc-invest-E6-r2-20261026T073455Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_rieng_tu
  verified_at: 2026-10-26T07:34:55Z
  output: |
    ok   kho công khai: không tệp nguon.md hay TRI-THUC.md nào
    … (25 dòng ok «trùng một bản … trên origin/main» cho raw loại tep-kho)
    ok   2026-10-26-kenh-tin-9/issue-9-kenh-tin.md (issue): 0 tên nguồn thật
    ok   2026-10-26-lat-ocp1/lat-ocp1-huong-tiep-can-2610.md (tep-may): 0 tên nguồn thật
    ok   2026-10-26-lien-lan/lien-lan-vong-mo-2410.md (tep-may): 0 tên nguồn thật
    ok   2026-10-26-lien-lan/BOARD.md (tep-may): 0 tên nguồn thật
    ok   2026-10-26-quyet-dinh-manh/quyet-dinh-manh-2310-2610.md (phien): 0 tên nguồn thật
    ok   TRI-THUC.md: 0 tên nguồn thật
    ok   wiki/dot/bo-sung-2310.md: 0 tên nguồn thật
    … (8 dòng ok khác cho wiki/dot/*.md)
    ok   wiki/dot/zcode-2310.md: 0 tên nguồn thật
    ok   wiki/nen/nen-chung.md: 0 tên nguồn thật
    ok   wiki/nen/quyet-dinh.md: 0 tên nguồn thật
    ok   kho công khai: không đường nào dưới raw/ hay wiki/
    RIENG-TU OK
  note: should-NOT-fire đạt, không có dòng «có tên nguồn thật» hay «kho công khai có tệp tri thức». Probe quét 13 tệp
    luật và trang, khớp đúng mọi tệp mà kho riêng theo dõi ngoài `raw/`. Phiên chấm so thêm: mọi tệp trong từng thư
    mục raw đều có trong danh sách của `nguon.md`, nên không tệp raw nào lọt khỏi bộ quét.

- eval: E7
  run_id: kho-tri-thuc-invest-E7-r2-20261026T073500Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_khong_cham
  verified_at: 2026-10-26T07:35:00Z
  output: |
    ok   .claude/settings.json: không đổi so với nền 31d80ff5
    bản ghi: scope local, 2.34.0
    ok   installed_plugins.json: tri-thuc scope local cho /Users/manhphan/dev/onehub-invest
    ok   settings.local.json (gitignored) bật tri-thuc
    ok   settings.local.json bị git bỏ qua
    KHONG-CHAM OK

- eval: E8
  run_id: kho-tri-thuc-invest-E8-r2-20261026T073501Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ktt_scope
  verified_at: 2026-10-26T07:35:01Z
  output: |
    ok   tệp đổi: 37 tệp, đều trong danh sách khai
    ok   bản phạm vi: chỉ dòng nguon đổi
    ok   product-map --check: khớp
    ok   check-lo-trinh static: không FAIL mới so với nền (2 FAIL có từ trước)
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». So với vòng 1 thêm 3 tệp của hồ sơ này (decisions.jsonl,
    evidence-report.md, run-log.jsonl). Hai FAIL có từ trước là răng phủ của phan-loai và cam-mau, do cảnh báo mốc
    OM1/OM2. Phiên chấm kiểm lại bộ lọc diff mới bằng tay: 0 dòng đổi ngoài `nguon:` trong 10 bản phạm vi.

Network truth: không có eval `ui-check` nào. Cả tám eval đều là `script`, không có đường mạng: n-a (driver).

## Known limits

- E1 đọc khối `tri_thuc` bằng bản chép `scripts/tri-thuc-khoa.cjs` trong kho chứ không gọi bản của kit. Hai bản trùng byte nhờ E2, nên gộp hai eval lại mới đủ ý AC-1.
- E3 gọi thẳng `tri-thuc.mjs --kiem` của kit thay vì lệnh `/tri-thuc:kiem`. Đây là cùng bộ lint nhưng không đi qua lớp lệnh của gói.
- E4 nhận ra «3 lỗi có từ trước» bằng cách so chữ của dòng lỗi. Probe không chạy lại trên main để chứng minh ba lỗi đó đã có sẵn ở đó.
- E5 chỉ đột biến một bản phạm vi (cam-mau). M3 bắt theo chữ thông báo «không phải trang wiki» chứ không theo một mã lỗi dạng `[...]`. Vế N1 của lint chỉ kiểm mã thoát 3: dòng ok có ghi «kèm lệnh clone» nhưng probe không kiểm có lệnh clone thật trong đầu ra.
- E6 chỉ quét trang ở đúng một tầng thư mục (`wiki/*/*.md`). Hôm nay mẫu đó phủ đủ 12 trang, nhưng một trang đặt thẳng dưới `wiki/` hay sâu hơn một tầng sẽ lọt khỏi bộ quét.

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: không đo baseline ở vòng này nên không xác định được.

Baseline khong do:
- E1–E8: mọi probe nằm ở `_acceptance/kho-tri-thuc-invest/probes/`, và cả thư mục đó lẫn khối `tri_thuc` trong config
  cùng 7 tệp kit đều chưa có trên cây diffBase `31d80ff`. Chạy trên cây cũ chỉ chứng minh probe không tồn tại. Sức
  phân biệt của bộ eval nằm ở E5: đối chứng xanh, rồi 5 đột biến đều đỏ đúng mã.

## Variance

none — mọi eval là tất định và chạy một lượt mỗi vòng. Kết quả hai vòng giống nhau.

## Iterations

Round 1: E1–E8 đều đạt trên `fb54ee3`. Phát hiện ngoài hợp đồng: trang tóm của kho riêng còn tên nguồn thật. Mạnh
quyết sửa và mở rộng AC-6 (`d-20261026T073327Z-1`).
Round 2: E1–E8 đều đạt trên `b0b4c0a`, gồm cả AC-6 mở rộng (13 tệp trang và luật có 0 tên nguồn thật). PASS, chờ người ký.

### Re-pin lần 1 — 2026-10-26, do hoá cũ do gộp main 933820e sau chữ ký
run_id: repin-20261026T075908Z-21372
sha: d15635b83044086184d4923c790a09c68559b3cb · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng
