# ADR-0015: Đường lệnh kéo một chiều cloud → máy thu

Ngày: 2026-10-26 · Trạng thái: accepted (Mạnh duyệt 26/10 — «duyệt TV0») · Bổ sung ADR-0014 (không thay) · Đi cùng sửa đổi ADR-0007
ngày 26/10 · Nguồn: `docs/research/ops-tu-van-hanh-nguon-saas.md` §3, §4.8 (PR #79), hàng TV0 của
`docs/plan/lo-trinh.json`

## Bối cảnh

Mạnh chốt ngày 25/10: đội vận hành dữ liệu **làm việc từ xa trên cổng Ops ở cloud**, không cần ngồi ở máy thu và không
cần Mạnh. Audit chỉ đọc ngày 25/10 (tài liệu nguồn §2) cho thấy:

- **0/19** thao tác vận hành đạt chuẩn «kiểm trước + nhật ký người thật + hoàn tác»; 8/19 hôm nay chỉ Mạnh làm được.
- **G4 — không có đường cloud → máy thu.** Mọi thao tác ghi chỉ chạy ở máy thu; cloud chỉ đọc số tổng hợp
  15′/lần (ADR-0014). «Làm trên cổng Ops» hôm nay nghĩa là ngồi ở máy thu.
- **G3 — ghi thẳng, không kiểm, không người, không đảo.** Route app ghi ngay vào runtime, actor là hằng số, purge xoá
  cứng `stg_*`.
- **G6 — an toàn Zalo dựa vào bắt-sau-khi-xảy-ra.** Gateway nạp nóng cấu hình dưới 1 giây; bộ canh kiểm sau tối đa
  5′. Một cấu hình sai được nạp trước khi ai kịp thấy.

ADR-0014 quyết cloud chỉ đọc và loại phương án tunnel (C) vì mở cổng vào máy đang giữ phiên Zalo. Quyết định 25/10
cần một đường ghi mà vẫn giữ lý do đã loại C.

## Quyết định

**Mặt điều khiển ở cloud, mặt thực thi ở máy thu. Cloud chỉ ghi ý muốn; máy thu kéo ý muốn về, kiểm, áp và báo lại.**

1. **Cloud chỉ ghi Lệnh có khuôn.** Thao tác ghi trên cổng Ops ở cloud tạo một dòng trong `change_requests` (loại
   lệnh, đích, `payload`, `before`, người gửi, người duyệt, `idempotency_key`, kết quả, lệnh đảo). Cloud **không bao
   giờ gọi vào máy thu**: không tunnel, không cổng mở vào, không webhook ngược. Lý do loại phương án C của ADR-0014
   giữ nguyên.
2. **Máy thu kéo ra ngoài.** Bộ áp `ops-apply` chạy ở máy thu (launchd, nhịp khởi điểm 60″, TV4 chốt số), gọi HTTPS
   ra cloud bằng **token máy theo tên** với scope `ops:pull`, không dùng `OPS_API_TOKEN` chung. Token này chỉ kéo được
   lệnh đã duyệt và gửi kết quả; nó không tạo hay duyệt được lệnh. Máy thu tắt thì lệnh nằm chờ, và cloud hiện
   «Máy thu chưa nhận lệnh từ HH:MM (giờ VN)» theo khuôn tín hiệu sức khoẻ của ADR-0014 quyết định 3. Không bao giờ
   hiện «đã áp» khi chưa có kết quả từ máy thu.
3. **Một bộ áp, sáu bước.** (1) kéo lệnh đã duyệt → (2) kiểm khuôn và bất biến bằng hàm thuần → (3) chạy thử, ra diff
   → (4) áp nguyên tử vào đích (DB local, cấu hình gateway, plist), giữ bản trước có số gắn mã lệnh → (5) kiểm sau áp
   → (6) kiểm sau hỏng thì tự áp lại bản trước; báo kết quả. Máy thu là bên duy nhất ghi vào runtime. Route app
   đang ghi thẳng (`source-groups`, `zalo/**`) chuyển sang lệnh ở hàng của nó (TV5, TV6). ADR này không đổi chúng.
4. **Chỉ lệnh có khuôn.** Danh sách loại lệnh đóng. Khởi điểm theo tài liệu nguồn §3.4: `unit.create` ·
   `unit.update_meta` · `unit.enable` · `unit.disable` · `unit.retire` · `source.pause` · `source.resume` ·
   `source.set_schedule` · `source.set_slo` · `context_rule.publish` · `context_rule.retire` · `coverage_target.set` ·
   `job.rerun` · `review.decide`. Không có lệnh tự do, không có «sửa JSON». Lịch chọn từ preset của loại nguồn, không
   gõ cron. Chỉ owner thêm được loại lệnh.
5. **Máy trạng thái của lệnh.**
   `draft → submitted → approved → queued → applying → applied`; `submitted → rejected`;
   `applying → failed → reverted` (tự động). Hoàn tác một lệnh đã áp là **một lệnh đảo mới** đi lại đúng vòng trên.
   Không sửa lệnh cũ. Mỗi lệnh có `idempotency_key`; bộ áp áp một lệnh tối đa một lần.
6. **Quyền và người duyệt.** Bảng vai `viewer · ops · admin · owner` nằm ở một chỗ (`app/src/lib/ops-access.ts`,
   hàng TV1). Trang và API dùng cùng luật. **Mọi lệnh chạm S03 cần người thứ hai duyệt** (admin khác hoặc owner —
   tài liệu nguồn §4.8 #1). Lệnh S05/S06, tạm dừng nguồn, sửa tiêu đề hay mô tả thì không cần. Admin tự duyệt được
   lệnh của mình, nhưng luôn phải qua bước xem diff.
7. **An toàn Zalo bằng thiết kế (luật 8, không nới lớp nào).**
   - **Khoá cấm**: bộ áp từ chối mọi lệnh có trường nằm trong `bindings`, `channels.zalo`, `plugins.entries.zalo`,
     `agents.*`, `talk`, `commands.*`, `hooks.internal.*`, `pluginHooks`, `groupPolicy`, `groupAllowFrom`, hay
     `requireMention` ở bất kỳ cấp nào. UI không có ô nào cho các khoá này.
   - **Kiểm trước khi ghi** bằng một hàm thuần `checkZaloInvariants(cfg)`. Bộ áp và bộ canh dùng chung hàm này
     (TV3a, TV3b). Vi phạm thì không ghi.
   - **Kiểm sau áp ở hai phía**: chạy bộ canh ngay sau khi áp. Trong 10′ phải thấy cả «0 lượt máy tự trả lời» lẫn
     «tin vẫn chảy». Một trong hai hỏng thì tự áp lại bản trước và báo.
   - Lệnh chạm S03 áp **từng lệnh một**, không gộp.
   - **Thêm nhóm S03 nghĩa là cho phép đọc một nhóm mà tài khoản thu đã ở trong đó.** Vào nhóm là việc người làm trên
     điện thoại. Agent không bao giờ vào nhóm.
   - **Phanh**: một cờ ở máy thu (chỉ người ngồi ở máy bật được) dừng bộ áp. Owner có nút «đóng băng thay đổi» trên
     cloud.
8. **Kết quả đi lên bằng đường đã có.** Kết quả lệnh, diff và nhật ký đi qua `pipeline/push-ops-facts.mjs` và bộ soát
   tầng A (ADR-0014 quyết định 1–2). Không dựng đường đẩy thứ hai. Nếu ngưỡng «≤ 5′» của TV4 cần nhịp nhanh hơn chu
   kỳ cloud-sync 15′, bộ áp gọi đường đó ngay sau mỗi lượt áp. Trên cloud có bản che tầng A; ở máy thu có bản đủ.
9. **Không bao giờ đi qua đường lệnh**: ảnh QR đăng nhập (ở lại máy thu, §4.8 #2), khoá API, credit, phiên, profile
   trình duyệt. Catalog trên cloud chỉ biết `secret_ref` và trạng thái («có khoá · hết hạn · hết credit»), do máy thu
   báo lên.

### Quan hệ với ADR-0014

ADR này **bổ sung** ADR-0014, không thay:

- **Giữ**: một đường đẩy số (`push-ops-facts`); trang cloud không tự đo thứ chỉ có ở máy thu; ngưỡng trễ 45′; loại
  sync bản gọt (B) và tunnel (C).
- **Đổi**: «Ops trên cloud chỉ đọc» thành «Ops trên cloud đọc số và ghi ý muốn».
- **Hai dòng của bảng «Trang nào đọc gì» của ADR-0014 sẽ thay khi hàng của nó giao**:
  - dòng `/ops/review` («nội dung thẻ là tầng A, chỉ ở local») thay bằng sửa đổi ADR-0007 ngày 26/10 khi TV13 giao;
  - dòng `/ops/sources` («không lên cloud»): catalog bản điều khiển (mã S0x, đơn vị thu, khuôn, vòng đời) lên cloud.
    Bảng giải mã tên nguồn thật vẫn chỉ ở máy thu.

## Phương án đã loại

- **Tunnel hoặc cổng mở vào máy thu** (phương án C của ADR-0014): vẫn loại, cùng lý do.
- **Cloud đẩy lệnh xuống** (webhook, push): cần máy thu nghe một cổng từ ngoài vào. Đó là phương án C dưới tên khác.
- **Đồng bộ bảng cấu hình hai chiều** (máy thu chép bảng cấu hình từ cloud, job đọc thẳng): không có điểm kiểm trước
  khi ghi, không có diff, không hoàn tác, và cấu hình gateway không đi qua `checkZaloInvariants`. Lặp lại G3 và G6.
- **Giữ thao tác ghi ở máy thu**: trái quyết định 25/10; G4 còn nguyên.

## Hệ quả

- **Tốt**: G4 hết; mọi thao tác ghi có kiểm trước, nhật ký người thật, diff và lệnh đảo (G3); cấu hình gateway sai bị
  chặn trước khi nạp chứ không phải bị bắt sau 5′ (G6); máy thu không mở cổng nào.
- **Chịu**:
  - Lệnh trễ tối đa một nhịp kéo cộng một nhịp báo kết quả. Ops không phải bảng điều khiển thời gian thực.
  - Máy thu là điểm đơn. Máy tắt thì không lệnh nào áp; cloud phải nói rõ điều đó.
  - Thêm một bề mặt là token máy `ops:pull`. Người cầm token chỉ kéo được lệnh đã duyệt. Người có quyền admin trên
    cloud ra được lệnh, nhưng chỉ trong danh sách loại lệnh đóng, trừ khoá cấm, có người thứ hai duyệt cho S03, và
    máy thu vẫn có phanh.
  - `push-ops-facts.mjs` (đã ở `t3_paths`) thêm một khối kết quả lệnh. TV4 vào chuỗi «chạy liền nhau» của BOI-CANH §4.
- **Lộ trình** (đợt `tu-van-hanh-2510`): TV1, TV2a, TV4 đứng trên ADR này; TV5, TV6, TV7, TV8, TV12, TV13, TV14 đi qua
  đường lệnh. UH7 `/ops/console` mở lại bằng hàng đường lệnh.
- **Việc của người** (ra khỏi kho): cấp token máy `ops:pull`; chỉ định trưởng vận hành làm `admin`; tạo tài khoản vai
  thật cho đội vận hành.
