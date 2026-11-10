# Gỡ hai phép đo đỏ sẵn: KDM-AC-3 và SL1-AC-5 (thiết kế)

Hàng `do-san-sl1-kdm` (dãy P3, T2, không mã lộ trình — giám sát giao 09/11, chuyển P3 10/11 19:27Z, uu_tien -6). Vùng sửa:
`scripts/kiem-tin-rao-gan-khu-vuc.mjs`, `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs` (itest `s03-len-cong` tách ra, §2.2).

## 1. Vấn đề (đo 10/11)

- `node --test scripts/*.test.mjs` (`executors.test.scripts`, eval hồi quy của nhiều hồ sơ — gần nhất E8 của
  `s4-suite-theo-vung` vòng 1 và 2) đỏ ở ca KDM-AC-3 của `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`; main đỏ cùng ca.
  Lý do đo được: `kiem-tin-rao-gan-khu-vuc.mjs` (chỉ đọc) in `S06: 90 tin trỏ khu vực không hợp lệ`; cả 90 tin trỏ xã
  `meta.source='dvhc'` mang `admin_code` (87 TP.HCM, 3 Đà Nẵng). PX1 (migration 084, `pipeline/CLAUDE.md` «Khớp tên khu vực
  (PX1)») cho bên ghi khớp tên vào «phường OSM hoặc xã danh bạ (`admin_code`, 084)» qua `khuVucKhopTen` của
  `pipeline/lib/osm.mjs`; thước vẫn coi hợp lệ chỉ là `phuongHopLe` (phường OSM). Thước lệch bên ghi, không phải dữ liệu hỏng.
- Hai ca SL1-AC-5 của `pipeline/scripts/s03-len-cong.itest.mjs` đỏ trên DB thử (lệnh chấm `dbs_s03_len_cong` đang bỏ qua
  chúng bằng `--test-skip-pattern`):
  - «áp 069 không đổi ô nào của tin hiện có»: phân xử lại mọi tin bằng hàm 061 rồi 069 làm đổi 2.225 tin (cột
    `property_type` + `field_provenance`). Đó là các tin có phát biểu `property_type` bậc `inferred` (DB hôm nay: 37.977 phát
    biểu inferred, sinh SAU 069 bởi phát biểu nhóm SL1 và đọc gộp PL30) — 069 cho chính loại phát biểu này vào cột. Câu đã
    ký nói về tin LÚC 069 ra đời, khi chưa có phát biểu loại hình suy.
  - «hai thứ tự với 068»: phát lại bản sao 067 lỗi `cannot change name of view column "seller_phone_inferred" to
    "unit_facing"` — 067 chạy `CREATE OR REPLACE VIEW sale_offers AS SELECT *`, còn migration 070 đã thêm cột tính
    `seller_phone_inferred` vào view.

## 2. Cách làm

**(1) KDM — thước dùng vị từ của bên ghi.** Trong `kiem-tin-rao-gan-khu-vuc.mjs`, cột `hop_le` của `chup` và mọi chỗ «tin
trỏ khu vực hợp lệ» dùng `khuVucKhopTen("a.", coMa)` với `coMa = await coDanhBa(c)` (cùng hàm, cùng cờ bên ghi đọc). Chưa
áp 084 → `khuVucKhopTen` trả `phuongHopLe` như cũ. Thước không đặt luật riêng chặt hơn bên ghi: xã có mã mang `meta.lac` theo đúng `khuVucKhopTen` (ô thứ ba của ca test so thẳng với câu SQL của bên ghi). Không đổi: tin mồi vẫn chọn trong phường OSM (`phuongHopLe`), khu vực
mồi lạc mang `meta.lac`, khu vực mồi không-OSM không có `admin_code` — nên cả hai loại mồi vẫn là không hợp lệ và ba chiều
của KDM-AC-3 giữ nghĩa. Test thêm một ca: trong một giao dịch ROLLBACK trên DB local, một tin trỏ xã có `admin_code` mà không
phải phường OSM được tính hợp lệ, xã không mã không OSM thì không; bản thước dùng `phuongHopLe` đỏ ở ca đầu.

**(2) SL1 — tách hồ sơ riêng, chờ Mạnh.** Hai ca SL1-AC-5 chỉ xanh lại được nếu đo trên thế giới lúc 069 ra đời (gỡ
phát biểu loại hình suy sinh sau 069; view `sale_offers` trước 070). Đó là đọc lại câu «phân xử lại mọi tin hiện có không đổi
ô nào» của hồ sơ đã ký `s03-len-cong` — việc của Mạnh, không phải máy (phản biện P0). Hai ca không nằm trong
`scripts/*.test.mjs`, nên tách ra không làm chậm việc gỡ E8 cho các hàng khác. Câu hỏi gửi giám sát kèm số đo: 2.225 tin
đổi `property_type` vì 37.977 phát biểu inferred; 067 phát lại vỡ ở cột `seller_phone_inferred` của 070.

**(3) Không ghi DB dùng chung.** Thước và test của nó chỉ đọc hoặc ghi trong `BEGIN … ROLLBACK`; probe quét cả hai tệp.

## 3. Ngoài vòng

- Không sửa dữ liệu 90 tin, không sửa transform hay `reassign-areas` (bên ghi đã đúng theo PX1).
- Không đổi `executors.test.*` của hồ sơ đã ký (`dbs_s03_len_cong` vẫn khai skip — gỡ skip là việc của hồ sơ kia khi ghim lại).
- Không gỡ KDM-AC-3 khỏi `scripts/ci-bo-qua.json` (CI không có dữ liệu stg thật).

## Đặc tả UX

Không chạm giao diện (dòng sổ `bỏ đặc-tả-UX`).
