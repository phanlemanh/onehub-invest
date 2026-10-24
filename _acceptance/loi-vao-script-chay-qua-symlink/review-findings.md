# Review findings: loi-vao-script-chay-qua-symlink

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khuôn lối vào mới ném ENOENT khi nhập module mà argv[1] không phải tệp có thật (lệch khuôn có sẵn ở product-map.mjs)**
  Người dùng thấy gì: Các job đêm và test hiện có vẫn chạy bình thường. Chỉ khi ai đó nạp các script này từ một lệnh có đối số lạ thì chúng sẽ báo lỗi ngay lúc nạp thay vì im lặng bỏ qua.
  Căn cứ: Hiện không job hay test nào gặp tình huống này nên người dùng không bị ảnh hưởng, không mất dữ liệu; nếu sau này gặp thì lỗi báo to và rõ nên dễ thấy, và sửa sau vẫn rẻ.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **AC-3 «không còn khuôn cũ» bỏ sót app/: check-baseline-growth.mjs vẫn so argv[1] thô**
  Người dùng thấy gì: Một công cụ kiểm tra chất lượng giao diện trong thư mục app vẫn dùng cách cũ để tự nhận mình đang được chạy, nên nếu sau này bị gọi qua đường tắt thì có thể chạy im lặng mà không kiểm gì. Hiện nó chỉ chạy trên CI bằng đường thật nên chưa bị.
  Căn cứ: Hiện chưa gây hại vì chỉ chạy trên CI bằng đường thật; nếu có bị câm thì chỉ làm mất một lượt kiểm giao diện, không động tới dữ liệu và người dùng cuối không thấy, sửa sau không đắt.
  file: `app/eslint-plugin-onehub-ui/check-baseline-growth.mjs`
  severity: low
  Đề xuất: known-limits

- **Test của pipeline phụ thuộc agent/node_modules/.bin/tsx; thiếu thì báo sai thành «lối vào câm»**
  Người dùng thấy gì: Trên một máy mới chưa cài đủ gói cho phần agent, bộ kiểm sẽ báo đỏ nhưng ghi sai nguyên nhân là lối vào script bị câm, dễ khiến người đọc đi sửa nhầm chỗ.
  Căn cứ: Chỉ ảnh hưởng người phát triển trên máy mới, test vẫn đỏ nên không lọt lỗi thật, không liên quan tới dữ liệu hay người dùng cuối; cài đủ gói là hết, nên không đáng mở việc.
  file: `pipeline/scripts/entrypoint-symlink.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Test AC-1 bỏ qua r.error của spawnSync nên báo nhầm 'lối vào câm' khi thiếu tsx hoặc khi quá giờ**
  Người dùng thấy gì: Khi một ô kiểm bị quá giờ hoặc thiếu công cụ chạy, bộ kiểm báo là lối vào bị câm trong khi nguyên nhân thật khác, làm người đọc mất thời gian tìm sai chỗ.
  Căn cứ: Chỉ làm chẩn đoán gây hiểu nhầm cho người phát triển, không làm lọt lỗi và không đụng tới dữ liệu hay người dùng cuối; người đọc thử lại là thấy, nên chấp nhận và ghi vết.
  file: `pipeline/scripts/entrypoint-symlink.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3 — AC-3 assert chuỗi `realpathSync(process.argv[1]` có mặt, trong khi lời hứa là quan hệ giữa hai vế của phép so lối vào**
  Người dùng thấy gì: Bộ quét tự động chỉ kiểm được rằng các script có dùng cách nhận diện đường dẫn đúng, chưa kiểm được là phép so sánh được viết hoàn toàn đúng. Một script viết mới theo kiểu sai nhưng trông giống đúng có thể lọt và lại chạy im lặng qua đường tắt.
  Căn cứ: Mười hai script quan trọng đã được chạy thật qua đường tắt nên rủi ro cho job đêm hiện tại đã được chặn; phần hở chỉ là script viết mới trong tương lai, nếu lọt cũng chỉ là lại im lặng như cũ và sẽ lộ ở lượt đêm, sửa sau không đắt.
  file: `pipeline/scripts/entrypoint-symlink.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên bố quét cả lớp «mọi tệp mang lối vào so chuỗi thô», nhưng danh sách thư mục cố định bỏ sót một thành viên còn sống của lớp**
  Người dùng thấy gì: Bộ quét nói là bắt mọi script dùng cách cũ nhưng thực ra bỏ qua thư mục giao diện app, nên một script cũ ở đó vẫn còn mà không bị báo.
  Căn cứ: Script còn sót chỉ chạy trên CI bằng đường thật nên chưa gây câm thật, không ảnh hưởng dữ liệu hay người dùng cuối; ghi rõ giới hạn là đủ, mở rộng phạm vi quét sau cũng rẻ.
  file: `pipeline/scripts/entrypoint-symlink.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
