# Danh bạ người hiện số gốc cho vai Vận hành (SD4 `people-hien-so-goc`)

Hạng T2, dãy U1. Hồ sơ: `_acceptance/people-hien-so-goc/`. Căn cứ: Hỏi-B ngày 30/10 (`docs/research/audit-bang-nguoi-sdt-3010.md`
dòng 291) và `docs/ROADMAP.md` §3 mục 24.

## Việc này làm gì

Hôm nay `/ops/people` hiện nhãn «SĐT (đã che)» ở mọi vai, ô tìm chỉ nhận tên và tài khoản, còn `/ops/deals` chỉ cho `admin`
thấy số người đăng. Sau việc này:

- Vai Vận hành và `admin` ở máy thu thấy số dạng `0912 345 678` trên danh sách và trang một người, chạm vào là gọi.
- Hai vai đó gõ `09…` hay `+84…` vào ô tìm thì ra đúng người có số ấy.
- Vai Vận hành thấy khối liên hệ trên `/ops/deals` như `admin`.
- Vai Người xem không nhận số nào trong HTML và dữ liệu đưa xuống trình duyệt, và không tìm được theo số.

Số đo hôm nay trên DB máy thu: 314 người đang hoạt động có bí danh `sdt` sống, cả 314 đúng khuôn `+84[35789]xxxxxxxx`, mỗi số
đúng một người. 212 bí danh `sdt_bam` đã nghỉ hết. Số 165 trong «Bật khi» của audit đã cũ, ngưỡng dùng số đếm lúc chạy.

## Thiết kế

**Lõi `app/src/lib/ops/people.ts`.**

- `fmtPhone` chuyển từ `deal-card.tsx` về đây, `deal-card.tsx` nhập lại và giữ xuất để nơi đang dùng không đổi.
- Thêm `telHref(kind, value, xem)`: trả `tel:+84…` khi vai xem được và giá trị đúng khuôn E.164, còn lại null. Giá trị lệch khuôn
  vẫn hiện chữ, không thành liên kết.
- Thêm `chuanHoaSdtTim(q)`: bỏ khoảng trắng, chấm, gạch, ngoặc rồi nhận `0…`, `84…`, `+84…` đủ chín số sau đầu số, trả `+84…`
  hoặc null. Chuỗi dở như `0912` trả null và tìm như chữ thường.
- `hienBiDanh` với `sdt` trả số đã tách nhóm. Gỡ `NHAN_CHE_SDT`. `sdt_bam` đời trước giữ nguyên 8 ký tự, vai dưới Vận hành vẫn null.
- `LOC` thêm tham số số đã chuẩn hoá: khớp nguyên giá trị trên bí danh `sdt` còn dùng của người đang hoạt động, cùng cách tên và tài
  khoản chỉ tìm trên bí danh còn dùng. Số đã nghỉ vẫn đọc và gọi được ở trang một người nhưng không tìm ra. Chữ tìm giữ nguyên.
- `NguoiHang.sdtBam` đổi tên `sdt`, vì nó chứa số gốc.

**Danh bạ.** `hangNguoi` đưa xuống client `sdt` và `tel`, vai dưới Vận hành nhận null ở cả hai. Số nằm ở cột đầu «Người», dưới tên: bảng
cuộn ngang trong khung nên cột sau không chạm được ngay trên điện thoại, mà «một chạm» là lời hứa của câu giao. Cột cũ đổi tiêu đề
«Tài khoản». Người nhiều số (hôm nay 0 ca): hàng hiện đúng số vừa tìm, không có tìm thì số mới nhất.
Trang một người thêm liên kết gọi ở dòng bí danh SĐT. Ô tìm đổi gợi ý «Tên, tài khoản hoặc SĐT». `people-content.tsx` đã bỏ `q` với
vai Người xem phía máy chủ, giữ nguyên cách đó.

**Căn giá tốt.** Hạ đúng khối liên hệ từ `isAdmin` xuống `xemNoiDungTin`. Ảnh và chữ bài bản nháp giữ cho `admin` (Hỏi-1): route `?path=`
của ảnh chỉ cho `admin`, và câu giao chỉ nói «cổng liên hệ». Dữ liệu đưa vào thẻ được lọc theo vai ngay ở trang, nên vai Người xem không có
trường liên hệ nào trong cây phần tử. Chú thích «SĐT tầng A» sửa thành tầng C.

**Hồ sơ đã ký bị thay.** SD3 Hỏi-2 ghim «che ở mọi vai cho tới khi U1 mở số», nên hai eval đo việc che mất vật đo. Khai theo luật
eval thay bởi của kit:

| Eval cũ | Tiêu chí đo lại |
|---|---|
| `sdt-luu-goc-e164/E8` | `people-hien-so-goc` AC-3 |
| `sd3-lam-chat-do-danh-ba/E7` | `people-hien-so-goc` AC-3 |

Con trỏ chỉ hợp lệ khi hồ sơ này có chữ ký người, nên vòng này không đi đường máy-thông ở Cổng Bằng chứng.

## Không gian đã quét

Ngữ cảnh: chân sản phẩm đào từ repo (`AGENTS.md`, `app/src/lib/ops-access.ts`, audit 30/10). Chân ngành: `[NGÀNH: ITU E.164]` cho dạng
lưu, `[NGÀNH: RFC 3966]` cho liên kết `tel:`, `[NGÀNH: RESO MemberMobilePhone]` cho field.

- Trục A, vai phiên: khách · user · viewer · ops · admin [thước CE: `BAC_VAI`, ma trận DBN-AC-6].
- Trục B, bề mặt: danh sách · một người · tìm · Căn giá tốt · dữ liệu đưa xuống trình duyệt [thước CE: ghi chú hàng SD4].
- Trục C, dạng số gõ: `0…` · `+84…` · `84…` · có dấu tách · số dở · số hợp lệ không có người [thước CE: audit dòng 267, khuôn DB].
- Trục D, nơi chạy: máy thu · cloud [thước CE: `localOnlyTable("parties")`, `dealsSql({cloud})`].

**Core:** ops và admin trên ba bề mặt ở máy thu (AC-1, AC-2, AC-6) · ma trận trục C (AC-4) · viewer trên mọi bề mặt (AC-3, AC-5, AC-6,
AC-10) · đối chiếu dữ liệu thật (AC-7).

**Later:** ảnh và chữ bài `/ops/deals` cho vai Vận hành (Hỏi-1) · nhãn «cùng SĐT với người…» (hôm nay 0 ca) · tìm theo một phần số (Hỏi-2) ·
nhật ký ai xem số · số gốc lên cloud.

**Never:** vai Người xem tìm theo số (ROADMAP §3 mục 24).

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/people` → gõ `0912 345 678` → Tìm → một hàng đúng người → chạm số → máy gọi (điểm ra: ứng dụng gọi).
- Biên: người không có số thì không có liên kết; số không ai có thì trạng thái trống; vai Người xem không có ô tìm.
- Lỗi và quay lại: lỗi đọc DB hiện lỗi sẵn có của trang, tải lại để thử; trống thì «Bỏ lọc» về danh sách.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Danh bạ người | Tìm người và gọi | Menu Ops / trang một người, ứng dụng gọi |
| Một người | Xem mọi bí danh của người và gọi | Danh bạ người / ứng dụng gọi |
| Căn giá tốt | Gọi người đăng để xác minh giá | Menu Ops / ứng dụng gọi |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-people-co-so | Danh bạ người | Dòng `0912 345 678` dạng liên kết dưới tên, ở cột đầu | Chạm để gọi |
| ST-people-khong-so | Danh bạ người | Không có dòng số | Mở trang một người |
| ST-people-viewer | Danh bạ người | «Ẩn với vai Người xem», không ô tìm | Xin vai cao hơn |
| ST-people-tim-trong | Danh bạ người | Trạng thái trống sẵn có của bộ lọc | Bỏ lọc hoặc đổi chữ tìm |
| ST-person-so | Một người | Dòng bí danh SĐT là liên kết; bí danh nghỉ kèm «Đã nghỉ» | Chạm để gọi |
| ST-deals-ops | Căn giá tốt | Tên, nhóm, nút số; không ảnh, không chữ bài | Chạm để gọi |
| ST-deals-viewer | Căn giá tốt | Không khối liên hệ, chú thích nói rõ vai được xem | Xin vai cao hơn |
| ST-deals-cloud | Căn giá tốt | Không khối liên hệ, chú thích «chỉ có ở máy thu» | Mở máy thu |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Ô tìm giữ giới hạn 100 ký tự; dấu tách trong số được bỏ trước khi so.
- Số dùng `translate="no"` và `tabular-nums`. Liên kết gọi nhận phím Tab và Enter như liên kết thường.
- Ở 390px bảng cuộn trong khung của data-grid, trang không cuộn ngang; liên kết số ở cột đầu nên chạm được khi chưa vuốt.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `ui/button` (variant=link, size=xs) bọc `<a>` | dùng | Cùng khuôn với liên kết mã người ở cột bên |
| `reui/data-grid` | dùng | Bảng đang có, chỉ đổi nội dung ô |
| Nút số của `deal-card.tsx` | dùng | Không đổi hình, chỉ đổi điều kiện hiện |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: giữ nguyên khuôn của hai trang đang chạy (`routes.md`), việc này chỉ đổi nội dung ô và điều kiện hiện nên không tra mẫu mới.
<!-- UX-SPEC-TEMPLATE>>> -->
