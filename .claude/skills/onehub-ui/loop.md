# Vòng làm việc: 8 bước, không bỏ bước nào

Áp dụng cho mọi lần thêm hay sửa một vùng UI trong `app/`. Bước nào lấy luật từ ReUI thì trỏ
về file ReUI, file này không chép lại.

1. **Kế hoạch 7 dòng** (`reui/SKILL.md`, mục "Before you write UI code"). Viết vào câu trả lời
   trước khi viết code. Bề mặt, archetype và họ khung lấy từ dòng của trang trong `routes.md`.
   Trang mới thì thêm dòng vào đó trước.
2. **Tra danh mục** `catalog.md`. Đã có bản chuyển thể cho đúng việc này thì dùng lại và nhảy
   tới bước 6. Loại UI nằm trong bảng "Một loại UI, một cách làm" thì dùng đúng cách đã ghi.
3. **Tìm bằng MCP.** *Trước khi chọn block*, khi chốt khuôn IA/bố cục (≥2 khuôn khả dĩ): tra
   Mobbin 3–6 màn cùng loại (`mcp__mobbin__search_screens`/`search_flows`, platform web), ghi
   `mobbin_url` làm căn cứ trong kế hoạch/design doc. Mobbin chỉ cho IA (không chép hình), block
   vẫn chọn từ ReUI (riêng bản đồ: `mapcn`, xem mục Bản đồ của `routes.md`). Không có Mobbin thì chọn từ danh
   sách archetype của `reui/rules/compose.md` và ghi lý do. Rồi: cả trang thì `compose_page`, một vùng thì `search` (gợi ý `type`/`component`,
   `surface: "frame"`). Đọc `whenNotToUse` của ứng viên (`get_block`/`get_example`).
   **Nhìn trước khi chọn:** có ≥2 ứng viên lệch nhau ≤15 điểm `score` thì gọi `get_thumbnail`
   cho từng cái rồi so bằng mắt, đừng chọn theo tên.
4. **Cài.** `get_install_command`, rồi chạy trong `app/`:
   `npx shadcn@latest add @reui/<tên> --yes`. Tên phải đúng như tool trả về. License key nằm
   trong `.env.local`, không commit.
5. **Đọc API thật.** Gọi `get_component([...componentsUsed])` một lần và `get_examples` cho
   cách ghép. Gặp tên nào chưa đọc thì chạy `validate_usage`. Prop, variant hay tên `@reui/`
   nào chưa thấy trong kết quả tool thì không viết.
6. **Chuyển thể** (`reui/rules/adapting.md`): chỉ đổi dữ liệu, chữ và prop; giữ cấu trúc và
   class. Số đi qua `lib/format.ts` (`copy-vi.md`). Màu số liệu lấy từ `data-color.md`. Mỗi
   vùng dữ liệu có đủ trống, tải và lỗi. Xong thì thêm dòng vào `catalog.md`.
7. **Kiểm máy.** Chạy `cd app && npx tsc --noEmit && npm run lint`, qua self-check C1–C4 (`reui/rules/quality.md`),
   `reui/rules/anti-patterns.md` và `get_audit_checklist`. Lỗi lint thì sửa, không disable
   (xem "Máy chặn" ở SKILL.md).
8. **Bước nhìn.** Mở Browser pane bằng `preview_start` tên `app` (`.claude/launch.json`, :3456).
   Chụp vùng vừa đổi ở **sáng**, **tối** (`resize_window` `colorScheme`) và **390px**
   (`resize_window` width 390). Không có thanh cuộn ngang trang. Xong thì trả viewport về
   `preset: "desktop"`. `/ops/**` cần đăng nhập: phiên nằm ở trình duyệt nào thì chụp ở đó.
   Không chụp được thì ghi "not visually verified" ở dòng 4 bên dưới.

## Hand-back: 5 dòng của ReUI

Kết thúc câu trả lời bằng đúng 5 dòng theo `reui/rules/quality.md`, mục **Hand-back**:

1. Installed: mỗi item kèm `previewUrl`.
2. Motion: từng phần tử có chuyển động và dòng tương ứng trong bảng motion, hoặc "none".
3. States: đã phủ, hoặc nêu cái còn thiếu.
4. Checks: C1–C4, ảnh chụp sáng/tối/390px, audit checklist, typecheck, lint. Mỗi mục ghi đã
   chạy, hoặc "not run" kèm lý do.
5. Deviations: luật nào bị phá hay chỗ kiểm nào còn sót, kèm file:line và lý do.
