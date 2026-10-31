# judge-evidence-du-truong — thẻ do judge-run sinh mang đủ mười trường của bảng so

Hàng HD1 của lộ trình (đợt `hang-duyet-3010`, dãy P3). Hồ sơ: `_acceptance/judge-evidence-du-truong/`.

## 1. Vấn đề

Audit hàng duyệt 30/10 (`docs/research/audit-hang-duyet-3010.md` §3.4, H8): `evidenceThe` của `agent/scripts/judge-run.ts`
ghi mỗi bên 8 khoá (`offer_id, source, price_vnd, area_m2, price_perm2, bedrooms, phuong, property_type`), còn
`queryPair` (`agent/src/tools/native.ts`) không chọn `street_raw, block_raw, floor_raw, bathrooms`. Bảng so của thẻ có
mười hàng (`TRUONG_GHEP_CAN`, `app/src/lib/ops/review-can-cu.ts`). Thẻ judge-run sinh vì thế luôn hiện Đường, Toà, Tầng
và WC là «Thiếu» ở cả hai bên, kể cả khi tin có giá trị. Đường của S06 là trường Mạnh dùng nhiều nhất khi bác thẻ.

## 2. Thiết kế

1. **`queryPair` chọn thêm bốn cột.** Câu SELECT lấy `street_raw, block_raw, floor_raw, bathrooms` của `sale_offers`;
   `PairData.a` và `PairData.b` thêm `street`, `block`, `floor` (chuỗi hoặc null) và `bathrooms` (số hoặc null).
   `queryPair` nhận thêm tham số tuỳ chọn là client đã mở, để test chạy đúng câu SELECT thật trên DB thử. Không có
   tham số thì nó tự mở kết nối như cũ.
2. **`evidenceThe` ghi đủ mười khoá, đặt tên theo bên đọc.** Mỗi bên ghi `offer_id`, `source`, mười khoá của
   `TRUONG_GHEP_CAN` (`price_vnd, area_m2, price_perm2, phuong, bedrooms, bathrooms, property_type, street, block, floor`),
   cộng `text` (bên A) hay `subject` (bên B) như trước. Tên khoá là tên trong `BenGhepCan` (`street`, không phải
   `street_raw`), vì bảng so đọc đúng các khoá đó. Giá trị vắng ghi `null` tường minh (khoá luôn có mặt).
3. **Thẻ cũ không bị sửa.** `SQL_CAP_NHAT` chỉ nối `evidence.cham` lên thẻ đang chờ, không đụng `offer_a`/`offer_b`. Thẻ
   sinh trước vòng (8 khoá) giữ nguyên khuôn cũ; muốn đủ trường thì gieo lại là việc vận hành sau gộp.
4. **Luật chấm không đổi.** `apNguong` và `buildJudgeInput` không đọc bốn trường mới. Luật loại trừ theo đặc trưng nhà
   là hàng HD2.

## 3. Phạm vi bỏ ngoài

- Người đăng mỗi bên (tên, `party_key`, số tin) — hàng HD13 (H14, H17).
- Thẻ đọc giá trị sống thay vì evidence đóng băng — H10, đợt 2.
- «Chưa rõ» so ra «Lệch» — H9, hàng riêng.
- Gieo lại thẻ đang chờ trên DB `oneinvest` để chúng có đủ trường — việc vận hành sau gộp.

## 4. Eval đã ký bị thay

`judge-nguong-la-code/E6` (AC-6) đòi tập khoá của `evidence.offer_a`/`offer_b` BẰNG tập khoá của seed 029. Với bốn khoá
mới, hai điều này không thể cùng đúng. AC-1 của hồ sơ này giữ trọn lời hứa còn lại của E6 (mỗi cặp `needs_llm` đúng một
thẻ đang chờ, mã tin khớp cặp, kết luận khớp `apNguong`, cặp không phải `needs_llm` không có thẻ, câu đếm thiếu thẻ bằng
0) và đổi khuôn khoá thành khoá seed 029 cộng bốn khoá của bảng so.

| Eval cũ | Đo gì | Thay bởi |
|---|---|---|
| judge-nguong-la-code/E6 | AC-6: sinh thẻ đúng một mỗi cặp, tập khoá = seed 029 | judge-evidence-du-truong#AC-1 |

Ca `AC-6 sinh thẻ` trong `agent/tests/judge-run.test.ts` được thay bằng ca mới trong cùng tệp.

## 5. Đo

- Khuôn khoá rút từ hai tệp thật: khoá seed 029 (cách ca cũ đang làm) và khoá `key:` của `TRUONG_GHEP_CAN` trong
  `review-can-cu.ts`. Không viết tay danh sách mười khoá trong test.
- `queryPair` đo trên DB thử có `sale_offers` dựng theo kiểu cột của `oneinvest.sale_offers`, không đo bằng
  `queryPair` giả; kiểu JS (chữ cho đường/toà/tầng, số cho WC) cũng được ghim.
- Bảng so: evidence của thẻ sinh thật đi qua `soTruongGhepCan` của `review-can-cu.ts` (hàm `review-card.tsx` dùng).
- Lô thật: tệp `agent/tests/judge-lo-that.itest.ts` (ngoài glob `tests/*.test.ts`, nên CI không chạy) chép các cặp
  `needs_llm` và thẻ đang chờ của chúng từ `oneinvest` (chỉ SELECT) sang DB thử, chạy judge-run, rồi gieo lại lô.
- Mỗi phép đo có đối chứng đỏ cùng fixture với thông điệp ghim.
