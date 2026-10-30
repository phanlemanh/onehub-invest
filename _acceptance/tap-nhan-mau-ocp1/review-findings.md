## Trong hợp đồng

- **Hình dạng 3 (assert «chuỗi có mặt» trong khi lời hứa là QUAN HỆ): khuon_ban chỉ kiểm khuôn 64 hex, không kiểm có bằng băm thư viện**
  file: `pipeline/lib/tap-mau.test.mjs:192`
  severity: medium
  AC: AC-7
  source: measurement
  detail: AC-7/E7 hứa dòng đầu JSONL khai «khuon_ban (64 hex = băm thư viện)», tức đây là quan hệ giữa khuon_ban và nội dung KHUON+BE. kiemDau chỉ có `assert.match(dau.khuon_ban, /^[0-9a-f]{64}$/)`. Một hằng 64 hex bất kỳ, hoặc băm không phụ thuộc thư viện, vẫn xanh. Không chỗ nào so với `khuonBan('ocp1')` hay với sha256(JSON.stringify({khuon: KHUON, be: BE})). Cũng không có đối chứng nào sửa thư viện khuôn rồi bắt khuon_ban phải đổi, dù đó chính là lý do có trường này (PL9 cần biết tập cũ không sinh lại được nữa). Lý do vào hợp đồng: AC-7 hứa dòng đầu khai băm của thư viện khuôn; phép kiểm chỉ xác nhận có chuỗi 64 hex nên không chứng minh được lời hứa đó.

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): quét «không import pg» bỏ sót cách nạp createRequire mà chính diff này đang dùng**
  file: `pipeline/lib/tap-mau.test.mjs:202`
  severity: low
  AC: AC-8
  source: measurement
  detail: AC-8/E8 tuyên là quét cả lớp «không import pg». NHAP_PG chỉ khớp ba dạng: `from "pg"`, `import("pg")`, `require("pg")`. Đối chứng đỏ (dòng 343) chỉ thử đúng một điểm `import pg from "pg"`. Không có ma trận viết trước gồm các cách nạp pg. Đã chạy thử: `createRequire(path.join(ROOT, "pipeline/package.json"))("pg")`, đúng dạng ở _acceptance/tap-nhan-mau-ocp1/probes/db.mjs:12 trong cùng diff, cho NHAP_PG.test = false. Dạng side-effect `import "pg"` cũng = false. Bộ sinh dùng các dạng đó để có đường ghi DB thì phép đo vẫn xanh. Lý do vào hợp đồng: AC-8 yêu cầu bộ sinh không import pg; phép quét bỏ sót các cách nạp khác nên không bảo đảm được điều AC hứa.

- **Hình dạng 4 (âm tính đứng một mình): vế «không có câu SQL ghi» (CAU_GHI) không có đối chứng đỏ nào**
  file: `pipeline/lib/tap-mau.test.mjs:203`
  severity: low
  AC: AC-8
  source: measurement
  detail: kiemNguonBoSinh có hai vế: NHAP_PG và CAU_GHI = /\b(?:INSERT|UPDATE|DELETE|COPY|TRUNCATE)\b/. Trong test TNM-AC-8 (dòng 340-343), đối chứng đỏ duy nhất chèn `import pg`, nên chỉ chứng được vế NHAP_PG có thể bắt. Vế CAU_GHI chỉ chạy âm tính trên nguồn thật, chưa lần nào được thấy bắt. Thêm nữa regex này phân biệt hoa thường: đã thử `c.query("insert into stg_zalo_posts values (1)")` và CAU_GHI.test = false. Vậy lời hứa «không có INSERT/UPDATE/DELETE/COPY/TRUNCATE» của AC-8 xanh mà không có bằng chứng phép đo có thể đỏ. Lý do vào hợp đồng: AC-8 nêu rõ bộ sinh không có câu SQL ghi; vế quét này chưa từng được chứng minh có thể bắt và bỏ sót chữ thường nên chưa bảo đảm được AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **db.mjs nhận diện «chạy trực tiếp» bằng path.resolve thay vì realpathSync: gọi qua đường symlink thì main() không chạy, probe thoát 0 mà không in gì**
  Người dùng thấy gì: Nếu ai đó chạy phép đo đếm dòng mẫu trong cơ sở dữ liệu qua đường tắt (symlink) thì nó im lặng thoát mà không đo gì, trông như đã đạt. Cách chạy chuẩn trong cấu hình không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra khi tự gọi bằng đường tắt hiếm dùng; không mất hay lộ dữ liệu, người chạy chỉ cần chạy lại bằng lệnh chuẩn, nên chi phí sửa vượt hậu quả.
  file: `_acceptance/tap-nhan-mau-ocp1/probes/db.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
