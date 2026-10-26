# Bản phạm vi — phân loại + enrich, lát Ocean Park 1 (23/10)

> Nguồn: `docs/architecture/classification-enrich-review.md` §0.2–§0.4 và §5 (review kiến trúc phân loại, Mạnh duyệt
> FRAMING + thang bậc + F3/F6 ngày 23/10). Chỉ mã việc PHÁT TRIỂN; việc vận hành (dọn tồn đọng F6, gắn nhãn, chốt
> M1–M4) liệt ở «Ra khỏi kho» của PR cắt lượt. Mã giữ theo bản review; `SN` là mã mới cho sổ nhóm (§0.3 F1); hậu tố a/b tách một mã review thành hai kết quả.

<!-- <<<PHAM-VI-MA -->
```
dot: phan-loai-2310
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6

- `L19a` — importer bỏ qua snapshot thử, không ghi vào stg_*
- `L19b` — bảng canonical không còn tin sinh từ dữ liệu thử; transform từ chối post thử
- `C0.2` — thẻ duyệt bỏ «AI tự tin %» và gợi ý mặc định; hiện căn cứ mọi trường, ảnh tin, toàn văn tin
- `C0.3` — quyết định duyệt ghi audit trong cùng giao dịch, kèm lý do
- `Z0.3` — watchdog cảnh báo khi phân bố điểm Kev trôi
- `Z1` — hook Zalo đẩy mọi tin kèm meta.kev; DATA-CONTRACT schemaVersion 3
- `C1.1` — importer nhận meta.kev; transform ghi phát biểu listing_intent thay cho bỏ tin
- `C1.2` — một sổ từ vựng (listing_intent, kind, property_type, offer_status, mã căn, price_basis, giá khoảng) sinh bảng ref, hằng, enum prompt, nhãn UI
- `C1.3` — màn gắn nhãn mù, tập dev/test, 20% gắn trùng đo đồng thuận
- `C1.4` — lệnh eval:classify chấm theo cận dưới Wilson, số nền lên /ops/quality
- `Z1.2` — thu danh mục toà · trục · mã căn của Vinhomes Ocean Park 1
- `C1.5` — nạp danh mục vào asset_nodes thêm cấp trục và căn, mỗi dòng mang bậc nguồn
- `C1.6` — bộ đọc mã căn, toà, dự án, giá khoảng, price_basis ra phát biểu kèm trích dẫn
- `SN` — một sổ nhóm cho mọi nguồn, mỗi nhóm khai dự án nhóm chuyên
- `C2.1a` — khoá tin bền, retired_at thay DELETE, mọi FK tới sale_offers/listings là RESTRICT
- `C2.1b` — bảng phát biểu append-only, bộ phân xử ba lớp, provenance
- `C2.2` — parser ghi phát biểu có rule_id; gỡ đóng băng ENRICH_COLS; Chợ Tốt duy trì đường, WC, tầng
- `C2.3` — enrichment_proposals thành phát biểu; quyết định người là phát biểu lớp sự thật; bậc B0–B5 tính được
- `C2.4` — E1 viết lại theo lớp (tên nhóm là suy luận); E2 chạy mù, trích dẫn được code kiểm
- `C2.5` — tự áp chỉ ô đạt ngưỡng F3; dưới ngưỡng hiện kèm nhãn suy ra
- `C2.6` — đường xử lý theo từng tin cho P1, độ tươi p50 ≤ 10 phút
- `C2.7` — ghép tin căn hộ vào dòng danh mục ở mức trục hoặc căn
- `C2.8` — observed_at cho mọi phát biểu, offer_status, lịch sử giá theo căn
- `C3.1` — thẻ duyệt v2: phát biểu theo lớp, đoạn trích tô trong toàn văn, bất đồng mọi cặp, quyết định thành nhãn
- `C3.2a` — resolve: stable_key bỏ giá và loại, đọc must_link/cannot_link, đưa P1 vào căn
- `C3.2b` — judge-entity: ngưỡng là code, LLM chỉ giải thích, lưu model/trace; ứng viên sinh thẻ ghép căn
- `C3.3` — thước phường × loại cho «Căn giá tốt», tin chưa rõ loại gắn nhãn
- `C3.4` — sửa parser S03 theo số đo (phường HCM, area_basis, chữ «bán»)
- `C3.5` — cổng Invest hiện độ chắc và bậc của từng căn
- `Z3.1` — gộp tin chỉ có ảnh vào tin chữ liền trước cùng người gửi, ở transform (ZCode đề xuất 23/10: raw giữ đúng event)
- `Z3.2` — chỉnh lại Kev trên tập nhãn G0
- `CM.1` — sổ cuộc gọi AI và trang chi phí trên /ops
- `CM.2` — bộ đánh giá nhiều model trên cùng tập nhãn ra bảng chọn model theo ô
- `CM.3` — nối AI Gateway: hai khoá, ngân sách, dự phòng về local, lọc tầng A khỏi prompt
- `CM.4` — thước đo chi phí để đưa một căn lên bậc
- `Q7` — property_subtype theo RESO PropertySubType + extension VN
- `M4` — trợ lý nhà đầu tư tính tiền riêng, đo theo người dùng, ADR SPL cho hồ sơ nhà đầu tư
```
<!-- PHAM-VI-MA>>> -->
