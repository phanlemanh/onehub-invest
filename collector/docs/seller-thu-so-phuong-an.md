# Phương án thu SĐT người bán từng kênh

> Kèm vòng `claudedp-0211-1` (hợp đồng người bán DATA-CONTRACT v5 — xem
> `DATA-CONTRACT.md` mục `seller`). Bảng này là ĐỀ XUẤT để Mạnh + điều phối
> chốt; mỗi kênh chốt xong được cấp MỘT vòng thu riêng — không tự triển khai,
> không tự nâng trần (ranh giới 0211-1). Không nhắn người bán/nhóm để hỏi số
> (luật 8). Số đếm ở đây lấy từ stg local ngày 2026-11-02.

## Kết quả kiểm nút «hiện số» S06 (đo 2026-11-02, phiên khách CHƯA đăng nhập)

| Thử | Trước | Sau khi bấm | Modal đăng nhập |
|---|---|---|---|
| tin-1 (Quận 7, TP.HCM) | nút «Hiện số 090910 \*\*\*» | nút thành «Gọi», số đầy đủ hiện trong trang | KHÔNG |
| tin-2 (Bình Thạnh, TP.HCM) | nút «Hiện số 093309 \*\*\*» | nút thành «Gọi», số đầy đủ hiện trong trang | KHÔNG |

- **Kết luận: S06 KHÔNG đòi đăng nhập để hiện số** (web nhà đất của S06, phiên
  không đăng nhập). Bấm là số ra — không cần tài khoản thu mới.
- Ảnh bằng chứng (local, có số thật — KHÔNG lên cloud/kênh):
  `~/ego/s06-hien-so-20261102/tin-2-after-click.png`.
- Payload thu hiện tại (API danh sách) chứa 0/51.994 SĐT — số chỉ có ở bước
  «hiện số» từng tin.

## Phương án từng kênh

| Kênh | Cách | Nhịp | Trần | phoneStatus đặt | Cần gì từ Mạnh |
|---|---|---|---|---|---|
| **S03 zalo** | số đã CÔNG KHAI trong `payload.text` — collector chỉ đặt trạng thái (regex thấy số); số E.164 pipeline đã trích sẵn từ trước | theo lượt thu hiện có, 0 lời gọi mới | không cần | `available` khi text có số, `not_tried` khi không | không — chỉ chờ vòng bật v5 ghi `seller` |
| **S05 facebook** | như S03: số nếu có nằm trong text post | theo lượt thu (paused tới 7/11) | không cần | `available`/`not_tried` | không |
| **S06 chợ tốt** | bấm «hiện số» từng tin qua web (KHÔNG đăng nhập — đã kiểm); lấy số + đổi nút thành «Gọi» xác nhận | ghép 2 lượt thu S06 hiện có (05:30/14:00), CHỈ lấy số cho tin trong worklist ưu tiên (tin BÁN mới, vùng mục tiêu) — không dàn trải cả 51.994 | **50 lời gọi hiện số/ngày** (đã chốt HD12 vòng 3010-7); nghỉ ngẫu nhiên 3–8s giữa 2 lời gọi | `available` · `error` (bị chặn/đổi giao diện) · còn lại `hidden_by_source` | duyệt: (a) dùng đường web không-đăng-nhập, (b) trần 50/ngày giữ nguyên, (c) tiêu chí tin vào worklist lấy số |
| **S01 airbnb** | nguồn CHE SĐT chủ nhà (nền tảng trung gian) — không có đường hợp lệ | — | — | `hidden_by_source` (đứng yên) | chấp nhận KHÔNG lấy số S01 |
| **S07 (chưa thu)** | chưa đăng ký nguồn | — | — | `not_tried` | khi mở kênh: thiết kế `seller` ngay từ vòng đầu |

S08 giữ chính sách cũ: **xoá SĐT trước khi ghi thô** — không nằm trong phạm vi
này. S02 chỉ hiệu chuẩn, không dính.

## Đề xuất bật v5 theo kênh (mỗi kênh một vòng riêng)

1. **S03 trước** (rẻ nhất: 0 lời gọi, 54.237/55.646 đã có senderId) — collector
   ghi `seller {accountRef=senderId, displayName=senderName, phone=null,
   phoneStatus theo regex, seenAt=fetchedAt}` + manifest v5.
2. **S06 sau khi Mạnh duyệt trần** — vòng thu số worklist 50/ngày.
3. S05 mở lại sau 7/11 (đi cùng S03 vì cùng payload sender).
