# Bảng nhóm S03 trên máy chủ đọc số máy thu đẩy lên (ON4 · `nhom-s03-tren-cloud`) — design

Hàng ON4 của `docs/plan/lo-trinh.json` (dãy P2, sau ON23, đứng trên ON22). Phủ OPS-9 (gốc G1). Ngưỡng (`bat_khi`): «Máy
thu có N nhóm bật và M tin vào raw của một nhóm: máy chủ hiện N và M; bản tin thiếu trường: ô ghi «—»». Từ vựng theo
`CONTEXT.md`: máy thu / máy chủ; «Vào bảng thô» là nhãn cột hiện có.

## Hiện trạng

- **«Vào bảng thô» theo nhóm luôn 0 ở bản tin**: `parseLog` (`pipeline/lib/ops-flow.mjs`) cộng `"accepted":n` của dòng
  `post 202` vào funnel tổng, nhưng hàng theo nhóm chỉ đếm `seen/passed/skipped` — `zaloGroups[].accepted` của bản tin
  luôn 0. Trang ở máy thu (`gateByGroup` trong `collections-queries.ts`) đã cộng đúng — hai bản đếm cùng nhật ký đang
  ra hai số.
- **«Danh sách cho phép đang bật N nhóm» sai ở cả hai nơi**:
  - máy thu: `readZaloAllowlist` đọc `channels.zalouser.groups` cấp ngoài — khoá cũ trước bản nhiều tài khoản (máy thu
    hôm nay: 4 nhóm), trong khi danh sách thật là nhóm hiệu dụng của từng tài khoản (`accounts.<id>.groups`, kế thừa
    cấp ngoài khi tài khoản không khai — hôm nay 8 nhóm, 7 bật), đúng như `/ops/sources` đọc (`zalo-admin.ts`
    `effectiveGroups` + `enabledKeys`);
  - máy chủ: `readZaloAllowlist` đọc tệp cấu hình ngay trên Vercel → `[]` → «0 nhóm».
- Sau ON3, `/ops/collections` trên máy chủ không dựng bảng nhóm S03 (gom vào Alert «Phần còn lại…»).

## Cách làm

1. **Bên ghi — đếm đúng «Vào bảng thô» theo nhóm**: `parseLog` cộng `"accepted":n` vào hàng của nhóm trên dòng `post 202`
   (cùng luật với funnel tổng và với `gateByGroup` của trang máy thu); phép đo chạy cả hai trên cùng nhật ký. Nhóm đã có
   `post 202` mà không dòng nào mang `accepted` (khuôn cũ của handler) → `accepted: null` ở cả hai bên — đã qua cổng mà
   không biết số tin vào là thiếu số, không phải 0 (câu giao: «thiếu facts thì «—», không 0»).
   - Handler thiếu tên kênh thì ghi mã nhóm vào thẻ `group=` (`collector/openclaw/handler.js`). Khối `s03` không mang mã:
     hàng nào có tên là chuỗi số dài (mã nhóm) hay trùng một mã trong cấu hình → `name: null`, bảng ghi «Nhóm chưa có tên».
2. **Một định nghĩa «nhóm bật»** = hợp các nhóm hiệu dụng bật (`enabled !== false && allow !== false`) của mọi tài khoản,
   theo đúng luật kế thừa của OpenClaw (`zalo-admin.ts` `effectiveGroups`); trùng mã giữa tài khoản đếm một lần.
   - app: tách `effectiveEnabledGroupIds(cfg)` khỏi `zalo-admin.ts`; `readZaloAllowlist` (máy thu) dùng nó;
   - bên ghi: `scripts/lib/ops-local.mjs` `readS03Allowlist` — bản .mjs cùng luật; phép đo đối chiếu hai bản trên cùng
     cấu hình tạm (như ON22). `zaloAccounts[].enabledGroups` của bản tin (badge «N nhóm bật» ở `/ops/sources`) dựng từ
     cùng hàm theo từng tài khoản — hôm nay nó bỏ qua `allow: false` và không cho tài khoản kế thừa cấp ngoài.
3. **Khối bản tin `s03`** (ADR-0014, có `measured_at`; lỗi → `{measured_at, error}`):
   `{ allowlistEnabled: N, groups: [{ name, seen, passed, skipped, accepted, realPosts7d, mockPosts7d, isMockOnly,
   lastSeenAt, lastEventAt }] }` — CHỈ số đếm + tên nhóm (tầng C, Mạnh 24/10); không mã nhóm (bảng máy chủ không cần
   nó; luật 6 chưa xếp tầng mã nhóm nên khối giữ tối thiểu — `zaloAccounts[].enabledGroups` đã mang mã lên máy chủ từ
   trước cho `/ops/sources`, vòng này không đổi điều đó), không tên tài khoản (giữ như tầng A). Bản tin đi qua bộ soát
   tầng A (NT2) như mọi khối; `zaloGroups[i].name` đã miễn.
4. **Máy chủ** — `getCloudOpsView().s03 = { allowlistEnabled, groups, stale } | null` (khối vắng, lỗi, sai khuôn → null):
   - có khối → dựng bảng nhóm S03 (bỏ «nhóm S03» khỏi Alert gom); mô tả «danh sách cho phép đang bật N nhóm» với N của
     khối; cột «Vào bảng thô» = M của khối; chân bảng KHÔNG liệt mã nhóm (máy chủ không có mã) — ghi «mã nhóm chỉ xem ở
     máy thu»; khối cũ → badge «Hoạt động» viền xám;
   - không khối → bảng không dựng, «nhóm S03» vẫn trong Alert gom — không bao giờ «0 nhóm»;
   - trường thiếu trong khối (bản tin đời cũ không có `accepted`) → ô «—».
5. **Máy thu**: bảng như cũ nhưng N và «Vào bảng thô» đúng theo 1–2.

## Câu hỏi cho người

- **Hỏi-1** — khối `s03` có mang mã nhóm không? Máy khuyên A: không mang; chân bảng máy chủ ghi «mã nhóm chỉ xem ở máy
  thu». B: mang mã rút gọn để chân bảng giống máy thu.
- **Hỏi-2** — «N nhóm bật» đếm thế nào? Máy khuyên A: hợp nhóm bật hiệu dụng của mọi tài khoản, trùng mã đếm một lần, và
  badge «N nhóm bật» từng tài khoản ở `/ops/sources` (máy chủ) đếm theo cùng luật (tính nhóm kế thừa, bỏ `allow: false`).
  B: bảng nhóm đếm hợp như A, badge `/ops/sources` giữ cách đếm cũ — hai chỗ trên máy chủ có thể nói hai số.

## Không làm

- Ô «Cổng S03 hôm nay» (ON3 Ngoài-3, hợp đồng riêng). Luồng 7 ngày, xoay vòng trên máy chủ — ON5.
- Quản trị danh sách cho phép (`/ops/sources`, admin) — không đổi thao tác; chỉ badge «N nhóm bật» của từng tài khoản đếm
  theo cùng định nghĩa nếu Hỏi-2 = A. Phép đo không gọi lệnh ghi nào trên OpenClaw.
- Sửa khoá `groups` cũ trong `~/.openclaw/openclaw.json` (cấu hình làn ZCode/vận hành).

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: người trực mở `/ops/collections` trên máy chủ → bảng «Nhóm S03 · Cộng đồng» ghi «danh sách cho phép đang bật
  N nhóm», từng nhóm có «Vào bảng thô» → nhóm nào im thì bấm «Thêm tài khoản, bật/tắt nhóm» (máy thu).
- Biên: chưa có khối nhóm S03 → bảng không có trên máy chủ, Alert gom ghi «nhóm S03 … xem ở cổng Ops trên máy thu».
- Lỗi & quay lại: khối cũ → Alert vàng 45′ của ON3; badge «Hoạt động» thôi xanh.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/collections` Thu thập (máy chủ, máy thu) | nhóm S03 nào đang chảy tin vào bảng thô | nav / `#nhom-s03`, `/ops/sources` (máy thu) |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-s03-none | `/ops/collections` máy chủ | không bảng nhóm; Alert gom có «nhóm S03» | mở cổng Ops trên máy thu |
| ST-s03-fresh | `/ops/collections` máy chủ | bảng nhóm, «đang bật N nhóm», «Vào bảng thô» = M theo nhóm, chân bảng không mã nhóm | đọc, bấm nhóm im |
| ST-s03-stale | `/ops/collections` máy chủ | như fresh, Alert vàng 45′, «Hoạt động» viền xám | kiểm tác vụ đồng bộ ở máy thu |
| ST-s03-local | `/ops/collections` máy thu | «đang bật N nhóm» theo nhóm hiệu dụng của mọi tài khoản, «Vào bảng thô» đúng | như cũ |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Ngưỡng cũ 45′ theo `state` của khối `s03` (FACTS_STALE_MS, ON22). Ở 390px bảng dùng khuôn lưới có sẵn (ON13).

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `ZaloGroupsTable` | mở rộng | nhận N từ khối, cột «Vào bảng thô» «—» khi thiếu trường, chân bảng máy chủ không mã |
| `Badge` (`@/components/reui/badge`) | dùng | «Hoạt động» viền xám khi cũ |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: luồng hiển nhiên — dựng lại một bảng có sẵn trên máy chủ, đổi nguồn số; không đổi cấu trúc.
<!-- UX-SPEC-TEMPLATE>>> -->
