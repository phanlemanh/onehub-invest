# Review findings — leak-gate-kiem-anon (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC ở round này)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Runbook hứa «gỡ tiếp tới khi xanh» nhưng lệnh `qua role` không gỡ được khi anon chỉ là thành viên gián tiếp, nên lượt sau đỏ lại đúng dòng cũ**
  Người dùng thấy gì: Trong trường hợp hiếm là tài khoản công khai thuộc một nhóm quyền lồng nhiều tầng, lệnh gỡ mà báo lỗi in ra không có tác dụng. Người vận hành sẽ thấy cùng một dòng đỏ lặp lại mà sổ không chỉ cách thoát.
  Căn cứ: Dữ liệu không bị lộ vì hệ thống vẫn dừng lượt đồng bộ, và cấu hình mặc định của Supabase không có nhóm quyền lồng như vậy. Chỉ gây kẹt tạm thời cho người vận hành. Ghi chú thêm vào sổ là rẻ và có thể làm sau.
  file: `docs/ops/supabase-lock-anon-rls.md`
  severity: low
  Đề xuất: known-limits

- **Sổ vận hành hứa «lượt kế xanh hoặc đỏ với đường cấp kế tiếp», nhưng khi role là thành viên gián tiếp (chuỗi role lồng nhau) thì lệnh gỡ in ra không có tác dụng và lượt kế đỏ lại với ĐÚNG dòng cũ**
  Người dùng thấy gì: Khi quyền đọc công khai được mở qua một chuỗi nhóm quyền lồng nhau, làm đúng theo sổ vận hành vẫn không gỡ được và hệ thống cứ báo đỏ lặp lại. Sổ không nói cách tự tra và gỡ ở mắt xích trực tiếp.
  Căn cứ: Không lộ dữ liệu vì hệ thống vẫn dừng lượt đồng bộ, và tình huống này hiếm trên cấu hình mặc định. Người vận hành có thể tự tra và gỡ thủ công, nên ghi thành han chế đã biết là đủ.
  file: `docs/ops/supabase-lock-anon-rls.md`
  severity: low
  Đề xuất: known-limits

- **Mỗi cặp role×quan hệ chỉ in MỘT đường cấp và một lệnh gỡ; khi quyền mở qua nhiều đường, chạy nguyên văn lệnh gỡ không làm lượt kế xanh như sổ vận hành hứa (r1)**
  Người dùng thấy gì: Nếu quyền đọc công khai bị mở qua nhiều đường cùng lúc, chạy đúng lệnh gỡ được in ra có thể chưa làm lượt đồng bộ kế tiếp xanh lại. Người vận hành phải gỡ thêm vài lượt, nhưng dữ liệu vẫn không bị lộ.
  Căn cứ: Hậu quả nhẹ vì cổng vẫn dừng an toàn, không lộ dữ liệu, người vận hành tự gỡ được bằng cách lặp lại lệnh gỡ mới; chỉ tốn thêm vài vòng đồng bộ và tình huống nhiều đường cùng mở khá hiếm.
  file: `pipeline/sync-cloud.mjs`
  severity: low
  Đề xuất: known-limits

- **Lệnh «gỡ:» chỉ nhắm MỘT đường cấp mỗi (role, quan hệ); quyền mở qua nhiều đường hoặc qua chuỗi role lồng nhau thì chạy đúng lệnh in ra vẫn không xanh (r1)**
  Người dùng thấy gì: Khi quyền đọc công khai đến qua nhiều đường hoặc qua chuỗi nhóm lồng nhau, lệnh gỡ mà hệ thống gợi ý có thể không có tác dụng và cổng cứ đỏ mãi với cùng một lệnh. Dữ liệu không bị lộ, nhưng người vận hành phải tự dò ra đường cấp thật.
  Căn cứ: Không lộ dữ liệu vì cổng vẫn dừng, và người vận hành tự gỡ được bằng cách tra tay đường cấp; chỉ gây mất thời gian xử lý ở tình huống hiếm (chuỗi nhóm lồng nhau), sửa sau không đắt nhưng cũng chưa cấp bách.
  file: `pipeline/sync-cloud.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên đo LỚP «không thuộc extension postgis» nhưng chỉ có một điểm-case khác TÊN, nhánh pg_depend không bao giờ được chạy tới (r1)**
  Người dùng thấy gì: Phép thử hiện chưa chứng minh được việc cổng chỉ bỏ qua ba quan hệ PostGIS khi chúng thật sự thuộc extension. Nếu có ai gỡ một trong ba quan hệ ấy khỏi extension rồi cấp quyền đọc công khai, cổng có thể không phát hiện.
  Căn cứ: Tình huống cần có người cố tình gỡ quan hệ khỏi extension rồi mở quyền, cực hiếm trên cloud thật; hậu quả nếu xảy ra là lộ dữ liệu của chỉ ba quan hệ hệ thống, và thêm một ô thử về sau không tốn kém.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
