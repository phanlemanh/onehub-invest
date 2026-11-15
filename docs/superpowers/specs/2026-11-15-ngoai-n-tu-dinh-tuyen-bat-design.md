# Bật máy tự xếp mục ngoài hợp đồng loại «giới hạn đã biết» — thiết kế

Ngày 15/11/2026 · hồ sơ `_acceptance/ngoai-n-tu-dinh-tuyen-bat/` · hạng T2 · dãy P2, đợt dot0-cam-mau.

## Việc và căn cứ

Mạnh duyệt 15/11 («Theo khuyến nghị», điểm D): ở Cổng Bằng chứng, mục ngoài hợp đồng mà máy đề xuất «ghi giới hạn
đã biết» hoặc «chấp nhận, không sửa» thì máy tự xếp. Mạnh chỉ quyết mục đòi hợp đồng mới hoặc đổi phạm vi.

Kit 2.37.0 đã có sẵn bộ ghi `scripts/dinh-tuyen-may.cjs` (thiết kế của kit:
`docs/superpowers/specs/2026-10-11-ngoai-n-tu-dinh-tuyen-design.md`). Bộ ghi tắt mặc định, bật theo kho bằng khoá
`feature_loop.ngoai_n_tu_dinh_tuyen: true` trong `_acceptance/config.yaml`. Việc của hồ sơ này chỉ là bật khoá đó.

Điều kiện mà bộ ghi tự giữ, kho không phải làm gì thêm:
- hồ sơ phải là T2 · verdict PASS · 0 UNCERTAIN · không bypass · phân loại phạm vi chạy trọn;
- mục chỉ được xếp khi chính máy đề xuất `known-limits` hoặc `wont-fix`;
- mục `new-contract`, hồ sơ T3, hồ sơ có UNCERTAIN vẫn về Mạnh;
- mỗi dòng sổ máy mang lệnh đảo (`dao`) — Mạnh đảo một mục bằng lệnh ký Cổng 2.

## Điều kiện kho đã đủ

Bộ đọc phía kho — lưới trước-merge (`scripts/pre-merge-check.sh`), vị từ làn V (`scripts/khong-can-nguoi.mjs`), và hai
thư viện (`lib/out-of-contract.cjs`, `lib/evidence-core.cjs`) — đang khớp byte với kit 2.37.0. CI không phải đổi.
Không sửa kit, không sửa bản chép.

## Đo trước khi bật (bộ đo `do-mo-phong.mjs` của hồ sơ)

Chín hồ sơ đã ký gần nhất, lấy nguyên từ git ở mốc `d2b4beaf`, đưa về trạng thái ngay trước Cổng Bằng chứng, chạy bộ ghi
của kit với config thật của cây:

| | Hồ sơ | Mục ngoài hợp đồng | Máy xếp | Còn về Mạnh |
|---|--:|--:|--:|--:|
| T2 | 6 | 38 | 28 (23 ghi Known limits · 5 chấp nhận, không sửa) | 10 (đều là mục máy đề xuất mở hợp đồng mới) |
| T3 | 3 | 17 | 0 | 17 |

So 28 dòng máy với lựa chọn thật của Mạnh: 24 khớp; 3 chỉ đổi qua lại giữa «ghi Known limits» và «chấp nhận, không
sửa» (cả hai đều ship, không sửa gì); **1 đảo thật** — `nap-s09` Ngoài-1, máy đề xuất ghi Known limits, Mạnh chọn mở
hợp đồng mới. Tỉ lệ đảo thật 3,6 %, dưới ngưỡng xem lại 10 % của thiết kế kit.

Sau khi máy xếp, hai hồ sơ (`nap-s09`, `sua-xa-bo-nut-ung-vien`) đủ xanh-sạch và đi làn V — không mời Mạnh ký Cổng 2.

## Giá

Một mục như `nap-s09` Ngoài-1 sẽ không còn hỏi Mạnh. Hồ sơ mà mọi mục đều được máy xếp sẽ đi làn V: không mời ký Cổng 2,
PR gộp theo cửa sổ của giám sát, nên Mạnh có thể không thấy mục ấy trước khi gộp. Dòng sổ máy giữ lệnh đảo (khoá `dao`);
đảo sau khi gộp là mở việc mới cho mục ấy.

## Phương án đã loại

- **Không bật, giữ như cũ:** Mạnh tiếp tục gõ 38/38 mục T2; trái lời duyệt 15/11.
- **Bật cả T3/UNCERTAIN:** bộ ghi của kit không cho; muốn thế phải sửa kit — ngoài phạm vi, cấm sửa kit từ kho này.
