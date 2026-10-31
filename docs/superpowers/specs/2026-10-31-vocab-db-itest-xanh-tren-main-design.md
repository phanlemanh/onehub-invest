# vocab-db itest xanh trên main — thiết kế

Hàng `vocab-db-itest-xanh-tren-main` (đợt dot0-cam-mau, dãy P2, T2). `pipeline/scripts/vocab-db.itest.mjs` đỏ 4 ca trên main
82a53e0a (VD-AC-7 ×2, VD-AC-8, VD-IQ-3) — chặn ghim lại hồ sơ đã ký `so-tu-vung-mot-nguon` (E7/E8) và gộp HD5 #234.

## Nguyên nhân (đo 31/10)

Test dựng «sổ hiện tại» bằng 043 + đoạn ref_* của 045 + 050. Sổ `pipeline/mappings.yaml` từ đó có thêm trục do 055
(danh bạ: `registry_status`, `alias_kind`, `registry_event_kind`, `party_role`), 056 (`data_level` lên cột) và 059
(`assertion_field`, `change_type`, cột `offer_status`) nạp vào ref_* — test không nạp nên dòng kỳ vọng từ sổ thừa 23 dòng
ref_lookup và 10 dòng ref_field_lookup. 059 còn dựng lại `field_assertions_field_chk` theo sổ; trên DB đi trước main (061 đã
áp) CHECK có 7 mã sổ main chưa có. Lỗi ở thước, không ở sản phẩm: `vocab.mjs --check-db` trên DB dựng đúng từ migration của
main vẫn khớp (răng `wanted-thanh-inquiry/rang/db-rieng.mjs` xanh 7/7).

## Thiết kế

Thay đoạn cắt cứng của 045 bằng bộ rút chung: mọi câu `INSERT INTO ref_lookup|ref_field_lookup …;` và câu dựng lại CHECK
ở cấp ngoài cùng (`ALTER TABLE … DROP CONSTRAINT IF EXISTS …_chk;` / `ADD CONSTRAINT …_chk CHECK …;`) của các migration số
> 043, theo thứ tự số; tách hai khúc trước/sau 050 để VD-IQ-3 vẫn đo đúng «043 một mình lệch ở inquiry, 050 sửa». Migration
mới (061 của HD5) tự vào. Không đổi assertion nào, không đổi tên ca.

## Ngoài phạm vi

- Sửa `vocab-core.mjs` hay sổ — không cần.
- Ghim lại hồ sơ `so-tu-vung-mot-nguon`, `wanted-thanh-inquiry` — làn ghim lại riêng sau khi gộp (giám sát).
