# Kế hoạch: audit-p1-resilience vòng 2 (hàng audit-p1-resilience-do-tren-main)

Thiết kế: `docs/superpowers/specs/2026-11-27-audit-p1-resilience-do-tren-main-design.md`. Cổng Phạm vi: Mạnh duyệt 27/11 07:44Z
(bậc T2; nghiệm thu nhánh mồ côi từ 30′ trở lên).

## Task 1: viết lại sandbox import-daily trong `scripts/audit-p1-resilience/acceptance.mjs`

- **Files:** chỉ `scripts/audit-p1-resilience/acceptance.mjs`, và chỉ trong mode `import-daily`.
- **Phục vụ:** E5, E9, E10, E11.
- **independent:** false (task duy nhất).
- **Việc:**
  1. `phanLop(src)` xếp mọi lần `$ROOT` theo luật vào năm lớp: thư viện, bước, cd+tsx, dữ liệu, không xếp được.
     - Tổng số lần trong văn bản phải bằng tổng các lớp.
     - Còn lần nào không xếp được → `{loi}`, và mode thoát 3 gọi tên.
  2. `importSandbox(plan, opts)`:
     - fixture có `manifest.json`, tuỳ ca thì thiếu manifest kèm mtime 5′ hay 45′;
     - chép thư viện bản thật; bản giả cho mỗi bước, ghi `buoc <đường>`; gói tsx rỗng; `import-airbnb.mjs` giả theo kế hoạch;
     - môi trường dựng từ đầu: HOME, TMPDIR trong sandbox, không `DATABASE_URL`, `PG*`, khoá model; stub có thêm `psql`;
     - bản chép thêm dòng đầu tạo tệp `spawned`, thêm dòng đối chứng nếu ca yêu cầu;
     - gác HOME: HOME thật, hoặc HOME ngoài sandbox → trả `{code:2, tu_choi}`, không spawn.
  3. `modeImportDaily`:
     - bốn ca AC-5 cũ, giữ nguyên assert; «transform chạy» = có lời gọi bước sau nạp;
     - ca 1: tập bước gọi bằng tập rút từ script, mỗi bước một lần;
     - ca AC-7: chưa xong / mồ côi, kèm chiều đỏ đổi mtime;
     - đối chứng AC-8: HOME thật, `/var/empty`;
     - đối chứng AC-9: bước lạ, cd tương đối không tsx, đường `.bin` lạ;
     - đối chứng ca 1 thiếu manifest;
     - kiểm `git status --porcelain` của kho thật trước và sau; `calls.log` không có đường ngoài sandbox hay `.openclaw`.
- **Verify per-task:** `node scripts/audit-p1-resilience/acceptance.mjs import-daily` ra `IMPORT-DAILY PASS`, cùng lượt phá thử bằng tay:
  - bỏ dòng chép `job-step.sh` → đỏ;
  - đổi luật gác HOME thành luôn đúng → đối chứng HOME đỏ;
  - bỏ bước cd+tsx khỏi lớp → ca 1 đỏ, hoặc thoát 3.
  - Bốn mode khác chạy lại vẫn PASS.
