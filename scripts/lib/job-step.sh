# job-step.sh — bộ chạy bước dùng chung cho job launchd (AU3 `job-bao-loi-that`).
# Nạp bằng `source`, không chạy trực tiếp. Bash 3.2 (macOS) chạy được.
#
#   job_step <job> <nhãn> <lệnh…>
#
# Chạy lệnh, trả ĐÚNG mã thoát của nó. Mỗi bước in MỘT dòng ghim thời lượng ra stderr:
#   JOB STEP [<job>] bước <nhãn> mã <n> giây <s> nhanh <c>
# Mã ≠ 0 → in thêm một dòng ghim NGAY SAU nó:
#   JOB FAIL [<job>] bước <nhãn> mã <n>
# Hai dòng này là thứ người tìm trong log launchd và phép đo `scripts/job-exit.test.mjs`,
# `scripts/job-step-thoi-luong.test.mjs` đọc.
# Không đổi đầu ra của chính lệnh. Không tự thoát — tệp bọc quyết dừng hay chạy tiếp.

#   job_step_ghi <job> <nhãn> <mã> <giây>
#
# In MỘT dòng ghim thời lượng ra stderr, không làm gì khác. KHÔNG mở, KHÔNG ghi tệp nào: hai plist
# của job nạp (`com.oneinvest.s03-nap-15phut`, `com.oneinvest.zalo-import`) đã đổ cả StandardOut lẫn
# StandardError vào log riêng của từng lượt, nên dòng này nằm sẵn trong một tệp đọc được. Một sổ
# riêng chỉ thêm một bề mặt hỏng vào đúng job mà phép đo không được phép làm hỏng.
# Cột `nhanh` = 1 CHỈ khi S03_LUOT_NHANH đúng bằng chuỗi "1" (cờ lượt nạp nhanh 15′).
job_step_ghi() {
  local nhanh=0
  if [ "${S03_LUOT_NHANH:-}" = "1" ]; then nhanh=1; fi
  echo "JOB STEP [$1] bước $2 mã $3 giây $4 nhanh $nhanh" >&2
}

job_step() {
  local job="$1" label="$2"
  shift 2
  local t0=$(date +%s)
  "$@"
  local rc=$?
  local t1=$(date +%s)
  local giay=$((t1 - t0))
  # đồng hồ lùi giữa bước (NTP bước lùi) — báo 0 chứ không bao giờ báo giây âm
  if [ "$giay" -lt 0 ]; then giay=0; fi
  job_step_ghi "$job" "$label" "$rc" "$giay"
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
