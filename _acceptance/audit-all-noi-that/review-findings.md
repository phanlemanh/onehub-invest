# Review findings: audit-all-noi-that (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **ROOT suy từ vị trí script làm audit đọc pipeline/logs của worktree (không có log) → báo sai «AirDNA nightly log trống»**
  Người dùng thấy gì: Khi chạy kiểm tra sức khoẻ từ bản làm việc phụ của Claude, báo cáo có thể nói sai là «tác vụ AirDNA ban đêm chưa chạy» dù đêm vẫn chạy bình thường. Người vận hành thấy một cảnh báo vàng giả và có thể mất công đi tìm lỗi không có.
  Căn cứ: Hậu quả nhẹ: chỉ là một cảnh báo vàng giả, không mất hay lộ dữ liệu, người dùng chạy lại từ thư mục chính là hết, và sửa sau cũng rẻ nên xếp thành việc riêng.
  file: `scripts/audit-all.sh`
  severity: medium
  Đề xuất: new-contract

- **Fixture launchctl khai là «bản chụp THẬT 23/10» nhưng thực ra đã lọc: mất dòng tiêu đề và 8/10 job oneinvest**
  Người dùng thấy gì: Bộ kiểm tra tự động nói rằng nó dựa trên bản chụp thật của danh sách tác vụ nền, nhưng thực ra chỉ có hai dòng. Hai tình huống như tác vụ sao lưu đang chạy giữa chừng chưa được thử, nên độ tin cậy ghi trong hồ sơ cao hơn thực tế một chút.
  Căn cứ: Hậu quả nhẹ: báo cáo cho người dùng vẫn đúng, chỉ là hồ sơ nghiệm thu nói quá mức đã kiểm; ghi rõ giới hạn là đủ, không cần dựng việc mới.
  file: `scripts/fixtures/launchctl-list-2026-10-23.txt`
  severity: low
  Đề xuất: known-limits

- **ROOT suy từ vị trí script khiến chạy audit từ worktree đọc log rỗng, báo LIMITED giả cho AirDNA nightly**
  Người dùng thấy gì: Chạy kiểm tra sức khoẻ từ bản làm việc phụ cho ra cảnh báo giả rằng nhật ký AirDNA ban đêm trống. Người vận hành có thể tưởng tác vụ đêm bị hỏng trong khi nó vẫn chạy.
  Căn cứ: Hậu quả nhẹ: chỉ là cảnh báo vàng giả, không mất dữ liệu, người dùng tự kiểm lại được ngay từ thư mục chính; sửa riêng sau không đắt và nên gộp cùng việc của lỗi trùng này.
  file: `scripts/audit-all.sh`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 6 (đường dẫn hardcode ROOT): ca AA-AC-6 «ROOT = cây tạm» không phân biệt được cây tạm với checkout của tác giả**
  Người dùng thấy gì: Bộ kiểm tra tự động có thể vẫn xanh nếu về sau ai đó viết cứng lại đường dẫn tới máy của tác giả, vì trên máy này file log thật cũng tồn tại. Lỗi cũ có thể quay lại mà không ai biết ngay.
  Căn cứ: Hậu quả nhẹ với người dùng cuối: hiện báo cáo vẫn đúng và không mất dữ liệu, chỉ là lưới an toàn chống lỗi cũ quay lại còn lỏng, ghi lại giới hạn là đủ.
  file: `scripts/audit-all.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): «không lệnh thật nào chạy» chỉ được đo bằng danh sách đen 5 đường tuyệt đối trên mã nguồn**
  Người dùng thấy gì: Bộ kiểm tra chỉ chặn vài cách gọi lệnh thật quen thuộc, nên nếu sau này có người gọi lệnh thật theo cách khác thì bộ kiểm tra vẫn xanh. Khi đó lúc kiểm tra có thể chạm mạng hay dịch vụ thật mà không ai hay.
  Căn cứ: Hậu quả nhẹ: hiện chưa có lời gọi thật nào lọt, rủi ro chỉ nằm ở lần sửa sau; người dùng không bị ảnh hưởng và việc siết chặt có thể làm khi chạm lại bộ kiểm tra.
  file: `scripts/audit-all.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): plist backup dựng tay theo đúng khoá PlistBuddy mà script đọc, không lấy ra từ install-cron.sh**
  Người dùng thấy gì: Phần kiểm tra thư mục sao lưu dùng file cấu hình dựng tay, không sinh từ công cụ cài thật. Nếu công cụ cài đổi cách ghi thì báo cáo sao lưu có thể sai mà bộ kiểm tra vẫn xanh.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra nếu hai bên lệch nhau trong tương lai; không mất dữ liệu, cảnh báo sai sẽ lộ ra ngay khi cài job sao lưu thật, nên ghi nhận giới hạn là đủ.
  file: `scripts/audit-all.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
