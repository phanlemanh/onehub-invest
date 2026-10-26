# cong-tac-khong-ha-nhom-go — thiết kế

Căn cứ: hai mục ngoài hợp đồng của TV2a `vong-doi-nguon` mà Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng (sổ
`d-20261026T090029Z-17`, `-19`); ô cơ hội `_acceptance/cong-tac-khong-ha-nhom-go/opportunity.md` (giám sát, P1-26).
Hồ sơ: `_acceptance/cong-tac-khong-ha-nhom-go/`.

## Vấn đề

Route `POST /api/v1/ops/source-groups` action `toggle` (hàm `toggleVongDoi`) ghi thẳng `status = 'paused'` khi tắt,
bất kể trạng thái cũ. Hệ quả:

- Tắt một nhóm `retired`/`completed` hạ nó về `paused`; bật tiếp thì thành `active` — chặn 409 «nhóm đã gỡ — không bật
  lại» bị lách bằng hai lệnh (giao diện cũ còn hiện «đang thu» cho nhóm vừa bị gỡ ở đường khác, hay hai lệnh gửi sát nhau).
- Tắt một nhóm `draft` đổi nó thành `paused` — trái nghĩa «chưa bật lần nào».

Đường ghi cũ (UPDATE chỉ đổi `enabled`, trigger `source_groups_dong_bo_enabled` của 047) đã đúng luật: thiết kế TV2a
khai ma trận 5 × 2 — tắt một đơn vị không ở `active` thì **không đổi**, bật `retired`/`completed` thì **từ chối**. Lỗi chỉ
nằm ở đường mới của route.

## Quyết định

**Công tắc theo đúng ma trận 5 × 2 của TV2a** (một luật cho cả hai đường ghi):

| trạng thái cũ | bật (`enabled: true`) | tắt (`enabled: false`) |
|---|---|---|
| `active` | 200 `unchanged` | `paused` + lý do (mặc định «tắt bằng công tắc /ops/sources»), audit |
| `paused` | `active`, xoá lý do và `resume_when`, audit | 200 `unchanged` |
| `draft` | `active` (bật lần đầu), audit | 200 `unchanged` — vẫn `draft` |
| `retired` | 409 «nhóm đã gỡ — không bật lại» | 409 «nhóm đã gỡ — công tắc không đổi trạng thái» |
| `completed` | 409 «nhóm đã xong — không bật lại» | 409 «nhóm đã xong — công tắc không đổi trạng thái» |

- Ô 409 và ô `unchanged`: không UPDATE, không dòng audit, `updated_at` giữ nguyên.
- Tắt nhóm `retired`/`completed` trả **409 có chữ** (không 200 im): giám sát chốt «giữ nguyên, không ghi, báo rõ».
  Lưới nhóm thu đã có sẵn đường xử lý 4xx của công tắc — hoàn công tắc về giá trị cũ và hiện `data.error` trong
  thông báo lỗi — nên giao diện không phải sửa.
- Đọc trạng thái và ghi trong CÙNG giao dịch có `SELECT … FOR UPDATE` (đã có): hai lệnh sát nhau xếp hàng trên khoá
  dòng, lệnh sau thấy trạng thái lệnh trước để lại.
- Chữ 409 tách «đã gỡ» và «đã xong» (hôm nay chung một chữ «đã gỡ» cho cả hai).

Nhánh cũ khi chưa áp 047 (`coVongDoi()` sai) giữ nguyên — mọi máy đã áp 047.

## Ngoài phạm vi

- Chặn ở tầng DB (CHECK/trigger cấm `retired`→`paused` qua đường đổi `status`): là một migration, quyết định dữ liệu
  riêng — đường đổi `status` có chủ đích (lệnh TV5/TV6) cần được phép đổi.
- Nhãn «Đã gỡ», «Nháp» trên lưới nhóm thu (hôm nay lưới chỉ có «Đang thu»/«Tắt»): đi cùng giao diện vòng đời (PL12
  Ngoài-5, ON20).
- Công tắc của nhóm S03 (bản soi gateway): việc của TV6.
