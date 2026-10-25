# cloud-sync báo lỗi thật (AU13 · `cloud-sync-bao-loi-that`) — design

Hàng AU13 của `docs/plan/lo-trinh.json` (đợt `bo-sung-2310`), mở đầu chuỗi số tổng hợp Ops trên cloud theo ADR-0014
(AU13 → ON7 → NT2 → ON22). Gốc: hồ sơ AU3 `_acceptance/job-bao-loi-that/` để lại ô `P3-3` (Hỏi-1 A, Mạnh 23/10).

## Lỗ hiện tại

`scripts/cloud-sync.sh` (launchd 15′) chạy `sync-cloud.mjs` rồi `push-ops-facts.mjs` với `set -uo pipefail` nhưng
không `-e` và không gom mã: mã thoát của job là mã của bước CUỐI. `sync-cloud` hỏng (leak gate đỏ, PGRST, mạng) mà
`push-ops-facts` lành → launchd ghi 0, `launchctl list` báo xanh, không ai biết lượt đồng bộ đã dừng.

`pipeline/push-ops-facts.mjs` dòng 13 viết cứng `LOCAL_URL` là chuỗi kết nối tới `localhost:5433` — không đi
theo `DATABASE_URL` như mọi bước làn Claude khác, nên phép đo «bước thật trên cổng canh» của AU3 không chạy được
với nó (ô `todo` «AC-5 push-ops-facts»).

## Cách làm

1. `scripts/cloud-sync.sh` nạp `scripts/lib/job-step.sh` (AU3) và chạy hai bước bằng `job_run cloud-sync <nhãn> node …`,
   kết bằng `exit "$JOB_RC"`. Hai bước vẫn chạy cả hai như trước — `push-ops-facts` là kênh nhịp tim cho `/ops`, không
   được tắt khi sync hỏng — chỉ mã thoát nói thật (mã hỏng ĐẦU TIÊN) và mỗi bước hỏng in một dòng ghim
   `JOB FAIL [cloud-sync] bước <nhãn> mã <n>` ra stderr (log launchd).
2. `pipeline/push-ops-facts.mjs`: `LOCAL_URL = process.env.DATABASE_URL ?? <chuỗi cũ tới localhost:5433>`
   — vắng biến (như plist `com.oneinvest.cloud-sync` hiện nay) thì y như cũ. Không đổi gì khác trong tệp (ON2 của dãy
   P3 đang sửa hàm `scheduler()` cùng tệp — diff giữ một dòng).
3. Thước — lật hai ô `todo` P3-3 trong `scripts/job-exit.test.mjs` của AU3 thành ca thật, cùng khung đo:
   - AC-3: cây tạm cloud-sync nay chép cả `scripts/lib/job-step.sh`; ô «chập chờn» (sync-cloud hỏng, push-ops-facts
     lành) → ≠0, đúng một dòng ghim, push-ops-facts VẪN được gọi; thêm ô ngược (push-ops-facts hỏng, sync lành) và đột
     biến bỏ `job_run` ở từng bước (theo khuôn `mutateDropGuard` AU3 đã có).
   - AC-5: `push-ops-facts` vào danh sách bước thật (11 bước) — hộp cát, `DATABASE_URL` trỏ cổng canh → ≠0, cổng canh
     thấy lần nối, hộp cát không chặn gì; chiều đỏ trên bản sao push-ops-facts viết cứng `localhost:5433` → hộp cát chặn
     `:5433`, cổng canh không thấy; và ca «vắng DATABASE_URL» → hộp cát chặn đúng `:5433` (mặc định cũ còn nguyên, không
     chạm DB thật).
4. `docs/ops/runtime-map.md` mục job đêm: P3-3 đã vá — cloud-sync thoát ≠0 khi bước nào hỏng, dòng `JOB FAIL [cloud-sync]`,
   push-ops-facts theo `DATABASE_URL`. ROADMAP một dòng.

## Không làm

- Không sửa plist launchd (làn ZCode, luật đợt) — plist không cần `DATABASE_URL`.
- Không đẩy cảnh báo job hỏng lên `/ops` (ON22/ON23) hay watchdog (ZC3).
- Không sửa hồ sơ AU3 đã ký: `expected` của E3/E5 bên đó mô tả trạng thái `todo` trước vòng này — ghi vào Notes.
- Không chạy cloud-sync thật hay chạm DB chung :5433 khi đo.
