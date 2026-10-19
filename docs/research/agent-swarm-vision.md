# Tầm nhìn: Agent Swarm Data Collection (Brainstorm — chưa phải kế hoạch thực thi)

Ngày: 2026-10-18 · Ghi từ brainstorm user · Trạng thái: **cần research thêm**

## Ý tưởng cốt lõi

Thay vì scrape truyền thống (Playwright + headless), dùng **trợ lý AI cá nhân**
(AI agents) có tài khoản thật, hoạt động như thành viên thật trong các group
(Zalo, Facebook) để thu thập dữ liệu:

- **Mô hình như OpenClaw**: trợ lý AI cá nhân có thể tích hợp Zalo — agent
  đọc group, tương tác như người thật
- **Browser với dấu tích "verified human"**: agent duyệt web với fingerprint
  giống người thật (không phải headless/automation detect được) → tránh bị
  chặn như crawler
- **Facebook Groups**: tương tự — agent là member thật, đọc post thu thập
- **Đội ngũ agent swarm**: nhiều trợ lý AI, mỗi agent có tài khoản riêng,
  mỗi agent cover vài group → **đội nhóm ảo của user** hoạt động song song

## Vì sao hướng này đáng cân nhắc (long-term)

1. **Bền vững hơn scraping**: platform không block "thành viên thật"
2. **Phủ rộng hơn**: mỗi agent cover 3-5 group, 10 agents = 30-50 group
3. **Chất lượng dữ liệu tốt hơn**: agent có thể lọc tin relevant ngay tại
   nguồn (không thu tất cả rồi parse)
4. **Tự nhiên**: agent có thể hỏi lại, làm rõ giá — người môi giới trả lời
   như cho người thật
5. **Khả năng mở rộng multi-platform**: Zalo + Facebook + Telegram cùng lúc

## Rủi ro & câu hỏi cần research

- **Chi phí**: mỗi agent cần 1 tài khoản AI (OpenClaw/Claude/GPT) + 1 tài
  khoản Zalo/FB → chi phí nhân bản theo số agent
- **Tuổi thọ tài khoản**: platform có phát hiện agent swarm không?
- **Đạo đức/ToS**: user đã quyết định cá nhân/phi thương mại (memory scope)
- **Kiến trúc**: agents chạy ở đâu? Cloud? Local? Ai orchestrate?
- **So sánh với scraping truyền thống**: khi nào agent tốt hơn Playwright?

## Next steps (khi user yêu cầu research)

1. Research OpenClaw + các nền tảng AI agent tương tự (Manus, Devin, etc.)
2. ~~Research anti-detect browser (Dolphin Anty, Multilogin, etc.)~~ —
   **LOẠI khỏi hướng research (ADR-0007/CCP)**: arms race leo thang, chính
   hành vi "giả vờ nhiều người" là dấu hiệu bot rõ nhất. Chiến lược thay:
   một account thật, đọc chậm, chỉ đọc, không xoay identity.
3. Prototype 1 agent Zalo: đọc 1 group, extract tin BĐS
4. Đề xuất kiến trúc agent swarm (orchestrator + agents + data pipeline)
5. Chi phí vận hành ước tính

## Quan hệ với kiến trúc hiện tại

Agent swarm là **thay thế tầng collector** cho Zalo/FB (không thay đổi
one-invest). Collector repo sẽ có thêm `agents/` chạy song song với
`collectors/` truyền thống — cùng output raw snapshot + manifest.

**KHÔNG thay thế**: Airbnb (API có cấu trúc, scraping ổn định), AirDNA
(web app, không cần agent), OSM (Overpass API).
