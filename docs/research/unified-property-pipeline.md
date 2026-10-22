# Đồng nhất đường ống dữ liệu — "Cuối ngày cũng chỉ là MỘT CĂN NHÀ"

Ngày: 2026-10-22 · Trạng thái: **ĐỀ XUẤT chờ duyệt**
Điều tra: hiện trạng pipeline + research 10/2026 (Qwen3-VL, ER hybrid,
OCR-vs-VLM, pHash). Luật nền: ADR-0011 RESO-first.

## 1. FRAMING

Vấn đề: 5 nguồn đang là 5 "căn nhà ảo" riêng — cùng một căn bán trên Zalo,
caption trên Facebook, đăng Chợ Tốt, cho thuê Airbnb, hiệu chuẩn AirDNA
thành 5 bản ghi không nối được. Hệ quả: ruler median bị nhiễu trùng lặp,
bait_gap đo bằng proxy phường thay vì chính căn, deals có thể trùng, and
asset_registry "Dự án" không có chỗ bám.

## 2. HIỆN TRẠNG — khoá định danh sẵn có (đo bằng dữ liệu thật 22/10)

| Tín hiệu | Độ phủ | Ghi chú |
|---|---|---|
| `offer_id` (hash nội nguồn) | 100% | chỉ dedup TRONG nguồn |
| `phone_hash` (sellers) | 1.043 người bán, P1 | **0 giao nguồn** tới nay; Chợ Tốt không có SĐT → không nối P1↔P2 |
| geo lat/lng | **99,98%** nhưng chỉ S06 | Zalo/FB text không có toạ độ |
| ảnh URL | 116 offers P1 (FB) + S06 full | chưa fingerprint |
| `pty_project_name` (S06) | có sẵn stg, **chưa extract** | khoá "cùng dự án" mạnh nhất VN |
| airbnb_id ↔ airdna | đã merge 506 | tiền lệ ER thành công duy nhất |
| khớp chính xác chéo nguồn (phường+giá+DT) | chỉ **3 cặp** | bait-gap làm giá lệch → cần fuzzy, không exact |

Parser hiện tại: regex coverage 56% (Zalo) / 35% (FB) — phần fail mất
hoặc rơi confidence thấp. Media-only tin Zalo đang **mất hoàn toàn** (skip
khi text rỗng — Kev gate chỉ đọc text).

## 3. PHÂN TÍCH — chọn kỹ thuật theo research 10/2026

**3.1 Entity Resolution: hybrid là chuẩn 2026** (Tilores 11/2025,
arXiv 2401.03426): deterministic blocking tạo cặp ứng viên rẻ → LLM
chỉ phán quyết cặp KHÔNG CHẮC. Không dùng LLM match toàn bộ (đắt,
không audit được).

**3.2 Vision**: Qwen3-VL họ 2B/4B/8B chạy edge/local (LM Studio, MLX
Apple Silicon) — phù hợp máy M5 hiện có; fine-tune được theo hướng Kev.
Kev-4B precedent: 81ms/call, recall 100% — chứng minh small-gate local
là pattern đúng của repo.

**3.3 OCR vs VLM cho ảnh VN**: hybrid — ảnh sạch dùng OCR thường (rẻ,
nhanh); ảnh "collage môi giới" (giá + SĐT dán trong ảnh — RẤT phổ biến
VN) cần VLM hiểu layout. Vintern/LaVy là VLM tiếng Việt nếu cần.

**3.4 pHash**: perceptual hash trưởng thành, sống sót nén/resize — rẻ
(CPU), chuẩn để bắt "cùng căn nhà" qua ảnh đăng lại chéo nguồn.

## 4. KIẾN TRÚC ĐỀ XUẤT — 4 lớp

```
S03 Zalo ──┐  S05 FB ──┐  S06 Chợ Tốt ──┐  S01 ABnB ── S02 AirDNA
 text+ảnh   │  text+ảnh  │  structured    │  structured (đã merge)
            ▼            ▼                ▼
┌─ LỚP 0: CHUẨN HOÁ (RESO — nền, đã có luật) ──────────────────┐
│  Lô 1 property_type (tách đất/nhà/căn hộ — đang trộn ruler!) │
│  Lô 2 mappings + DQ enum; asset_nodes Project Registry R1     │
└───────────────────────┬───────────────────────────────────────┘
                        ▼
┌─ LỚP 1: ENRICH ĐỊNH DANH (mỗi offer, tự động) ───────────────┐
│  + project_node (matcher tên dự án 2 tầng từ asset_nodes)     │
│  + photo_phash[] (mọi ảnh → fingerprint CPU)                   │
│  + geo (S06 có sẵn; P1 suy từ phường+project centroid)         │
│  + text_llm_extract (fallback tin regex-fail → confidence 'llm')│
└───────────────────────┬───────────────────────────────────────┘
                        ▼
┌─ LỚP 2: ENTITY RESOLUTION → bảng `properties` (MỘT CĂN NHÀ) ─┐
│  Stage A blocking: cùng phường (+cùng project) + DT ±15% +    │
│    giá/m² ±20%  → cặp ứng viên                                │
│  Stage B scoring (deterministic):                             │
│    phone_hash trùng → AUTO-MERGE (score 1.0)                  │
│    pHash Hamming < 8 → strong (0.8)                           │
│    geo < 30m (S06↔S06 repost) → strong                        │
│  Stage C LLM-judge (chỉ cặp 0.4–0.7, batch đêm, Qwen local): │
│    input 2 mô tả + số liệu → same_house? + evidence → audit   │
│  properties(id, geo, project_node, property_type, evidence[]) │
└───────────────────────┬───────────────────────────────────────┘
                        ▼
┌─ LỚP 3: VISION PIPELINE (theo ý user — phân loại trước) ─────┐
│  3a Kev-V gate (media-only tin Zalo): Qwen3-VL-4B is_bds      │
│     trên ảnh đầu → hết mất tin chỉ-có-ảnh                     │
│  3b Phân loại ảnh/offer: interior/exterior/collage-text/      │
│     floorplan → chọn hero UI + route 3c                       │
│  3c Collage môi giới (giá/SĐT IN TRONG ẢNH) → VLM extract     │
│     → merge vào parser text → bắt giá tin "ảnh-only"          │
└───────────────────────────────────────────────────────────────┘
```

## 5. ĐỊNH VAI ĐÚNG CHO LLM (trả lời câu hỏi user)

Nguyên tắc giữ nguyên (**LLM-off-data-path** — bài học C1/C2 + bug NaN):
**LLM không bao giờ SỬA dữ liệu; LLM chỉ (a) phân loại cổng, (b) phán
quyết có-audit, (c) extract dạng gán-nhãn có evidence.** Regex/structural
giữ làm đường chính; mọi output LLM tag `confidence='llm'` + source evidence
để bench đối chiếu (pattern bench-extraction hiện có). Qwen 27B local
(~9s/reasoning-low) đủ cho judge batch đêm; không phụ thuộc API đắt.

## 6. GIÁ TRỊ MỞ KHOÁ (khi "một căn nhà" sống)

1. **bait_gap THẬT per-căn**: cùng property có giá P1 + P2 → đo chính xác
   "phễu môi giới" mà bạn đặt ra ban đầu (thay vì proxy phường).
2. Ruler sạch: dedup trước khi tính median (hiện trùng cộng 2 lần).
3. Deals không trùng + lịch sử giá theo CĂN (tăng/giảm qua lần đăng).
4. Bridge asset_nodes: căn → tòa → phân khu → khu đô thị (benchmark
   trong dự án như AirDNA submarket).
5. Ảnh chỉ-có-trong-một-nguồn enrich cho căn gộp.

## 7. LỘ TRÌNH 3 GIAI ĐOẠN (đề xuất duyệt từng mốc)

| G | Việc | Phụ thuộc | Ước tính |
|---|---|---|---|
| **G-1 Nền chuẩn hoá** | Lô 1 (property_type + CHECK + reroll) + Lô 2 (DQ) của phiên RESO + asset_nodes R1 (Project Registry tối thiểu: ~20 khu đô thị HN/HCMC seed) | không — sẵn sàng | 1-2 buổi |
| **G-2 Entity core** | pHash fingerprint toàn ảnh + bảng `properties` + Stage A/B blocking/scoring (không LLM) + reroll ruler trên properties | G-1 | 1-2 buổi |
| **G-3 Vision + LLM** | Kev-V media-only gate (Qwen3-VL-4B local) + classify ảnh + VLM extract collage + LLM judge Stage C | G-2; cần tải model local | 2-3 buổi |

Thứ tự này đặt deterministic trước AI: G-2 làm được 80% giá trị gộp mà
chưa đụng model nào; vision chỉ đến khi có dữ liệu để nó xử lý.

## 8. Nguồn research 10/2026

- Qwen3-VL (2B/4B/8B edge): arXiv 2511.21631; ROCm production blog 3/2026; LM Studio
- ER hybrid best-practice: Tilores 11/2025; arXiv 2401.03426; survey Binette 2022
- OCR vs VLM VN: TRM Labs (OCR→VLM production); Vintern/LaVy; VietOCR ~90% clean
- pHash: imagededup; sharp-phash Node; MDPI Electronics 2026 (pHash vs deep)
