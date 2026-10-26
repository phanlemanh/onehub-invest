# Hình tại điểm quyết định — vong-doi-nguon (Cổng Phạm vi, T3)

| Điểm | Đếm | Hình |
|---|---|---|
| status là nguồn sự thật, enabled là bản soi do trigger giữ (d-…-1) | 4 nhánh (INSERT/UPDATE × nêu status/chỉ enabled) | `dong-bo-enabled` |
| Luật chạy isRunnable (d-…-3, d-…-4) | 3 bước nối tiếp (nguồn có không → nguồn active → đơn vị) | `luat-chay` |
| Hỏi-1 tắt không lý do (d-…-8) | 3 nhánh rẽ | gộp vào `dong-bo-enabled` (nhánh route tắt) |
| Mặc định status giữ active (d-…-2) | dưới ngưỡng: 1 bước | — |
| Hỏi-2 thêm nhóm ở active (d-…-9) | dưới ngưỡng: 2 lối, 1 bước | — |
| Áp migration local trước gộp (d-…-7) | dưới ngưỡng: 1 bước | — |
| Hai descope (d-…-5, d-…-6) | dưới ngưỡng | — |

## Đề bài `dong-bo-enabled`

- Loại: flowchart (một lệnh ghi vào `source_groups` đi tới trạng thái nào).
- Nút vào: «route toggle tắt (Hỏi-1: lý do mặc định)», «route toggle bật», «route add», «đường cũ: chỉ ghi enabled», «SQL ghi status».
- Nút giữa: trigger `source_groups_dong_bo_enabled` — rẽ «có nêu status?» → enabled := (status = 'active') · «chỉ đổi enabled?» → status suy từ enabled (tắt → paused + lý do «tắt qua cột enabled (đường ghi cũ)», bật → active + xoá lý do).
- Nút cuối: CHECK `enabled = (status = 'active')` và `paused` phải có lý do → ghi được / bị từ chối.
- AC: AC-2, AC-6, AC-10.

## Đề bài `luat-chay`

- Loại: flowchart quyết định của `isRunnable(nguồn, đơn vị?)`.
- Bước: nguồn có dòng? (không → `nguon-khong-co`) → trạng thái nguồn lạ? (`trang-thai-la:nguon`) → nguồn ≠ active? (`nguon-<tt>`) → có hỏi đơn vị? (vắng → `chay`) → đơn vị có dòng? (`don-vi-khong-co`) → lạ? (`trang-thai-la:don-vi`) → ≠ active? (`don-vi-<tt>`) → `chay`.
- Ghi chú dưới hình: «chỉ 2/49 ô chạy»; CLI: 0 chạy · 3 không chạy · 2 lỗi.
- AC: AC-4, AC-5.
