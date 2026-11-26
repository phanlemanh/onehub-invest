# Review findings: yeu-cau-khong-thanh-tin-thue (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bằng chứng E10 (pipeline_that) được chạy trước lần sửa regex transform-zalo ở HEAD**
  Người dùng thấy gì: Hồ sơ nghiệm thu ghi kết quả chạy thử bộ kiểm tra toàn đường ống ở phiên bản trước lần chỉnh luật cuối cùng. Bản cuối vẫn qua các bài kiểm tra riêng, nhưng chưa có lần chạy toàn bộ xác nhận lại cho đúng bản cuối.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, các bài kiểm tra riêng của luật vẫn xanh, và chỉ cần chạy lại bộ kiểm tra một lần là bổ sung được bằng chứng với chi phí thấp.
  file: `_acceptance/yeu-cau-khong-thanh-tin-thue/evidence/m5-pipeline-that.txt`
  severity: low
  Đề xuất: known-limits

- **pl42_loai_tin so với origin/main thay vì một sha ghim, khác mẫu có sẵn (r1)**
  Người dùng thấy gì: Phép kiểm «bộ test cũ không bị sửa» có thể báo đỏ oan nếu nhánh chính đổi hai tệp đó vì việc khác, và sau khi gộp thì luôn xanh nên không còn bắt được gì. Người dùng cuối không thấy ảnh hưởng nào, chỉ đội phát triển có thể gặp báo động giả.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu của người dùng, chỉ có nguy cơ báo đỏ nhầm trong khâu kiểm, và chạy lại hay ghim lại sau này đều rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **pipeline/CLAUDE.md ghi sai nơi `--kiem` ghi tệp mẫu (lệch với code và luật GS 26/11 điểm 6) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tài liệu hướng dẫn chạy lệnh đo ghi sai chỗ lưu tệp mẫu, nên người đọc có thể tưởng chạy lệnh là làm mới bản bằng chứng đã nộp. Dữ liệu và người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ gây nhầm cho người vận hành đọc tài liệu, không mất hay lộ dữ liệu, tự phát hiện được khi chạy thử và sửa một dòng chữ là xong.
  file: `pipeline/CLAUDE.md`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: E10 hứa một QUAN HỆ (tập ca bị bỏ = tập may_thu của ci-bo-qua.json) nhưng lệnh chỉ đo exit 0 / fail 0 (r1)**
  Người dùng thấy gì: Phép kiểm trên máy phát triển chỉ xác nhận bộ kiểm thử chạy xanh, chưa xác nhận số ca bị bỏ qua đúng danh sách đã khai. Nếu có ca bị bỏ thừa hay thiếu thì vẫn không bị báo đỏ.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ làm lưới kiểm thử thưa hơn ở một chỗ; kho đã có phép đo riêng cho quan hệ này nên rủi ro thấp.
  file: `_acceptance/yeu-cau-khong-thanh-tin-thue/evals.yaml`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
