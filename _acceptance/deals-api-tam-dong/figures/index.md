# Hình tại điểm quyết định — deals-api-tam-dong (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Luật cổng: 401 thay vì 200 rỗng · phiên ops cũng qua · hàm cổng nhận getUser (3 dòng sổ S1 đầu) | 2 nhánh rẽ (bearer đúng? → phiên ops?) + 3 bước nối tiếp | `cong-deals.html` / `.png` |
| Không gom 5 route ops (descope) | 0 nhánh, 1 bước | dưới ngưỡng: 0 nhánh · 1 bước |
| Không cờ env mở lại (descope) | 0 nhánh, 1 bước | dưới ngưỡng: 0 nhánh · 1 bước |
| Bỏ đặc-tả-UX (descope) | 0 nhánh, 1 bước | dưới ngưỡng: 0 nhánh · 1 bước |
| Hỏi-1: merge → prod đóng API ngay | 1 nhánh rẽ (merge ngay / giữ PR) | dưới ngưỡng: 1 nhánh · 1 bước |

## Đề bài `cong-deals`

- Loại hình: flowchart (luồng quyết định của một request).
- Nút: `GET /api/v1/deals` → «Bearer = OPS_API_TOKEN (token máy chủ không rỗng)?» — có → «truy vấn sale_offers → 200 {data, meta}»;
  không → «Phiên còn hạn và role ops/admin hoặc email trong OPS_EMAILS?» — có → cùng nút 200; không → «401 {"error":"unauthorized"} — không chạm sale_offers».
- Nhãn chữ: tiếng Việt như trên; ghi chú nhỏ ở nhánh bearer đúng «không đọc phiên»; ở nút 401 «khách · bearer sai · token máy chủ trống · role user · phiên hết hạn».
- AC liên quan: AC-1 (401 trước truy vấn), AC-2 (bearer đúng, không đọc phiên), AC-3 (bearer sai/token trống), AC-4 (ma trận phiên).
