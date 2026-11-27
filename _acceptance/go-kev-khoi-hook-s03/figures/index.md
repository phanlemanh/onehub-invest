# Hình tại Cổng Phạm vi — go-kev-khoi-hook-s03

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1: chữ ký Cổng Bằng chứng phủ việc chép hook + khởi động lại gateway (dòng sổ «Áp lên máy thu…») | 6 bước nối tiếp (pull → kiểm nhịp watchdog → sao lưu → chép hook → khởi động lại gateway → kiểm sau) + 2 nhánh lùi | cần hình: `ap-may-thu.html` |
| Hỏi-2: watchdog chỉ chốt tĩnh + kiểm nhịp sau pull, không hộp cát chạy trọn (gap-probe P0 human-gate1) | 2 lối (giữ chốt tĩnh · dựng hộp cát) | dưới ngưỡng: 2 nhánh rẽ nhưng 1 bước — gộp vào hình trên ở nút «kiểm nhịp watchdog» |
| Phạm vi hẹp KEV1 / KEV2 | 1 bước | dưới ngưỡng: 1 |

## Đề bài hình `ap-may-thu`
- Loại: flowchart dọc (swimlane hai làn: «có hiệu lực khi pull» và «cần lời riêng Mạnh»).
- Nút: Gộp PR (GS) → Pull checkout chính → [watchdog K1 chạy ngay] Kiểm nhịp «ok … kev:off (K1)» ≤10′ → Sao lưu hook + mốc log → Chép HOOK.md + handler.js → Khởi động lại gateway (lời riêng Mạnh, ngoài 05:30–06:30 và 14:00–14:45) → kiem-sau.sh trong 30′ → ĐẠT.
- Nhánh: nhịp không thấy → Lùi watchdog (git revert + pull); kiem-sau KHÔNG ĐẠT → Lùi hook (chép .bak + khởi động lại).
- Nhãn chữ tiếng Việt; AC-9, AC-5.
