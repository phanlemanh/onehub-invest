# doc-gop-env-rong — thiết kế

## Vấn đề

`pipeline/doc-gop-hang-ngay.sh` (PL34, #384) dựng mảng `ENV_FILE=()` và chỉ thêm `--env-file=<gốc>/.env` khi kho có
`.env`. Lời gọi node dùng `"${ENV_FILE[@]}"`. Tệp chạy `set -u`; `/bin/bash` 3.2 của macOS coi mảng rỗng là biến chưa
đặt, nên kho không có `.env` thì bước chết «ENV_FILE[@]: unbound variable» trước lời gọi đầu, mã 1, cả hai bước.

Đo 10/11 (lượt S4 của `app-test-chap-chon-e4b-sap`, worktree không có `.env`): bộ `cd agent && npm test` đỏ đúng ca
PL34-AC-8. Máy thu có `.env` nên job đêm không hỏng; CI chạy bash 5 nên xanh. Mọi worktree không chép `.env` thì đỏ.

## Cách sửa

Một dòng: `${ENV_FILE[@]+"${ENV_FILE[@]}"}` — mở mảng chỉ khi đã đặt; bash 3.2 và bash 5 cùng nghĩa.

## Phép đo

- DGER-AC-1: chép tệp bước đêm + `scripts/lib/job-step.sh` vào một gốc kho tạm, chạy bằng `/bin/bash` (macOS: 3.2) với
  node giả. Không `.env` → thoát 0, hai lời gọi, không cờ `--env-file`. Có `.env` → hai lời gọi mang cờ.
- DGER-AC-2 (đối chứng): cùng hộp, chép bản trước vòng (`"${ENV_FILE[@]}"` trần) → thoát khác 0, stderr
  «ENV_FILE[@]: unbound variable», không lời gọi nào. Chỉ đo được khi `/bin/bash` là bản 3; bash khác thì ca tự bỏ qua
  kèm lý do (CI Linux).
- PL34-AC-8 giữ nguyên, phải xanh ở worktree không có `.env`.

## Lối khác đã bỏ

- Chép `.env` vào worktree: chỉ che lỗi, mọi worktree mới vẫn đỏ; phiên Claude không được đọc `.env`.
- `set +u` quanh lời gọi: rộng hơn cần, che biến chưa đặt khác.
