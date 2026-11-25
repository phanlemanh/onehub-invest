## Trong hợp đồng

- **Hình dạng 3: lời hứa là quan hệ thứ tự «listingCount giảm dần rồi tên», nhưng dữ liệu cố định không phân biệt nó với xếp theo tên**
  file: `app/tests/api-markets-khong-s02.test.tsx:79`
  severity: medium
  AC: AC-2
  source: measurement
  detail: AC-2 hứa một quan hệ giữa các giá trị: thứ tự là listingCount giảm dần, bằng nhau thì theo tên (contract.md dòng 37). Dữ liệu trong test là TT = Alpha(3 tin), Beta(3 tin), Gamma(1 tin). Thứ tự chữ cái của tên trùng đúng với thứ tự số tin giảm dần. Vì vậy assert `deepEqual(body.data.map(d => [d.name, d.listingCount]), [["Alpha",3],["Beta",3],["Gamma",1]])` vẫn xanh nếu route chỉ `ORDER BY m.name`, hoặc bỏ hẳn khoá listing_count. Test chỉ ghim một dãy cụ thể mà không có ca nào mà hai tiêu chí cho kết quả khác nhau. Nhánh đối chứng (SQL cũ đặt Gamma đầu) chỉ chứng minh test bắt được kiểu xếp theo S02. Nó không chứng minh test đo được khoá số tin. Cần ít nhất một thị trường có tên đứng trước nhưng ít tin hơn, ví dụ «Aaa» với 1 tin. Khi đó xếp theo tên và xếp theo số tin cho ra hai thứ tự khác nhau.
  rationale: AC-2 hứa thứ tự theo số tin giảm dần rồi theo tên, mà dữ liệu test cho cùng kết quả với xếp theo tên nên không chứng minh được AC này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khối chú thích HT23 chen giữa JSDoc và hàm checkApiSurface, làm JSDoc gắn nhầm sang BANG_S02**
  Người dùng thấy gì: Một dòng chú thích trong công cụ kiểm tra nội bộ đứng sai chỗ nên trình soạn thảo gợi ý nhầm. Người dùng cổng và API không thấy khác biệt nào.
  Căn cứ: Chỉ là chú thích nằm lệch, không đổi kết quả kiểm tra nào, không ảnh hưởng người dùng, sửa hay không cũng chẳng gây hại.
  file: `scripts/check-api-surface.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

