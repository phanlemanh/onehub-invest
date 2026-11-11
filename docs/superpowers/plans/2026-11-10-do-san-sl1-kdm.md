# do-san-sl1-kdm — kế hoạch thi công

**Mục tiêu:** thước gán khu vực tin rao (`scripts/kiem-tin-rao-gan-khu-vuc.mjs`) dùng đúng vị từ `khuVucKhopTen(coDanhBa)` của
bên ghi, để KDM-AC-3 và `scripts/*.test.mjs` xanh lại; không ghi DB dùng chung.

**Thiết kế:** `docs/superpowers/specs/2026-11-10-do-san-sl1-kdm-design.md` · hợp đồng `_acceptance/do-san-sl1-kdm/contract.md`.

## Ràng buộc chung

- Không sửa dữ liệu, transform, `reassign-areas`, `pipeline/lib/osm.mjs`.
- Mọi câu ghi của thước và test nằm trong `BEGIN … ROLLBACK`.
- Không đổi `executors.test.*` đã có.

## Task 1 — thước dùng vị từ của bên ghi (independent: false)

Files: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`. Phục vụ E1, E3.

- Import `coDanhBa`, `khuVucKhopTen` từ `../pipeline/lib/osm.mjs`.
- Xuất `sqlHopLe(coMa)` = `khuVucKhopTen("a.", coMa)`; `chup(c, coMa)` dùng nó cho cột `hop_le`; `main` đọc `coMa = await
  coDanhBa(c)` một lần sau khi nối và truyền xuống mọi lần `chup`.
- Giữ nguyên chọn tin mồi bằng `phuongHopLe` và hai loại khu vực mồi.
- Verify: `node scripts/kiem-tin-rao-gan-khu-vuc.mjs` → S06 0 tin, PASS.

## Task 2 — ca KDM-PX1 ba ô, round-trip với bên ghi (independent: false)

Files: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`. Phục vụ E2, E3, E4.

- Ca `KDM-PX1`: nối DB local, `BEGIN`, chèn ba khu vực mồi dưới `vn-hcmc` (`vn-hcmc-zz-px1-ma-<pid>` có `admin_code` giả,
  `meta.source='dvhc'`; `…-khong-ma-<pid>` không mã, `meta.source='moi-khong-osm'`; `…-lac-<pid>` có `admin_code`, `meta`
  `{source:'dvhc', lac:true}`), ba tin `sale_offer_records` trỏ vào. Đọc `hop_le` của ba tin bằng `chup(c, coMa)` của thước và
  bằng `SELECT … WHERE ${khuVucKhopTen("a.", coMa)}` của bên ghi; assert bằng nhau từng ô, ô một `true`, ô hai `false`.
  Chiều đỏ: `chup` dựng với `phuongHopLe` cho ô một `false` ≠ bên ghi, assert ghim «KDM-PX1». `ROLLBACK` trong `finally`, rồi
  đếm khu vực id `vn-hcmc-zz-px1-%` = 0.
- Verify: `node --test --test-name-pattern=KDM-PX1 scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`; phá thử (thay `sqlHopLe` bằng
  `phuongHopLe`) → đỏ đúng thông điệp.

## Task 3 — hồi quy

Verify: `node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`, `bash _acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh`,
`node --test scripts/*.test.mjs` (/verify scripts).
