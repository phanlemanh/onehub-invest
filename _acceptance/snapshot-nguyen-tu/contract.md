---
schema_version: 1
feature: snapshot thu thập chỉ hiện ra cho bước nạp khi đã ghi trọn vẹn, nên lượt nạp không bao giờ đánh dấu «đã nạp» một snapshot dở dang
slug: snapshot-nguyen-tu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
veto_state: mo
veto_opened_at: 2026-10-25T09:44:32Z
approved_by:
approved_at:
---

# Acceptance Contract: snapshot-nguyen-tu

## Context

Sự cố tìm ra ở nghiệm thu AU3: collector tạo thư mục snapshot ngay lúc bắt đầu ghi, còn manifest chỉ có ở cuối (giữa hai mốc
có thể là cả lượt tải media). Tệp bọc nạp chạy đúng lúc đó thấy thư mục thiếu manifest, importer bỏ qua với mã 0, con trỏ
state vượt qua snapshot ấy → snapshot không bao giờ vào stg (mất dữ liệu lặng lẽ). Lời giao `claudedp-2510-8` (chặn ZC4 và G4).
ZCode XONG ở `zcode/snapshot-nguyen-tu` @ 7b6494f sau hai lần MỞ LẠI (chốt chống trùng tên). Nhánh nghiệm thu = `origin/main`
08afadf gộp 7b6494f.

## Criteria

- AC-1: Given một snapshot đang ghi (đã ghi items và tải media, chưa finalize), When nhìn thư mục thị trường của snapshot, Then chỉ có một thư mục ẩn `.<id>.partial`, chưa có thư mục tên thật và chưa có manifest.
- AC-2: Given snapshot finalize, When nhìn lại, Then chỉ còn thư mục tên thật, có manifest, mọi tệp trong manifest có mặt và khớp sha256, items đọc lại đúng.
- AC-3: Given hai hay ba writer cùng thị trường + nguồn tạo trong cùng một mili-giây (trước hoặc sau khi writer đầu finalize), hoặc đã có sẵn một thư mục tên thật cùng id, When ghi và finalize, Then mỗi writer ra một snapshot riêng trọn vẹn với đúng item của nó, không lỗi đổi tên, không ghi vào thư mục cũ, không còn `.partial` nào.
- AC-4: Given một thư mục snapshot thiếu manifest trẻ hơn 30 phút, When tệp bọc nạp Zalo chạy, Then nó dừng chuỗi, giữ con trỏ state, thoát khác 0 để lượt sau thử lại; còn thư mục thiếu manifest già hơn 30 phút thì log «mồ côi», bỏ qua và đi tiếp.
- AC-5: Given thư mục ẩn `.<id>.partial`, When tệp bọc nạp chạy, Then thư mục đó không được nạp và không đẩy con trỏ state.
- AC-6: Given nhánh, When chạy lại các chế độ harness AU3 (ts-format, apify, chotot, lock) và toàn bộ test collector trên bản build sạch, Then tất cả xanh.

## Coverage

- Bỏ coverage-scan — trục: vòng đời snapshot (đang ghi / đã finalize), đụng tên (cùng ms trước / sau finalize, tên thật có sẵn),
  cổng tệp bọc (thiếu manifest trẻ / già, thư mục ẩn), hồi quy AU3 + collector.

## Out of scope

- Writer bị kill giữa chừng để lại `.<id>.partial` vĩnh viễn: thư mục ẩn, tệp bọc bỏ qua; chưa có bước dọn — chấp nhận như rác vô hình.
- `pipeline/import-airbnb.mjs` giữ cửa «bỏ qua thư mục thiếu manifest, mã 0» cũ làm lưới an toàn (giờ tệp bọc chặn trước).
- Triển khai collector :9210 dưới launchd với bản build mới (ZC4) — lời giao riêng sau merge.

## Notes

- Harness `scripts/snapshot-nguyen-tu/acceptance.mjs` chạy `SnapshotWriter` của bản build collector trên thư mục gốc tạm, ghim `Date`
  để ép cùng mili-giây; `SNT_STORAGE` trỏ bản khác để đối chứng. Không đụng collector/snapshots thật, không mở cổng, không ghi DB.
- Kiểm harness biết đỏ (trước verify), mỗi bản biên dịch riêng:
  - main: dang-ghi đỏ (thư mục tên thật có ngay khi ghi).
  - vòng 1 cb174db: trung-ms lỗi ENOTEMPTY (hai writer cùng ms chung `.partial`).
  - vòng 2 dd1ea44c: ten-that-co-san đỏ + trung-ms ENOTEMPTY (bỏ mất kiểm tên thật).
  - vòng 3 7b6494f: cả ba xanh.
- Cổng tệp bọc (AC-4, AC-5) đo bằng chế độ `mo-coi` của harness AU3, do ZCode thêm trong cùng nhánh; lượt chấm đối chứng nó trên tệp bọc của main.
