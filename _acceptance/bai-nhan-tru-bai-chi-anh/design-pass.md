---
slug: bai-nhan-tru-bai-chi-anh
at: 2026-11-09T01:20:00Z
route: http://localhost:3465/ops/data-flow?window=all
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (ghim)
options:
divergence: skipped — khung Sankey DF0 (chuyển thể @reui/chart-49) có sẵn; DF6 chỉ thêm nút và một cột theo đúng khuôn của khung, hai câu còn mở (mẫu số) là nghĩa số, không phải hướng nhìn
ds_skill: onehub-ui
states: [ST-nhanh-day-du, ST-chi-s06, readout-doc-thanh-tin, readout-doc-thanh-yeu-cau, luoi-chat-luong, chang-theo-ngay]
breakpoints: [mobile-375, desktop-1280]
themes: [light, dark]
patched: 2
deferred: 1
---
# design-pass — bai-nhan-tru-bai-chi-anh

Bản thật: dev :3465 của worktree dãy P4, nối DB thử `oneinvest_p4_df4` (chép DB máy thu 09/11) đã làm tươi bằng bộ chạy
mới (`refresh-data-flow.mjs`). Chụp bằng ego-browser theo khung phần tử (không có thanh bên).

## Ma trận capture

Chụp lại 09/11 sau khi Mạnh chốt Hỏi-2 ở Cổng Phạm vi (Yêu cầu là đầu ra ngang tin rao, «Đọc được» = tin rao + Yêu cầu).

| state | breakpoint | theme | file |
|---|---|---|---|
| ST-nhanh-day-du (chọn S03; cột «Đọc được» 58.769 · 68,1%) | desktop-1280 | light | evidence/design-pass/sankey-s03--desktop-1280--light.png |
| readout «Đọc thành tin rao» (Tỉ lệ bước 54,9%) | desktop-1280 | light | evidence/design-pass/readout-doc-thanh-tin--desktop-1280--light.png |
| readout «Đọc thành Yêu cầu» (Tỉ lệ bước 13,2%) | desktop-1280 | light | evidence/design-pass/readout-doc-thanh-yeu-cau--desktop-1280--light.png |
| luoi-chat-luong (S03 «Đọc được» 58.769 · 68%) | desktop-1280 | light | evidence/design-pass/chat-luong--desktop-1280--light.png |
| chang-theo-ngay (ô «Đọc được» 134.408 · 80,9% bài cần đọc) | desktop-1280 | light | evidence/design-pass/chang-theo-ngay--desktop-1280--light.png |
| ST-nhanh-day-du (chọn S03) | desktop-1280 | dark | evidence/design-pass/sankey-s03--desktop-1280--dark.png |
| ST-nhanh-day-du (chọn S03) | mobile-375 | dark | evidence/design-pass/sankey-s03--mobile-375--dark.png |
| ST-chi-s06 | desktop-1280 | light | evidence/design-pass/sankey-chi-s06--desktop-1280--light.png |

## Cảnh ngữ-cảnh

- Không cần: `context: host-embedded` — vật chụp trên route thật trong vỏ Ops.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Nút «Đọc thành Yêu cầu» (chặng «Yêu cầu», trước là «Rẽ nhánh») tô `chart-2` thì ở chế độ tối trùng tông xanh lá của «Gắn căn» — đổi sang
  cyan có cặp `dark:` (`bg-cyan-500 dark:bg-cyan-400`, `var(--color-cyan-500)`); ảnh tối 1280 cho thấy tách rõ với Gắn căn,
  Định vị, Gom cụm và màu rơi.
- Sau Hỏi-2: nút giữa vốn không ghi tên cạnh thanh, nên «Đọc thành tin rao» không có nhãn bên cạnh «Đọc thành Yêu cầu» —
  thêm cờ `labeled` cho nút giữa, hai đầu ra cùng ghi tên và số; chú thích cột «Đọc được» ghi tổng hai đầu ra.

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Ở 375 px Sankey cuộn ngang trong khung (có từ DF0, trang không cuộn ngang); DF6 thêm cột «Bài cần đọc» nên phần cuộn
  dài thêm một cột. Đề xuất: giữ (khung Sankey nhiều cột vốn dành cho máy tính, thẻ việc ghi thiết bị «máy tính»).
