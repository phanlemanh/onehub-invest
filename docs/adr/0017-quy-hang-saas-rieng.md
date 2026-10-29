# ADR-0017: Quỹ hàng là sản phẩm SaaS riêng — Invest cấp dữ liệu qua một kết nối một chiều có thoả thuận

Ngày: 2026-10-29 · Trạng thái: **accepted** (Mạnh chốt 29/10: chỗ đứng «Chốt app riêng»; nguyên tắc SaaS «Chốt, viết
ADR») · Liên quan: ADR-0007 (SPL), ADR-0011 (RESO-first), ADR-0013 và ADR-0016 (căn, danh bạ vật thể), ADR-0014 và
ADR-0015 (cloud không chọc vào máy local), `docs/architecture/portals.md`, ROADMAP §3 mục 13 và 15

## Bối cảnh

**Quỹ hàng** là ứng dụng quản lý hàng cho sàn môi giới: nhận lead chủ nhà, biến thành căn sẵn sàng bán, giữ tươi,
phát cho đầu khách và khách qua link sống. Thiết kế (bối cảnh, phỏng vấn, kiến trúc thông tin, 41 màn phác thảo) nằm
ở tài liệu thiết kế riêng tư của Quỹ hàng, không nằm trong kho này.

Quỹ hàng cần đúng những thứ Invest đang có: danh mục dự án → toà → trục → căn (ADR-0016), số thị trường theo toà,
tin rao công khai để đối chiếu giá. Câu hỏi: Quỹ hàng nằm ở đâu, và dữ liệu đi qua lại thế nào.

Bốn điều khiến Quỹ hàng không thể là một phần của kho hay app này:

| Điều | Invest | Quỹ hàng |
|---|---|---|
| Khách hàng | Nhà đầu tư (cổng `/vn/**`) và đội vận hành (cổng `/ops/**`) | Nhiều sàn môi giới, mỗi sàn một vùng dữ liệu riêng |
| Dữ liệu người dùng | Hồ sơ người dùng app là tầng A, không rời máy local (luật 6) | Tài khoản và quỹ hàng của sàn chạy trên máy chủ, đi kèm hợp đồng và điều khoản (chốt 28/10) |
| Dữ liệu nhạy nhất | Tên nguồn thật | Tên và số điện thoại chủ nhà — người thường, không phải người đăng rao, nên **không** thuộc tầng C |
| Kho mã | Công khai, có bản sao công khai (`tools/sync-public`); launchd chạy code từ checkout chính | Cần riêng tư; phát hành theo nhịp của sàn |

## Quyết định

### 1. Chỗ đứng

Quỹ hàng là **ứng dụng riêng** thuộc phía cung của OneHub Platform; **không phải cổng thứ ba** của OneHub Invest.
Luật hai cổng (`portals.md`, AGENTS.md luật 9) giữ nguyên: `app/` không có route nào của Quỹ hàng.

### 2. Kho và dữ liệu tách hẳn

- Kho riêng tư `phanlemanh/onehub-quy-hang`, không có bản công khai.
- Cơ sở dữ liệu riêng (dự án Supabase riêng). Quỹ hàng không đọc cơ sở dữ liệu của Invest; Invest không đọc cơ sở
  dữ liệu của Quỹ hàng.
- Luật dữ liệu của Invest (SPL, tầng A/C) không áp lên dữ liệu của Quỹ hàng; Quỹ hàng có luật dữ liệu của riêng nó,
  ghi trong kho Quỹ hàng. Hai bộ luật gặp nhau ở đúng một chỗ: cửa ra của mỗi bên (mục 5).

### 3. Nguyên tắc SaaS: cơ chế ở kiến trúc, chính sách ở thoả thuận

Quỹ hàng là SaaS dọc cho ngành bất động sản: linh hoạt theo công ty và theo kết nối, nhưng lõi viết chặt — không đối
tượng mới, không công thức, không bố cục tự dựng (chốt 28/10). Năm tầng, mỗi tầng một người đổi:

| Tầng | Gồm | Ai đổi |
|---|---|---|
| Bất biến | Cách ly giữa công ty · thông tin chủ nhà không rời công ty · người luôn bấm gửi, không tự động hoá Zalo cá nhân · phần nội bộ không ra trang khách | Không ai — đổi là đổi sản phẩm |
| Kiến trúc (cơ chế) | Lõi nghiệp vụ, API, hộp thư sự kiện, loại kết nối, đối tượng thoả thuận, lớp dữ liệu | Đội sản phẩm, qua code + ADR |
| Cấu hình công ty | Cách gọi riêng, trạng thái riêng, trường riêng, luật chia lead, thuế phí, vai | Quản trị của công ty |
| Thoả thuận kết nối (chính sách) | Bật kết nối nào, chiều nào, lớp dữ liệu nào, hiệu lực | Người có thẩm quyền của hai bên; có nhật ký |
| Vận hành | Mở công ty, gói dịch vụ, hợp đồng, hỗ trợ | Đội vận hành, không chạm dữ liệu của công ty |

- **Thoả thuận là một đối tượng của hệ thống**: hai bên · loại kết nối · chiều · lớp dữ liệu được đi · hiệu lực · ai
  duyệt · nhật ký. Tắt là dừng chảy ngay.
- **Lớp dữ liệu có trần**; thoả thuận chỉ mở tới trần. Danh mục: ra ngoài được · hàng chia sẻ được: theo thoả thuận,
  qua luật ẩn · nội bộ công ty: trong công ty · **nguồn (chủ nhà, số, giá đáy, ảnh sổ): không bao giờ rời công ty** ·
  giao dịch (giá chốt): mặc định tắt, chỉ mở bằng thoả thuận có điều khoản riêng · hành vi (lượt mở): chỉ dạng tổng hợp.
- **Không bên nào được viết cứng.** Invest là bên cung cấp đầu tiên của loại kết nối «nguồn danh mục và thị trường»;
  Platform là kênh đầu tiên của loại «kênh đăng» và «nguồn lead». Chỗ đứng ở mục 1 là chiến lược kinh doanh, không phải
  ràng buộc kiến trúc.
- **Đội của mình là một công ty như mọi công ty**: không cửa riêng; đội vận hành OneHub vào dữ liệu một công ty chỉ khi
  công ty cấp quyền hỗ trợ có hạn, có nhật ký.

### 4. Một API cho mọi bề mặt; giữa các hệ thống là hợp đồng và sự kiện

- Mọi bề mặt của Quỹ hàng (máy tính, điện thoại, trang khách, app gốc và bộ gõ sau này) và mọi hệ thống ngoài đi qua
  một API có phiên bản, kiểu REST có mô tả OpenAPI. Mọi thay đổi là một lệnh qua API; máy chủ kiểm quyền và luật rồi
  ghi sự kiện — đường ghi duy nhất.
- Giữa các hệ thống không gọi qua lại tức thì: Quỹ hàng ghi sự kiện ra hộp thư đi và giao qua webhook có ký, gửi lại
  khi lỗi; dữ liệu cấp vào đi theo khuôn có số phiên bản.

### 5. Kết nối đầu tiên: Invest → Quỹ hàng, một chiều

Thoả thuận đang bật, loại «nguồn danh mục và thị trường»:

| Đi sang Quỹ hàng | Không bao giờ đi |
|---|---|
| Danh mục dự án → toà → trục → căn và thuộc tính căn từ danh bạ vật thể (ADR-0016); mặt bằng theo trục | Vật thể và giá trị chỉ có từ S08 (luật 5: S08 không tái xuất) |
| Số thị trường tổng hợp theo toà và loại căn (dải giá đang rao, trung vị), kèm mốc đo | Số AirDNA (luật 5) |
| Tin rao công khai đã khớp căn: giá, điều kiện phí nếu có, ngày, người đăng (tầng C) | Tên nguồn thật, tên miền, **đường dẫn bài gốc** — chúng lộ tên nguồn (tầng A) |
| — | Ảnh tin rao; hồ sơ người dùng Invest; mọi bảng `stg_*` |

- **Invest đẩy, không ai chọc vào Invest.** Cùng mẫu với ADR-0014: máy local tính sẵn, đẩy kèm mốc đo. Invest không mở
  cửa vào nào cho Quỹ hàng gọi (cùng tinh thần ADR-0015: cloud không với vào máy local).
- **Luật của Invest chặn ở cửa ra của Invest**: bộ soát tầng A, S08 và AirDNA chạy trước khi đẩy; gói không qua soát
  thì không đi. Quỹ hàng không cần biết các luật đó, vì không bao giờ nhận.
- **Khuôn do loại kết nối định nghĩa**, nằm ở kho Quỹ hàng (bên cung cấp nào cũng theo cùng khuôn); Invest ghim số
  phiên bản khuôn mình đẩy. Đổi khuôn thì tăng phiên bản, giữ bản cũ một thời gian.
- **Danh mục cho dự án đầu tiên không dựng từ S08**: lấy từ bảng hàng Excel của sàn thử và phần danh bạ vật thể không
  đến từ S08.

### 6. Chiều ngược: tắt, và mở bằng thoả thuận chứ không bằng kiến trúc

Quỹ hàng → Invest hiện **tắt**. Ứng viên về sau: giá chốt (nguồn giá giao dịch thật), báo sai thông tin căn. Mở là
một quyết định kinh doanh có điều khoản với sàn; Invest nhận qua cửa kiểm của chính nó — thành phát biểu kèm bằng
chứng (ADR-0013), qua người duyệt hoặc luật xác định (luật 7), không ghi thẳng vào danh bạ. Lớp «nguồn» không bao giờ
sang Invest.

## Hệ quả

- **Trong kho này chỉ thêm một việc**: một bước đẩy nguồn cấp ở `pipeline/` (làn Claude), kèm bộ soát — hàng việc
  riêng, làm khi kho Quỹ hàng đã có khuôn kết nối. Không thêm route, bảng hay quyền nào vào `app/`.
- **ZCode không có việc mới**: nguồn cấp đọc từ danh bạ và metrics đã có, không chạm `stg_*` hay DATA-CONTRACT.
- **Kho Quỹ hàng tự giữ ADR của nó** cho stack, cách ly theo dòng, bộ đồng bộ, đăng nhập. Hướng khởi điểm (Next.js,
  Postgres riêng với luật theo dòng theo công ty, better-auth có tổ chức, Vercel) chốt tiếp ở đó sau ba bài thử: lưới
  5.000 dòng sửa trên ô, bộ đồng bộ khi mất mạng, ảnh xem trước của link trên Zalo.
- **Cổng bắt buộc trước mỗi lần phát hành của Quỹ hàng**: kiểm «công ty này không thấy gì của công ty kia» và kiểm
  trang khách không chứa trường nội bộ.

## Không làm

- Cổng `/quy-hang/**` hay bất kỳ route Quỹ hàng nào trong `app/`.
- Dùng chung cơ sở dữ liệu, đọc chéo bảng, hay đồng bộ hai chiều giữa hai kho dữ liệu.
- Đưa Quỹ hàng vào bản sao công khai hay vào `tools/sync-public`.
- Tích hợp riêng từng bên kiểu dây cứng — mọi kết nối đi qua loại kết nối và thoả thuận.

## Còn mở (chốt ở kho Quỹ hàng hoặc ở khâu vận hành)

- Danh mục căn dùng ra ngoài: dựng từ bảng hàng sàn nhập, hay mua có quyền dùng ra ngoài.
- Rà pháp lý theo Luật Bảo vệ dữ liệu cá nhân (hiệu lực 1/1/2026) trước khi có sàn đầu tiên ngoài đội.
- Cách đăng nhập, tên miền trang khách, bộ đồng bộ dùng dịch vụ có sẵn hay tự làm.
