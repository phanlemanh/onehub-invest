## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

## Chưa phân loại (triage-failed)

phân loại phạm vi không chạy được — không lỗi nào bị máy tự sửa, người xem lại toàn bộ

- **_Avoid_ của «Ngừng rao»: «tin hết rao» không được thước ON12-AC-1 quét vì cùng mục có ngoặc**
  file: `CONTEXT.md:229`
  severity: low
  source: conventions
  detail: Round này chỉ CONTEXT.md đổi (commit 3e19f64c đổi «hết hạn» thành «tin hết hạn»). Đổi như vậy là đúng: «hết hạn» trần làm đỏ các chuỗi hợp lệ (mã QR hết hạn, chế độ Bùng hết hạn…) trong phạm vi quét của ON12-AC-1. Nhưng dòng `_Avoid_: tin hết hạn, expired, tin chết, tin hết rao (dùng «ngừng rao»); rút (là nghỉ bản ghi)` được tách bằng dấu phẩy, nên mục cuối là `tin hết rao (dùng «ngừng rao»); rút (là nghỉ bản ghi)`. `laTu` trong scripts/lib/ops-nhan.mjs:5 bỏ mọi mục có ngoặc hoặc «», nên mục này bị coi là lời dặn chứ không phải từ để quét. Tôi đã chạy avoidTerms trên CONTEXT.md: khối «Ngừng rao» chỉ ra ba từ là 'tin hết hạn', 'expired', 'tin chết'. «tin hết rao» không bao giờ bị chặn trên cổng Ops, dù văn bản ghi rõ là từ phải tránh. Hiện app/src chưa có chuỗi nào dùng «hết rao», nên chưa có lỗi thật; đây là lỗ hổng của thước. Mẫu «từ (chú thích)» đã có ở nhiều dòng khác (216, 234…), nên đây không phải vi phạm mới, chỉ là chỗ khác với ý muốn. Cách sửa gợi ý: tách thành `tin hết rao, ...` và đặt lời dặn «(dùng «ngừng rao»)» ở mục riêng hoặc sau dấu chấm phẩy. Phần «rút (là nghỉ bản ghi)» bị bỏ khỏi thước là hợp lý, vì «rút» là thuật ngữ hợp lệ cho việc nghỉ bản ghi. Các tên trong dòng Code (`ghi_khong_thay_lai`, `ngung_rao_sau_ngay`, rule_id `khong-thay-lai:<offer_id>`, inferred/e1_rule) khớp với db/migrations/085_ngung_rao_khong_thay_lai.sql.

- **Bộ quét ON12 không bao giờ quét «tin hết rao» vì nó nằm chung đoạn phẩy với chú thích trong ngoặc**
  file: `CONTEXT.md:229`
  severity: low
  source: bugs
  detail: Dòng `_Avoid_: tin hết hạn, expired, tin chết, tin hết rao (dùng «ngừng rao»); rút (là nghỉ bản ghi)` bị `avoidTerms` (scripts/lib/ops-nhan.mjs:16) tách theo dấu phẩy. Đoạn cuối là `tin hết rao (dùng «ngừng rao»); rút (là nghỉ bản ghi)`. Đoạn này có `(`/`«` nên hàm `laTu` (dòng 5) loại nó và coi là lời dặn. Kết quả: chỉ «tin hết hạn», «expired», «tin chết» được quét. «tin hết rao» bị bỏ qua mà không báo gì, nên ON12-AC-1 vẫn xanh dù chữ này có xuất hiện trên chuỗi hiển thị của Ops. Lần sửa 3e19f64c chỉ đổi «hết hạn» thành «tin hết hạn» (đã chạy app/tests/ops-nhan-theo-context.test.tsx, 26/26 pass). Lần sửa đó không đụng tới lỗ này. Cách sửa: tách ra thành `..., tin chết, tin hết rao, rút` và chuyển phần chú thích ra ngoài danh sách phẩy. Nếu «rút» quá rộng để quét thì chỉ giữ «tin hết rao».

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

