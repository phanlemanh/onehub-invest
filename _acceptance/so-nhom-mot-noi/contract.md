---
schema_version: 1
feature: Người vận hành khai mọi đơn vị thu (nhóm S03, nhóm S05, vùng S06, market S02) trong một sổ trên /ops, mỗi đơn vị có mã ổn định dạng S03-N012, thị trường, dự án nhóm chuyên và trạng thái vòng đời
slug: so-nhom-mot-noi
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: db/migrations/** và app/src/app/api/v1/ops/** (t3_paths); hàng lộ trình ghi T3
surfaces: [ui, api, cli]
status: verified
design_doc: docs/superpowers/specs/2026-10-26-so-nhom-mot-noi-design.md
approved_by: Mạnh
approved_at: 2026-10-26
---

# Acceptance Contract: so-nhom-mot-noi

## Context

Hàng PL12. Đơn vị thu hôm nay nằm ở ba chỗ, ba khuôn: S05/S06 ở `source_groups`, S03 ở cấu hình gateway, S02 ở
`airdna_markets`. Không đơn vị nào có mã ổn định, thị trường hay dự án nhóm chuyên. Vòng này dựng một sổ chung
`collection_units` bằng cách đổi tên `source_groups` (giữ một view tương thích tên cũ). Sổ được thêm mã đơn vị, loại,
thị trường, dự án. S03 và S02 vào sổ bằng một script chỉ đọc nguồn. Trang `/ops/sources` hiện sổ và cho admin khai thị
trường, dự án. Căn cứ: review phân loại §0.3 F1 (`SN`), tài liệu Ops tự vận hành §3.2 và §4.8 #7, ADR-0015, TV2a (#129).

Source input: `_acceptance/so-nhom-mot-noi/opportunity.md`.

## Criteria

- AC-1: Given DB ở khuôn sau 047, When chạy migration của vòng này hai lần, Then bảng `source_groups` thành `collection_units` giữ nguyên mọi dòng, id, trigger và CHECK; `source_groups` là view gồm mọi dòng, giữ tên cột cũ, ghi xuyên được; lần hai không lỗi, không đổi gì. (cross-layer)
- AC-2: Given view `source_groups`, When chạy nguyên văn các câu đọc và ghi đang có (rút từ `apify-facebook-collector.mjs`, `collect-chotot.mjs`, `che-do-thu.ts`, `ha-bung-het-han.mjs`, route `source-groups`), Then mọi câu chạy được và trả, ghi đúng như trước migration; tập tệp nhắc `source_groups` trên đỉnh nhánh đúng bằng danh sách viết trước; lưới nhóm thu cũ và route `source-groups` chỉ hiện, chỉ thao tác S05/S06 (mã khác → 400); test `che-do-thu` (không sửa) xanh cả khi `public` đã áp 048 — chạy trên lược đồ tạm mô phỏng public sau gộp; test vòng đời của TV2a xanh sau khi cập nhật fixture theo khuôn 048.
- AC-3: Given một đơn vị mới chèn không nêu mã, When chèn đơn vị cho từng cặp (nguồn, loại) — kể cả sau khi một đơn vị bị `retired` hay bị xoá, Then mã sinh đúng khuôn `S0x-[NVM]ddd`, tăng dần theo cặp, không trùng, không cấp lại; sửa `unit_code` của dòng đã có bị từ chối.
- AC-4: Given `market_codes` và `project_node_ids`, When ghi một mã không phải thị trường (`areas.region_type <> 'market'` hay không tồn tại) hoặc một node ngoài loại đã chốt ở Hỏi-3, Then DB từ chối nêu tên ràng buộc; mã thị trường và node khu đô thị hợp lệ được nhận.
- AC-5: Given cấu hình gateway mẫu có nhóm bật, nhóm tắt, và một nhóm vừa biến mất, When chạy `pipeline/sync-don-vi.mjs` nhiều lần, Then sổ có đúng một đơn vị S03 mỗi nhóm (bật → `active`, tắt → `paused` lý do «tắt ở gateway», biến mất → `paused` lý do «không còn ở gateway» theo Hỏi-4, quay lại → cùng dòng, cùng mã, `active`); tệp cấu hình thiếu hay hỏng → thoát khác 0, sổ không đổi; băm tệp cấu hình trước/sau bằng nhau; stdout không chứa id nhóm; bản .mjs của hàm đọc nhóm cho cùng kết quả với bản TS trên mọi fixture. (cross-layer)
- AC-6: Given `airdna_markets` và `area_sources`, When chạy script đồng bộ, Then mỗi market S02 có đúng một đơn vị loại `market`, `market_codes` theo ánh xạ `area_sources` khi có; chạy lại không đổi gì.
- AC-7: Given một đơn vị S03 hay S02 trong sổ, When gọi `isRunnable` qua `docTrangThai(client, code, unitKey)`, Then quyết định đọc từ `collection_units` cho mọi nguồn (ma trận nguồn × trạng thái đơn vị như TV2a).
- AC-8: Given phiên admin trên `/ops/sources`, When mở sổ, Then thấy mọi đơn vị của S02, S03, S05, S06 với mã đơn vị, nhãn nguồn, tên gốc, thị trường, dự án, trạng thái; dòng S03 mang nhãn «theo cổng S03»; không hiện URL nhóm S05 hay id nhóm S03; khai thị trường và dự án qua hộp thoại thì dòng đổi và `ops_audit` có một dòng cùng giao dịch; lưu lỗi thì hộp còn mở kèm chữ lỗi; tab nguồn rỗng hiện trạng thái trống kèm lệnh đồng bộ; đọc sổ lỗi hiện vùng lỗi kèm Thử lại. (cross-layer)
- AC-9: Given phiên `ops` (không admin) hay Bearer máy, When gọi action `set-meta`, Then 403 và sổ không đổi.
- AC-10: Given luồng lên cloud, When soát `CLOUD_ALLOW` và payload `push-ops-facts`, Then `collection_units` không lên cloud; tệp mới của vòng không chứa tên nguồn thật (soát bằng `guardValues`).

## Coverage

Quét bằng morphological-scan, preset entity-feature (design doc):
- Trục A — loại đơn vị: nhóm S03 | nhóm S05 | vùng S06 | market S02 [thước CE: ba nơi khai hôm nay — `source_groups`, cấu hình gateway, `airdna_markets`]
- Trục B — thuộc tính: mã | loại | tên gốc | thị trường | dự án | trạng thái [thước CE: câu giao PL12 + tài liệu nguồn §3.2]
- Trục C — đường ghi: migration | script đồng bộ | route `set-meta` | đường cũ qua view [thước CE: `git grep source_groups` trên main d88ce20]
- Trục D — bên đọc: script thu (view) | trang `/ops/sources` | `isRunnable` | cloud (không lên) [thước CE: như trục C]
- Cắt ngang: chạy lại hai lần · an toàn gateway (chỉ đọc) · tầng A.

## Đường đo

- Thước: mọi đơn vị thu ở một sổ có mã ổn định · số từ: `SELECT source_code, unit_type, count(*) FROM collection_units` · bảo đảm bởi: AC-1, AC-3, AC-5, AC-6
- Thước: người vận hành khai thị trường, dự án trên /ops · số từ: `ops_audit` action `source-group:set-meta` · bảo đảm bởi: AC-8

## Out of scope

- Đưa sổ lên cloud (đi cùng TV4/TV11); lệnh `unit.*` (TV5/TV6); bật/tắt nhóm S03 từ sổ (TV6).
- Tiêu đề chuẩn và mô tả nhóm (ON19), màn sửa trên cloud (ON20).
- Lỗi «tắt nhóm đã gỡ hạ về tạm dừng» của route cũ (việc mới P1-18).

## Notes

- Migration chỉ áp DB local sau khi gộp (cùng luật TV2a); Supabase không có bảng này.
