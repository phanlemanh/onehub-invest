# Hình tại điểm quyết định — auth-error-thu-lai-retry (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — chứng «Thử lại về server» bằng gì | hai nhánh rẽ (A jsdom qua ranh giới lỗi thật của Next · B smoke chỉnh tạm trên bản chạy) | `hoi-1-cach-chung.html` / `.png` |
| Ô auth-hop-chuan/E4 → AC-1 (superseded_by) + thứ tự ký → ghim lại → đẩy | dưới ngưỡng: 1 nhánh, máy đã quyết (mot-loi) | — |
| Sửa config.yaml thành YAML chuẩn | dưới ngưỡng: 1 nhánh, máy đã quyết (mot-loi) | — |

## Đề bài hình `hoi-1-cach-chung`

- Loại hình: cây quyết định hai nhánh (decision tree), nhánh A tô màu nhấn «máy khuyên».
- Nút gốc: «Bấm "Thử lại" trên trang lỗi đăng nhập/đăng ký — chứng rằng nó tải lại từ server bằng gì?» (AC-1).
- Nhánh A (máy khuyên): «jsdom + ranh giới lỗi THẬT của Next» → «bấm → Next gọi router.refresh() đúng 1 lần (đếm)» → «không đụng code sản phẩm · không frame cho người ký · giao diện không đổi».
- Nhánh B: «smoke trên bản chạy :3460» → «chỉnh tạm /login ném lỗi → bấm → thấy request RSC mới + ảnh trước/sau → khôi phục» → «có frame · thêm ~1 eval · rủi ro HMR, chỉnh tạm tệp (auth) lúc chấm».
- Chân hình: «Dòng lệnh duyệt điền sẵn A; muốn B thì trả "sửa: Hỏi-1 = B"».
