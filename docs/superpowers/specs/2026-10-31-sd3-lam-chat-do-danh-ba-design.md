# sd3-lam-chat-do-danh-ba — làm chặt phép đo danh bạ SĐT (Ngoài-14/15/17 của SD3)

Hồ sơ: `_acceptance/sd3-lam-chat-do-danh-ba/` · hàng P4 (giám sát duyệt P4-117, 31/10) · sau `sdt-luu-goc-e164` (PR #247).
Tri thức: `onehub-invest-tri-thuc:wiki/chu-de/nguoi-va-sdt.md` («đo trục SĐT mỗi đêm»; RESO: SĐT là bí danh mạnh nhất,
không phải khoá Người).

## Vấn đề

Cổng Bằng chứng SD3 để lại ba mục «mở hợp đồng mới» về độ chặt của phép đo:

- **Ngoài-14**: phép đo danh bạ E4 chỉ kiểm tập con — người cũ mang thêm số lạ, hay một số gắn hai người, vẫn xanh; số
  người có `sdt` và số người có `sdt_bam` chỉ được in, không so.
- **Ngoài-15**: phép kiểm tên E5 nới quan hệ — chấp nhận tên nằm ở BẤT KỲ người nào mang `sdt` hoặc `sdt_bam` của số ấy,
  kể cả bí danh đã nghỉ.
- **Ngoài-17**: phép quét che số trên `/ops/people` dùng ngưỡng 4+ chữ số (lời hứa 3+), đối chứng đỏ tự ném lỗi không đi
  qua bộ quét, vai admin lặp y hệt vai ops.

060 chưa áp lên máy thu (Mạnh duyệt riêng). Phép đo chặt có giá nhất ở hai chỗ: lượt kiểm trên DB thử ngay trước khi áp,
và kiểm hằng đêm sau khi áp.

## Thiết kế — ba phần

### A. Kiểm hằng đêm N6 «mỗi số một người» (Ngoài-14) — `pipeline/do-danh-ba-sdt.mjs`

Thêm kiểm thứ sáu vào bộ đo trục SĐT (SD5), theo nguồn S03, S05, chỉ trên bí danh `sdt` còn hiệu lực (số gốc E.164):

| Số | Nghĩa |
|---|---|
| `trung` | giá trị `sdt` thuộc từ hai người trở lên trong cùng nguồn |
| `thua` | giá trị `sdt` không có trên bản ghi tin nào của nguồn (kể cả tin đã nghỉ) — số lạ thừa |
| `thieu` | SĐT trên tin sống của nguồn mà không người nào mang bí danh `sdt` — người thiếu |
| `tong` | số giá trị `sdt` còn hiệu lực của nguồn |

Đạt ⟺ `trung = 0 ∧ thua = 0 ∧ thieu = 0`. Ghi `danh-ba-sdt:n6` một dòng mỗi nguồn vào `dq_check_results` (chỉ số đếm,
không SĐT). Trước khi áp 060, máy thu chưa có bí danh `sdt` nên `thieu` = mọi số trên tin → không đạt — đúng tín hiệu
«chưa áp 060». Nhãn tiếng Việt trên `/ops/quality` thêm vào `app/src/lib/dq-labels.ts`.

### B. Phép đo một lần trên DB thử trước khi áp 060 (Ngoài-14 phần chuyển, Ngoài-15) — probe của hồ sơ

`_acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs` trên DB thử chép máy thu (`db-thu-chac.sh` của SD3):

- **Đúng ảnh**: trước 060 dựng `party_key → {E.164 của số cũ}` từ bí danh `sdt_bam` (khoá băm) và số dạng 0… trên bản
  ghi tin; sau 060 + một lượt dựng danh bạ, `party_key → {giá trị sdt còn hiệu lực}`. Hai ánh xạ BẰNG nhau (cùng khoá, cùng
  tập); số người hai bên `assert.equal`; mỗi giá trị `sdt` thuộc đúng một người mỗi nguồn.
- **Tên đúng người**: với mỗi tên khác rỗng của bảng `sellers` cũ (chụp trước 060), MỌI người đang mang bí danh `sdt` của
  số ấy có bí danh `ten` còn hiệu lực bằng đúng tên ấy (so sau `btrim`), và có ít nhất một người như vậy.
- Đối chứng đỏ đi qua đúng hàm so: ánh xạ sau thêm một số lạ → «LECH ANH»; bản chép 060 chép tên sang người khác →
  «TEN SAI NGUOI»; nghỉ bí danh tên trong giao dịch → «TEN SAI NGUOI».

### C. Che số trên `/ops/people` với loader thật và ba vai thật (Ngoài-17) — test app

`app/tests/people-che-so-loader.test.tsx`: trong BEGIN…ROLLBACK trên DB local (nạp 060 trong giao dịch), dựng người có
bí danh `sdt`, gọi loader thật (`danhSachNguoi`, `motNguoi`) bằng client giao dịch, quyền xem từ `xemNoiDungTin` thật của
ba vai (`viewer`, `ops`, `admin`), dựng hàng bằng `hangNguoi`/`hienBiDanh`. Bộ quét `loSoGoc(o, so)`: ô nào chứa chuỗi
3+ chữ số liên tiếp của số gốc là lộ. Đối chứng đỏ đi qua CÙNG bộ quét: luật che đời trước (8 ký tự đầu) trên cùng hàng →
bộ quét bắt «LO SO GOC TREN PEOPLE». Vai admin và ops cho cùng quyền xem — test in điều đó ra, không gọi là ba vai khác.

## Ngoài phạm vi

- Gắn tên trên tin vào người theo SĐT trong bộ dựng danh bạ (hiện chỉ người theo tài khoản nhận bí danh `ten`; tên người
  bán đọc từ tin qua view `sellers`, Hỏi-3 SD3).
- Áp 060 lên máy thu hay Supabase; sửa `db/db-thu.sh` dùng chung.
- Gộp người theo SĐT với người theo tài khoản (Đợt 3).

## Đặc tả UX

Bỏ — hàng không đổi giao diện; nhãn mới trên `/ops/quality` theo khuôn nhãn có sẵn (entry descope).
