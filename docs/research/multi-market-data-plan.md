# Kế hoạch dữ liệu đa thị trường: Zalo (bán + thuê dài hạn) → Yield

Ngày: 2026-10-18 · Bổ sung cho airdna-integration-plan.md và ADR-0004
Mục tiêu: giá bán + giá thuê dài hạn theo thị trường (từ nhóm Zalo môi giới)
kết hợp dữ liệu Airbnb tự thu → **phân tích yield đầu tư** — One Invest trở
thành công cụ trả lời "mua ở đâu, cho thuê kiểu nào, lời bao nhiêu %".

## 1. Phân tích nguồn Zalo — khác biệt căn bản

| Khía cạnh | Airbnb (hiện tại) | Zalo groups (mới) |
|---|---|---|
| Dạng dữ liệu | JSON API có cấu trúc | **Văn bản tự do tiếng Việt** + ảnh |
| Nhịp | Pull theo lịch (snapshot) | Stream — poll theo checkpoint tin cuối |
| Vị trí | Có lat/lng | Mờ: "góc Mễ Trì", "mặt phố Xuân Thủy" → cần geocode |
| Chất lượng | Nguồn sự thật | Tin rao: repost nhiều lần, giá mặc cả, tin ảo |
| Cá nhân | Ít | SĐT môi giới — strip khi lên canonical |
| Trùng lặp | Xáo trộn phân trang | Cùng tin đăng lại nhiều nhóm/nhiều ngày |

Hệ quả kiến trúc: thu thập giống nhau (plugin + raw + manifest), nhưng thêm
**tầng enrichment** ở one-invest: parse → geocode → dedup → offers.

## 2. Kiến trúc bổ sung (không phá hiện có)

```
collector repo (không đổi core):
  collectors/zalo-groups.ts
    - Playwright system Chrome headful, session Zalo đã login (user join nhóm)
    - Poll các nhóm theo checkpoint timestamp; chỉ ĐỌC, rate chậm 1-2 lần/ngày
    - RawItem: kind="zalo-post", payload={text, images, author_hash, group,
      posted_at}; KHÔNG parse gì ở collector

one-invest:
  migration 008_zalo.sql:
    stg_zalo_posts(post_id PK, group_id, posted_at, author_hash, text, images jsonb,
                   snapshot_id FK, captured_at)
  transform-zalo.mjs — pipeline enrichment 5 bước:
    1) Làm sạch text (bỏ emoji dư, chuẩn hoá số)
    2) Parse quy tắc tiếng Việt:
       - loại tin: bán | thuê (từ khoá "bán"/"cho thuê"/"CTCH"/"full nội thất"…)
       - giá: "45tr/m2", "4.5 tỷ", "tổng 2.1tỷ", "15tr/tháng", "triệu/tháng"
       - diện tích: "45m2", "45m²", "DT 45m"
       - PN/PLC: "2PN 2WC", "studio"
       - vị trí: tên đường + phường/quận (match với 126 phường OSM + streets)
    3) Phân loại confidence (high = đủ giá+diện tích+vị trí match phường)
    4) dedup_key = hash(SĐT-hash, phường, giá, diện tích, loại) → gộp repost;
       first_seen/last_seen/count_repost
    5) Ghi sale_offers / rent_lt_offers (canonical, strip SĐT)
  500_asset_stats.sql:
    market_asset_stats(area_id, month,
      n_sale, median_sale_perm2, n_rent_lt, median_rent_lt,
      str_yield, lt_yield)          -- yield dùng market_metrics của ta
    TRUNCATE + rebuild mỗi lần chạy (như 300/400)
  UI:
    - Trang area: section "Bán & Thuê dài hạn" (median giá/m², giá thuê LT,
      số tin + "từ N tin, N nhóm, 30 ngày")
    - Trang market: card "Yield theo quận" — bảng [quận | giá bán/m² |
      thuê LT/tháng | STR revenue/tháng (ta) | yield STR % | yield LT %]
    - (Giai đoạn sau) Deal screener: tin bán có STR yield > ngưỡng
```

## 3. Trọng số giá trị (vì sao đáng làm)

1. **Yield là câu hỏi thật của nhà đầu tư** — Airbnb data của ta cho tử số,
   Zalo giá bán cho mẫu số. Không có giá bán thì chỉ là analytics; có giá
   bán là công cụ quyết định.
2. Đối xứng hiệu chuẩn: AirDNA `get_for_sale_metrics` (đã live trên MCP,
   MLS + projected STR yield) → chuẩn cho giá bán Zalo, như AirDNA LTM chuẩn
   cho STR tự thu.
3. Độ phủ VN-native: nguồn không ai tổng hợp — lợi thế khác biệt thật.

## 4. Kế hoạch thực thi

- Z0 (user): join các nhóm Zalo môi giới Hà Nội (10-20 nhóm), login session
  Chrome dành cho collector.
- Z1 (1 buổi): collector zalo-groups poll + checkpoint; chạy thử 1 tuần dữ
  liệu; stg_zalo_posts.
- Z2 (1-2 buổi): transform-zalo parser v1 (regex high-precision), đo coverage
  (% tin parse đủ giá+diện tích — mục tiêu ≥60% trước khi dùng); dedup;
  canonical offers.
- Z3: market_asset_stats + UI sections + yield card; chạy song song AirDNA
  integration (Track A) để có hiệu chuẩn cả 3 lớp (STR, LT, giá bán).
- Z4 (tương lai): LLM-assist parse các tin phức tạp; deal screener;
  HCMC nhân bản.

Định nghĩa "đạt" Z3: trang /vn/hanoi + các quận có yield STR & LT tính từ
dữ liệu thật (≥100 tin bán + ≥100 tin thuê LT đã dedup cho Hà Nội), nguồn
và độ tươi hiển thị rõ.

## 5. Rủi ro kỹ thuật & giảm nhẹ

- Parser miss nhiều format → đo coverage mỗi lần chạy, UI hiện "độ phủ parse
  X%"; interface transform cho phép cắm LLM sau.
- Tin ảo/mặc cả → median (không mean) + khoảng [p25, p75] + tối thiểu N tin.
- Tài khoản Zado bị chú ý → chỉ đọc, cadence thấp, session riêng, không gửi
  tin bao giờ.
- Geocode sai phường → chỉ tin nào match phường mới vào stats; còn lại đếm
  "chưa định vị".
