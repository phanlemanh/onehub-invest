# ADR-0009: Ranh giới reverse engineer AirDNA cấp listing

Ngày: 2026-10-20 · Trạng thái: accepted · Liên quan: ADR-0005 (nguồn hạng nhất),
ADR-0007 (CCP), plan `docs/superpowers/plans/2026-10-20-e2-airdna-source.md`

## Bối cảnh

E2 cần (1) vũ trụ listing đầy đủ — discovery Airbnb theo search có thiên lệch
mẫu; (2) lịch sử booking LTM — không thể tự thu lại quá khứ. AirDNA có cả hai.
Đường chính thức (MCP/API) ưu tiên; RE listing-level là vùng xám ToS lớn nhất
từ trước tới nay — cần ranh giới tự đặt trước khi làm.

## Quyết định

1. **Chỉ RE trên tài khoản trả phí của chính user** (profile `.airdna-profile`
   một tài khoản), tab đã login — nhất quán chuỗi chấp nhận rủi ro cá nhân
   phi thương mại từ ADR-0003/0005.
2. **MCP/API chính thức trước**: lớp dữ liệu nào MCP expose + gói cho phép thì
   dùng MCP; RE chỉ cho phần thiếu (quyết định ghi trong
   `docs/research/airdna-mcp-audit.md`).
3. **Volume có trần**: khảo sát ≤ vài chục request; vận hành ≤500
   request/ngày, chia ngày cho universe lớn. CCP áp cho AirDNA như một
   platform: rate ≤0.3 req/s, cửa sổ giờ, một identity, fail = lùi + báo.
4. **Không phân phối lại dữ liệu thô** AirDNA ngoài hệ nội bộ; tầng serving
   chỉ hiển thị tổng hợp + badge nguồn S02 (đúng SPL/ADR-0007); không đưa
   payload thô lên cloud sync.
5. **Rủi ro chấp nhận**: tài khoản bị khóa = mất nguồn hiệu chuẩn + universe
   supplement; dữ liệu self (S01) không phụ thuộc. Suy giảm có kiểm soát nhờ
   view coalesce (ADR-0005).

## Hệ quả

- Collector RE AirDNA mới (`airdna-listings`, `airdna-history`) phải qua cổng
  CCP scheduler như mọi collector; audit log volume.
- Mọi kết luận khảo sát cite evidence REA trong `research-local/` (không commit).
