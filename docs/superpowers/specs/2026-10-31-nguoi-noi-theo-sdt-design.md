# HD13 nguoi-noi-theo-sdt — gộp người theo SĐT cùng nguồn (thiết kế)

Hàng HD13 (`docs/plan/lo-trinh.json`), đợt 3 của audit hàng duyệt 30/10. Nền: DB2b `ho-nguoi-theo-nguon` (055), SD3
`sdt-luu-goc-e164` (060, bí danh `sdt` = số gốc `+84…`). Căn cứ: `docs/research/audit-bang-nguoi-sdt-3010.md` §3.3–3.4,
trang tri thức «Người và SĐT».

## 1. Vấn đề

Bộ dựng danh bạ (`pipeline/lib/danh-ba-nguoi.mjs`) cố ý tách người theo SĐT khỏi người theo tài khoản (Hỏi-4 của DB2b).
Kết quả: 0 người mang cả hai loại bí danh, trong khi đa số SĐT S03/S05 nối một–một với đúng một người gửi. Đo chỉ-đọc
trên DB máy thu 31/10: S03 170 cặp một–một / 187 SĐT (8 SĐT dùng chung, 5 người gửi nhiều số), S05 13 / 14 (1 dùng
chung); SĐT chung giữa các nguồn: 0.

## 2. Luật gộp (thuần, `chonGop`)

Trên tin SỐNG (`retired_at IS NULL`) có `seller_phone`, theo từng nguồn S03, S05 riêng:

- người gửi của tin = `sender_id` của các bài trong `post_ids` cùng nguồn (đúng như `rutDinhDanh`);
- dựng SĐT → {người gửi}, người gửi → {SĐT};
- cặp (SĐT p, người gửi a) là MỘT–MỘT khi p có đúng một người gửi a và a có đúng một SĐT p — cùng định nghĩa N1 của
  `do-danh-ba-sdt.mjs`;
- gộp người theo SĐT `Ks` (bí danh `sdt` = p, nguồn đó) VÀO người theo tài khoản `Ka` (bí danh `tai_khoan_nguon` = a,
  cùng nguồn) khi `Ks` đang `active`, `Ka` đang `active`, `Ks ≠ Ka`. Người `split` hay `merged` không bao giờ bị gộp.
- S06 (chưa có SĐT, HD12 chưa giao) và mọi cặp khác nguồn: không xét.

Ca nhiều–nhiều (SĐT ≥ 2 người gửi; người gửi ≥ 2 SĐT) không gộp; bộ dựng đếm và in theo nguồn. Thẻ duyệt là hàng sau.

## 3. Ghi (trong `dungNguoi`, cùng giao dịch, cùng khoá 55055)

Thứ tự trong một lượt:

1. Đọc như cũ + đọc `parties` (status, merged_into) thành bản đồ `gopVao` (người bị gộp → người còn lại, đi theo chuỗi).
2. `giaiNguoi` như cũ (người, bí danh mới).
3. `chonGop` trên tin + bí danh (cũ ∪ mới) + trạng thái → danh sách gộp mới; cộng vào `gopVao`.
4. Mọi vai lượt này sinh ra được ánh xạ qua `gopVao` (vai parser của tin chỉ-SĐT về người còn lại), bỏ trùng.
5. Ghi người, bí danh mới (không đổi). Ghi gộp: `UPDATE parties SET status='merged', merged_into=Ka` + một dòng
   `registry_events (object_key=Ks, kind='gop', related_keys={Ka}, reason='sdt-mot-mot <S0x>', changed_by='dung-nguoi')`.
6. Rút vai: `chonVaiRut` như cũ; vai rút thuộc người vừa bị gộp mang lý do `gop-nguoi`, còn lại `thay-boi-luot`. Thêm vai
   mới (vai trên `Ka`).

Bí danh `sdt` ở nguyên `Ks` (chỉ mục duy nhất sống không cho chép sang `Ka`); người đọc đi qua `merged_into`. Lượt hai: `Ks`
đã `merged` → không gộp lại, vai đã ở `Ka` → 0 thay đổi.

Đếm trả về thêm `gop`, `nhieu_nhieu: {S03: {sdt_nhieu_nguoi, nguoi_nhieu_sdt}, …}`; dòng in thêm `· gộp N · nhiều–nhiều …`.

## 4. Tách (`tachNguoi`, CLI `dung-nguoi.mjs --tach <party_key> --ly-do «…» [--thu]`)

Một giao dịch: khoá 55055 → người phải đang `merged` (khác → thoát 1, không ghi gì) → `UPDATE parties SET status='split',
merged_into=NULL` + `registry_events (kind='tach', related_keys={người còn lại cũ}, reason=<ly-do>, changed_by='dung-nguoi')`
→ chạy `dungNguoi` ngay: tin chỉ-SĐT về lại `Ks` (người `split` không trong `gopVao`), vai parser trên `Ka` của các tin ấy
rút `thay-boi-luot`. Không dòng nào bị xoá; lượt sau không gộp lại vì `Ks` là `split`. Thiếu `--ly-do` → thoát 2.

## 5. Thước

- Thuần (`danh-ba-nguoi.test.mjs`): ma trận `chonGop` + ánh xạ vai.
- DB (`danh-ba-nguoi.itest.mjs`, DB thử `oneinvest_p3_nguoi`, BEGIN…ROLLBACK, 055 + 060 nạp trong giao dịch): gộp, lượt
  hai, nhiều–nhiều, tách, CLI.
- Dữ liệu thật (`nap-lai-nguoi.mjs`, DB thử chép máy thu, ROLLBACK): lượt 1 gộp = số cặp một–một chưa gộp đếm độc lập bằng
  `tinhSo` của `do-danh-ba-sdt.mjs` trước lượt; sau lượt N1 = 0; lượt 2 gộp 0; 0 người chuẩn mang hai SĐT khác nhau; đối
  chứng: luật bỏ vế «người gửi có đúng một SĐT» → thước bắt người hai SĐT.

## 6. Ngoài phạm vi

Gộp khác nguồn (chờ HD12) · thẻ duyệt ca nhiều–nhiều (cần app) · bộ đọc theo `merged_into` ở `/ops/people`, judge
(`agent/`) và kiểm N2 của SD5 · tự tách khi cặp thôi một–một · áp 060/055 lên DB máy thu.
