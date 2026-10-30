## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thêm cột data_level_snapshot.data_level vào sổ mappings.yaml làm đỏ vocab-db.itest (VD-AC-7), vì apMig không nạp đoạn ref_* của 056**
  Người dùng thấy gì: Một phép kiểm nội bộ đối chiếu danh sách từ vựng với cơ sở dữ liệu báo đỏ sau vòng này. Người dùng cuối không thấy gì, nhưng phép kiểm này không còn đáng tin cho đến khi được cập nhật.
  Căn cứ: Chỉ làm một phép kiểm nội bộ báo đỏ, không mất hay sai dữ liệu của người dùng, và sửa sau rẻ vì chỉ là cập nhật bộ thử.
  file: `pipeline/mappings.yaml`
  severity: high
  Đề xuất: new-contract

- **cloud-sync sẽ JOB FAIL mỗi lượt từ lúc gộp tới khi 056 được áp lên DB local dùng chung**
  Người dùng thấy gì: Nếu mã được gộp mà migration chưa được áp lên máy thu, mỗi lượt đồng bộ lên cloud sẽ báo lỗi và nhịp tim trên trang Ops hiện đỏ oan cho đến khi áp migration.
  Căn cứ: Chỉ là báo lỗi tạm thời, không mất dữ liệu, tự hết ngay khi áp migration theo đúng thứ tự đã ghi trong hồ sơ.
  file: `scripts/cloud-sync.sh`
  severity: medium
  Đề xuất: known-limits

- **Chú thích executor bac_level ghi «64 tổ hợp», trong khi test và eval E1 đo 74 ô**
  Người dùng thấy gì: Một dòng chú thích nội bộ ghi sai số ca kiểm; không ảnh hưởng đến cách bậc dữ liệu được tính hay hiển thị cho người dùng.
  Căn cứ: Sai chữ trong chú thích, không có hậu quả với người dùng và không làm sai kết quả kiểm.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Ảnh chụp theo ngày dùng current_date của phiên DB đang ở múi UTC, nên ngày chuyển lúc 07:00 giờ Việt Nam**
  Người dùng thấy gì: Ảnh chụp phân bố bậc mỗi ngày đổi ngày lúc 7 giờ sáng giờ Việt Nam thay vì nửa đêm, nên ngày in trên bảng lệch lịch Việt Nam trong 7 giờ đầu mỗi ngày.
  Căn cứ: Không mất hay đếm sai dòng nào, chỉ mốc đổi ngày bị dời 7 giờ, và sửa sau vẫn rẻ vì dữ liệu cũ vẫn dùng được.
  file: `pipeline/sql/610_data_level.sql`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): field_provenance của ca B3/B4 do test tự viết, khoá và cờ measured không bao giờ do bên ghi resolve_offer_fields sinh ra**
  Người dùng thấy gì: Trên dữ liệu thật hiện chưa có căn nào lên được bậc B3 hay B4 vì phần ghi nguồn gốc số đo chưa tồn tại; bộ thử chỉ chứng minh hàm đúng khi dữ liệu đã đúng khuôn.
  Căn cứ: Việc ghi nguồn gốc số đo đã được hoãn có chủ đích sang các hàng sau, không làm mất hay sai dữ liệu hiện có.
  file: `pipeline/scripts/bac-du-lieu.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): «không căn nào nhận B1» và «không đơn vị nào B5» không có chiều đỏ, đúng sẵn theo cấu trúc hàm, và B5 chỉ quét căn**
  Người dùng thấy gì: Hai phép kiểm «không căn nào ở B1» và «không đơn vị nào ở B5» đúng sẵn nên không bắt được lỗi nếu sau này có người sửa hàm; người dùng hiện không thấy sai lệch nào.
  Căn cứ: Kết quả hiện tại đúng, rủi ro chỉ ở tương lai khi hàm bị sửa, và các hàng sau sẽ tự thêm ca kiểm khi mở B5.
  file: `pipeline/scripts/bac-du-lieu.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): assert `J.seq.at(-1) === "bac-du-lieu"` kiểm hằng do chính test khai**
  Người dùng thấy gì: Một câu khẳng định trong bộ thử luôn đúng và trông như đang đo thứ tự bước cuối, nhưng thứ tự này đã được đo ở chỗ khác; người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là một dòng kiểm thừa, thứ tự thật đã có phép đo khác bảo vệ, sửa hay không cũng không đổi kết quả.
  file: `scripts/job-exit.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình): AC-6 chỉ kiểm vắng 6 mã thô, không kiểm dương «mỗi dòng phân khúc có tên thị trường và nhãn loại hình tiếng Việt»**
  Người dùng thấy gì: Bảng phân bố bậc in ra hiện được kiểm là không lộ mã loại hình thô, nhưng chưa có phép kiểm nào xác nhận mỗi dòng đều có tên thị trường và nhãn tiếng Việt đầy đủ.
  Căn cứ: Bảng vẫn in được và không lộ mã thô; nếu thiếu nhãn thì chỉ xấu chữ, người dùng nhìn là thấy và sửa sau không tốn kém.
  file: `app/scripts/bac-roundtrip.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
