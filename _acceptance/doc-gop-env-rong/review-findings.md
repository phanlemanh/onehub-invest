## Trong hợp đồng

- **Hình dạng 3: chỉ assert chuỗi có mặt, trong khi AC-1 hứa một quan hệ: --env-file phải trỏ đúng <gốc>/.env của gốc kho tạm**
  file: `agent/tests/doc-gop-hang-ngay.test.ts:424`
  severity: medium
  AC: AC-1
  source: measurement
  detail: AC-1 trong contract.md hứa: «kho có .env thì cả hai lời gọi mang --env-file=<gốc>/.env». Đây là quan hệ giữa giá trị cờ và gốc kho tạm mà chayBuocGocTam vừa dựng (biến `goc` trong hàm), nhưng hàm không trả `goc` về. Assert ở dòng 424 chỉ khớp regex `/^--env-file=\S+\/\.env --import tsx .../`, nghĩa là chấp nhận mọi đường dẫn kết thúc bằng `/.env`. Một hồi quy làm script đọc .env của kho khác vẫn qua test, ví dụ ROOT suy sai rồi trỏ về checkout chính `~/dev/onehub-invest/.env`, hoặc về `$HOME/.env`. Như vậy phép đo chưa ghim được quan hệ «cờ trỏ đúng .env của chính gốc đang chạy». Hướng sửa: trả `goc` từ chayBuocGocTam rồi so bằng nhau với chuỗi `--env-file=${goc}/.env` (lưu ý mkdtemp trên macOS có thể ra /var hoặc /private/var, nên so qua realpath). Ghi chú về phạm vi: ROOT của tệp test suy từ import.meta.dirname nên không phạm hình dạng 6. Hộp thử chép script thật và job-step.sh thật nên không phạm hình dạng 2. AC-2 ghim thông điệp «ENV_FILE[@]: unbound variable», có đối chứng dương ở AC-1 và có assert notEqual cho chỗ sửa, nên không phạm hình dạng 4.
  rationale: AC-1 hứa rõ cả hai lời gọi mang --env-file=<gốc>/.env khi kho có .env, nhưng phép đo chỉ khớp đuôi /.env nên chưa chứng minh được quan hệ mà AC-1 nêu.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E3/AC-3 không tự dựng điều kiện «worktree không có .env» nên bằng chứng có thể rỗng nghĩa**
  Người dùng thấy gì: Khi chạy kiểm ở máy có sẵn tệp cấu hình, kết quả xanh của bộ test không chứng minh riêng cho tình huống thiếu tệp đó. Bước đọc gộp ban đêm vẫn chạy đúng, chỉ có lời khẳng định trong hồ sơ nghiệm thu hơi rộng hơn phép đo.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu; tình huống thiếu tệp đã có phép đo riêng ở tiêu chí khác, nên ghi lại hạn chế này là đủ và sửa sau rất rẻ.
  file: `_acceptance/doc-gop-env-rong/evals.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
