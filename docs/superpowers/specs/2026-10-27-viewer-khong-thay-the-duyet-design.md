# viewer-khong-thay-the-duyet — thiết kế

Căn cứ: Ngoài-9 của `_acceptance/quyen-bon-vai-mot-cho/review-findings.md` (Mạnh: «mở hợp đồng mới», 27/10); ô cơ hội
`_acceptance/viewer-khong-thay-the-duyet/opportunity.md` (giám sát, P1-38); AGENTS.md luật 6 («Nội dung bài gốc, ảnh tin
rao … và thẻ duyệt `review_queue` lên cloud cho vai `ops` trở lên»); `docs/research/ops-tu-van-hanh-nguon-saas.md` §3.5
(viewer: «mã S0x, số, tin đã che»).

## Vấn đề (khảo sát 27/10 trên `main` 7d1ffe66)

TV1 cho vai `viewer` qua `canAccessOps`. Hai chỗ đưa nội dung «ops trở lên» tới mọi vai vào được Ops (chỉ ở máy thu —
cloud dừng ở thông báo «chỉ có ở máy thu»):

| Chỗ | Lộ gì | Đã chặn |
|---|---|---|
| `/ops/review` — `ReviewContent` → `loadReviewQueue` | tiêu đề, bằng chứng, gợi ý và lý giải của AI của mọi thẻ | ảnh (admin) |
| `/ops/data-flow` — `getDataFlow` → `FlowRecord.postText`, `postGroup` → `DataFlowView` (client) | bài gốc 600 ký tự + tên nhóm | ảnh (admin) |

Các trang khác (`/ops`, `/ops/collections`, `/ops/quality`, `/ops/deals`) chỉ đưa số, mã S0x, hoặc đã chặn nội dung
bằng `isAdmin`; `/ops/sources` chỉ admin. Khảo sát tay này thành phép đo: bảng kiểm kê một dòng mỗi trang `/ops/**` và
mỗi route ops (AC-8), đỏ khi trên đĩa có route chưa khai hoặc route đọc nội dung mà bao đóng import thiếu hàm che.

## Quyết định

- **Một hàm ở `app/src/lib/ops-access.ts`**: `xemNoiDungTin(user)` = vai có hiệu lực từ `ops` trở lên (cùng bậc
  `BAC_VAI`, email `OPS_EMAILS` tính như ops). Mọi chỗ đưa nội dung tin/thẻ xuống trình duyệt hỏi hàm này.
- **`/ops/review` với vai dưới Vận hành**: không truy vấn cột nội dung nào của `review_queue`; hiện số thẻ chờ và số theo
  loại (một câu đếm `item_type, count(*)`), cùng khuôn đếm mà trang dùng trên cloud, kèm một thông báo
  «Nội dung thẻ chỉ hiện cho vai Vận hành trở lên.». Vai Vận hành trở lên: như hôm nay.
- **`/ops/data-flow` với vai dưới Vận hành**: trang thay `postText`, `postGroup` của mọi bản ghi bằng `null` TRƯỚC khi
  trao cho `DataFlowView` (thành phần client — dữ liệu không xuống trình duyệt); sheet của bản ghi hiện
  «Bài gốc chỉ hiện cho vai Vận hành trở lên.» thay cho khối «Bài gốc». Thân trang là
  `components/ops/data-flow/data-flow-content.tsx` (DF1 đã tách); nó tự đọc phiên qua `getUser` (mặc định
  `getSessionUser`, ca thử tiêm người giả) rồi mới che.
- Nhãn vai lấy từ `CONTEXT.md` mục «Vai Ops» («Vận hành»). Không thêm thuật ngữ mới.
- Cloud không đổi: `/ops/review` giữ nhánh «bảng tầng A vắng» chạy trước nhánh vai; `/ops/data-flow` theo khuôn cloud
  của DF1 (`dong-chay-len-cloud`, gộp 29/10) — bản ghi cloud vốn không mang bài gốc, sheet ghi «Bài gốc chỉ xem ở máy
  thu.» cho mọi vai.

## Kiểm bằng mắt

- `scripts/dev-ops-account.mjs` thêm `--vai viewer`: tạo/giữ `viewer-test@local.test` (vai viewer, chỉ DB local), mật
  khẩu ở `.claude/viewer-test-account.json` (gitignored, cùng khuôn tài khoản thử admin). Không cờ thì như hôm nay.
- AC-9: đăng nhập dev :3456 bằng tài khoản viewer, chụp `/ops/review` và sheet một bản ghi S05 ở `/ops/data-flow`; lặp
  lại bằng tài khoản admin để đối chiếu.

## Đặc tả UX

Bỏ khuôn đặc tả UX (dòng sổ `descope`): vòng chỉ ẩn hai khối nội dung có sẵn và đặt một câu chú thích theo khuôn câu
«Ảnh tin chỉ hiện cho quản trị viên.» và `LocalOnlyAlert` đã có trên chính hai trang.

## Ngoài phạm vi

- Định danh tài khoản thu (`zaloAccounts`, `ownerAccount`, `zaloAllowlist[].groupId`) trong `GET /api/v1/ops/collections` —
  hôm nay đi tới mọi vai Ops lẫn bearer chung; là câu hỏi tầng A riêng (định danh tài khoản thu), không phải nội dung tin.
  Chờ Mạnh quyết ở Cổng Phạm vi (Hỏi-1): khuyên mở hàng riêng; lối khác là che với viewer ngay vòng này.
- `group_key` nhóm S05 ở `GET source-groups`; khoá `airdna*` ở `truthful-coverage`.
- Đưa nội dung thẻ, bài gốc lên cloud (TV13 và hàng sau).
