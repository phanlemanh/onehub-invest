# check-freshness đo giờ thu thật (`freshness-do-gio-thu-that-s03`) — thiết kế

Hàng mới từ Ngoài-3 của AU4 (`freshness-theo-nguon-that`, Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 23/10;
giám sát duyệt `P3-13`, đề xuất mã AU14). Gom Ngoài-5, Ngoài-6 của AU4 (cùng tệp phép đo). T2.

## 1. Số đo

| Mã | Cột AU4 đang đo | Ai ghi | Nghĩa thật |
|---|---|---|---|
| S03, S05 | `stg_zalo_posts.captured_at` | `pipeline/import-airbnb.mjs:102` `ON CONFLICT (post_id) DO UPDATE SET text = EXCLUDED.text, captured_at = now(), …` — KHÔNG đổi `snapshot_id` | giờ NẠP; `snapshot_id` = snapshot lần đầu thấy bài |
| S06 | `stg_chotot_ads.captured_at` | `pipeline/import-chotot.mjs:75` `… payload = EXCLUDED.payload, snapshot_id = EXCLUDED.snapshot_id, captured_at = now()` | giờ NẠP; `snapshot_id` = snapshot nạp gần nhất |
| S01 | `airbnb_snapshots.collected_at` | manifest `finishedAt`, ghi một lần | giờ THU ✓ |
| S02 | `airdna_markets.captured_at` | `transform-airdna.mjs:70` gán `fetchedAt` của item (cả khi upsert lại) | giờ THU ✓ |

DB 23/10: S06 snapshot mới nhất thu 22/10 22:32, nạp 23/10 01:34; S05 thu 21/10 11:00, nạp 21/10 14:02.

## 2. Thiết kế

- `ZALO_POSTS` và probe S06 trong `scripts/lib/freshness.mjs` đã `JOIN airbnb_snapshots` — đổi `max(p.captured_at)` /
  `max(c.captured_at)` thành `max(s.collected_at)`. Phân mã S03/S05 theo `agent_id` giữ nguyên: mốc của một mã = snapshot
  mới nhất chứa ít nhất một hàng của mã đó. Không đổi SLO, đầu ra, cờ CLI.
- Hệ quả của hai ngữ nghĩa upsert: Zalo — mốc của S03/S05 là snapshot MỚI NHẤT có bài MỚI (nạp lại snapshot cũ không
  kéo mốc); Chợ Tốt — nạp lại snapshot cũ kéo `snapshot_id` của tin trùng về snapshot cũ, mốc chỉ có thể lùi (báo quá
  hạn sớm, chiều an toàn). `chotot-daily.sh` chỉ nạp snapshot mới nhất, nên ca lùi chính là ca thu hỏng cần báo.
- `scripts/lib/freshness.mjs` xuất thêm `TIME_SOURCE` (mã → `bảng.cột` thời gian) — một khai báo để phép đo AC-8 đối
  chiếu với SQL của từng probe.
- Chú thích đầu `check-freshness.mjs` + `ops-check` SKILL: mọi mã tính theo giờ THU.

## 3. Phép đo (`scripts/check-freshness.test.mjs`, cùng khuôn AU4)

- Ca «nạp lại bản cũ» S06 bằng importer THẬT `import-chotot.mjs` trên schema tạm (snapshot giả: manifest + sha256 +
  items gzip): nạp, nạp lại → `stale` theo `finishedAt`; nạp snapshot mới → `fresh`. S03/S05: fixture theo đúng dòng
  upsert đã trích (chưa round-trip importer Zalo — nhiều loại item + media).
- Ma trận mã → cột (AC-8): `TIME_SOURCE` = bảng viết trước, mỗi probe `max(` đúng cột; bản sao đổi probe → đỏ.
- Ca tách S03/S05 có đối chứng (Ngoài-5): hàng S03 ở snapshot cũ 80 giờ, hàng S05 ở snapshot mới 1 giờ → S03 `stale`,
  S05 `fresh` (S05 không được làm S03 trông tươi).
- Ma trận biên (Ngoài-6): 5 mã có SLO × {tuổi = SLO → `fresh`, SLO + 1 → `stale`} = 10 ca viết trước + ca đếm; thêm
  chiều quá hạn theo thành phố (S01 hanoi tươi, hcmc quá hạn cùng lúc) và S04 `completed` có dữ liệu quá hạn vẫn không đo.
- Chẩn đoán DB thật (ca `GT-AC-6` riêng): vẫn chỉ S05/hanoi, `last` = 2026-10-21T11:00Z (giờ thu); in thêm giờ nạp,
  giờ thu, số hàng lệch snapshot cho S03/S05/S06.

## 4. Ngoài phạm vi

`/ops` (AU6) · đổi importer để `captured_at` giữ giờ thu (làn ZCode, không cần — snapshot đã có giờ thu) · Ngoài-1/2/4
của AU4 (Known limits đã ký).

## Đặc tả UX

Không chạm UI — bỏ (sổ: «bỏ đặc-tả-UX»).
