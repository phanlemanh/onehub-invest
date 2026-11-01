# main-xanh-duoi-tai-db — hai test DB không đỏ theo tải

Giám sát đợt dot0 giao (ưu tiên 0, 01/11): main đỏ dưới tải DB local dùng chung, chặn mọi lượt ghim lại (#252, #234, #254).

## Hai chỗ đỏ

1. `agent/tests/enrich-revert.test.ts` AC-10 «migration idempotent» áp lại 036 + 044 + 045 hai lần trong giao dịch
   test. 044 là DDL khoá độc quyền bảng dùng chung (`sale_offer_records`, `enrichment_proposals`…); job S06/đêm đang
   ghi → `deadlock detected` (40P01) ở lần 2. Đó là tải, không phải lỗi idempotent.
2. `app/tests/the-duyet-du-can-cu.test.tsx` kiểm «public đã bị chạm» bằng cách so SỐ DÒNG mười bảng public trước và
   sau lượt. Job S06/đêm ghi `property_offers`, `field_assertions`… trong lúc lượt chạy → số đổi → đỏ dù lượt không
   chạm gì.

## Cách sửa

1. **Áp lại chịu tải** (`apLaiChiuTai`): mỗi lần áp nằm trong `SAVEPOINT`, `SET LOCAL lock_timeout = '5s'`; lỗi mã
   40P01 (deadlock) hoặc 55P03 (hết chờ khoá) → `ROLLBACK TO SAVEPOINT`, chờ lùi 500 ms × lần, thử lại tối đa 5 lần.
   Mọi mã khác ném ngay — lỗi idempotent thật vẫn đỏ. Không đổi assertion nào của AC-10.
2. **Kiểm public theo dấu lượt** (`publicBiCham`): ghi mốc xid lúc mở lượt; cuối lượt đếm ở từng bảng public các dòng
   sinh/sửa SAU mốc (`age(xmin) <= age(mốc)`) mà nội dung (`to_jsonb`) mang dấu của lượt — mã tin/cặp/thẻ `td_…`,
   `hd9…`, vai `td-…`, actor `machine:td`, tên lược đồ tạm, mã người tạo trong lược đồ tạm. Phải bằng 0 ở mọi bảng.
   Dòng của job khác không mang dấu → không đếm. Hàm nhận lược đồ làm tham số để test được trên lược đồ nháp.

## Phương án bỏ

- Chạy agent test trên DB riêng: phải dựng đủ chuỗi migration 001→060 cho một DB mới mỗi lượt — đắt, và lệch DB thật.
- So snapshot REPEATABLE READ: trước/sau là hai thời điểm, một snapshot không bao được cả lượt; kiểm public vẫn cần
  biết dòng nào của lượt.
- Advisory lock chung với job đêm: phải sửa mã làn ZCode/pipeline — ngoài vùng.

## Giới hạn

- Kiểm public không bắt được lượt XOÁ dòng public có từ trước (số dòng giảm) — bản cũ bắt được nhưng cũng đỏ theo mọi
  job xoá. Code lượt này chạm public chỉ qua ID của chính lượt (không có ở public), nên lối xoá không có đường tới.
