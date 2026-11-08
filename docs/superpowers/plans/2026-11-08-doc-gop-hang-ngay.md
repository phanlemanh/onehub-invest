# Kế hoạch — doc-gop-hang-ngay (PL34)

Hồ sơ: `_acceptance/doc-gop-hang-ngay/` · Thiết kế: `docs/superpowers/specs/2026-11-08-doc-gop-hang-ngay-design.md`.
Verify mọi task: `cd agent && npm test` (DB của riêng lượt) + `cd agent && npx tsc --noEmit`.

## T1 — `chayLuot` nhận `doDaDoc`, `goiDenTran`, đếm `hong`

- Files: `agent/src/enrich/doc-gop-s03/chay.ts`
- Việc: `doDaDoc` chạy câu dò đã đọc của PL30 cả khi truyền sẵn thẻ; `goiDenTran` bỏ bước từ chối cả lượt và ước lời kế bằng
  max(uoc, tiền thật lớn nhất đã gặp); `TomTatChay.hong` đếm JSON hỏng. Không truyền → hành vi cũ (test PL30 xanh).
- Phục vụ: E3, E4, E6 · independent: false (T2 dùng)

## T2 — mô-đun `hang-ngay.ts`

- Files: `agent/src/enrich/doc-gop-s03/hang-ngay.ts`
- Việc: `docCoHangNgay(argv)` (cờ, khuôn ngày, trần), `phamViNgay(client, ngay)` (cửa sổ giờ VN, testMarker, khuTrung với tinCua),
  `chayHangNgay({client, co, bayGio, taoModel, uoc, log})` (chi ngày theo run_id, gọi chayLuot với doDaDoc + goiDenTran, mã thoát,
  dòng ghim CHAM TRAN, tóm tắt `{"pl34": …}`; `--thu` dừng trước mọi lời gọi và không ghi).
- Phục vụ: E1–E7 · independent: false

## T3 — lệnh `hang-ngay` trong `agent/scripts/doc-gop-s03.ts`

- Files: `agent/scripts/doc-gop-s03.ts`
- Việc: nhánh `hang-ngay`: kiểm cờ + bảng trước khoá và trước DB (thoát 2), đòi khoá khi không `--thu`, nối DB, gọi
  `chayHangNgay`, in tóm tắt; usage cập nhật.
- Phục vụ: E1, E7 · independent: false

## T4 — bước đêm `pipeline/doc-gop-hang-ngay.sh`

- Files: `pipeline/doc-gop-hang-ngay.sh`
- Việc: nạp `scripts/lib/job-step.sh`; hôm qua, hôm kia theo giờ VN (tính từ `DOC_GOP_BAY_GIO` khi có); `job_run` hai bước;
  `DOC_GOP_NODE`, `DOC_GOP_TRAN_NGAY_USD`; `--env-file` của gốc kho khi có; `exit "$JOB_RC"`.
- Phục vụ: E8 · independent: true

## T5 — test `agent/tests/doc-gop-hang-ngay.test.ts`

- Files: `agent/tests/doc-gop-hang-ngay.test.ts`
- Việc: ca PL34-AC-1 … PL34-AC-8 theo `evals.yaml`; message của mỗi assert là thông điệp ghim của chiều đỏ. Phá thử: sửa vật thật
  trong cây làm việc theo từng chiều đỏ của evals, chạy ca, thấy đúng thông điệp, hoàn lại (ghi kết quả vào mục «Phá thử» dưới).
- Phục vụ: E1–E8 · independent: false

## Phá thử

08/11, DB thử `oneinvest_p2_pl34`, mỗi lượt sửa một chỗ trong vật thật, chạy đúng ca, rồi `git checkout` hoàn lại. 20/20 ca đỏ
với đúng thông điệp ghim:

| Vật sửa | Ca | Thông điệp |
|---|---|---|
| bỏ `testMarker` | PL34-AC-1 | BAI THU LOT VAO PHAM VI |
| `tinCua` rỗng | PL34-AC-1 | TIN DOC HAI LAN |
| bỏ dò đã đọc | PL34-AC-1 · PL34-AC-3 | DOC LAI BAI DA DOC · LUOT HAI GOI LAI |
| dò đã đọc theo `text_hash` bất kể `post_id` | PL34-AC-1 · PL34-AC-3-DANG-LAI | BAI DANG LAI BI BO · DANG LAI KHONG CO NHAN |
| cửa sổ ngày theo UTC | PL34-AC-1 | SAI NGAY GIO VN |
| `run_id` bỏ ngày chi | PL34-AC-2 | RUN_ID THIEU NGAY CHI |
| ghi thêm `eval_label_items` | PL34-AC-2 | GHI NGOAI NHAN BAC |
| dò đã đọc bỏ `json_ok` | PL34-AC-3-HONG | JSON HONG KHONG DUOC DOC LAI |
| `goiDenTran: false` | PL34-AC-4 | TU CHOI CA LUOT |
| bỏ kiểm trần từng lời gọi | PL34-AC-4 | VUOT TRAN NGAY |
| ước bỏ max với tiền thật | PL34-AC-4-DAT | CHI THAT VUOT TRAN |
| cộng mọi `pl34-%` | PL34-AC-5 | CONG CHI NGAY KHAC |
| trần không trừ chi trước | PL34-AC-5 | TRAN KHONG CHIA CHUNG NGAY |
| mã thoát bỏ đếm JSON hỏng | PL34-AC-6 | JSON HONG CA LUOT VAN THOAT 0 |
| bỏ kiểm khuôn ngày | PL34-AC-7 | NGAY SAI VAN CHAY |
| bỏ đòi khoá | PL34-AC-7 | THIEU KHOA VAN CHAY |
| bước đêm tính ngày theo UTC | PL34-AC-8 | NGAY BUOC DEM SAI GIO VN |
| bước đêm dừng sau bước hỏng đầu | PL34-AC-8 | BUOC HOM KIA BI BO |
