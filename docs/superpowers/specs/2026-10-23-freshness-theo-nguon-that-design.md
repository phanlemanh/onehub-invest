# check-freshness đo theo nguồn thật (AU4 · `freshness-theo-nguon-that`) — thiết kế

Hàng AU4 của `docs/plan/lo-trinh.json` (đợt `cam-mau-2310`, T2, ranh giới `scripts/check-freshness.mjs`). Câu giao:
«check-freshness đo độ tươi theo bảng thật của từng nguồn, có SLO cho S05 và S06, không còn dòng quá hạn giả».
Ngưỡng (ô cơ hội, Mạnh duyệt build): «Trên DB hiện tại: chỉ S05 (đứng từ 21/10) báo quá hạn».

## 1. Số đo trước khi thiết kế (23/10 ~10:50 +00, DB local :5433, chỉ đọc)

`node scripts/check-freshness.mjs` → exit 1, **9 dòng, cả 9 giả**:

| Dòng in | Vì sao giả |
|---|---|
| `S03/hanoi: 4 ngày (SLO 3)` | lấy từng `source` riêng: `zalo-mock` (19/10) báo quá hạn dù `zalo-agent` của cùng S03 mới 05:00 hôm nay — không gộp max theo mã |
| `S02/hanoi`, `S02/hcmc`, `S02/vn: chưa có snapshot` | S02 không ghi `airbnb_snapshots`; dữ liệu thật ở `airdna_markets.captured_at` (22/10 12:12) |
| `S03/hcmc`, `S03/vn: chưa có snapshot` | ghép chéo mọi mã × mọi thành phố — S03 chỉ thu Hà Nội |
| `S04/hanoi`, `S04/hcmc`, `S04/vn: chưa có snapshot` | S04 `status = completed` (địa giới một lần) mà vẫn có SLO 90 ngày; lọc `active` lại để mã này rơi vào «chưa có» |

Không đo S05, S06 (không có trong bảng SLO). Dữ liệu thật hôm nay:

| Mã | Bảng thật | Mới nhất |
|---|---|---|
| S01 | `airbnb_snapshots` (hai source_id của S01) | hanoi 19/10 · hcmc 18/10 · vn 23/10 |
| S02 | `airdna_markets.captured_at` | vn 22/10 |
| S03 | `stg_zalo_posts` hàng có `agent_id` không thuộc mã khác, snapshot thuộc S03 | hanoi 23/10 05:00 |
| S05 | `stg_zalo_posts` hàng có `agent_id` ∈ `source_ids` của S05 (đi chung snapshot `zalo-agent`) | hanoi **21/10 14:02** — đứng (402 khi khởi chạy actor, audit L10) |
| S06 | `stg_chotot_ads.captured_at` | hanoi/hcmc 23/10 01:34 |

## 2. Thiết kế

1. **Một nguồn định nghĩa** `scripts/lib/freshness.mjs` (nhận một `pg` client, không tự kết nối — để AU6 và phép đo
   dùng lại): `SLO_HOURS`, `readFreshness(client, { now })` → mảng `{ code, city, last, ageHours, sloHours, status }`
   với `status ∈ fresh | stale | none | no-slo`. Đọc `source_registry` (mã + `source_ids`, KHÔNG đọc/in `real_name`).
2. **Bảng thật theo mã** — mỗi mã một truy vấn, lọc bằng `source_ids` đọc từ registry (không literal nguồn trong mã):
   S01 `airbnb_snapshots.source = ANY(ids)`; S02 `airdna_markets` theo `country_code`; S03/S05 `stg_zalo_posts`
   join `airbnb_snapshots` (lấy `city`), phân mã theo `agent_id ∈ ids` trước, rồi theo source của snapshot; S06
   `stg_chotot_ads` join `airbnb_snapshots`. Gộp **max theo (mã, thành phố)**.
3. **Thành phố = nơi mã đó có dữ liệu** — bỏ ghép chéo. Mã `active` không có dòng nào ở đâu → một dòng `none`
   («chưa có dữ liệu»). Mã `completed` (S04) không đo.
4. **SLO** (giờ): **S05 12 · S06 36** — theo nhịp thu đã khai trong `app/src/lib/ops-queries.ts` (S05 4 lượt/ngày,
   S06 hằng ngày); ADR-0007 «offers ≤3 ngày» đặt từ trước khi có S05/S06, và 3 ngày cho S05 thì nguồn đứng 2 ngày
   vẫn «tươi» — trái ngưỡng Mạnh duyệt. **S01 · S02 · S03 là Hỏi-1** (hai bảng đang lệch nhau):

   | Lối | S01 | S02 | S03 | Lỗi trên DB 23/10 ~11:00 |
   |---|---|---|---|---|
   | A (khuyên) — ADR-0007 (CLI hiện tại) | 8 ngày | 35 ngày | 3 ngày | chỉ S05/hanoi |
   | B — `ops-queries.ts` (app) | 36 giờ | 36 giờ | 2 giờ | S05/hanoi + S01/hanoi (19/10) + S01/hcmc (18/10) + S03/hanoi (05:00) |

   Lối A khớp nhịp thu thật (S01 thu tuần, S02 xoay vòng 43 market, S03 nạp lô 00:00) và ngưỡng Mạnh duyệt; lối B
   biến S01 thu tuần thành «đứng» sau 1,5 ngày. Mã `active` thiếu SLO → `no-slo`, tính là lỗi.
5. **Đầu ra**: dòng chữ chỉ mang mã S0x + thành phố + tuổi + SLO (giờ) của CHÍNH hàng; `--json` in mảng hàng.
   Exit 1 khi có `stale | none | no-slo`; webhook giữ như cũ (cùng chữ). Hai cờ phục vụ đo và soi: `--now <ISO>`
   (mốc tính tuổi) và `--schema <tên>` (đặt `search_path` trước khi đọc).
6. **Không đổi** `app/` — `/ops` và `/ops/collections` dùng chung số là AU6 (`sau` AU4); module ở bước 1 là chỗ AU6 nối.

## 3. Phép đo

`scripts/check-freshness.test.mjs` (chạy bởi `node --test scripts/*.test.mjs`):

- **Fixture từ khuôn thật, không đụng bảng thật:** schema tạm riêng `freshness_test_<pid>_<n>`, `CREATE TABLE …
  (LIKE public.<bảng> INCLUDING DEFAULTS)` cho 5 bảng đo, chèn hàng mẫu; ca module gọi `readFreshness` trong giao
  dịch, ca CLI chạy tiến trình con `check-freshness.mjs --schema <tạm> --now <ISO>` (đo mã thoát thật);
  `DROP SCHEMA … CASCADE` cuối ca. DB không tới → ca **skip** có lý do (eval đòi `ok`, nên skip lộ ra).
- **SPL hai chiều:** registry fixture mang chuỗi canh `REALNAME-CANARY` ở `real_name` và `source_ids` canh; ca kiểm
  chuỗi canh có trong registry rồi đòi vắng ở stdout, stderr, `--json` và body webhook (máy chủ HTTP local).
- Mỗi tiêu chí một cặp hai chiều trên CÙNG fixture: vật lành → `fresh`; dời đúng một mốc thời gian quá SLO → `stale`
  với thông điệp ghim (mã/thành phố).
- **Chẩn đoán trên DB hiện tại** (không chặn): chạy CLI thật (`--json` và bản chữ), in mã thoát, tập `stale|none|no-slo`
  kèm `status` + `last`, và giờ chấm vào đầu ra TAP — số đo của ngưỡng ở thời điểm chấm.

## 4. Ngoài phạm vi

`/ops`, `/ops/collections`, `/api/v1/ops/coverage` (AU6) · đổi ADR-0007 (đề nghị: cập nhật dòng SLO thêm S05/S06 —
chủ kho sửa ở commit riêng) · cảnh báo khi quá hạn ngoài webhook có sẵn · độ tươi theo phút của F4 (lát đầu) ·
sửa S05 đứng (402 — làn ZCode).

## Đặc tả UX

Không chạm UI — bỏ (sổ: «bỏ đặc-tả-UX»).
