---
schema_version: 2
feature_slug: sourceid-tin-anh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7617e4a21b697fb63ce8745f4da734c1affa8faf
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: sourceid-tin-anh

ZC1 (T2) — hai tin chỉ có ảnh cùng nhóm cùng thời điểm đều vào raw với sourceId khác nhau.
Vòng verify 1, phiên ngữ cảnh sạch, HEAD = 9fc3336 (code `collector/` và
`pipeline/import-airbnb.mjs` trùng 7271b32).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: sourceid-tin-anh-E1-20261023T095002
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc1_sourceid
  cmd: cd collector && rm -rf dist && npm run build && cd .. && node scripts/kev-nhan/acceptance.mjs sourceid
  verified_at: 2026-10-23T09:50:02Z
  output: |
    3 tin chỉ ảnh: {"accepted":3,"duplicates":0} · lặp y hệt: {"accepted":0,"duplicates":1} · tin chữ: {"accepted":1,"duplicates":0} / {"accepted":0,"duplicates":1}
    ok   khác sender hoặc khác URL, cùng nhóm cùng ts → 3 tin đều được nhận
    ok   3 RawItem chỉ ảnh mang 3 sourceId khác nhau
    ok   snapshot có 4 item (3 chỉ ảnh + 1 tin chữ), được 4
    SOURCEID PASS

- eval: E2
  run_id: sourceid-tin-anh-E2-20261023T095004
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc1_sourceid
  cmd: cd collector && rm -rf dist && npm run build && cd .. && node scripts/kev-nhan/acceptance.mjs sourceid
  verified_at: 2026-10-23T09:50:04Z
  output: |
    3 tin chỉ ảnh: {"accepted":3,"duplicates":0} · lặp y hệt: {"accepted":0,"duplicates":1} · tin chữ: {"accepted":1,"duplicates":0} / {"accepted":0,"duplicates":1}
    ok   khác sender hoặc khác URL, cùng nhóm cùng ts → 3 tin đều được nhận
    ok   3 RawItem chỉ ảnh mang 3 sourceId khác nhau
    SOURCEID PASS

- eval: E3
  run_id: sourceid-tin-anh-E3-20261023T095005
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc1_sourceid
  cmd: cd collector && rm -rf dist && npm run build && cd .. && node scripts/kev-nhan/acceptance.mjs sourceid
  verified_at: 2026-10-23T09:50:06Z
  output: |
    3 tin chỉ ảnh: {"accepted":3,"duplicates":0} · lặp y hệt: {"accepted":0,"duplicates":1} · tin chữ: {"accepted":1,"duplicates":0} / {"accepted":0,"duplicates":1}
    ok   should-NOT-fire: tin chỉ ảnh lặp y hệt (cùng sender, cùng URL) vẫn bị khử trùng
    SOURCEID PASS

- eval: E4
  run_id: sourceid-tin-anh-E4-20261023T095007
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc1_sourceid
  cmd: cd collector && rm -rf dist && npm run build && cd .. && node scripts/kev-nhan/acceptance.mjs sourceid
  verified_at: 2026-10-23T09:50:07Z
  output: |
    ok   tin có chữ (kèm ảnh) giữ nguyên id cũ sha256(group|ts|text) = b8117e9fd720…
    ok   tin chữ cùng nội dung khác sender vẫn trùng như trước (công thức cũ không đổi)
    SOURCEID PASS

- eval: E5
  run_id: sourceid-tin-anh-E5-20261023T095015
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1_stg_roundtrip
  cmd: cd collector && rm -rf dist && npm run build && cd .. && node scripts/kev-nhan/acceptance.mjs stg-roundtrip
  verified_at: 2026-10-23T09:50:16Z
  output: |
    nạp: exit 0 · đã nạp: 0 listings (+0 đêm), 0 discovery refs, 0 osm boundaries, 2 zalo posts (2 có media_files)
    stg_zalo_posts của snapshot: 2 dòng · sender [s1, s2]
    ok   import-airbnb nạp snapshot v3 không lỗi
    ok   hai event ảnh cùng nhóm cùng ts → hai raw item
    ok   → hai dòng stg_zalo_posts khác post_id
    dọn: xoá 1 snapshot · còn 0 dòng stg của snapshot giả
    ok   dọn sạch dữ liệu giả
    STG-ROUNDTRIP PASS

### An toàn DB (E5)

- Đã đọc harness trước khi chạy: kiểm `snapshot_id` trong `airbnb_snapshots` và `post_id` trong
  `stg_zalo_posts` chưa tồn tại (có thì bỏ chạy, không nạp), nhóm giả `acc-zc1-<epoch>`, dọn bằng
  `DELETE FROM airbnb_snapshots WHERE snapshot_id = $1` (cascade sang `stg_zalo_posts`).
- `stg_zalo_posts` 2242 dòng trước và 2242 dòng sau; `airbnb_snapshots` 528 trước và 528 sau; còn 0 dòng có
  `group_name LIKE 'acc-zc1-%'`. Các bảng khác có cột `snapshot_id` không phải đích ghi của import zalo.
- Collector API :9210 giữ nguyên PID (63069); `~/.openclaw/logs` mtime không đổi.

## Known limits

- **Harness tuyên bố `skipMedia` nhưng tuỳ chọn đó không tồn tại.** `stg-roundtrip` gọi
  `s.flush({ skipMedia: true })`, còn `flush()` trong `collector/src/api/server.ts` không nhận tham số, nên
  `fetchMessageMedia` vẫn chạy với allowlist mặc định `zdn.vn`. Chế độ `sourceid` gọi `flush()` thẳng. Vì thế
  E1–E5 (cả ở lượt baseline) đã gửi HTTP GET thật tới `f1.zdn.vn` cho các đường ảnh giả (`/x.jpg`, `/a.jpg`…).
  Không có gì gửi vào Zalo, không chạm :8009/:9210, và media fail-open nên không đổi kết quả eval. Nhưng câu
  «nạp với skipMedia (không tải ảnh thật)» trong Notes của hợp đồng không đúng. Dòng «2 có media_files» là
  `meta.mediaFiles` mang lỗi tải.
- Cùng một ảnh giao lại với URL khác (token ký zdn.vn khác) ra hai sourceId — đúng như «Out of scope» của hợp
  đồng (chưa chuẩn hoá URL). Phép thử riêng xác nhận: `a.jpg?tok=1` và `a.jpg?tok=2` cùng sender, cùng ts →
  2 accepted.
- E3 và E4 xanh trên baseline ce4ad81 (ở mức từng dòng kiểm): chúng là ca giữ hành vi cũ (lặp y hệt vẫn khử
  trùng; tin có chữ giữ công thức cũ), không phân biệt code mới với code cũ — đúng ý đồ hồi quy.
- E5 không đo baseline (n-a): eval ghi DB local dùng chung, và flush trên cây cũ cũng tải ảnh thật; phần phân
  biệt đã được lượt baseline của `sourceid` chứng (cây cũ: 3 tin chỉ ảnh → 1 accepted, 2 duplicates).

## Ngoài hợp đồng

- **Thứ tự media đổi → sourceId đổi.** URL được nối theo thứ tự nhận, không sắp xếp. Tin chỉ ảnh `[a, b]` rồi
  `[b, a]` cùng nhóm/ts/sender → 2 accepted. Hook giữ thứ tự của OpenClaw nên chỉ lộ ra khi runtime đổi thứ tự
  lúc giao lại.
- **`url` và `path` cùng có:** công thức dùng `m.url ?? m.path`. Cùng tin, một lần giao có url+path và một lần
  chỉ có path → 2 sourceId (phép thử riêng P3: 2 accepted).
- **Text toàn khoảng trắng:** hook `trim()` nên đường hook an toàn. Server thì không trim; `!text` sai với
  `"  "`, nên rơi về công thức cũ và hai tin chỉ ảnh khác sender, khác ảnh vẫn đụng nhau (phép thử riêng P4:
  `{"accepted":1,"duplicates":1}`). Chỉ lộ ra với bên gọi API khác hook.
- **Hồi quy độ bền ingest:** với tin text rỗng, `media` không phải mảng (vd object) hoặc chứa `null` thì
  `sourceIdOf` ném `TypeError`. `ingest` không bắt lỗi, nên `main.ts` trả 500 cho cả lô, trong khi các tin đứng
  trước trong lô đã vào `seen`/buffer. Code cũ không đụng `media` khi tính id nên nhận bình thường. Hook luôn gửi
  mảng đã lọc, nên đường thật hiện không chạm. Tái hiện: `createAgentServer` trên thư mục tạm, ingest
  `{text:"", ts, media:{url:"x"}}` hoặc `media:[null]`.
- **Id cũ trong `state/agent-seen.json`:** sau khi triển khai, một tin chỉ ảnh từ trước triển khai nếu được giao
  lại sẽ mang id mới, không khớp id cũ đã lưu → vào raw lần hai. Ảnh hưởng nhất thời, hợp đồng đã ghi «không
  backfill».

## Analyst

Non-discriminating evals: E3, E4 — xanh trên cả nhánh lẫn baseline; đây là ca giữ hành vi cũ có chủ ý
(should-NOT-fire và giữ nguyên id tin có chữ), không chứng tính năng mới.

Baseline khong do: E5 — eval ghi DB local dùng chung; theo brief, không chạy trên cây cũ khi không chắc (flush
trên cây cũ cũng tải ảnh thật).

Baseline (ce4ad81, worktree tạm ngoài repo, chép harness, `npm ci` + build collector; đã gỡ worktree):
`sourceid` red — 3 tin chỉ ảnh khác sender/khác URL ra `{"accepted":1,"duplicates":2}` và snapshot 2 item thay
vì 4 (E1, E2 red). Các dòng kiểm của E3, E4 xanh.

## Variance

none — mọi eval đều tất định (runs: 1). E1–E4 chạy chung lệnh bốn lần riêng, kết quả trùng nhau.

## Iterations

Round 1: 5/5 eval PASS; không có lỗi chạm tiêu chí. Harness có một khiếm khuyết (skipMedia không có tác dụng) ghi
ở Known limits. Các phát hiện ngoài hợp đồng để người quyết.

### Re-pin lần 1 — 2026-10-23, do hoá cũ do merge origin/main d72479f (ZC3 PR #31) vào nhánh
run_id: repin-20261023T103114Z-38290
sha: 7617e4a21b697fb63ce8745f4da734c1affa8faf · suites: 6 lệnh exit 0 · evals: 5/5 eval máy đạt kỳ vọng
