# Review findings: s4-suite-theo-vung (round 1)

## Trong hợp đồng

- **Vùng portal_static bỏ sót các script mà check-portal-compliance.mjs nạp (gồm cả cổng chặn lộ tầng A), và CI không chạy bù cho suite này**
  AC: AC-5
  file: `scripts/suite-neu-doi.mjs:40`
  severity: high
  detail: VUNG.portal_static = ["app/**", "scripts/check-portal-compliance.mjs"]. Nhưng check-portal-compliance.mjs nạp động ./check-ops-tier-a.mjs, ./check-deals-api.mjs, ./check-api-surface.mjs và ./check-mcp-tools.mjs. Các tệp này lại import tiếp ./lib/tier-a-source-names.mjs và ./lib/ops-visible-strings.mjs. Đã chạy thử: quyetDinh("portal_static", ["scripts/check-api-surface.mjs"]) trả về chay:false, và kết quả cũng là chay:false với scripts/check-ops-tier-a.mjs và scripts/lib/tier-a-source-names.mjs. Vậy một nhánh chỉ sửa cổng chặn lộ tầng A (luật bất biến số 6, SPL) hay sổ bề mặt API sẽ bỏ qua đúng suite đang kiểm những tệp đó. Chú thích đầu tệp và config.yaml dòng 29 viết «CI vẫn chạy đủ», contract.md dòng 98 coi «CI chạy đủ suite» là lưới hứng chỗ hở. Điều này sai với portal_static: không workflow nào trong .github/workflows gọi check-portal-compliance.mjs (git grep không ra). Một ca đỏ ở đây sẽ lọt qua cả lượt chấm, làn ghim lại lẫn CI.
  rationale: AC-5 đòi bảng vùng phủ mọi đường dẫn mà mã tham chiếu, đệ quy theo import ra ngoài module; vùng portal_static thiếu các script được nạp nên AC-5 không đạt.
  source: conventions

- **Test canh phủ AC-5 không thấy import cùng thư mục ("./x"), nên lỗ portal_static không bị bắt**
  AC: AC-5
  file: `scripts/suite-neu-doi.test.mjs:176`
  severity: medium
  detail: thamChieu chỉ giải các literal chứa "../" hoặc bắt đầu bằng một thư mục gốc (TOP). Các literal như "./check-deals-api.mjs" bị bỏ qua. Với app, pipeline và agent, import "./" vẫn nằm trong module nên không hại gì. Nhưng MODULE.portal_static chỉ có một tệp (scripts/check-portal-compliance.mjs), nên mọi `await import("./check-*.mjs")` ra khỏi module mà phép quét không thấy. Vì vậy AC-5 vẫn xanh dù bảng vùng thiếu, và lời hứa «bảng vùng đo bằng test canh phủ» không đúng với suite này. Cần giải cả literal "./" theo thư mục của tệp, hoặc lấy MODULE.portal_static gồm cả các tệp check-*.mjs và scripts/lib/** mà nó nạp.
  rationale: AC-5 hứa phép quét đệ quy theo cạnh import làm đỏ khi có tham chiếu ra ngoài vùng; phép quét bỏ sót import './' nên lời hứa này không thành.
  source: conventions

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **paths của E6 thiếu tệp probe mà lệnh E6 chạy (kho đang bật stale_scope: paths)**
  Người dùng thấy gì: Sửa tệp kiểm tra cấu hình thì hồ sơ nghiệm thu không bị đánh dấu cũ, nên có thể có bằng chứng lỗi thời mà không ai thấy.
  Căn cứ: Hậu quả nhẹ, chỉ ảnh hưởng độ tươi của hồ sơ nội bộ, không mất dữ liệu và sửa sau rất rẻ.
  file: `_acceptance/s4-suite-theo-vung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Chú thích s4v_keo ghi «ma trận 18 ô», còn test và eval là 24 ô**
  Người dùng thấy gì: Một dòng ghi chú trong cấu hình nói sai số ô kiểm tra, người đọc có thể hiểu nhầm nhưng không ảnh hưởng hoạt động.
  Căn cứ: Chỉ là chữ chú thích, không ảnh hưởng người dùng, sửa lúc nào cũng được.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Đổi tên/di chuyển tệp ra khỏi vùng làm suite bị bỏ qua sai (git diff --name-only bật dò rename nên chỉ in đường đích)**
  Người dùng thấy gì: Khi một nhánh chuyển tệp từ module này sang module khác, lượt chấm có thể bỏ qua bộ kiểm của module cũ và để lọt lỗi.
  Căn cứ: Lỗi lọt chỉ ở ca hiếm là di chuyển tệp, vẫn còn CI chạy đủ bộ kiểm hứng lại, và sửa rẻ.
  file: `scripts/suite-neu-doi.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bước chép .env nuốt lỗi git ls-files: không chép gì mà vẫn thoát 0**
  Người dùng thấy gì: Nếu việc chép tệp cấu hình thất bại âm thầm, môi trường chấm báo dựng xong nhưng sau đó các bộ kiểm đỏ khó hiểu.
  Căn cứ: Chỉ xảy ra khi cấu hình đường dẫn sai, tự lộ ra ở lượt chấm và chạy lại là xong, không mất dữ liệu.
  file: `scripts/dung-worktree-cham.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ca «chạy lại không đổi» chỉ đo việc stdout vắng chữ «chép/nối/sinh», mà chưa lần nào kiểm lần chạy đầu có in các chữ đó**
  Người dùng thấy gì: Phép kiểm chạy lại không đổi gì có thể xanh dù không chứng minh được điều đó, nên một thay đổi sau này có thể lọt.
  Căn cứ: Chỉ là công cụ nội bộ, hậu quả nhỏ, người dùng cuối không bị ảnh hưởng và gia cố test rẻ.
  file: `scripts/dung-worktree-cham.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình) trong probe: so hai kết quả grep có thể cùng rỗng nên vẫn xanh**
  Người dùng thấy gì: Phép kiểm cấu hình giữ nguyên có thể báo xanh mà thực ra không so gì cả nếu định dạng tệp đổi.
  Căn cứ: Rủi ro thấp vì còn kiểm khác che phần lớn, chỉ là công cụ nội bộ và sửa rẻ.
  file: `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (không round-trip với bên đọc): S4V-AC-6 đọc config bằng bộ tách regex tự viết, không dùng resolveConfigKey/resolveConfigList của kit, là bộ mà s4-args và repin-lane thật sự dùng**
  Người dùng thấy gì: Test cấu hình có thể xanh trong khi công cụ thật đọc cấu hình khác đi sau này, làm lượt chấm chạy sai lệnh.
  Căn cứ: Hiện tại đã kiểm tay là đúng, rủi ro chỉ khi cấu hình bị sửa lạ, lượt chấm lỗi sẽ thấy ngay và sửa rẻ.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/s4-suite-theo-vung/evals.yaml, _acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
