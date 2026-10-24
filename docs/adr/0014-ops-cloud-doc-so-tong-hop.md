# ADR-0014: Ops trên cloud đọc số tổng hợp do máy local tính sẵn

Ngày: 2026-10-24 · Trạng thái: accepted (Mạnh chốt 24/10 — «Chọn A»)

## Bối cảnh

Audit cổng Ops trên prod ngày 24/10 (chỉ đọc, bản phạm vi `docs/plan/pham-vi-ops-noi-that-2410.md`) gom lỗi theo
nhóm gốc. Hai nhóm đầu cùng một nguyên nhân:

- **G1**: trang đọc bảng, tệp hay cổng chỉ có ở máy local mà không có nhánh cloud (OPS-1, 2, 3, 5, 9; một phần
  OPS-4, 8). Ví dụ: `getLockdownStatus` grep log và probe cổng ngay trên Vercel; `readZaloAllowlist` đọc tệp cấu
  hình không có trên Vercel; `source_registry`, `review_queue`, `stg_*` không sync (ADR-0007 SPL, luật 6).
- **G2**: khi không đo được, trang vẽ thành xanh, đỏ hoặc 0 (OPS-3, 4, 5, 10). Ví dụ: «Quá hạn 0» badge xanh,
  «Bản ghi 24h = 0» khi dữ liệu vẫn chảy, L4b «Ổn» khi grep thất bại.

Hệ quả: dashboard Ops trên prod gần như không có số thật. Dữ liệu để tính các số đó (log job, cấu hình OpenClaw,
watchdog, bảng thô tầng A) nằm ở máy local và theo luật phải ở lại đó.

Đã có một đường đi đúng hướng: `pipeline/push-ops-facts.mjs` chạy sau mỗi lượt `scripts/cloud-sync.sh` (15′/lần),
POST lên `/api/v1/ops/ingest`, upsert một dòng `ops_heartbeat`; `/ops/collections` đọc dòng đó qua
`getLocalFacts()` (`app/src/lib/collections-queries.ts`). Đường này chưa phủ độ tươi/SLO, lockdown, số đếm 24h
hay hàng chờ duyệt, chưa ghi mốc đo theo từng khối, chưa qua bộ soát tầng A, và trang không phân biệt «chưa có
số» với «số cũ».

## Quyết định

**A — máy local tính sẵn số tổng hợp rồi đẩy lên cloud; trang Ops trên cloud chỉ đọc bảng số đó.**

1. **Một đường đẩy**: mở rộng `pipeline/push-ops-facts.mjs`, không dựng đường mới. Payload thêm các khối:
   - độ tươi/SLO từng nguồn, tính bằng **đúng định nghĩa chung** `scripts/lib/freshness.mjs` ↔
     `app/src/lib/freshness.ts` (test parity của AU6 giữ hai bản khớp);
   - trạng thái job đêm (launchd, lần chạy cuối, mã thoát);
   - lockdown/watchdog từng lớp (kết quả kiểm, hoặc «không kiểm được» — không bao giờ mặc định «Ổn»);
   - số bản ghi 24h theo nguồn S0x;
   - số thẻ chờ duyệt (**chỉ số đếm** theo loại, không nội dung thẻ).
   Mỗi khối mang `measured_at` riêng; payload mang `pushedAt` như hiện nay. Các khối riêng của từng trang
   (allowlist + «Vào raw» theo nhóm S03, luồng 7 ngày) đi cùng đường này, cùng luật, do hàng trang tương ứng thêm.
2. **Chỉ tổng hợp + mã S0x.** Tên nguồn thật, `real_name`, `source_ids`, định danh tài khoản thu (chưa chốt,
   BOI-CANH §2) KHÔNG lên — tầng A (ADR-0007, luật 6). Tên nhóm Zalo được lên (tầng C, ADR-0007 sửa đổi 24/10).
   Payload đi qua **bộ soát tầng A của NT2** trước khi gửi; soát đỏ thì không gửi gì.
3. **Đọc ở cloud**: một hàm đọc chung trả `{ facts, measuredAt, stale }`. Trang hiện
   «Số đo lúc HH:MM (giờ VN) từ máy local». Facts cũ quá ngưỡng thì trang báo rõ
   «Máy local không đẩy số từ HH:MM (giờ VN)» — đây là **tín hiệu sức khoẻ** (máy local, cloud-sync hoặc mạng
   hỏng), hiện bằng Alert cảnh báo, không bao giờ vẽ xanh. Không có facts nào: «—» kèm «Chỉ đo ở máy local».
4. **Trang trên cloud không tự đo** những gì chỉ có ở local: không grep log, không đọc tệp cấu hình, không probe
   cổng, không query bảng tầng A.

### Trang nào đọc gì (trên cloud)

| Trang | Nguồn số trên cloud | Ghi chú |
|---|---|---|
| `/ops` | facts: độ tươi/SLO từng nguồn, số thẻ chờ | ô KPI không đo được: «—», không badge xanh |
| `/ops/collections` | facts: lockdown, máy móc, job, nhóm S03, bản ghi 24h, luồng 7 ngày | đã đọc `ops_heartbeat` một phần; nay đọc toàn bộ |
| `/ops/quality` | facts: độ phủ/độ tươi (`/api/v1/ops/coverage`); bảng đã sync: `dq_check_results`, `area_sources`, `ref_calib_*` | số S02 chỉ ở trang này (luật 5) |
| `/ops/review` | facts: chỉ «N thẻ đang chờ» | nội dung thẻ là tầng A, chỉ ở local |
| `/ops/sources` | không lên cloud | tên nguồn thật; giữ `LocalOnlyAlert` (PR #53) |
| `/ops/deals` | như hiện nay: `sale_offers` đã sync | không đổi |

### Ngưỡng trễ

| Mức | Điều kiện (theo `measured_at` của khối, giờ máy chủ) | Trang hiện |
|---|---|---|
| Tươi | ≤ 45′ (3 lượt cloud-sync 15′) | «Số đo lúc HH:MM (giờ VN) từ máy local» |
| Cũ | > 45′ | Alert cảnh báo «Máy local không đẩy số từ HH:MM (giờ VN)»; số cũ vẫn hiện nhưng mờ, không badge trạng thái xanh |
| Không có | không có dòng / thiếu khối | «—» kèm «Chỉ đo ở máy local» đúng một lần mỗi trang |

Ngưỡng 45′ là hằng số một chỗ trong code (cùng chỗ với hàm đọc chung). Đổi chu kỳ cloud-sync thì đổi hằng số theo.

## Phương án đã loại

- **B — sync bản gọt của các bảng local lên cloud** (vd `source_registry` bỏ cột tầng A, như AU12 ban đầu): chỉ
  chữa được phần đọc registry. Lockdown, watchdog, log job, cấu hình allowlist không phải bảng — vẫn không có số.
  Thêm bảng gọt là thêm bề mặt lộ tầng A cần soát từng cột.
- **C — tunnel từ cloud tới máy local** (trang cloud gọi thẳng API ở local): trang phụ thuộc máy local đang mở và
  tunnel đang sống; mở cổng vào máy thu là việc cấu hình hạ tầng của Mạnh, trái tinh thần «tầng A không rời máy»
  và thêm bề mặt tấn công cho máy đang giữ phiên Zalo.

## Hệ quả

- Tốt: số trên cloud là cùng số máy local tính, theo cùng định nghĩa; «không đo được» và «máy local im» thành tín
  hiệu đọc được thay vì xanh giả; tầng A không rời máy; không thêm hạ tầng (luật 11).
- Chịu: số trên cloud trễ tối đa một chu kỳ cloud-sync (15′) — Ops không phải giám sát thời gian thực;
  `push-ops-facts.mjs` (đã ở `t3_paths`) to thêm và thành đường T3 nhiều hàng cùng chạm — phải chạy liền nhau
  (BOI-CANH §4).
- Lộ trình: hàng nền **ON22** (`ops-facts-so-tong-hop`, T3) đứng trên NT2; các hàng trang G1/G2 (ON2, ON3, ON4,
  ON5) và AU12 đứng trên ON22.
- Đổi lược đồ: payload vẫn là `ops_heartbeat.payload` (jsonb); nếu Cổng Phạm vi của ON22 chọn bảng riêng cho số
  tổng hợp thì xin số migration ở sổ SO-MIGRATION qua phiên liên làn.
