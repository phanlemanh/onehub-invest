## Trong hợp đồng

- **Hình dạng 5 (tuyên quét LỚP mà chỉ có điểm-case): AC-5 «mọi ca của bản 89730e6b còn» dùng bộ đọc regex bỏ sót ca đặt tên bằng hằng và gộp mọi ca sinh theo bảng thành một tên**
  file: `scripts/design-floor/tmp-sach.test.mjs:118`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Dòng 118 có `caseNames = /\btest\(\s*(['`])((?:\\.|(?!\1).)*)\1/g`, tức tên ca chỉ được nhận khi là chuỗi literal nằm ngay sau `test(`. Chạy bộ đọc này trên các tệp test ở 89730e6b cho thấy hai lỗ. (1) `test(DIFF_CASE, ...)` ở fresh.test.mjs:96 (ca 'M2-AC-10 diff config.yaml cặp cố định…') KHÔNG có trong tập `before`, nên xoá ca đó thì thước vẫn xanh. (2) Các ca sinh trong vòng lặp, như `test(`M2-AC-6 ${label}: …`)` trên bảng BROKEN (gen-registry), `M2-AC-3 ${label}` (gen-tokens), `M2-AC-7 cặp đỏ — ${label}` (reuse-plan) và `M2-AC-10 sau gộp ${label}` (fresh-sau-gop), chỉ còn lại MỘT tên template thô. Bỏ một hàng khỏi bảng nhãn thì mất ca thật mà `lostCases` vẫn trả []. Thêm nữa, bộ đọc còn bắt rác như '<tên>' và "${name}`), caseBody(oldSrc, `test(" làm «tên ca». Không có ma trận viết trước kiểu số ca = số phần tử: chỉ có sàn `before.length >= 25`, và cặp đỏ ở dòng 129 chỉ bỏ đúng một điểm `before[0]`. Lời hứa AC-5/E5 là «tập tên ca tại 89730e6b là tập con của tập hiện tại», nhưng thước không đếm đủ phần tử của lớp đó.
  rationale: AC-5 hứa «mọi tên ca» của các tệp test tại 89730e6b vẫn còn, mà thước chỉ đếm được ca có tên chuỗi literal nên xoá ca đặt tên bằng hằng hoặc một hàng trong bảng ca sinh thì thước vẫn xanh.

- **Hình dạng 5 (danh sách miễn «ĐÓNG viết trước» mà thước chỉ đếm tổng): AC-4 đếm regions = 2 mà không ghim cặp (tệp, tên vùng)**
  file: `scripts/design-floor/tmp-sach.test.mjs:107`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Dòng 85 nhận cả hai dấu mốc TEMPDIR-MIEN và RAW-MKDTEMP-DOI-CHUNG ở BẤT KỲ tệp nào. Dòng 94 `regions++` đếm chung không theo tệp, và dòng 107 chỉ đòi `{ hits: [], regions: 2 }`. AC-4/E4 hứa một danh sách miễn đóng gồm đúng hai phần tử: thân tempDir trong test-helpers.mjs và đúng một vùng đối chứng trong tmp-sach.test.mjs. Đó là quan hệ tệp↔vùng, nhưng thước không liệt kê và không so từng phần tử. Ví dụ: chuyển vùng RAW-MKDTEMP-DOI-CHUNG khỏi tmp-sach.test.mjs, hoặc khoanh `// <<<TEMPDIR-MIEN … // TEMPDIR-MIEN>>>` quanh một lời gọi mkdtempSync trần mới trong reuse-plan.test.mjs rồi bỏ một vùng cũ. Khi đó hits vẫn [] và regions vẫn 2, nên thước xanh. Cặp đỏ ở dòng 114–115 chỉ chèn lời gọi NGOÀI mọi vùng tại hai điểm (reuse-plan:3, tmp-sach:12), không có ca đỏ cho vùng miễn giả hay vùng đặt sai tệp. Vì vậy tính «đóng» của danh sách chưa được đo.
  rationale: AC-4 nêu danh sách miễn ĐÓNG viết trước gồm đúng thân tempDir trong test-helpers.mjs và đúng một vùng đối chứng trong tmp-sach.test.mjs, mà thước chỉ đếm tổng hai vùng nên đổi chỗ hoặc thêm vùng miễn giả vẫn xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
