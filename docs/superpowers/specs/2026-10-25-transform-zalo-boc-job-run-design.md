# Thiết kế — transform-zalo-boc-job-run

Căn cứ: Cổng Bằng chứng `au3-nap-bao-loi` 25/10 — Mạnh chọn «Ngoài-3: mở hợp đồng mới» (sổ dòng
`d-20261025T045838Z-3`); giám sát P4-33 («Chỉ sửa bước làn Claude; import_one/state/khoá giữ nguyên»); bảng «Job đêm báo
lỗi thật» của `docs/ops/runtime-map.md` (AU3).

## Vấn đề

`scripts/zalo-import-daily.sh` (`set -uo pipefail`, không `-e`) kết thúc bằng hai dòng trần:
`node pipeline/transform-zalo.mjs` rồi `node pipeline/refresh-bait-gap.mjs`. Mã thoát của job là mã của bước CUỐI:
transform hỏng, refresh lành → job thoát 0, launchd ghi «last exit 0».

## Cách làm

Đúng khuôn đã chốt ở AU3 cho `apify-facebook-daily.sh` (cùng bộ chạy bước `scripts/lib/job-step.sh`):

```bash
# Từ đây trở xuống là làn Claude (AU3): …
. "$ROOT/scripts/lib/job-step.sh"
job_run zalo-import-daily transform-zalo node "$ROOT/pipeline/transform-zalo.mjs"
job_run zalo-import-daily refresh-bait-gap node "$ROOT/pipeline/refresh-bait-gap.mjs"
exit "$JOB_RC"
```

- Hai bước vẫn chạy đủ như cũ (refresh chạy cả khi transform hỏng — hành vi hiện tại).
- Job thoát bằng mã của bước hỏng ĐẦU TIÊN; mỗi bước hỏng in một dòng `JOB FAIL [zalo-import-daily] bước <nhãn> mã <n>`
  ra stderr.
- Mọi dòng trước khối này (nạp, `import_one`, state, khoá, thoát 1 khi nạp hỏng) giữ nguyên từng byte — làn ZCode.
- `docs/ops/runtime-map.md`: thêm dòng `com.oneinvest.zalo-import` vào bảng «Job đêm báo lỗi thật».

## Phép đo

`scripts/zalo-import-job.test.mjs` (khuôn `scripts/job-exit.test.mjs`): chép NGUYÊN tệp bọc thật + `job-step.sh` vào cây
tạm có một snapshot `…__zalo-agent__<mốc>`; `node` giả đầu PATH ghi lời gọi và hỏng theo `FAIL_STEPS`; HOME tạm,
`DATABASE_URL` cổng đóng — không node thật, không DB, không OpenClaw. Chiều đỏ: bản tệp bọc ở main trước vòng (lấy bằng
`git show`) với transform hỏng thoát 0.

## Không làm

- Đoạn nạp (`import_one`, state, khoá) — làn ZCode; bản vá P1.5 nằm trên nhánh `zcode/audit-p1-resilience`.
- Đổi thứ tự hay dừng chuỗi khi transform hỏng (refresh vẫn chạy như cũ).
- Plist launchd và cảnh báo khi job đỏ.
