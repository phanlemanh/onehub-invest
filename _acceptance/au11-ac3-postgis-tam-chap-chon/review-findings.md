## Trong hợp đồng

- **Hình dạng 5 — E5 tuyên giữ «mọi chuỗi thông điệp assert» nhưng bộ rút chỉ bắt một phần, ngưỡng chỉ là >= 10, không có ma trận đủ viết trước**
  AC: AC-4
  file: `_acceptance/au11-ac3-postgis-tam-chap-chon/probes/cho-tinh.mjs:17`
  severity: medium
  source: measurement
  detail: Mục expected của E5 (evals.yaml dòng 34) hứa «mọi chuỗi thông điệp assert của các ca AU11-AC-3, AU11-AC-4 cũ còn nguyên». rutThongDiep chỉ có ba regex: test("…"), assert.X(…, "…") và assert.match(x, /…/). Em chạy nó trên tệp ở merge-base e01513de thì được 22 mục, và nó bỏ sót các chỗ sau: thông điệp viết bằng template literal (dòng 54 `dựng PostGIS tạm không được: ${setupErr}`, dòng 148 `thiếu dòng lý do cho «${m.ca}»`, dòng 164 `«${m.ca}» là ca đỏ sẵn của main`); assert.match dùng new RegExp(`áp ${n - 1} migration xanh…`) và new RegExp(`app — bỏ qua …`) (dòng 66, 147); /^ℹ tests 1$/m vì có cờ m nên regex `\/[^\n]+\/\)` không khớp (dòng 144); assert.doesNotMatch(r.stdout, /TỪ CHỐI/) (dòng 83); các chuỗi trong assert.ok(loi.some(x => x.includes("…"))) (dòng 173–174). Phép kiểm chỉ đòi `ds.length >= 10 && mat.length === 0` (dòng 30). Số mục đem so không bằng số assert có ở bản cũ, nên xoá hay sửa bất kỳ thông điệp nào kể trên thì probe vẫn in AU11-GIU PASS. Chiều đỏ (dòng 35–38) chỉ lấy một mẫu trong chính tập đã rút được, nên không chứng được rằng tập đó đủ.
  rationale: AC-4 đòi mọi chuỗi thông điệp assert của các ca AU11-AC-3/AC-4 cũ giữ nguyên, mà phép kiểm chỉ bắt một phần nên không chứng minh được điều AC-4 hứa.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe duoi-tai ghi bản chép test cũ vào ngay thư mục scripts/ đang được theo dõi**
  Người dùng thấy gì: Nếu lượt thử dưới tải bị ngắt đột ngột, một tệp tạm có thể nằm lại trong thư mục scripts và làm bẩn cây làm việc. Không ảnh hưởng người dùng cuối, xoá tay là xong.
  Căn cứ: Hậu quả nhẹ, chỉ gây bẩn cây làm việc trên máy dev, tự xoá được dễ dàng, còn sửa thì phải đổi cách probe nhập tệp nên không đáng.
  file: `_acceptance/au11-ac3-postgis-tam-chap-chon/probes/duoi-tai.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
