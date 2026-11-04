---
schema_version: 2
feature_slug: gan-nhan-theo-nhom-s03
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 61c1d09481ed201104c4a0a8105b1d1c0a65a74f
human_signoff:
---

# Evidence Report: gan-nhan-theo-nhom-s03

Vòng 2. Mọi eval của tính năng đều xanh (16 eval chạy lại, 2 eval mang từ vòng 1), nhưng REJECT vì một lệnh suite hồi quy không gắn eval nào còn đỏ: `cd app && npm test` thoát khác 0 (bộ test `tests/ops-nhan-theo-context.test.tsx`, xem khối suite bên dưới). Hai lệnh đỏ ở vòng 1 là `cd pipeline && npm test` và `node scripts/check-portal-compliance.mjs` đã xanh ở vòng này.

Ghi chú cho người chấm: khối E4 mang `network_observed: app-fail`. Người chạy ghi đó là phản hồi validate có chủ ý của bước 6 (thiếu lý do và căn cứ Nhóm), đúng điều Expected mô tả, không có lỗi máy chủ hay lỗi kết nối. Máy xếp E4 là đạt, nhưng người chấm xem lại quyết định này ở Cổng 2; số trạng thái thô nằm trong `evidence/E4-network.txt`.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | ui-check | PASS |
| E5 | AC-3 | test | PASS |
| E6 | AC-4 | test | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-5 | ui-check | PASS |
| E9 | AC-6 | test | PASS |
| E10 | AC-7 | test | PASS |
| E11 | AC-8 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-9 | test | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-10 | script | PASS |
| E16 | AC-10 | script | PASS |
| E17 | AC-7 | ui-check | PASS |
| E18 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-gan-nhan-theo-nhom-s03-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_migration
  verified_at: 2026-11-04T11:40:51Z
  output: |
    MIGRATION OK

- eval: E2
  run_id: minted-gan-nhan-theo-nhom-s03-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_mau
  verified_at: 2026-11-04T11:40:51Z
  output: |
    MAU OK

- eval: E3
  run_id: minted-gan-nhan-theo-nhom-s03-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_pipeline
  verified_at: 2026-11-04T11:16:10Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: E4-20261104-verifier
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-04T11:40:51Z
  screenshot: evidence/E4-step1.png
  observed: |
    E4-step1.png (1440x900 sang, nhom dau): bo chon nhom o goc phai tren («Cho Thue. Chuyen Nhuong Nha Pho Vinhomes Grand Par», tien do 0/30), bai goc 2 dong «2PN2WC C Day du noi that 13tr ...» kem nut Xem het bai, dong huong dan moi, bieu mau 5 khoi hai cot (trai Tin + Can, phai Vi tri + Gia + Nguoi ban), 17 hang moi hang co o can cu Chu/Nhom/Nghe, o Ly do, chan «Da dien 0/17» va nut «Luu va xem may doc» o y~829, tat ca trong man khong cuon; chu Chu dang chon nen den. E4-step1b.png: bai 5 dong bi gap con 3 dong co dau cham, nut Xem het bai. E4-step1b-open.png: bai hien du 5 dong nguyen van, nut thanh Thu gon, nut Luu van thay. E4-step1b-cuon.png: da cuon bieu mau, header dinh giu bai 5 dong va dong huong dan o tren, noi dung form chay duoi, nut Luu dinh o day (co khe 24px noi dung lot o tren header). E4-step2.png: nhom «📢Yeshomes.vn🔥», 0/30, bai dau cua nhom do (anh URL), cung bieu mau. E4-step3.png: 390x844 che do toi, bo cuc mot cot, bo chon nhom day ngang, bai goc gap + Xem het bai, form xep doc, chan dinh «Luu va xem may doc»; khong tran ngang; badge Next o goc trai duoi la cua dev. E4-step3-chon.png: sau khi chon Tin rao / Cho thue / Nhom, nut da chon sang tren nen toi, doc ro; badge 2/17. E4-step4-truoc.png (sang, da dien 17/17): nut da chon nen den chu trang, o khong-suy-ra-duoc xam + tick, Khu do thi can cu Nhom noi bat, Ly do trong. E4-step4.png: sau Luu: nhan «Ly do (bat buoc)» + vien o Ly do mau do, dong loi do «Co truong khong tu chu bai — ghi ly do» ngay duoi o, form giu nguyen gia tri da nhap (Vinhomes Grand Park, 2, 2, 13, 13, 08xxxxxxxx), khong chuyen trang; loi dung o, doi chieu Expected: khop.
  network_observed: app-fail

- eval: E5
  run_id: minted-gan-nhan-theo-nhom-s03-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T11:40:51Z
  output: |
    ℹ duration_ms 1291.389916

- eval: E6
  run_id: minted-gan-nhan-theo-nhom-s03-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T11:40:51Z
  output: |
    ℹ duration_ms 1291.389916

- eval: E7
  run_id: minted-gan-nhan-theo-nhom-s03-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_mu
  verified_at: 2026-11-04T11:40:51Z
  output: |
    MU OK

- eval: E8
  run_id: E8-20261104-1852
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-04T11:40:51Z
  screenshot: evidence/E8-step1.png
  observed: |
    Đã mở từng frame bằng Read.
    E8-step1.png (1440x1500 sáng, nhóm "GCN thử có máy đọc", đã Lưu bài "RB 2PN1WC"): có khối "Bài gốc", bên trái khối "So với máy" với bảng 4 cột Trường | Anh gắn | Bộ đọc | AI đọc (17 hàng), bên phải khối "Ghi trường hợp" có "Thẻ nhóm" nêu chữ thẻ nhóm môi giới Vinhomes Grand Park, ô chọn "Thẻ đúng với bài này không?", "Loại trường hợp", "Diễn giải", nút "Bỏ qua" và "Ghi và sang tin kế". Mô tả ghi "3 trường khác máy". Ô khác máy được tô badge vàng: Loại hình (Bộ đọc "—"), Toà ("rb"), WC ("—"), nên chỗ khác nhìn ra được. Bên dưới là bảng "Trường hợp theo nhóm".
    E8-step2.png (nhóm "GCN thử chưa có máy", bài "Bán căn 1PN giá tốt"): bảng cột Bộ đọc và AI đọc toàn "—"; mô tả "0 trường khác máy. Máy chưa đọc bài này."; khối Thẻ nhóm hiện "Nhóm chưa có thẻ" (không có ô "Thẻ đúng không").
    E8-step3.png (nhóm "GCN thử bài ba tin"): mô tả "5 trường khác máy. Bài có 3 tin; đang so với tin đầu. AI chưa đọc bài này." Bộ đọc có giá trị tin đầu (6 triệu, rb, 2), ô khác máy được badge vàng (Loại hình, Toà, Phòng ngủ, Giá cao nhất 6 triệu so với 12 triệu, Tên). Thẻ nhóm "Nhóm thử có thẻ."
    E8-step4.png (390x2800, nền tối): bảng "So với máy" xếp dọc, mỗi trường có dòng giá trị Anh gắn không nhãn rồi "Bộ đọc", "AI đọc"; badge khác máy vẫn thấy; "Ghi trường hợp" và "Trường hợp theo nhóm" xếp dưới; không có thanh cuộn ngang. Lưu ý nhỏ: ở khổ hẹp giá trị Anh gắn là dòng đầu mỗi hàng, không có nhãn "Anh gắn" riêng, nhưng thứ tự vẫn rõ, không ảnh hưởng expected. Bảng "Trường hợp theo nhóm" ở cuối cắt chữ tên nhóm thành nhiều dòng hẹp (thẩm mỹ, không tràn trang).
  network_observed: clean

- eval: E9
  run_id: minted-gan-nhan-theo-nhom-s03-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T11:40:51Z
  output: |
    ℹ duration_ms 1291.389916

- eval: E10
  run_id: minted-gan-nhan-theo-nhom-s03-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T11:40:51Z
  output: |
    ℹ duration_ms 1291.389916

- eval: E11
  run_id: minted-gan-nhan-theo-nhom-s03-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_cases
  verified_at: 2026-11-04T11:16:10Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-gan-nhan-theo-nhom-s03-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_do_cu
  verified_at: 2026-11-04T11:40:51Z
  output: |
    DO-CU OK

- eval: E13
  run_id: minted-gan-nhan-theo-nhom-s03-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mgn_app
  verified_at: 2026-11-04T11:40:51Z
  output: |
    ℹ duration_ms 1537.664208

- eval: E14
  run_id: minted-gan-nhan-theo-nhom-s03-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T11:40:51Z
  output: |
    ℹ duration_ms 1291.389916

- eval: E15
  run_id: minted-gan-nhan-theo-nhom-s03-E15-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-11-04T11:40:51Z
  output: |
    design-floor-s4: không báo hex thô mới (lệnh không in dòng tóm tắt)

- eval: E16
  run_id: design-gate-73c3f84ecc
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.gcn_gate
  verified_at: 2026-11-04T11:40:51Z
  output: |
    design-gate P0 chạy trên 10 tệp màn của lát labels, không báo lỗi

- eval: E17
  run_id: E17-20261104-ui-v2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-04T11:40:51Z
  screenshot: evidence/E17-step1.png
  observed: |
    E17-step1.png (Read, 1280x1400): màn /ops/labels?lat=s03-theo-nhom, bảng «Trường hợp theo nhóm», mô tả «Chỉ có số. Chữ lý do đọc qua lệnh xuất ở máy thu.», bốn cột Nhóm | Đã gắn | Cần ngữ cảnh | Trường hợp. Hàng của ba nhóm đã seed: «GCN thử có máy đọc» 1/2, cần ngữ cảnh 1, «Mặc định theo nhóm 1»; «GCN thử chưa có máy» 1/1, 1, «Mặc định theo nhóm 1»; «GCN thử bài ba tin» 1/1, 1, «Mặc định theo nhóm 1». Toàn bộ 28 nhóm còn lại ghi «chưa có» ở cột Đã gắn và «—» ở hai cột kia. Không có chữ lý do (chuỗi mồi LYDO-KHONG-LEN-BANG) trong ảnh. Bảng chỉ có số, đọc được theo nhóm: khớp Expected. E17-step2.png (Read, 390x844): cùng bảng ở khổ hẹp, cuộn tới nhóm giữa bảng; cột Nhóm bẻ chữ nhiều dòng nhưng cả bốn cột còn trong khung, các hàng «GCN thử …» hiện 1/2, 1/1 cùng «Mặc định theo nhóm 1», hàng khác «chưa có»; không thanh cuộn ngang, không cột bị cắt: khớp Expected. Bề rộng trang đo bằng eval là 390, bằng khổ màn.
  network_observed: clean

- eval: E18
  run_id: minted-gan-nhan-theo-nhom-s03-E18-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_round_trip
  verified_at: 2026-11-04T11:40:51Z
  output: |
    ROUND-TRIP OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-04T11:40:51Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-04T11:40:51Z

- cmd: cd app && npm test
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  verified_at: 2026-11-04T11:40:51Z
  # lệnh này không gắn eval nào và còn đỏ — nguyên nhân REJECT của vòng 2
  output: |
    Bộ test: tests/ops-nhan-theo-context.test.tsx
    Một ca so danh sách tệp (deepStrictEqual) lệch, mong đợi ['src/components/ops/review-content.tsx'].
    ca ON12-AC-1 «0 từ _Avoid_ trên chuỗi hiển thị của phạm vi quét»: 15 !== 0
    Các chỗ bị báo (không có tệp nào thuộc components/ops/labels):
      ai-calls/ai-calls-view.tsx:166 «lỗi»; design/catalog-samples.tsx:128 «lỗi»;
      people/person-view.tsx:137 «bằng chứng»; review-content.tsx:42 «bằng chứng»;
      sources/so-don-vi.tsx:57 «lỗi»; sources/source-groups.tsx:71,75,83,97 «lỗi»;
      states/app-crash.tsx:33,36; states/page-error.tsx:27,30; states/region-error.tsx:27,28 «lỗi»

- cmd: cd pipeline && npm test
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-04T11:40:51Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-04T11:40:51Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-04T11:40:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Field baseline cua moi eval ghi n-a vi round nay khong do; evals.yaml khong doi tu lan baseline cuoi (round 1).

Eval khong-phan-biet (xanh tren CA code moi lan baseline round 1, chung minh harness chu khong phai tinh nang; viet lai de assert hanh vi moi hoac xac nhan la regression-guard co chu y):
- E13 — `cd app && node --import tsx --test tests/labels.test.tsx`
- E15 — `design-floor-s4.mjs --root .`

## Variance

none — mọi eval chạy một lần và xác định, không có eval nhiều lần chạy hay bị lúc xanh lúc đỏ

## Iterations

Round 1: các eval của tính năng đều xanh nhưng ba lệnh suite không gắn eval (`cd app && npm test`, `cd pipeline && npm test`, `node scripts/check-portal-compliance.mjs`) thoát khác 0 — REJECT. Trả về thi công.
Round 2: 16 eval chạy lại và xanh, E3 và E11 mang từ vòng 1 (delta không chạm paths của eval). `cd pipeline && npm test` và `node scripts/check-portal-compliance.mjs` đã xanh; còn `cd app && npm test` đỏ ở bộ `ops-nhan-theo-context` (15 chuỗi chạm từ _Avoid_ trên cổng Ops, không thuộc tệp labels) — REJECT.
