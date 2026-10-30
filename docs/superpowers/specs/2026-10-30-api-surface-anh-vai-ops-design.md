# Thiết kế: sổ bề mặt API khai đúng quyền /api/zalo-media sau PL3 (api-surface-anh-vai-ops)

Hồ sơ: `_acceptance/api-surface-anh-vai-ops/` · hạng T2 · dãy U1 · nguồn: mục Ngoài-2 của PL3 (the-duyet-du-can-cu),
Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 30/10 (`_acceptance/the-duyet-du-can-cu/decisions.jsonl`
`d-20261030T071529Z-27`).

## Vấn đề

PL3 mở chế độ `?snapshot=` của `/api/zalo-media` cho vai Vận hành (`xemNoiDungTin` trong `serveZaloMedia`), còn `?path=`
(staging OpenClaw) vẫn chỉ admin. Sổ bề mặt API (`app/src/lib/api-surface.ts`) vẫn khai route là `admin`, và docstring
route vẫn ghi «chỉ admin». Luật đầu tệp sổ: «Sổ phải RỘNG BẰNG HOẶC HƠN mã: mã không bao giờ cho một người gọi mà sổ
không cho (mã chặt hơn sổ thì được, ghi ở `note`)». Hôm nay mã cho vai Vận hành mà sổ không cho — sổ nói dối. Bộ kiểm
`scripts/check-api-surface.mjs` không bắt vì chế độ `admin` chỉ đòi có `isAdmin(` trong bao đóng import (nhánh `?path=`
vẫn có).

## Cách làm

1. **Sổ:** dòng `zalo-media` đổi sang `ops-session` — chế độ hẹp nhất trong năm chế độ mà vẫn rộng bằng hoặc hơn mã
   (`ops` có nhánh bearer, mã không có; `admin` hẹp hơn mã). `note` ghi phần mã chặt hơn sổ: `?snapshot=` vai Vận hành
   trở lên (`xemNoiDungTin`), `?path=` chỉ admin, vai Người xem nhận 404.
2. **Route:** chế độ `ops-session` của bộ kiểm đòi route gọi `canAccessOps(`. Route đọc phiên một lần, chặn
   `!canAccessOps(user)` bằng 404 rồi chuyển phiên cho lõi `serveZaloMedia(req, user)`. Hành vi không đổi: mọi người
   bị cổng mới chặn (khách, user) vốn đã bị `xemNoiDungTin` chặn bằng 404. Docstring route nói đúng quyền.
3. **Bộ kiểm cổng tĩnh** (`check-portal-compliance.mjs` §6): biểu thức nhận route «chỉ chuyển phiên cho lõi» đổi theo
   khuôn mới (đọc phiên một lần, `serveZaloMedia(req, user)`), vẫn cấm đọc tệp trong route; chiều đỏ giữ.
4. **Bộ đột biến** (`check-api-surface.mjs mutation`): M13 («route admin mất isAdmin») và M15 («route admin thêm nhánh
   bearer») đang dùng zalo-media làm mẫu route admin không qua `kiemQuyen` — zalo-media thôi là route admin, nên hai ca
   đổi sang route admin dựng giả (như M12/M16 dựng route ops-session giả). Thêm M20: zalo-media mất `canAccessOps` →
   «chế độ ops-session mà mã thiếu canAccessOps».

## Phương án đã loại

- **Giữ `admin`, chỉ sửa note/docstring:** trái luật đầu tệp sổ — sổ hẹp hơn mã là đúng lỗi Ngoài-2.
- **Thêm chế độ thứ sáu («nội dung tin, vai Vận hành, không bearer»):** đúng khít hơn nhưng nở từ vựng của sổ, bộ kiểm,
  `mcp-tools.json` và bảng quyền cho một route; luật sổ đã cho phép sổ rộng hơn mã khi ghi ở `note`.
- **Gọi `getSessionUser()` hai lần trong route** (giữ nguyên chuỗi §6 cũ): thêm một lần đọc phiên mỗi ảnh, chỉ để
  giữ một biểu thức kiểm.

## Đặc tả UX

Không có giao diện: vòng chỉ đổi sổ khai quyền, một cổng phía máy chủ không đổi hành vi, và hai bộ kiểm tĩnh.

## Ngoài phạm vi

- Đổi quyền thật của `/api/zalo-media` (ai xem được ảnh nào) — giữ nguyên quyết định PL3.
- Các route khác của sổ.
