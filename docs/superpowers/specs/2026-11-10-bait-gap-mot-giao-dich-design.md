# Bait gap chạy trong một giao dịch có khoá chung (bait-gap-mot-giao-dich) — thiết kế

Ngày 10/11/2026 · dãy N1 · hạng T2 · tách từ AC-7 của `s03-len-nhanh-nac-1` (yêu cầu N1-58, giám sát duyệt).

## 1. Vì sao

`pipeline/refresh-bait-gap.mjs` chạy cuối ba job: `zalo-import-daily` (S03/S05), `chotot-daily` (S06, 05:30 và 14:00) và
`apify-facebook-daily`. Phần bait gap (`refreshBaitGap`) hôm nay tự-commit từng câu:

1. `UPDATE sale_offers SET bait_gap_pct = NULL WHERE price_tier = 'P1'` — commit ngay;
2. `UPDATE … SET bait_gap_pct = <tính lại theo thước P2>` — commit ngay;
3. loại tin phi lý (`bait_gap_pct = NULL` cho tin trượt) + một dòng `ops_audit`.

Giữa câu 1 và câu 2, mọi tin P1 mang `bait_gap_pct = NULL` — Ops «Căn giá tốt» và cloud đọc thấy rỗng nếu đọc đúng lúc
ấy. Lượt bị cắt sau câu 1 (lỗi, khoá, máy tắt) thì rỗng tới lượt sau. Hai lượt chạy cùng lúc thì xen nhau trên cùng dòng.
Lượt nạp S03 mỗi 15′ (hàng `s03-nap-nhanh`, PR #404) làm cửa sổ chồng lấn với job S06 14:00 dày hơn; review của PR ấy nêu
rủi ro và giám sát giữ không bật plist lượt nhanh tới khi hàng này vào main.

## 2. Thiết kế

- `buocDem(c, { savepoint = false })` (đường chạy thật của `main`):
  - `savepoint: false` → `BEGIN` · `SELECT pg_advisory_xact_lock(hashtext('refresh-bait-gap'))` · `refreshBaitGap(c)` ·
    `COMMIT` (lỗi → `ROLLBACK`, ném lại). Rồi giao dịch danh bạ Người như hôm nay, câu đầu cũng lấy khoá ấy.
  - `savepoint: true` (người gọi đã mở giao dịch — test, thước nạp lại) → không mở giao dịch riêng, chỉ lấy khoá
    (giữ tới khi giao dịch người gọi kết thúc), rồi như hôm nay.
- `refreshBaitGap(c)` giữ nguyên thân và chữ ký: người gọi nó trực tiếp (các test, `test-data-residue`, `s03-len-cong`)
  đều chạy trong giao dịch của mình.
- Khoá theo tên `hashtext(...)`, cùng kiểu `danh-ba-vat-the` (`KHOA_CO_VAN`) — không đụng số khoá của tệp khác.
- `buocVatTheDem` (danh bạ vật thể) giữ giao dịch và khoá riêng như hôm nay.

Hệ quả: ba job tự xếp hàng ở bước bait gap. Job có `PGOPTIONS=-c lock_timeout=…` (lượt nhanh S03 sau hàng
`s03-len-nhanh-nac-1`) chờ tối đa thời gian ấy rồi lỗi `lock timeout`, giao dịch ROLLBACK trọn — giá trị cũ còn nguyên.
Job khác chờ như chờ khoá dòng hôm nay. Đổi lại: giao dịch bait gap giữ khoá dòng P1 vài giây (đo 10/11: cả bước 6,1 s)
thay vì từng câu ngắn. Người đọc (Ops, sync-cloud) không bị chặn — MVCC cho họ bản trước giao dịch.

## 3. Đo

Test DB thật trên DB của riêng lượt (`db/db-thu.sh --chay`), gọi tiến trình `refresh-bait-gap.mjs` thật:
giữ khoá + `lock_timeout` → thoát nhanh, P1 nguyên; giữ khoá không timeout → chờ rồi xong; hai tiến trình cùng lúc → không
deadlock, kết quả như một lượt; một phiên đọc song song không bao giờ thấy số tin P1 rỗng tăng giữa lượt. Chiều đỏ trên
bản chép tệp: bỏ khoá; bỏ giao dịch và chèn `pg_sleep(1)` giữa câu 1 và câu 2.

## 4. Ngoài phạm vi

- `lock_timeout` và bỏ lượt của lượt nạp nhanh S03 — hàng `s03-len-nhanh-nac-1`.
- Đổi cách tính bait gap (thước P2, ngưỡng tin phi lý).
- Giao dịch của `buocVatTheDem`, `resolve-properties`, `transform-*`.
