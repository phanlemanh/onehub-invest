# Một bộ soát tầng A cho mọi đường lên cloud (NT2 · `soat-tang-a-moi-duong-len-cloud`) — design

Hàng NT2 của `docs/plan/lo-trinh.json` (dãy P2 đợt `dot0-cam-mau`, chuỗi ADR-0014 AU13 → ON7 → **NT2** → ON22). Ngưỡng:
«Cấy tên nguồn thật vào payload ops-facts hoặc một cột: lệnh đẩy dừng trước khi gửi; leak gate đỏ khi cloud có cột PII ngoài
danh sách cho phép». ON22 đứng trên hàng này: mọi khối số tổng hợp Ops mới đi qua cùng bộ soát.

## Hiện trạng

- Hai đường rời máy: `pipeline/sync-cloud.mjs` (bảng → Supabase, 15′) và `pipeline/push-ops-facts.mjs` (bản tin `ops_heartbeat`).
- `sync-cloud` đã soát tên nguồn trên payload bảng người bán bằng `scanSourceNames(text, tokens)` (token từ
  `source_registry`) và có `leakGate` (bảng thô/`stg_*`/`airdna%` vắng-hoặc-rỗng, `seller_ref` chuẩn S0x, quyền anon).
  Leak gate CHƯA soát cột: một cột PII lọt lên bảng người bán ở cloud không làm gate đỏ.
- `push-ops-facts` KHÔNG qua bộ soát nào. ON7 đã che tên trong nhãn/dòng log (bộ che `mask-source-names`), nhưng một
  đường mới (ON22 thêm khối số) hay một hồi quy (bỏ bộ che) sẽ đẩy tên thật đi không ai chặn.
- Bản tin còn `zaloAccounts[].name` — tên tài khoản thu, AGENTS luật 6 ghi «chưa chốt, giữ như tầng A» (Hỏi-1).

## Cách làm

1. **Bộ soát chung** `pipeline/lib/tier-a-guard.mjs`:
   - `guardValues(value, entries, { exempt })` → `[{ path, code }]`: đi mọi giá trị chuỗi của một đối tượng JSON (đường
     dạng `jobs[0].lastLine`), khớp tên bằng lõi `findSourceNames` của `pipeline/lib/mask-source-names.mjs` (một lõi cho
     cả bộ che lẫn bộ soát). `exempt`: đường được miễn có tên — tên nhóm S03 (`zaloGroups[i].name`, tầng C từ 24/10).
   - `entriesFromTokens(tokens)` để `sync-cloud` đưa token sẵn có vào cùng lõi.
   - Báo bằng đường + mã S0x — không bao giờ in tên.
2. **`push-ops-facts`**: dựng payload xong → `guardValues(payload, REG.names, EXEMPT)`; có chỗ trúng → in
   `FACTS CHẶN [tầng A] <đường> <S0x>` ra stderr cho mỗi chỗ, `process.exitCode = 1`, KHÔNG gọi `fetch`. Danh sách tên
   rỗng (không đọc được `source_registry`) → chặn luôn (đóng chặt) — không có cách biết bản tin sạch.
   Theo Hỏi-1 = A: bên ghi gửi `zaloAccounts[].name = null`; bộ soát chặn bản tin có `zaloAccounts[i].name` khác null.
3. **`sync-cloud`**: `scanSourceNames` giữ chữ ký, gọi lõi chung qua `entriesFromTokens` (cùng kết quả cho bảng ca dùng
   chung của ON7). `leakGate` thêm hai phép soát:
   - mỗi bảng trong `CLOUD_ALLOW` có ở cloud: cột của nó (`information_schema.columns`) phải ⊆ danh sách cho phép →
     lệch thì `cột ngoài danh sách cho phép: <bảng>.<cột>`;
   - bảng tầng A `user_events`, `user_profile`, `review_queue` có ở cloud và có dòng → `<bảng>=<n>`.
4. **Thước**:
   - `pipeline/scripts/soat-tang-a.test.mjs` (`cd pipeline && npm test`): `push-ops-facts` THẬT qua
     `capture-ops-facts` (ON7) — bản lành gửi được; bản sao bỏ bộ che / cấy tên vào trường ngoài jobs / gửi tên tài
     khoản → thoát ≠ 0, máy chủ thu KHÔNG nhận POST, stderr nêu đường + mã; bảng ca ON7 chạy qua `scanSourceNames` và
     `guardValues` cho cùng kết quả.
   - `pipeline/scripts/check-cloud-sync.mjs` ca mới `pii-cot` (DB mô phỏng như AU1): cloud thêm cột `seller_phone` vào
     `sale_offers` → gate đỏ nêu `sale_offers.seller_phone`; cloud có `user_events` 1 dòng → gate đỏ; cloud sạch → xanh.
5. **Tài liệu**: `docs/ops/runtime-map.md` mục cloud-sync — bộ soát chung, dòng `FACTS CHẶN`, hai phép soát mới của leak
   gate; ROADMAP một dòng.

## Không làm

- Không đổi khoá JSON của bản tin (Hỏi-1 của ON7 — đo giá trị).
- Không soát nội dung tự do theo mẫu PII chung (SĐT, email…) — tầng C theo luật 23/10 cho người bán; chỉ tên nguồn thật
  + dữ liệu người dùng app + tên tài khoản thu.
- Không áp lên cloud prod (gate chạy trong lượt sync kế; không sửa tay DB prod).
- Không sửa plist (làn ZCode).

## Hỏi-1 (chỉ người có)

Tên tài khoản thu (`zaloAccounts[].name`) là tầng A hay C? Máy khuyên A — đúng chữ AGENTS hiện tại («giữ như tầng A»):
bản tin gửi `null`, trang `/ops/sources` trên cloud hiện mã tài khoản thay tên. Lối khác: C — giữ tên trên cloud, bộ soát
miễn đường này; cần sửa AGENTS luật 6 và ADR-0007 cùng commit.
