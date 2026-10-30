---
schema_version: 1
slug: bang-yeu-cau
feature: Bảng Yêu cầu bên mua (cần mua · cần thuê) đối xứng listing, transform ghi từ bài có phát biểu ý định = Yêu cầu, nạp lại không nhân dòng
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T07:50:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Kéo mục chờ SH12 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`, «Tin «tìm mua / tìm thuê» thành tín hiệu cầu»,
mở lại khi «Mạnh quyết Q8(b)») lên thành hàng T3 của dãy P1, đứng sau PL5. SH12 thành hàng ở lượt cắt kế; vòng này
không ghi tệp lộ trình.

Người vận hành (`/ops`) và các hàng đo cầu sau (do-cau-tu-yeu-cau) cần một chỗ lưu nhu cầu bên mua: hôm nay bài «khách
tìm thuê 2pn…», «cần mua nhà…» chỉ nằm ở raw + stg và — sau PL5 — một phát biểu `listing_intent = inquiry` theo bài; không
có bảng nào giữ tiêu chí của nhu cầu (khu vực, loại hình, số PN, ngân sách) để đếm hay ghép với listing.

Cổng Đáng: build, Mạnh duyệt 30/10 ~07:50Z bằng câu «nên mở luôn bảng Inquiry» (luật đợt dot0-cam-mau, mục
«bang-yeu-cau»; Mạnh đổi ý sau «Mở hàng đo trước» — do-cau-tu-yeu-cau đứng sau và đọc từ bảng này); giám sát giao P1 30/10.
Phạm vi giám sát chép: bảng Yêu cầu bên mua đối xứng listing theo CONTEXT «Yêu cầu» (kind cùng bộ mã, property_type cùng
sổ, giá là khoảng ngân sách, tiêu chí khu vực/loại hình/số PN/ngân sách, không gắn căn); RESO-first (SavedSearch gần nhất,
extension khai đủ ở mappings.yaml); transform ghi từ bài có phát biểu ý định = Yêu cầu; nạp lại không nhân dòng; raw bất
biến; ghép với listing để hàng sau; migration xin số liên làn (kế: 058); sửa câu CONTEXT «bảng lưu yêu cầu… là tính năng
sau».

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] mỗi bài S03 có phát biểu `listing_intent = inquiry` đã thành đúng một Yêu cầu chưa,
  và nạp lại có giữ nguyên số Yêu cầu không?
- Kết quả nào là SỐNG: [đề xuất] trên bản chép dữ liệu thật (DB thử) với điểm Kev: mỗi bài có phát biểu inquiry sống (đã
  gạt bài thử) nằm trong đúng một Yêu cầu sống — một Yêu cầu là một nhóm đăng lại theo Hỏi-2; nạp lại lần hai thêm 0, nghỉ
  0; tiêu chí (khu vực, loại hình, số PN, ngân sách) đọc được ở bài có viết — tỉ lệ in trên số bài có dấu hiệu chữ.
- Kết quả nào là CHẾT: [đề xuất] số Yêu cầu lệch số bài inquiry, hoặc nạp lại nhân dòng, khi hết timebox.
- Timebox: một vòng T3.
