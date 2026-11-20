# Thiết kế: che tên nguồn — khai «khớp nguyên cụm, không lấy từ đầu» theo dòng sổ (che-ten-nguon-khong-lay-tu-dau)

Ngày 18/11/2026 · dãy U1 · hạng T3 (nới bộ soát tầng A, chạm `db/migrations`, `pipeline/sync-cloud.mjs`) · lối B do GS chốt
(U1-1811-1).

## Vì sao

Lõi che/soát tên nguồn (`nameVariants` của `pipeline/lib/mask-source-names.mjs`, bản chép `app/src/lib/mask-source-names.ts`)
sinh ba biến thể cho mỗi token của sổ nguồn (tên thật và từng định danh): tên đủ, bản viết liền, và TỪ ĐẦU khi token nhiều từ
và từ đầu ≥ 4 ký tự. Biến thể ≥ 4 ký tự khớp ở mọi chỗ. Tối 17/11 thêm dòng S16 (tên hai từ + tên miền) thì:

- từ đầu của tên là thương hiệu chủ đầu tư, cũng là từ đầu của hàng trăm tên dự án → /ops/registry hiện «S16 <tên dự án>»;
- từ đầu của tên miền là một từ chung → bộ soát của sync-cloud dừng mọi lượt đẩy.

GS chữa tạm bằng dữ liệu (tên viết liền, chỉ giữ slug), nên cụm hai từ có dấu cách và tên miền S16 hiện KHÔNG được che/soát.

## Số đo (DB máy thu, `discovery/bang-phu-ca.md`, chỉ mã + số)

- S16 dạng trả về: từ đầu của tên trúng 8 nút dự án, 114.760 bí danh, ≈ 1.320 dòng bảng đi cloud; từ đầu của tên miền trúng
  3.355 dòng `areas`; biến thể đủ và viết liền trúng 0.
- Bỏ hẳn biến thể từ đầu thì hở: một định danh S05 có 60 dòng log job mà CHỈ biến thể từ đầu che được (ca ON7 ghim «từ đầu
  của tên nhiều từ»).
- Các nguồn khác: từ đầu thừa (S01, S02, S03, S06) hoặc trúng 0 chỗ (S05 tên, S07, S08, S10–S15).

## Lối chọn: cột cờ theo dòng (B)

- Migration 112: `source_registry.match_whole boolean NOT NULL DEFAULT false`. Bảng chỉ ở máy thu, không lên cloud.
- Lõi nhận entries `{ code, realName, wholeOnly }`. `wholeOnly` = true → chỉ tên đủ và viết liền, không từ đầu. Thiếu cờ =
  false = y như hôm nay: chỗ đọc nào chưa mang cờ thì che THỪA (ồn, thấy ngay), không rò.
- MỘT hàm nạp dùng chung đọc sổ + cờ: `pipeline/lib/source-name-entries.mjs` (bản pipeline) và `docSourceNameEntries` của
  `app/src/lib/source-roles.ts` (bản app — app không import pipeline). Hàm nạp trả mọi token (tên thật + định danh) mỗi token
  mang cờ của dòng. DB chưa áp 112 (thiếu cột) → mọi cờ false (che thừa). Không có bảng → [] (đóng chặt như hôm nay).
- `tier-a-guard.entriesFromTokens` nhận cả token trần (cũ) lẫn `{ token, wholeOnly }`.
- Sáu chỗ đọc chuyển qua hàm nạp, theo thứ tự GS: đường rời máy trước — `sync-cloud.mjs` (token cho leak gate VÀ bước che
  phía SQL `maskedSourceExpr`, đặt NULL cột mang tên nguồn), `push-ops-facts.mjs` (hai câu đọc), `do-hang-ngay.mjs` (+ một dòng
  trong `lib/do-hang-ngay.mjs` để cờ tới bộ soát); rồi chỗ hiển thị Ops — `offers-public.ts`, `collections-queries.ts`; rồi thước
  `scripts/quet-ten-nguon-html.mjs`. `scripts/lib/ops-local.mjs` không cần sửa: danh sách tên của nó do push-ops-facts truyền vào.
- Bản app của hàm nạp nằm cạnh lõi ở `app/src/lib/mask-source-names.ts` (`docSourceNameEntriesVoi`) để bộ test pipeline nạp
  được; `source-roles.docSourceNameEntries` gọi nó với pool của app.
- Không chuyển (Known limits, chặn thừa không rò): `scripts/do-nen-hieu-nang/do.mjs`, `scripts/link-nguoi-ban-s03/ten-nguon.mjs`,
  `pipeline/scripts/check-s08-inventory.mjs`, `scripts/lib/tier-a-source-names.mjs` (hạt giống rút từ migration).

## Loại

- (A) bỏ hẳn từ đầu: hở 60 dòng log S05.
- (C) dấu «=» trong chính token: chỗ đọc `real_name` thô không qua lõi tìm chuỗi «=…» và không trúng gì — hở im lặng. Với bộ soát
  tầng A, hỏng phải hỏng đóng.

## Áp máy thu

Áp 112; trả dòng S16 về tên hai từ + tên miền với `match_whole = true` (giá trị GS cấp lúc áp qua tệp cục bộ, không chép vào
hồ sơ); kiểm sau: /ops/registry hiện đúng tên dự án, một lượt sync-cloud chạy thử qua leak gate, cấy cụm tên có dấu cách và tên
miền S16 vào bảng thử thì bộ soát bắt được.

## Fixture

Không tên nguồn thật trong hợp đồng, test hay kênh. Ca mới dùng tên giả cùng hình dạng: hai từ, từ đầu trùng thương hiệu của
tên dự án giả; tên miền có nhãn đầu là từ chung.
