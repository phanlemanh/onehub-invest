# job-step.sh — bộ chạy bước dùng chung cho job launchd (AU3 `job-bao-loi-that`).
# Nạp bằng `source`, không chạy trực tiếp. Bash 3.2 (macOS) chạy được.
#
#   job_step <job> <nhãn> <lệnh…>
#
# Chạy lệnh, trả ĐÚNG mã thoát của nó. Mã ≠ 0 → in một dòng ghim ra stderr:
#   JOB FAIL [<job>] bước <nhãn> mã <n>
# Dòng này là thứ người tìm trong log launchd và phép đo `scripts/job-exit.test.mjs` đọc.
# Không đổi đầu ra của chính lệnh. Không tự thoát — tệp bọc quyết dừng hay chạy tiếp.

job_step() {
  local job="$1" label="$2"
  shift 2
  "$@"
  local rc=$?
  if [ "$rc" -ne 0 ]; then
    echo "JOB FAIL [$job] bước $label mã $rc" >&2
  fi
  return "$rc"
}

#   job_run <job> <nhãn> <lệnh…>
#
# Như job_step, nhưng luôn trả 0 để chuỗi chạy tiếp; mã hỏng ĐẦU TIÊN được giữ ở JOB_RC.
# Tệp bọc kết thúc bằng `exit "$JOB_RC"` — luồng dữ liệu y như trước, chỉ mã thoát nói thật.
JOB_RC=${JOB_RC:-0}

job_run() {
  job_step "$@"
  local rc=$?
  if [ "$rc" -ne 0 ] && [ "$JOB_RC" -eq 0 ]; then
    JOB_RC=$rc
  fi
  return 0
}
