## Trong hợp đồng

- **Hình 3 (assert «chuỗi có mặt» thay cho quan hệ): kiểm form gắn server action chỉ bằng `action` khác rỗng**
  AC: AC-5
  file: `app/tests/auth-hop-chuan.test.tsx:171`
  severity: medium
  source: measurement
  detail: AC-5 hứa «form vẫn gửi ĐÚNG server action như trước», tức form đăng nhập nối với `login`, form đăng ký nối với `register`. Test chỉ có `assert.ok(log.querySelector("form")?.getAttribute("action"))` (dòng 171) và `assert.ok(root.querySelector("form")?.getAttribute("action"))` (dòng 177). Khi dựng phía client, React 19 đặt cùng một chuỗi `javascript:throw …` cho MỌI action là hàm, còn action dạng chuỗi bất kỳ cũng cho giá trị khác rỗng. Vì vậy tráo `login` và `register`, hoặc gắn một hàm bất kỳ, thì ca vẫn xanh. evals.yaml E5 còn ghi «so với bản render đối chứng của chính form», nhưng trong test không có bản đối chứng nào: lời mô tả của eval hứa nhiều hơn phép đo thật làm.
  rationale: AC-5 hứa form gửi đúng server action như trước, mà phép kiểm không phân biệt được hai action nên AC chưa được chứng minh.

- **Hình 4 (assertion âm tính đứng một mình): quét <style> chuyển động trong jsdom không có đối chứng dương**
  AC: AC-1
  file: `app/tests/auth-hop-chuan.test.tsx:101`
  severity: medium
  source: measurement
  detail: Ở dòng 99-102, `root.querySelectorAll("style")` rồi `assert.ok(!styles.some(s => /@keyframes|animation/.test(s)))`. Quét tĩnh bên trên có chiều đỏ cấy chuỗi, còn nửa render này thì không. Không có ca nào chứng minh bộ quét bắt được `<style>` chứa @keyframes khi nó thật sự được dựng. Ví dụ React 19 kéo `<style href precedence>` lên document.head, mà phép quét chỉ nhìn #root. Kết quả 0 vì đúng là sạch hay 0 vì quét nhầm chỗ thì không phân biệt được.
  rationale: AC-1 đòi khi render không có @keyframes hay animation, nhưng phép quét phía render không có đối chứng nên không đo được AC này.

- **Hình 3 (assert «chuỗi có mặt» thay cho quan hệ): safeNext kiểm bằng cách grep mã nguồn trang**
  AC: AC-5
  file: `app/tests/auth-hop-chuan.test.tsx:184`
  severity: low
  source: measurement
  detail: AC-5 hứa «?next= vẫn đi qua safeNext», tức giá trị `next` truyền cho form và dùng trong redirect phải là `safeNext(rawNext)`. Test chỉ `assert.match(readApp(f), /safeNext\(rawNext\)/)`, tức chuỗi lời gọi có mặt trong tệp. Một trang gọi `safeNext(rawNext)` rồi vẫn truyền `rawNext` vào `<LoginForm next=…>` hay `redirect(...)` thì vẫn xanh. Quan hệ «đầu ra = safeNext(đầu vào)» không được đo.
  rationale: AC-5 hứa ?next= vẫn đi qua safeNext, mà phép kiểm chỉ grep chuỗi lời gọi chứ không đo giá trị thật được dùng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Smoke đăng ký chỉ chặn DATABASE_URL, không chặn BASE_URL: trỏ vào máy khác sẽ tạo tài khoản thật ở đó mà không dọn**
  Người dùng thấy gì: Nếu ai đó chạy kiểm thử đăng ký nhầm vào bản chạy thật hoặc máy khác, một tài khoản thử sẽ bị tạo ở đó và không ai dọn. Khách dùng không bị ảnh hưởng trực tiếp, chỉ để lại tài khoản rác.
  Căn cứ: Chỉ xảy ra khi người dev tự trỏ nhầm địa chỉ, hậu quả nhẹ là một tài khoản rác xoá tay được, và việc thêm rào kiểm địa chỉ có thể làm riêng sau.
  file: `scripts/dev-register-check.mjs`
  severity: medium
  Đề xuất: known-limits

- **(auth)/error.tsx gọi reset() trong khi trang /register và /login lỗi ở phía server; kho đã có mẫu retry() cho đúng tình huống này**
  Người dùng thấy gì: Khi trang đăng nhập hoặc đăng ký lỗi vì dữ liệu tạm thời, bấm «Thử lại» có thể không khôi phục được và khách phải tự tải lại trang.
  Căn cứ: Khách tải lại trang là thoát được nên không mất dữ liệu, nhưng nút bấm không làm đúng việc nó hứa; sửa cần đổi cả hợp đồng lẫn kiểm thử nên nên mở việc riêng.
  file: `app/src/app/(auth)/error.tsx`
  severity: medium
  Đề xuất: new-contract

- **Bước kiểm vai `user` bị chặn khỏi Ops đạt với mọi mã khác 200, nên phiên hỏng hoặc server lỗi vẫn báo xanh**
  Người dùng thấy gì: Bài kiểm đăng ký đầu-cuối có thể báo đạt dù phiên vừa đăng ký không dùng được hoặc trang Ops đang lỗi. Khách không thấy gì khác, nhưng đội có thể tin nhầm là mọi thứ ổn.
  Căn cứ: Chỉ làm bài kiểm bớt nhạy, không ảnh hưởng khách và không mất dữ liệu; có thể siết lại sau mà không tốn nhiều.
  file: `scripts/dev-register-check.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bước email trùng in 'không tạo phiên' nhưng không kiểm điều đó**
  Người dùng thấy gì: Bài kiểm in ra rằng đăng ký lại cùng email không tạo phiên nhưng thực ra không kiểm điều đó. Hiện app vẫn chạy đúng, chỉ là sau này nếu hỏng thì bài kiểm không báo.
  Căn cứ: App đang đúng nên khách không gặp gì; rủi ro chỉ là bỏ sót lỗi trong tương lai và sửa rất rẻ khi cần.
  file: `scripts/dev-register-check.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
