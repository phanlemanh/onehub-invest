# s02-cua-api — kế hoạch (S2, T2)

Mạnh giao trực tiếp ngày 26/11: «Đồng ý nhanh mới và thử trước báo với claude code việc thử nghiệm này», rồi
«Đồng ý» (22:37) với chuỗi hồ sơ T2 → PR → gộp qua cổng Claude → build lại collector. Mã viết theo TDD (ca đỏ trước)
trên nhánh mới từ `origin/main`; hợp đồng và evals dựng lại từ các tình huống đo được — ghi ở sổ quyết định. Phép đo
đột biến chạy thử lúc viết đã lộ hai kẽ hở của bộ test và một chỗ mã nên chặt hơn; cả ba sửa trong phạm vi mười tiêu
chí, theo TDD.

| Việc | Tệp | Phục vụ | independent |
|---|---|---|---|
| 1. Đọc phiên trên đĩa theo định dạng LevelDB (nhật ký cắt mảnh, bảng nén tiền tố, giải nén snappy, mới nhất thắng) | tệp phiên S02 (xuất `docPhienTuProfile`) | AC-2 | — (đã làm) |
| 2. Tra đổi token hai lời; phân loại phản hồi; lỗi xác thực và lỗi bị chặn thành hai loại riêng | tệp phiên S02 | AC-3, AC-4 | — (đã làm) |
| 3. Bộ thu không còn trình duyệt; trình lấy token; `call()` dừng khi bị chặn, không nuốt lỗi bước làm mới; nhịp 0,2; lệnh `login` | tệp bộ thu S02 (xuất `docExpAppToken`) | AC-1, AC-4 → AC-6, AC-8, AC-9 | — (đã làm) |
| 4. Lệnh `login` của CLI, mỗi lệnh một nhánh đóng; hợp đồng `Collector` không đổi | `collector/src/cli.ts` | AC-9 | — (đã làm) |
| 5. Test đơn vị: kho localStorage và phản hồi HTTP dựng bằng số; lệnh `login` đen-trắng qua CLI thật với Chrome giả | `collector/src/test/s02-doc-phien.test.ts` · `s02-cua-api.test.ts` · `s02-bo-thu-cua-api.test.ts` | E12 | true |
| 6. Ba phép đo, mỗi phép có chiều đỏ trên bản đột biến hoặc tệp cấy | `probes/chay-test-dot-bien.mjs` · `probes/khong-trinh-duyet.sh` · `probes/vung.sh` | E1 → E11 | true |
| 7. Chỉ dẫn cho agent: lượt thu không cần trình duyệt, lệnh `login`, phiên có hạn, agent không đọc tay profile | `collector/CLAUDE.md` · `collector/AGENTS.md` | AC-9, AC-10 | true |

Verify mỗi việc: chạy chính phép đo đó cả hai chiều (đã chạy lúc viết: xanh, và mọi bản đột biến bị bắt). Không còn
mã nào phải viết.
