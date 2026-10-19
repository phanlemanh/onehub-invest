# Audit MCP/API chính thức AirDNA (E2 Task A2)

Ngày: 2026-10-20 · Nguồn: https://mcp.airdna.co/docs (WebFetch, trích nguyên văn)

## Xác thực

- OAuth qua tài khoản AirDNA; server `https://mcp.airdna.co`; Client ID công
  khai `478a2ed7-0d70-4feb-a340-d8c96dcd4c2b`, không cần secret.
- Quyền tool theo entitlement components: `basic_research`,
  `standard_research`, `advanced_research`, `rms_*`, `for_sale`… Tool thiếu
  quyền **bị ẩn** (không báo lỗi). Timeseries `period_capped_by` theo plan,
  max 200 điểm/requests.

## Bảng go/no-go từng lớp dữ liệu E2

| Lớp cần | Tool MCP | Trạng thái | Quyết định |
|---|---|---|---|
| Vũ trụ listing theo market | `get_str_listing_table` (cần `advanced_research`) | **"listed but not callable yet"** | **RE (Track A)** — MCP khi live |
| Chi tiết 1 listing bất kỳ | `get_listing_detail` | not callable yet | RE |
| Lịch sử booking LTM listing | `get_listing_history` | not callable yet | RE |
| Cohort so sánh listing | `compare_str_listings`, `get_str_listing_metrics/timeseries` | not callable yet | RE |
| Market/submarket research + timeseries | `rank_markets`, `get_market_metrics/timeseries`… | not callable yet | RE (explorer API đã capture E1; mở rộng period) |
| For-sale | `get_for_sale_listings/metrics` | **LIVE** (mọi tài khoản) | MCP khi cần (lớp G4 sau) |
| Listing của chính mình (Adapt) | `list_my_listings` v.v. | live (Adapt) | không áp dụng |

## Kết luận

1. **Hôm nay MCP không phục vụ được E2** — toàn bộ tool nghiên cứu listing +
   market đang "coming soon". Đường thực thi = RE explorer API (mở rộng
   collector `airdna-research`), đúng kịch bản B của ADR-0009.
2. **Kết nối MCP sớm khi các tool live** (OAuth không secret) — khi đó chuyển
   dần lớp tương ứng sang MCP, RE rút về phần MCP thiếu. Đăng ký theo dõi
   changelog.
3. Giới hạn timeseries 200 điểm → lịch sử >200 tháng (không cần) nhưng lưu ý
   khi sync listing timeseries sau này.

Evidence: WebFetch cache nội dung docs (2026-10-20). Không có trang giá.
