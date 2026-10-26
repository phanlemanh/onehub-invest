---
schema_version: 1
feature: source_registry và sổ nhóm có vòng đời năm trạng thái kiểm bằng CHECK kèm lý do và điều kiện bật lại, và một hàm isRunnable trả quyết định chạy cho từng nguồn và đơn vị thu
slug: vong-doi-nguon
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: chạm db/migrations/** và app/src/app/api/v1/ops/** (t3_paths); hàng lộ trình ghi T2
surfaces: [api, cli]
status: draft
design_doc: docs/superpowers/specs/2026-10-26-vong-doi-nguon-design.md
approved_by:
approved_at:
---

# Acceptance Contract: vong-doi-nguon

## Context

Hàng TV2a. Hôm nay `source_registry.status` là chữ tự do, không CHECK, và `paused` không script thu nào tuân (G1 —
`docs/research/ops-tu-van-hanh-nguon-saas.md` §2.4). Sổ nhóm `source_groups` (S05, S06) chỉ có cờ `enabled`. Vòng này
đặt một vòng đời chung năm trạng thái `draft · active · paused · retired · completed` trên cả hai bảng, kiểm bằng CHECK.
`paused` bắt buộc có lý do. Vòng này cũng viết một hàm `isRunnable` để TV2b, PL12 và TV4 tuân theo. Đứng trên ADR-0015
(#124).

Vòng này KHÔNG sửa script thu nào của làn ZCode. `status` là nguồn sự thật; `source_groups.enabled` thành bản soi do
trigger giữ khớp (kèm CHECK), nên câu đọc `… AND enabled` của các script thu và các đường ghi cũ còn ghi `enabled` chạy
y như trước. Migration tương thích ngược vì DB local dùng chung cho mọi worktree và job đêm.

Source input: `_acceptance/vong-doi-nguon/opportunity.md`.

## Criteria

- AC-1: Given migration vòng này đã áp lên một lược đồ tạm có hai bảng ở khuôn trước migration, When INSERT hay UPDATE `status` ngoài năm giá trị (`'deprecated'`, `''`, `'Active'`, `NULL`) trên `source_registry` và trên `source_groups`, Then DB từ chối từng lệnh: lỗi CHECK nêu tên ràng buộc `*_status_chk`, hoặc NOT NULL với `NULL`. Cả năm giá trị hợp lệ đều được nhận (`paused` kèm lý do).
- AC-2: Given cùng lược đồ ấy, When đặt `status = 'paused'` với `reason` `NULL`, `''` hay `'   '` trên mỗi bảng, Then DB từ chối bằng `*_paused_reason_chk`. Có `reason` thì nhận; `resume_when` vắng hay có đều nhận.
- AC-3: Given khuôn trước migration có sẵn dòng `source_registry` ở `active`, `paused` có `note`, `paused` không `note`, `completed`, và dòng `source_groups` có `enabled` `true` và `false`, When chạy migration hai lần liền, Then (a) trạng thái `source_registry` giữ nguyên — migration không đổi trạng thái nguồn nào (Hỏi-3); dòng `paused` có `reason` = `note`, hoặc chuỗi cố định `'trước TV2a: chưa ghi lý do'` khi `note` trống; (b) nhóm `true` thành `active`, nhóm `false` thành `paused` kèm lý do cố định; (c) trên mọi dòng `enabled = (status = 'active')`; (d) lần chạy thứ hai không lỗi và ảnh chụp hai bảng không đổi.
- AC-4: Given ma trận viết trước 7 × 7 = 49 ô (nguồn: năm trạng thái, lạ, không có dòng; đơn vị: vắng, năm trạng thái, lạ), When gọi `isRunnable` cho từng ô, Then đúng hai ô chạy: nguồn `active` với đơn vị vắng, và nguồn `active` với đơn vị `active`. 47 ô còn lại trả `run = false` với `ly_do` đúng như ma trận (nguồn chặn trước đơn vị, trạng thái lạ thì chặn).
- AC-5: Given một lược đồ tạm có nguồn và nhóm ở các trạng thái khác nhau, When chạy CLI `node pipeline/lib/vong-doi.mjs <mã> [--unit <group_key>]`, Then nguồn chạy được thoát 0; nguồn hay đơn vị bị chặn thoát 3 kèm `ly_do` đúng; mã không có thoát 3 với `nguon-khong-co`; DB không tới được thoát 2. stdout mỗi lần đúng một dòng JSON, không chứa `group_key` hay `reason` của dòng nào. (cross-layer)
- AC-6: Given route `POST /api/v1/ops/source-groups` gọi bằng Bearer `OPS_API_TOKEN` trên lược đồ tạm đã migration, When `toggle` tắt (không lý do, rồi có lý do), `toggle` bật, `toggle` bật một nhóm `retired`, và `add` một nhóm, Then DB cho đúng (route chạy trên lược đồ tạm, `public` không đổi): tắt → `paused`, lý do mặc định hay lý do gửi lên; bật → `active`, `reason` và `resume_when` thành `NULL`; bật nhóm `retired` → 409 và dòng không đổi; `add` → `active`. Mỗi `toggle` thành công ghi `ops_audit` có `from` và `to`. (cross-layer)
- AC-7: Given lược đồ đã migration, When chạy nguyên văn câu đọc nhóm (rút từ chính tệp) của `pipeline/apify-facebook-collector.mjs` và `pipeline/collect-chotot.mjs`, Then mỗi câu trả đúng các nhóm `active` của nguồn mình; câu đọc lưới của trang `/ops/sources` (`docNhomThu`) và của GET route trả đủ dòng với `enabled` đúng. Các suite `che_do_thu`, `check_freshness`, `app_ui` và `pipeline` thoát 0.
- AC-8: Given tệp 047 không có tiền tố `public.` hay lệnh đặt `search_path`, và một lược đồ không có `source_registry` lẫn `source_groups` (như Supabase), When chạy nguyên tệp migration (dừng ở lỗi đầu), Then không lỗi và không tạo bảng, cột hay hàm nào.
- AC-9: Given bản chép nguyên dòng của `public.source_registry` và `public.source_groups` trên DB local :5433 vào một lược đồ tạm (public chưa áp — áp sau gộp), When chạy migration trên bản chép, Then số dòng mỗi trạng thái giữ nguyên, mọi dòng `paused` có lý do, nhóm ra `status` khớp `enabled` cũ và `enabled` không đổi giá trị, đủ năm ràng buộc có mặt, và `public` không bị chạm. Tệp migration và `pipeline/lib/vong-doi.mjs` không chứa `real_name` hay `source_ids` nào của `source_registry` local (soát bằng `guardValues`).
- AC-10: Given lược đồ đã migration, When ghi theo đường cũ — INSERT chỉ nêu `enabled` (`true`, `false`), UPDATE chỉ `enabled` trên đủ 5 trạng thái cũ × 2 giá trị (bảng luật ở design doc) — và theo đường mới — UPDATE `status` sang `paused` có lý do, `retired`, `active`; UPDATE đặt `status = 'active'` với `enabled = false` cùng lúc, Then sau mỗi lệnh `enabled = (status = 'active')`; tắt qua `enabled` cho `paused` với lý do `'tắt qua cột enabled (đường ghi cũ)'`; bật qua `enabled` xoá `reason` và `resume_when`; bật qua `enabled` một đơn vị `retired` hay `completed` bị từ chối và dòng không đổi; lệnh lệch thì `status` thắng; gỡ trigger trên bản sao thì CHECK `source_groups_enabled_khop_chk` từ chối ghi lệch.

## Coverage

Quét bằng morphological-scan, preset test-matrix (design doc mục «Không gian đã quét»):
- Trục A — trạng thái nguồn: draft | active | paused | retired | completed | lạ | không có dòng [thước CE: CHECK năm giá trị + hai ca biên; NGÀNH: Airbyte connection status, Fivetran paused]
- Trục B — trạng thái đơn vị: vắng | draft | active | paused | retired | completed | lạ [thước CE: như trục A]
- Trục C — đường ghi: migration backfill | route toggle | route add | SQL trực tiếp [thước CE: `git grep` mọi chỗ ghi `source_groups`/`source_registry` trên main e70e148]
- Trục D — bên đọc: isRunnable/CLI | script thu đọc `enabled` | freshness đọc `status = 'active'` | trang đọc `enabled` [thước CE: `git grep` mọi chỗ đọc]
- Cắt ngang: môi trường (local có bảng · cloud không có bảng) · chạy lại hai lần · không chạm `public` trước gộp (mọi ca chụp `public` trước/sau).

## Đường đo

- Thước: trạng thái ngoài năm giá trị bị DB từ chối · số từ: lệnh INSERT/UPDATE trên lược đồ tạm · bảo đảm bởi: AC-1
- Thước: isRunnable đúng trên đủ ma trận nguồn × đơn vị · số từ: 49 ô viết trước · bảo đảm bởi: AC-4
- Thước: `paused` thiếu lý do bị từ chối · số từ: lệnh UPDATE trên lược đồ tạm · bảo đảm bởi: AC-2

## Out of scope

- Script thu gọi `isRunnable` và bỏ danh sách cứng (TV2b, làn ZCode).
- Đơn vị S03 (cấu hình gateway) và market S02 vào sổ: đi cùng sổ đơn vị thu PL12.
- Nhãn «Nháp» cho `draft` trên `/ops/sources`, ô nhập lý do khi tắt: giao diện đi cùng PL12/ON20 hoặc TV5.
- Bản TypeScript của `isRunnable` cho app: TV4 cần thì chép, kèm test đồng bộ như freshness.
- CHECK `retired` phải có `retired_at`; lệnh `source.pause`/`source.resume` (TV4).
- Áp migration lên Supabase: hai bảng không có trên cloud; migration tự bỏ qua ở đó.

## Notes

- Migration tương thích ngược (trigger + CHECK khớp, mặc định `source_registry.status` giữ `'active'`): `enabled` giữ
  tên, kiểu và giá trị trên mọi dòng hiện có. Ca test `che-do-thu` (hồ sơ đã ký) không phải sửa.
- Áp 047 lên DB local :5433 dùng chung **chỉ sau khi gộp** (phiên liên làn dặn 26/10, cùng lúc cấp số). Bước triển khai
  sau gộp: áp bằng lệnh của `.claude/rules/migrations.md`, rồi chạy `executors.test.vong_doi_nguon` lần nữa.
- Supabase: không áp, vì cloud không có hai bảng này (AC-8 chứng migration tự bỏ qua nếu lỡ chạy).
