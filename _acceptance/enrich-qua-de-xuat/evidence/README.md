# Ảnh chụp thẻ duyệt agent_output — bổ sung trước Cổng Bằng chứng

Chụp ngày 2026-10-22 (sau S4 round 2) theo yêu cầu của chủ kho, NGOÀI lượt chấm máy
(ui-observed đã bỏ có tên ở Cổng Phạm vi — d-20261022T130932Z-6). Không phải kết quả của
eval nào; là bằng chứng nhìn bổ sung cho AC-9.

- Code: nhánh `feat/enrich-qua-de-xuat` @ `9f36941`, chạy `next dev` từ worktree
  `.claude/worktrees/enrich-qua-de-xuat` (cổng 3457), DB Postgres local :5433.
- Đăng nhập: tài khoản ops thử chỉ có trên DB local (`scripts/dev-ops-account.mjs`, PR #1).
- Thẻ thử: `review_queue` id 158, `item_id = enrich:demo-cong2` (không trỏ tin thật nào),
  evidence lấy từ đầu ra LLM thật (trace enrich-text 22/10, fixture #0). Đã xoá sau khi chụp.

| Khung | Thấy gì |
|---|---|
| `E10-step1-cho-duyet.png` | Thẻ «Cùng căn?» cũ không đổi (trên); thẻ thử: đoạn tin, bảng Loại BĐS · Phòng ngủ · Đường + AI tự tin 90%, ba nút Áp dụng / Bỏ / Để sau |
| `E10-step2-da-ap.png` | Sau bấm «Áp dụng»: thẻ chuyển xuống «Đã quyết (1)», nhãn «Đã áp», không còn nút |

Đối chiếu DB sau khi bấm: `review_queue` 158 → `approved` có `decided_by`/`decided_at`;
`ops_audit` có dòng `review:decide · agent_output · approved · reviewId 158`;
`enrichment_proposals` 0 dòng (thẻ thử không gắn đề xuất nên không ghi dữ liệu tin nào).
