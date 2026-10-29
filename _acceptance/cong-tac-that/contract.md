---
schema_version: 1
feature: công tắc thật — mọi đường thu S01, S02, S05, S06 hỏi vòng đời nguồn × đơn vị qua một cổng trước khi gọi nhà cung cấp, hết danh sách cứng, lỗi DB thì dừng
slug: cong-tac-that
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-27
---

# Acceptance Contract: cong-tac-that

## Context

TV2b (lộ trình, mốc TVM1 «tạm dừng/bật nguồn từ cloud»): ca thật 21–24/10 S05 hết credit vẫn bắn 4 lần/ngày; tắt hết nhóm
thì `apify-facebook-collector.mjs` và `collect-chotot.mjs` rơi về danh sách cứng; `chotot-daily.sh` cứng hai thành phố.
TV2a (#129) đã có luật chạy `pipeline/lib/vong-doi.mjs` (`isRunnable` nguồn × đơn vị, CLI thoát 0 chạy · 3 không chạy · 2 lỗi);
PL12 (#139) đổi `source_groups` thành view trên `collection_units`. ZCode làm ở lời giao claudedp-2610-13
(`zcode/cong-tac-that` @ 6ac79718; đang mở lại vì lỗi `set -e` ở hai script cổng). TV2b mở đường cho TV4b (bấm tạm dừng từ
cloud) và TV15 (trần chi phí S05). Hạng T3 theo lộ trình: đổi hành vi chạy đêm của bốn nguồn.

Đổi hành vi đã ký: 2510-4 (`khoa-nap-s05-paused`, Mạnh ký 25/10) cho S05 «DB lỗi thì coi như active, vẫn thu» (fail-open). TV2b
đảo thành fail-closed: DB lỗi thì không thu, thoát khác 0.

Source input: lộ trình TV2b + lời giao claudedp-2610-13 (phiên điều phối liên làn, 26/10/2026)

## Criteria

- AC-1: Given nguồn S05 ở trạng thái khác active, When chạy collector S05, Then 0 lời gọi nhà cung cấp, thoát 0, in đúng một dòng mã nguồn + lý do; nguồn active và có nhóm active thì có lời gọi.
- AC-2: Given S05 active nhưng không còn nhóm active, When chạy collector, Then 0 lượt thu, không rơi về danh sách nhóm nào khác, thoát 0.
- AC-3: Given thêm một vùng S06 active mới, When chạy lượt thu và chuỗi nạp hằng ngày, Then vùng đó được thu và được nạp; vùng paused/retired không được thu hay nạp.
- AC-4: Given nhóm hay vùng paused/retired xen giữa nhóm active, When chạy, Then chỉ đơn vị active được thu (cả hai nửa trong một lượt).
- AC-5: Given DB không kết nối được hoặc cổng vòng đời lỗi, When chạy bất kỳ đường thu nào của S01, S02, S05, S06, Then 0 lời gọi nhà cung cấp và thoát khác 0.
- AC-6: Given trạng thái lạ (ngoài năm trạng thái) ở nguồn hoặc đơn vị, When chạy, Then đơn vị đó bị chặn.
- AC-7: Given cổng vòng đời trả «không chạy» (3) hoặc «lỗi» (2), When chạy THẬT từng script vào của launchd (airdna-daily, weekly-with-jitter, smoke-daily, chotot-daily), Then với 3: thoát 0 kèm một dòng mã + lý do; với 2: thoát khác 0; cả hai: 0 lời gọi nhà cung cấp.
- AC-8: Given mã nguồn sau thay đổi, When soát các đường thu, Then không còn danh sách nhóm/vùng viết cứng hay vòng lặp vùng cứng, và quyết định chạy chỉ đi qua `pipeline/lib/vong-doi.mjs` (không đọc `enabled` để quyết thu).
- AC-9: Given nhánh, When chạy bộ test của `pipeline/` và `scripts/`, rồi ghim lại các hồ sơ đã ký chạm các tệp này, Then tất cả xanh; hồ sơ có thước bị đổi theo hành vi mới mang dòng revisit.

## Coverage

- Bỏ coverage-scan — trục: nguồn (S01, S02, S05, S06) × trạng thái (active, paused, retired, lạ, DB lỗi) × lớp (collector, script vào launchd, chuỗi nạp), cộng soát mã và hồi quy hồ sơ đã ký.

## Out of scope

- Triển khai lên máy thu (plist, chạy thật một ngày «S05 paused: 0 lời gọi»): lời giao triển khai riêng sau merge, bằng chứng hai phía.
- Nút tạm dừng/bật nguồn trên /ops (TV4b) và tự tạm dừng khi chạm trần chi phí (TV15).
- Sửa `pipeline/lib/vong-doi.mjs` (luật của TV2a, giữ nguyên).
- Gọi nhà cung cấp thật trong lúc kiểm: mọi ca dùng nhà cung cấp giả đếm lời gọi.
