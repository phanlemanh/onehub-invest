---
schema_version: 2
feature_slug: nhom-moi-requiremention
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6f62fec74e6e30f3a15591281ad0c7bb0f3e2ffe
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: nhom-moi-requiremention

Hạng T3 (khai tay trong hợp đồng — an toàn Zalo, luật 8). Mọi eval là `test`; không có eval judgment, không có ui-check
(`network_observed` không áp dụng).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | test | PASS |

## Evidence

Hai lệnh đã khử trùng: `cd app && npm test` (E1–E9, một lượt, 252 ca, chạy 00:33:43Z–00:34:05Z) và
`cd app && npx tsc --noEmit && npm run lint` (E10, 00:34:05Z–00:34:17Z), cả hai trên cây HEAD 6f62fec, timeout công cụ
600000 ms, không bị công cụ ngắt. Đầu ra đầy đủ ở `.acceptance-runs/nhom-moi-requiremention/` (`app_ui.txt`, `app_lint.txt`).
Tổng kết TAP của lượt `npm test`: tests 252 · pass 252 · fail 0 · cancelled 0 · skipped 0 · duration_ms 21352.

- eval: E1
  run_id: nhom-moi-requiremention-E1-20261025T003405Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:34:05Z
  output: |
    ✔ NM-AC-1 nhóm mới ở 4 bố cục → {enabled:true, requireMention:true} đúng chỗ (12.51425ms)
    ✔ NM-AC-1 bản sao dựng nhóm mới requireMention false, gỡ kiểm → tệp nhận false (55.961167ms)
    Đọc test: mỗi bố cục (default có groups riêng · default kế thừa channel · layout cũ · acc2) so deepEqual mục
    group:moi đúng đường khoá VÀ deepEqual enabledGroups hiệu dụng của mọi tài khoản trước/sau (chỉ thêm group:moi ở
    tài khoản thao tác); bố cục kế thừa còn so groups cấp channel giữ nguyên; bản sao nạp qua napBanSao (rào chạy trên bản sao).

- eval: E2
  run_id: nhom-moi-requiremention-E2-20261025T003405Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:34:05Z
  output: |
    ✔ NM-AC-2 bật lại nhóm false/thiếu khoá/có khoá khác ở default và acc2 → enabled:true + requireMention:true, khoá khác giữ nguyên (47.580709ms)
    ✔ NM-AC-2 bản sao bật lại chỉ đặt enabled → giữ false (24.305084ms)
    Đọc test: 6 nhóm (f, t, k × default, acc2), mỗi nhóm so deepEqual với {...trước, enabled:true, requireMention:true}
    — khoá allow, ghiChu giữ nguyên giá trị; cấu hình sau cùng sạch theo hàm kiểm.

- eval: E3
  run_id: nhom-moi-requiremention-E3-20261025T003405Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:34:05Z
  output: |
    ✔ NM-AC-3 tắt nhóm có sẵn, nhóm chưa có, và đúng nhóm đang phạm → ghi thành công, KHÔNG bị chặn (17.210416ms)
    Đọc test: group:a → {enabled:false, requireMention:true}; group:chua → {enabled:false, requireMention:true};
    cấu hình phạm đúng một chỗ (khẳng định length 1) → tắt X → hàm kiểm trả []; sau mỗi lần ghi đúng 1 tệp .bak-.

- eval: E4
  run_id: nhom-moi-requiremention-E4-20261025T003405Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:34:05Z
  output: |
    ✔ NM-AC-4 cấu hình sạch → [] (0.152958ms)
    ✔ NM-AC-4 ma trận vi phạm → có vi phạm đúng nhãn lớp (0.621958ms)
    ✔ NM-AC-4 sát ranh KHÔNG phạm → [] (0.059125ms)
    Đọc test: ma trận khẳng định đủ 23 ca (L2 ×4, L3 ×1, L3b ×11, groupPolicy ×2, hỏng ×5); mỗi ca doesNotThrow, có vi
    phạm mở đầu đúng nhãn lớp, ca L3b nêu id nhóm; thêm 5 gốc không phải object; 4 ca sát ranh trả [].

- eval: E5
  run_id: nhom-moi-requiremention-E5-20261025T003405Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:34:05Z
  output: |
    ✔ NM-AC-5 băm đoạn trích bằng băm ghim (0.40775ms)
    ✔ NM-AC-5 bộ canh phán vi phạm ⇒ hàm kiểm phán vi phạm trên mọi tệp của ma trận AC-4 (1968.898167ms)
    ✔ NM-AC-5 sát ranh: cả hai KHÔNG phán vi phạm (417.129416ms)
    Đọc test: đoạn trích lấy lúc chạy (biểu thức N_BIND và khối giữa << 'EOF' / EOF), chạy python trên từng tệp của
    23 ca phạm + 4 sát ranh + sạch; python thoát khác 0 hay L2 không in "0" tính là vi phạm (khớp cách bộ canh gọi alert);
    có đối chứng dương (bộ canh thật sự bắt bindings 1 entry và hai ca L3b) nên phép bao hàm không rỗng.

- eval: E6
  run_id: nhom-moi-requiremention-E6-20261025T003405Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:34:05Z
  output: |
    ✔ NM-AC-6 cấu hình phạm ở chỗ khác → bật và tắt nhóm khác đều bị từ chối: hàm ném + route 400 nêu lớp, tệp nguyên byte, không .bak mới (36.096583ms)
    ✔ NM-AC-6 bản sao gỡ lời gọi kiểm → tệp bị ghi (23.308084ms)
    ✔ NM-AC-6 bản sao giữ kiểm, dựng nhóm false → L3b nêu group:moi ở 4 bố cục, tệp nguyên byte (42.930834ms)
    Đọc test: 4 cấu hình (nhóm khác false · bindings 1 entry · channels.zalo · groupPolicy open); hàm bị reject với regex
    lớp ở cả bật lẫn tắt; handler POST thật với Bearer = OPS_API_TOKEN trả 400 và error khớp lớp; Buffer.equals byte gốc; baks() rỗng.

- eval: E7
  run_id: nhom-moi-requiremention-E7-20261025T003405Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:34:05Z
  output: |
    ✔ NM-AC-7 thước tĩnh: một hàm ghi cấu hình writeCfg một tham số, câu đầu là bước kiểm, mọi lời gọi ghi nằm trong nó (0.468958ms)
    ✔ NM-AC-7 createZaloAccount/deleteZaloAccount trên cấu hình phạm → từ chối, tệp nguyên byte (248.951083ms)
    ✔ NM-AC-7 bản sao kiểm sau writeFile (0.370792ms)
    ✔ NM-AC-7 bản sao thêm writeFile(CONFIG) ngoài writeCfg (0.22925ms)
    ✔ NM-AC-7 bản sao thêm tham số bỏ kiểm (0.223625ms)
    Đọc test: ba chiều đỏ so đúng thông điệp nêu tệp app/src/lib/zalo-admin.ts và lớp vi phạm.

- eval: E8
  run_id: nhom-moi-requiremention-E8-20261025T003405Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:34:05Z
  output: |
    ✔ NM-AC-8 rào: homedir, openclaw, config, tệp python dưới thư mục tạm; DATABASE_URL cổng đóng (112.258583ms)
    ✔ NM-AC-8 rào với HOME thật / đoạn trích có pkill trả vi phạm nêu đường lạc (0.279167ms)
    ✔ NM-AC-8 bật/tắt nhóm không gọi openclaw → nhật ký giả rỗng (25.607292ms)
    Đọc test: zalo-admin và route chỉ import động trong before() sau khi đặt HOME/PATH/DATABASE_URL giả, ca tự quét
    nguồn của chính nó để cấm import tĩnh; napBanSao và chayTrich chạy rào trước khi dùng; env python có HOME giả.

- eval: E9
  run_id: nhom-moi-requiremention-E9-20261025T003405Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:34:05Z
  output: |
    Đủ 28 ca GT-AC-* / LK-AC-* trong TAP (11 GT-AC + 17 LK-AC), bằng đúng 28 tên ca trong
    app/tests/go-tai-khoan-kiem-id.test.tsx và app/tests/login-kiem-id.test.tsx; cả hai tệp không đổi ở commit này.
    ✔ GT-AC-5 chỗ logout trong app/src bằng đúng danh sách viết trước [zalo-admin.ts · deleteZaloAccount] và đứng sau requireDeletableAccount (40.69ms)
    ✔ LK-AC-7 chỗ login trong app/src bằng đúng danh sách viết trước [zalo-admin.ts · startZaloLogin] và đứng sau requireLoginAccount (19.515375ms)

- eval: E10
  run_id: nhom-moi-requiremention-E10-20261025T003417Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-25T00:34:17Z
  output: |
    > eslint && node eslint-plugin-onehub-ui/check-bare-disables.mjs
    ✖ 3 problems (0 errors, 3 warnings)
    tsc --noEmit không in lỗi nào; 3 cảnh báo react-hooks/exhaustive-deps (investment-simulator.tsx, user-event-beacon.tsx,
    use-file-upload.ts) khớp chú thích «3 cảnh báo cố ý» của executors.test.app trong _acceptance/config.yaml; không tệp nào của hồ sơ này.

## Known limits

- Mọi phép đo chạy trên cấu hình chép trong thư mục tạm với openclaw giả. Không eval nào đo gateway OpenClaw thật: việc
  gateway nạp nóng cấu hình đã kiểm, và khẳng định của Context «requireMention:true không làm mất tin thu (hook nhận tin
  SAU admission, TRƯỚC mention gate)» chưa được phép đo nào của hồ sơ chứng minh — đúng phạm vi hợp đồng (Out of scope),
  nhưng là rủi ro vận hành còn để ngỏ.
- AC-6: handler POST thật chỉ được gọi với thao tác bật (`enabled: true`); thao tác tắt nhóm khác trên cấu hình phạm chỉ
  đo qua `setZaloGroupEnabled`. Route chỉ chuyển tiếp hàm và đổi mọi lỗi thành 400, nên rủi ro thấp.
- AC-7: thước tĩnh dựa trên regex tên hàm (`writeFile`, `copyFile`, `rename`, `appendFile`, bản `Sync`); API ghi khác
  (`createWriteStream`, `open` + `write`) và việc chính CLI openclaw ghi cấu hình (comment trong `deleteZaloAccount`
  nói CLI có thể ghi config trong lúc logout) nằm ngoài tầm thước và ngoài bước kiểm.
- AC-5: phép bao hàm chạy trên 23 ca phạm + 4 sát ranh + cấu hình sạch chuẩn; hai cấu hình sạch phụ của AC-4 (bố cục kế
  thừa, layout cũ) không đưa qua đoạn trích bộ canh. Đọc khối python của bộ canh thì cả hai không bị nó phán vi phạm,
  nên bao hàm không bị ảnh hưởng; ghi lại để người soát biết.

## Ngoài hợp đồng

- `deleteZaloAccount` gọi `openclaw channels logout --account <id>` TRƯỚC `writeCfg`. Trên cấu hình đang phạm, bước kiểm
  từ chối ghi (tệp nguyên byte, đúng AC-7) nhưng phiên đăng nhập của tài khoản đã bị logout — thao tác gỡ để lại trạng
  thái nửa chừng (tài khoản còn trong cấu hình, phiên đã mất). Không thuộc tiêu chí nào; cân nhắc kiểm cấu hình trước
  khi logout ở một hàng riêng.

## Analyst

Baseline không đo: đường VERIFY độc lập này không chạy làn baseline trên diffBase, nên field `baseline:` của mọi eval ghi
n-a. Theo cấu trúc mã: trên cây trước commit, `zaloConfigViolations` chưa được xuất và tệp
`app/tests/nhom-moi-requiremention.test.tsx` chưa tồn tại, nên E1–E8 không thể xanh ở baseline; E9 và E10 là
regression-guard có chủ ý (test GT/LK và tsc/lint), dự kiến xanh cả hai phía.

Eval không-phân-biệt: không xác định được (baseline không đo).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1 đến E10 đều đạt (một lượt `cd app && npm test` 252/252 ca, một lượt tsc + lint 0 lỗi); không eval nào hỏng,
không có mục judgment. Verdict PASS.
