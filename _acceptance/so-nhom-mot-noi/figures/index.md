# Hình tại điểm quyết định — so-nhom-mot-noi (Cổng Phạm vi, T3)

| Điểm | Đếm | Hình |
|---|---|---|
| Một bảng đổi tên + view gồm mọi dòng (dòng sổ view-all-rows) | 3 nơi khai hôm nay → 1 sổ; 5 bên đọc/ghi cũ qua view; 3 chỗ lọc S05/S06 | `mot-so` |
| Hỏi-4 nhóm S03 biến khỏi gateway | 4 trạng thái × 3 lối vào (bật, tắt, biến mất, quay lại) + tệp thiếu/hỏng | `soi-gateway` |
| Hỏi-3 loại node dự án | dưới ngưỡng: 2 lối, 1 bước | — |
| Mã đơn vị không cấp lại | dưới ngưỡng: 1 bộ đếm, 1 bước | — |
| Hỏi-1 khai ở máy thu, descope design-pass | dưới ngưỡng | — |

## Đề bài `mot-so`

- Loại: data flow (đơn vị thu đi từ đâu vào sổ, ai đọc sổ bằng đường nào).
- Trái — ba nơi khai hôm nay: «bảng source_groups (S05 nhóm, S06 vùng)», «cấu hình gateway trên máy thu (S03 nhóm) — chỉ đọc», «airdna_markets (S02 market)».
- Giữa — một bảng `collection_units` (migration 048 đổi tên từ source_groups): cột mới unit_code (S03-N012), unit_type, original_name, market_codes, project_node_ids. Đường vào: migration giữ dòng cũ; `pipeline/sync-don-vi.mjs` upsert S03 và S02.
- View `source_groups` (mọi dòng, tên cột cũ, ghi xuyên được) nối bảng với bên đọc cũ: script thu S05/S06 (làn ZCode, không sửa), `che-do-thu`, `ha-bung-het-han`, `isRunnable`.
- Phải — bên đọc mới: khu «Sổ đơn vị thu» trên /ops/sources (admin khai thị trường, dự án → ops_audit). Lưới nhóm thu cũ và route source-groups lọc S05/S06.
- Ranh: cloud — sổ KHÔNG lên (gạch đứt, ghi «đi cùng TV4/TV11»).
- AC: AC-1, AC-2, AC-5, AC-6, AC-8, AC-10.

## Đề bài `soi-gateway`

- Loại: state machine của một đơn vị S03 qua các lượt `sync-don-vi`.
- Trạng thái: «chưa có dòng» → «active» · «paused — tắt ở gateway» · «paused — không còn ở gateway» (Hỏi-4, khuyến nghị) · «retired» (chỉ admin đổi tay, không do sync).
- Chuyển: bật ở gateway → active; tắt ở gateway → paused «tắt ở gateway»; biến khỏi cấu hình → paused «không còn ở gateway»; quay lại cấu hình → active, CÙNG dòng, CÙNG mã.
- Nhánh lỗi: tệp cấu hình thiếu hay hỏng → thoát ≠ 0, sổ không đổi (không đốt mã nhóm nào).
- Ghi chú dưới hình: «sync không ghi một byte vào cấu hình gateway (băm trước/sau bằng nhau)»; lối khác của Hỏi-4: biến mất → retired (mất mã, không quay lại).
- AC: AC-3, AC-5.
