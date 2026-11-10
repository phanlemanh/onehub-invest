# Kế hoạch thi công — thuoc-song-song-dem-theo-ten-ca

Hợp đồng: `_acceptance/thuoc-song-song-dem-theo-ten-ca/contract.md` (duyệt 2026-11-10). Thiết kế:
`docs/superpowers/specs/2026-11-09-thuoc-song-song-dem-theo-ten-ca-design.md`. Các bước phụ thuộc nhau, làm tuần tự.

1. **`song-song.mjs lib` đếm theo tên** (AC-1..4). Khai `CA_LDR` (ba tên), lọc bằng `--test-name-pattern` neo
   `^(…)$` (thoát ký tự regex), ép `--test-reporter=spec`. Hàm `kiemTheoTen(out, tepTest)` rút tên `test("…")` của tệp,
   rút tên ca có dòng ✔/✖ trong đầu ra, trả lỗi `CA LDR VANG` / `CA NGOAI DANH SACH CHAY` / thiếu `ℹ pass 3`, `ℹ fail 0`.
   Ba đối chứng trên bản chép tạm `.dot-<pid>-*`: đổi tên ca 1; thêm ca «LDR ca thêm ngoài danh sách»; thêm ca
   «<tên ca 1> phụ». Ba đột biến cũ giữ nguyên, chạy cùng bộ lọc. Băm lib + test trước/sau (`TEP THAT BI DOI`). Dọn ở
   `finally`, rồi soát `pipeline/scripts`, `pipeline/lib` không còn `.dot-*` (`CON BAN CHEP TAM`).
2. **`pham-vi.sh` neo khoảng** (AC-5). `base=a86804f7…`, `head=2070958c…`; commit vắng → thoát 2
   `KHONG CO COMMIT NEO <sha>`; bỏ vế «điểm rẽ bằng HEAD»; diff `base..head`.
3. **Ba probe của hồ sơ này**: `neo.sh` (E6 — so tập `ok` với `git diff --name-only`, bản chép tạm đổi neo → thoát 2,
   is-ancestor → `NEO KHONG BEN`), `ghim.sh` (E7 — dòng repin cuối, `verified_commit`, lưới trước-gộp `--base`,
   đối chứng `GHIM LECH`), `pham-vi.sh` (E8 — danh sách AC-7, hồ sơ đã ký không đổi chữ, đối chứng sellers-chip).
4. Chạy thử `atss_lib`, `atss_pham_vi`, `ttc_neo`, `ttc_pham_vi`; commit; xin `ghim-lai`, chạy `repin-lane.mjs --slug
   app-test-chiu-song-song --write`; commit; chạy `ttc_ghim`.
5. Contract `implemented` → S4 (xin `s4`).
