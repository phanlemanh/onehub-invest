# Hình tại điểm quyết định — leak-gate-kiem-anon (Cổng Phạm vi, T3)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1: điều kiện merge — chạy --kiem-anon trên prod sau 037 hay không | 2 nhánh rẽ + chuỗi 4 bước → cần hình | `luong-gate.html` |
| Dòng máy quyết (kiểm hai chỗ, gồm authenticated, chừa 3 PostGIS, fail-closed, mô phỏng áp 037, tách runMain, giữ cỡ) | dưới ngưỡng: mỗi dòng 1 lựa chọn, 0 nhánh người | — |

## Đề bài: luong-gate

- Loại hình: luồng trái → phải, hai làn.
- Làn trên «một lượt sync»: catalog → **kiểm anon (trước khi gửi)** → đọc local → staging → tráo → **leak gate (sau tráo, gồm kiểm anon)** → xong. Hai ô kiểm tô nổi; từ mỗi ô một mũi tên đỏ xuống «SYNC FAIL [gate] … <role> đọc được public.<t> (…; gỡ: REVOKE …) · exit 1». Ghi chú dưới ô trước-khi-gửi: «chưa dòng nào rời máy».
- Một hộp nhỏ cạnh hai ô kiểm: «chừa: spatial_ref_sys · geometry_columns · geography_columns (thành viên extension postgis)».
- Làn dưới «đường tới merge»: Mạnh áp 037 lên prod → (Hỏi-1 rẽ) A — khuyên: Mạnh chạy `--kiem-anon` trên prod (chỉ đọc) → sạch → merge; B: merge ngay. Nhãn rủi ro ở nhánh B: «prod còn quan hệ lạ → mọi lượt sync đêm dừng đỏ».
- AC liên quan: AC-2, AC-7, AC-11 (và AC-1 cho hộp chừa).
