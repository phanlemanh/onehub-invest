// doc-gop-3-model-s03.ts — PL30 `chon-model-theo-o`, lượt ĐO: đọc gộp một thẻ vàng S03 (chữ bài + mọi ảnh + thẻ nhóm + quy ước
// + từ điển mã toà) bằng ba model qua Vercel AI Gateway, ra đủ 17 ô của biểu mẫu nhãn kèm căn cứ và câu trích, rồi chấm theo
// ô × model trên nhãn vàng của lát `s03-theo-nhom`.
// Luật 7: chỉ đo. Script CHỈ ĐỌC DB (không ghi eval_labels, silver_labels, ai_calls hay bảng nào); mọi đầu ra ở research-local.
// Luật 6 (sửa 06/11, PR #334): nội dung bài gửi model nguyên văn, không che tên nguồn; không gửi hồ sơ user app, định danh
// tài khoản thu, khoá/phiên, source_registry. Người đăng (sender_*) không gửi: tên/SĐT người bán đọc từ chữ và ảnh.
// Tiền: trần 20 USD cho cả việc đo (Mạnh duyệt 06/11); mỗi lượt ước trước, sổ cộng dồn ở <out>/chi-phi.jsonl.
//
//   npx tsx scripts/doc-gop-3-model-s03.ts chuan-bi
//   npx tsx scripts/doc-gop-3-model-s03.ts uoc --split dev
//   npx tsx --env-file=<.env> scripts/doc-gop-3-model-s03.ts chay --model haiku --split dev --nhan v1 [--chi 3]
//   npx tsx scripts/doc-gop-3-model-s03.ts cham --nhan v1 --split dev
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createGateway, generateText } from "ai";
import pg from "pg";
import { chuKhongLink, danhSachAnhCum, docGhep, refsCuaDong } from "../../app/src/lib/labels-anh";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { danhSachAnh, luotTuDong } from "../../pipeline/lib/vlm-anh.mjs";

const MAIN = "/Users/manhphan/dev/onehub-invest";
const OUT = process.env.DO3_OUT ?? join(MAIN, "research-local/do-3-model-s03");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const LAT = "s03-theo-nhom";
export const TRAN_USD = 20;

export type M3 = "haiku" | "glm" | "deepseek";
export const MODELS: Record<M3, { id: string; vao: number; ra: number }> = {
  haiku: { id: "anthropic/claude-haiku-5.5", vao: 0.1, ra: 0.5 },
  glm: { id: "zai/glm-5.3-flash", vao: 0.15, ra: 0.5 },
  deepseek: { id: "deepseek/deepseek-v4.1-flash-1017", vao: 0.3, ra: 1.2 },
};

export const FIELDS = [
  "listing_intent", "kind", "property_type", "multi_unit", "project", "subzone", "building", "stack", "floor",
  "bedrooms", "bedrooms_plus", "bathrooms", "area_m2", "price_min_vnd", "price_max_vnd", "seller_name", "seller_phone",
] as const;
export type Field = (typeof FIELDS)[number];

// ==== prompt ====
// v1 → v2 (sửa theo lệch trên dev, không nhìn test): mã toà có dấu chấm, mã toà riêng một dự án suy ra khu đô thị ở nhóm
// không chuyên, bài không phải tin rao để trống các ô, tên người bán bỏ xưng hô.
// v2 → v3 (dev): phân khu của Masteri Era Landmark, «X thu về» là giá căn, số giá lệch đơn vị.
export const PROMPT_VERSION = "dg3-s03-v3";

const HUONG_DAN = `Bạn là người gắn nhãn tin đăng trong nhóm chat môi giới bất động sản Việt Nam. Bạn nhận: tên nhóm, thẻ nhóm (mô tả nhóm, mã toà hay gặp), chữ bài và mọi ảnh của bài. Đọc như một người trong nhóm, rồi điền đủ 17 ô dưới đây cho căn được rao (hoặc nhu cầu được hỏi).

Mỗi ô là một object {"v": giá trị hoặc null, "cc": căn cứ hoặc null, "trich": chuỗi}:
- "v": null nghĩa là «Không suy ra được». Không đoán: chỉ điền khi chữ bài, ảnh, thẻ nhóm hoặc kiến thức nghề cho ra giá trị đó.
- "cc": một trong "chu_bai" (đọc từ chữ bài), "anh" (đọc từ ảnh), "ngu_canh_nhom" (từ tên/thẻ nhóm), "kien_thuc_nghe" (hiểu biết nghề, quy ước, từ điển). v null thì cc null.
- "trich": chép nguyên văn đoạn ngắn của chữ bài làm căn cứ; căn cứ ảnh thì mô tả ngắn vùng ảnh và chép chữ trong ảnh; căn cứ nhóm/nghề thì nêu lý do một câu. v null thì "".

Các ô:
- listing_intent: "offer" = tin rao bán hoặc cho thuê; "inquiry" = khách cần mua/thuê (yêu cầu); "not_listing" = không phải tin BĐS (quảng cáo dịch vụ như ngân hàng cho vay, chào hỏi, thu hồi, bài không có nội dung đọc được). Ô này luôn có giá trị. not_listing → multi_unit "no", MỌI ô khác null (kể cả tên, SĐT người quảng cáo).
- kind: "sale" = bán, chuyển nhượng, sang nhượng HĐMB; "rent_lt" = cho thuê (giá theo tháng). Yêu cầu: dịch vụ khách cần (cần mua → sale, cần thuê → rent_lt). not_listing → null.
- property_type: "apartment" (căn hộ, studio, duplex, penthouse chung cư) | "house" (nhà phố, liền kề, biệt thự, shophouse) | "land" | "room" (phòng trọ) | "commercial" (mặt bằng, văn phòng). not_listing → null.
- multi_unit: "yes" khi một bài rao từ hai căn trở lên với thông số khác nhau (danh sách nhiều căn, bảng hàng); "no" khi một căn (kể cả bài rao một căn mà kèm nhiều ảnh). Ô này luôn có giá trị "yes" hoặc "no". Bài nhiều căn: các ô còn lại điền cho căn đầu tiên được nêu đủ nhất.
- project: tên khu đô thị / đại đô thị, viết đủ như từ điển, vd "Vinhomes Ocean Park 1", "Vinhomes Grand Park", "Vinhomes Smart City", "Ecopark", "The Global City".
- subzone: phân khu hoặc dự án con trong khu đô thị, vd "The Paris", "Origami", "The Beverly", "Masteri Waterfront", "The Canopy Residences".
- building: mã toà như bài/CĐT viết, giữ dấu chấm, vd "PR2", "S8.01", "TC1", "BE3", "C1Z1".
  - Vinhomes Ocean Park 1 khu The Metropolitan: mã căn "PR5.1203" = toà PR5, tầng 12, trục 03; "LD2XX03" = toà LD2, tầng che, trục 03.
  - Vinhomes Grand Park (Origami, Rainbow) và The Sapphire 1 (OCP1): mã toà GỒM phần sau dấu chấm — "S8.02", "S1.03", "S5.02" là toà; mã căn viết tiếp sau, vd "S1.03xx12A" = toà S1.03, tầng che (null), trục 12A; "S8.02.1505" = toà S8.02, tầng 15, trục 05.
- stack: trục căn (hai số cuối của mã căn), vd "03", "10". Che (xx) → null.
- floor: tầng, vd "12", "09", "12A". Tầng bị che («2x», «xx», «tầng cao/trung») → null.
- bedrooms: số phòng ngủ, số nguyên; studio = 0; «1PN+», «2N+1» → số PN chính (1, 2).
- bedrooms_plus: "yes" khi căn có phòng «+» (1PN+, 2PN+1, 2N+1…), "no" khi không; không biết số phòng → null.
- bathrooms: số WC, số nguyên.
- area_m2: diện tích m², số (vd 64.5). Không có → null.
- price_min_vnd, price_max_vnd: giá theo đồng, số nguyên (2,62 tỷ = 2620000000; 14tr = 14000000; thuê theo tháng). Một giá → hai ô bằng nhau; khoảng giá → thấp/cao. Không có giá → cả hai null.
- seller_name: tên người bán/môi giới ghi trong chữ bài hoặc ảnh (chữ ký, «LH Thắm»…), bỏ xưng hô đứng trước (em, anh, chị, a, c, mr, ms, cô, chú): «Em Thắm» → "Thắm". Không ghi → null. Không dùng tên sàn hay tên nhóm.
- seller_phone: SĐT liên hệ trong chữ bài hoặc ảnh, viết dạng +84 (0912345678 → +84912345678). Không có → null.

Quy ước của người gắn (đã chốt, áp dụng khi khớp ca):
- WC: căn nào cũng có ít nhất 1 WC. Bài không ghi WC: studio, 1PN, 1PN+ → 1 (căn cứ kien_thuc_nghe). Từ 2PN trở lên bài không ghi → null, trừ khi biết mẫu căn của CĐT.
- Studio: property_type apartment, bedrooms 0.
- Giá che số cuối («1,7x tỷ»): khoảng 1,70–1,79 tỷ (min 1700000000, max 1790000000).
- Yêu cầu (khách cần mua/thuê): listing_intent inquiry, kind = dịch vụ khách cần, giá = ngân sách.
- «thu về tay X tr», «cắt x% đã đóng» là tiền chênh người bán nhận khi chuyển nhượng HĐMB (con số nhỏ hơn hẳn giá căn), không phải giá căn → giá null. Còn «5300 net», «1,950 thu về», «Giá: 1,65 tỷ thu về» (con số cỡ giá cả căn) VẪN là giá căn.
- Số giá viết lệch đơn vị: «3400 tỷ» cho một căn hộ là 3400 triệu = 3,4 tỷ; «4,350 tỷ» là 4,35 tỷ.
- «2 ngủ» với căn 1PN+: môi giới hay gọi 1PN+ là «2 ngủ»; khi ảnh/bảng CĐT ghi 1BR+ và giá, diện tích khớp → bedrooms 1, bedrooms_plus yes (căn cứ anh).
- Giá sơ cấp nhiều phương thức thanh toán (TTS/TTC/TTV…): hai ô giá = giá chuẩn (TTC).
- Masteri Trinity Square thuộc Vinhomes Ocean Park 2 (bài hay viết «Trinity»); 3 phân khu Southern/Central/Northern Square. Mã CĐT «C3L1-13-06»: tầng 13, trục 06; phần toà «C3L1» không suy ra từ bài thì null.
- Masteri Era Landmark thuộc Vinhomes Ocean Park 3 (bài hay viết «Era»); mã C1Z1 trùng với Trinity Square nên phân biệt theo tên dự án trong bài.
- Tổ hợp The Metropolitan (Vinhomes Ocean Park 1): PR = The Paris, LD = The London, BE = The Beverly. Mã PR…, LD…, BE… trong nhóm OCP → project «Vinhomes Ocean Park 1», subzone theo mã (kien_thuc_nghe). «bể bơi Paris» là tên tiện ích.
- Mã toà chỉ có ở một dự án (PR, LD, TC, TK, GH…) đủ để suy ra project và subzone kể cả khi nhóm không chuyên dự án đó (kien_thuc_nghe). Mã trùng giữa dự án (S1, S2, BE, C1Z1) thì phải dựa vào tên dự án trong bài hoặc thẻ nhóm; không rõ thì null.
- Toà M1 (nhóm OCP) thuộc phân khu Masteri Waterfront.
- Smart City · The Canopy Residences: TC1 = The Canopy Vista, TC2 = The Canopy Summit, TC3 = The Canopy Harmony; subzone «The Canopy Residences», building TC1/TC2/TC3.

Từ điển khu đô thị → phân khu / dự án con → mã toà:
- Vinhomes Ocean Park 1 (Gia Lâm, HN): The Metropolitan gồm The Paris PR1–PR6, The London LD1–LD3, The Beverly BE1–BE4 · The Sapphire 1: S1.xx (vd S1.03, S1.09) · The Ruby: R1.xx · Masteri Waterfront (Masterise Homes): M1, M2, M3 · Masteri Lakeside (Masterise Homes): L1, U38, U38A · Senique (CapitaLand): S1, S2 (khác S1 của Grand Park) · The Pavilion: P1–P4 · Masteri Park Place: A1, A2.
- Vinhomes Ocean Park 2 (Hưng Yên): Masteri Trinity Square (Southern / Central / Northern Square), mã CĐT C1L1, C1L2, C1Z1, C2Z1–C2Z3, C3L1, C3L2, C3Z1.
- Vinhomes Ocean Park 3: Masteri Era Landmark (subzone ghi "Masteri Era Landmark"; The SPARK là tên khu bên trong, không dùng làm subzone), mã C1Z1.
- Vinhomes Smart City (Tây Mỗ, HN): The Canopy Residences TC1–TC3 · The Tonkin TK1, TK2… · Lumiere Evergreen (Masterise Homes): A3 (vd A3.09.19).
- Vinhomes Grand Park (Thủ Đức, HCM): Glory Heights GH1–GH5 · The Beverly BE1–BE5 (khác BE của OCP1) · Origami S6–S10 (vd S8.01, S8.02) · The Rainbow S1–S5 · Lumière Boulevard (LBV) · Masteri Centre Point (MCP) toà E.
- The Global City (HCM): Masteri Cosmo Central B1 (vd B1-12A-05).
- Ecopark (Hưng Yên): Sky Oasis · Sky Forest · Landmark.
- Vinhomes King Park (Bắc Ninh).

Trả đúng MỘT object JSON, không markdown, không giải thích, có đủ 17 khoá: ${FIELDS.join(", ")}.`;

export const PROMPT_SHA = createHash("sha256").update(HUONG_DAN).digest("hex").slice(0, 12);

// ==== tệp ====
type The = {
  item_id: number; split: "dev" | "test"; stratum: string | null; group_name: string | null; group_note: string | null;
  text: string; so_link_khac: number; anh: { tep: string; mime: string; sha256: string }[]; anh_thieu: number; loai_bai: string[];
};
type Vang = { item_id: number; field: Field; value: string | null; basis: string | null };
type MocSo = { item_id: number; may: "bo_doc" | "dtb_haiku"; field: Field; value: string | null };

const docJsonl = async <T>(p: string): Promise<T[]> =>
  existsSync(p) ? (await readFile(p, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l) as T) : [];
const ghiJsonl = (p: string, rows: unknown[]) => writeFile(p, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");

function thamSo(argv: string[]) {
  const o: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith("--")) o[argv[i].slice(2)] = argv[i + 1]?.startsWith("--") || argv[i + 1] === undefined ? "1" : argv[++i];
  return o;
}

// ==== chuẩn bị (chỉ đọc DB) ====
async function chuanBi() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("SET default_transaction_read_only = on");
    const { rows: items } = await c.query(
      `SELECT i.item_id::int, i.split, i.stratum, i.ref_id, i.ghep, cu.name AS unit_name, cu.note AS group_note
       FROM eval_label_items i LEFT JOIN collection_units cu ON cu.unit_code = i.stratum
       WHERE i.lat = $1 AND i.ghep->>'trung_voi' IS NULL AND EXISTS (SELECT 1 FROM eval_labels l WHERE l.item_id = i.item_id)
       ORDER BY i.item_id`, [LAT]);
    const the: The[] = [];
    for (const it of items) {
      const g = docGhep(it.ghep);
      const refs = refsCuaDong(it.ref_id, g);
      const { rows: bai } = await c.query(
        `SELECT DISTINCT ON (post_id) post_id, text, group_name, media, media_files, snapshot_id
         FROM stg_zalo_posts WHERE post_id = ANY ($1) ORDER BY post_id, captured_at DESC`, [refs]);
      const theoId = new Map(bai.map((b) => [b.post_id, b]));
      const xep = refs.flatMap((r) => theoId.get(r) ?? []);
      const luot = xep.flatMap((b) => luotTuDong(b, "rieng"));
      const { anh } = danhSachAnh(luot, { tran: 20 });
      const trenMan = danhSachAnhCum(xep); // ảnh người gắn thấy trên thẻ (tệp + URL chưa tải)
      const tongTrenMan = trenMan.length;
      // Ảnh chỉ có URL (chưa tải vào snapshot): màn gắn nhãn lấy qua máy chủ (lay-anh-goc). Lượt đo làm như màn — tải vào bộ
      // nhớ đệm ở research-local (gitignored), không ghi vào snapshots (bất biến), không chép URL ra bảng.
      for (const u of trenMan) {
        if (u.kind !== "url") continue;
        const a = await taiAnhUrl(u.url);
        if (a && !anh.some((x: { sha256: string }) => x.sha256 === a.sha256)) anh.push(a);
      }
      const dongChu = g?.chu_ref ? theoId.get(g.chu_ref) : theoId.get(it.ref_id);
      const { chu, soLinkKhac } = chuKhongLink(dongChu?.text ?? "", []);
      const loai: string[] = [];
      if (chu.trim().length >= 15) loai.push("co_chu"); else loai.push("chi_anh");
      the.push({
        item_id: it.item_id, split: it.split, stratum: it.stratum, group_name: xep.find((b) => b.group_name)?.group_name ?? it.unit_name ?? null,
        group_note: it.group_note ?? null, text: chu, so_link_khac: soLinkKhac,
        anh: anh.map((a: { tep: string; mime: string; sha256: string }) => ({ tep: a.tep, mime: a.mime, sha256: a.sha256 })),
        anh_thieu: Math.max(0, tongTrenMan - anh.length), loai_bai: loai,
      });
    }
    const { rows: vang } = await c.query(
      `SELECT l.item_id::int, l.field, l.value, l.basis FROM eval_labels l JOIN eval_label_items i USING (item_id)
       WHERE i.lat = $1 AND i.ghep->>'trung_voi' IS NULL ORDER BY l.item_id, l.field`, [LAT]);
    // Loại bài từ nhãn vàng (chỉ để tách số khi chấm; không vào prompt).
    for (const t of the) {
      const v = (f: string) => vang.find((x) => x.item_id === t.item_id && x.field === f)?.value;
      if (v("multi_unit") === "yes") t.loai_bai.push("nhieu_can");
      if (v("listing_intent") === "inquiry") t.loai_bai.push("yeu_cau");
      if (v("listing_intent") === "not_listing") t.loai_bai.push("khong_phai_tin");
    }
    // Mốc so: Bộ đọc (sale_offers) và Haiku chỉ đọc chữ dtb-s03-v1 (silver_labels), cùng cách lấy như do-may-tren-vang-s03.sql.
    const { rows: moc } = await c.query(
      `WITH it AS (SELECT i.item_id, coalesce(i.ghep->>'chu_ref', i.ref_id) ref FROM eval_label_items i
                   WHERE i.lat = $1 AND i.ghep->>'trung_voi' IS NULL AND EXISTS (SELECT 1 FROM eval_labels l WHERE l.item_id = i.item_id)),
       o AS (SELECT it.item_id, so.* FROM it LEFT JOIN LATERAL (SELECT * FROM sale_offers s WHERE it.ref = ANY (s.post_ids) ORDER BY offer_id LIMIT 1) so ON true),
       d AS (SELECT it.item_id, s.listing_intent, s.kind, s.probabilities p FROM it LEFT JOIN LATERAL (
               SELECT listing_intent, kind, probabilities FROM silver_labels WHERE source_code = 'S03' AND post_id = it.ref AND prompt_version = 'dtb-s03-v1' AND json_ok
               ORDER BY labeled_at DESC, label_id DESC LIMIT 1) s ON true)
       SELECT item_id::int, 'bo_doc' may, f field, v value FROM o, LATERAL (VALUES
         ('listing_intent', CASE WHEN o.offer_id IS NOT NULL THEN 'offer' END), ('kind', o.kind::text), ('property_type', o.property_type::text),
         ('building', o.block_raw), ('floor', o.floor_raw), ('bedrooms', o.bedrooms::text), ('bathrooms', o.bathrooms::text),
         ('area_m2', (o.area_m2::numeric)::text), ('price_min_vnd', o.price_vnd::text), ('price_max_vnd', o.price_vnd::text),
         ('seller_name', o.seller_name), ('seller_phone', o.seller_phone)) x(f, v)
       UNION ALL
       SELECT item_id::int, 'dtb_haiku', f, v FROM d, LATERAL (VALUES
         ('listing_intent', d.listing_intent), ('kind', d.kind), ('property_type', d.p->>'property_type'), ('building', d.p->>'block'),
         ('bedrooms', d.p->>'bedrooms'), ('bathrooms', d.p->>'bathrooms'), ('area_m2', d.p->>'area_m2'),
         ('price_min_vnd', d.p->>'price_vnd'), ('price_max_vnd', d.p->>'price_vnd')) x(f, v)`, [LAT]);
    await mkdir(OUT, { recursive: true });
    await ghiJsonl(join(OUT, "the.jsonl"), the);
    await ghiJsonl(join(OUT, "vang.jsonl"), vang as Vang[]);
    await ghiJsonl(join(OUT, "moc-so.jsonl"), moc as MocSo[]);
    const soAnh = the.reduce((n, t) => n + t.anh.length, 0);
    console.log(`chuan-bi: ${the.length} thẻ (dev ${the.filter((t) => t.split === "dev").length}, test ${the.filter((t) => t.split === "test").length}); ảnh có tệp ${soAnh}, ảnh thiếu tệp ${the.reduce((n, t) => n + t.anh_thieu, 0)}; chữ rỗng ${the.filter((t) => !t.text.trim()).length}`);
  } finally {
    await c.end();
  }
}

const ANH_OK: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
async function taiAnhUrl(url: string): Promise<{ tep: string; mime: string; sha256: string } | null> {
  if (!/^https:\/\//i.test(url)) return null;
  const dir = join(OUT, "anh-url");
  const khoa = createHash("sha256").update(url).digest("hex").slice(0, 24);
  for (const [mime, duoi] of Object.entries(ANH_OK)) {
    const tep = join(dir, `${khoa}.${duoi}`);
    if (existsSync(tep)) return { tep, mime, sha256: createHash("sha256").update(await readFile(tep)).digest("hex") };
  }
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: "follow" });
    const mime = (r.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase().replace("image/jpg", "image/jpeg");
    if (!r.ok || !ANH_OK[mime]) return null;
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length > 5 * 1024 * 1024) return null;
    await mkdir(dir, { recursive: true });
    const tep = join(dir, `${khoa}.${ANH_OK[mime]}`);
    await writeFile(tep, b);
    return { tep, mime, sha256: createHash("sha256").update(b).digest("hex") };
  } catch {
    return null;
  }
}

// ==== dựng tin nhắn ====
function chuNguoiDung(t: The) {
  return [
    `Tên nhóm: ${t.group_name ?? "(không có)"}`,
    `Thẻ nhóm: ${t.group_note ?? "(không có)"}`,
    `Số ảnh của bài: ${t.anh.length}`,
    `Chữ bài:\n<<<\n${t.text || "(bài không có chữ)"}\n>>>`,
  ].join("\n");
}

async function tinNhan(t: The) {
  const content: ({ type: "text"; text: string } | { type: "file"; data: Uint8Array; mediaType: string })[] = [{ type: "text", text: chuNguoiDung(t) }];
  for (const [i, a] of t.anh.entries()) {
    content.push({ type: "text", text: `Ảnh ${i + 1}:` });
    content.push({ type: "file", data: new Uint8Array(await readFile(a.tep)), mediaType: a.mime });
  }
  return [{ role: "user" as const, content }];
}

// ==== ước ====
/** Ước token: chữ ~3,2 ký tự/token (tiếng Việt), ảnh ~1600 token, ra ~1500 (gồm suy nghĩ). */
export function uocThe(t: The, m: M3) {
  const vao = (HUONG_DAN.length + chuNguoiDung(t).length) / 3.2 + t.anh.length * 1600;
  const ra = 1500;
  return { vao, ra, usd: (vao * MODELS[m].vao + ra * MODELS[m].ra) / 1e6 };
}

async function daChi(): Promise<number> {
  return (await docJsonl<{ usd: number }>(join(OUT, "chi-phi.jsonl"))).reduce((n, r) => n + (r.usd ?? 0), 0);
}

async function chonThe(co: Record<string, string>) {
  let the = await docJsonl<The>(join(OUT, "the.jsonl"));
  if (co.split && co.split !== "all") the = the.filter((t) => t.split === co.split);
  if (co.item) the = the.filter((t) => co.item.split(",").map(Number).includes(t.item_id));
  if (co.chi) the = the.slice(0, Number(co.chi));
  return the;
}

async function uoc(co: Record<string, string>) {
  const the = await chonThe(co);
  const ms = (co.model ? co.model.split(",") : Object.keys(MODELS)) as M3[];
  let tong = 0;
  for (const m of ms) {
    const s = the.reduce((a, t) => { const u = uocThe(t, m); return { vao: a.vao + u.vao, ra: a.ra + u.ra, usd: a.usd + u.usd }; }, { vao: 0, ra: 0, usd: 0 });
    tong += s.usd;
    console.log(`${m}: ${the.length} thẻ, vào ~${Math.round(s.vao)} token, ra ~${s.ra}, ~${s.usd.toFixed(4)} USD`);
  }
  const da = await daChi();
  console.log(`tổng ước ${tong.toFixed(4)} USD; đã chi ${da.toFixed(4)}; sau lượt ~${(da + tong).toFixed(4)} / trần ${TRAN_USD}`);
  return tong;
}

// ==== gọi ====
/** Gateway: không giữ dữ liệu, không dùng huấn luyện (như vlm-anh-s03). DeepSeek chỉ qua Baseten (Hỏi-3 KC3 đã chốt). */
function tuyChon(m: M3) {
  const chung = { zeroDataRetention: true, disallowPromptTraining: true };
  return { gateway: m === "deepseek" ? { ...chung, only: ["baseten"] } : chung };
}

const chiPhiGateway = (meta: unknown): number | null => {
  const v = Number((meta as { gateway?: { cost?: unknown } } | undefined)?.gateway?.cost);
  return Number.isFinite(v) && v >= 0 ? v : null;
};

export function tachJson(raw: string): Record<string, unknown> | null {
  const s = raw.replace(/```(?:json)?/g, "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const o = JSON.parse(s.slice(a, b + 1));
    return o && typeof o === "object" && !Array.isArray(o) ? o : null;
  } catch {
    return null;
  }
}

async function chay(co: Record<string, string>) {
  if (!process.env.AI_GATEWAY_API_KEY) throw new Error("thiếu AI_GATEWAY_API_KEY — chạy với --env-file; chưa gọi model");
  const m = co.model as M3;
  if (!MODELS[m]) throw new Error(`model phải là ${Object.keys(MODELS).join("|")}`);
  const nhan = co.nhan ?? "v1";
  const the = await chonThe(co);
  const uocLuot = the.reduce((n, t) => n + uocThe(t, m).usd, 0);
  let da = await daChi();
  console.log(`chay ${m} (${MODELS[m].id}) ${the.length} thẻ, nhãn ${nhan}, prompt ${PROMPT_VERSION}/${PROMPT_SHA}: ước ${uocLuot.toFixed(4)} USD; đã chi ${da.toFixed(4)}`);
  if (da + uocLuot > TRAN_USD) throw new Error(`vượt trần ${TRAN_USD} USD nếu chạy — dừng, báo giám sát`);
  const dir = join(OUT, "ra", nhan);
  await mkdir(dir, { recursive: true });
  const tep = join(dir, `${m}.jsonl`);
  const daCo = new Set((await docJsonl<{ item_id: number; ok: boolean }>(tep)).filter((r) => r.ok || !co["lam-lai"]).map((r) => r.item_id));
  const gw = createGateway({ baseURL: process.env.AI_GATEWAY_BASE_URL || undefined, apiKey: process.env.AI_GATEWAY_API_KEY });
  const songSong = Number(co["song-song"] ?? 4);
  const hang = the.filter((t) => !daCo.has(t.item_id));
  let i = 0;
  const motThe = async (t: The) => {
    const uocMot = uocThe(t, m).usd;
    if (da + uocMot > TRAN_USD) { console.log(`#${t.item_id}: chạm trần, bỏ`); return; }
    const t0 = Date.now();
    let r: Record<string, unknown>;
    try {
      const kq = await generateText({
        model: gw(MODELS[m].id), system: HUONG_DAN, messages: await tinNhan(t), temperature: 0, maxOutputTokens: 8000,
        maxRetries: 1, abortSignal: AbortSignal.timeout(240_000), providerOptions: tuyChon(m),
      });
      const vao = kq.usage?.inputTokens ?? null, ra = kq.usage?.outputTokens ?? null;
      const that = chiPhiGateway(kq.providerMetadata);
      const usd = that ?? (vao !== null && ra !== null ? (vao * MODELS[m].vao + ra * MODELS[m].ra) / 1e6 : uocMot);
      const json = tachJson(kq.text);
      r = {
        item_id: t.item_id, split: t.split, model: m, model_id: MODELS[m].id, prompt: PROMPT_VERSION, prompt_sha: PROMPT_SHA, ok: true,
        json_ok: json !== null && FIELDS.every((f) => f in json), json, raw: json ? undefined : kq.text, finish: kq.finishReason,
        vao, ra, ra_suy_nghi: (kq.usage as { reasoningTokens?: number; outputTokenDetails?: { reasoningTokens?: number } } | undefined)?.outputTokenDetails?.reasoningTokens ?? (kq.usage as { reasoningTokens?: number } | undefined)?.reasoningTokens ?? null,
        usd, usd_gateway: that, giay: (Date.now() - t0) / 1000, so_anh: t.anh.length,
      };
    } catch (e) {
      r = { item_id: t.item_id, split: t.split, model: m, prompt: PROMPT_VERSION, prompt_sha: PROMPT_SHA, ok: false, loi: String((e as Error)?.message ?? e).slice(0, 300), giay: (Date.now() - t0) / 1000, usd: 0 };
    }
    da += Number(r.usd ?? 0);
    await appendFile(tep, JSON.stringify(r) + "\n");
    await appendFile(join(OUT, "chi-phi.jsonl"), JSON.stringify({ luc: new Date().toISOString(), nhan, model: m, item_id: t.item_id, usd: r.usd, usd_gateway: r.usd_gateway ?? null, vao: r.vao ?? null, ra: r.ra ?? null, cong_don: Number(da.toFixed(6)) }) + "\n");
    console.log(`#${t.item_id} ${r.ok ? (r.json_ok ? "ok" : "json-hong") : "loi: " + r.loi} ${Number(r.giay).toFixed(1)}s vào ${r.vao ?? "-"} ra ${r.ra ?? "-"} ${Number(r.usd).toFixed(5)} USD (cộng dồn ${da.toFixed(4)})`);
  };
  const tho = Array.from({ length: songSong }, async () => { while (i < hang.length) await motThe(hang[i++]); });
  await Promise.all(tho);
  console.log(`xong ${m}: đã chi cộng dồn ${da.toFixed(4)} USD`);
}

// ==== chấm ====
const boDau = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
export function veE164(v: string): string | null {
  const d = v.replace(/[^\d+]/g, "");
  const so = d.startsWith("+84") ? d.slice(3) : d.startsWith("84") && d.length === 11 ? d.slice(2) : d.startsWith("0") ? d.slice(1) : d;
  return /^[35789]\d{8}$/.test(so) ? `+84${so}` : null;
}
/** Chuẩn hoá một giá trị về dạng so: null/""/unknown → null; số → chuỗi số; chữ → thường, NFC, gọn khoảng trắng. */
export function chuan(f: Field, v: unknown): string | null {
  if (v === null || v === undefined) return null;
  let s = String(v).normalize("NFC").trim().toLowerCase();
  if (!s || s === "null" || s === "unknown" || s === "không suy ra được") return null;
  if (f === "seller_phone") return veE164(s) ?? s;
  if (["area_m2", "price_min_vnd", "price_max_vnd", "bedrooms", "bathrooms"].includes(f)) {
    const n = Number(s.replace(/,/g, "."));
    return Number.isFinite(n) ? String(n) : s;
  }
  if (f === "stack" || f === "floor") return /^\d+$/.test(s) ? String(Number(s)) : s.replace(/^0+(?=\d)/, "");
  if (f === "project" || f === "subzone") s = boDau(s).replace(/^the\s+/, "");
  if (f === "building") s = s.replace(/\s+/g, "");
  return s.replace(/\s+/g, " ");
}

type Dong = { item_id: number; split: string; loai: string[]; f: Field; gv: string | null; mv: Record<string, string | null> };

async function cham(co: Record<string, string>) {
  const nhan = co.nhan ?? "v1";
  const split = co.split ?? "all";
  const the = (await docJsonl<The>(join(OUT, "the.jsonl"))).filter((t) => split === "all" || t.split === split);
  const vang = await docJsonl<Vang>(join(OUT, "vang.jsonl"));
  const moc = await docJsonl<MocSo>(join(OUT, "moc-so.jsonl"));
  const ms = Object.keys(MODELS) as M3[];
  const ra: Record<string, Map<number, Record<string, unknown>>> = {};
  for (const m of ms) {
    const rows = await docJsonl<Record<string, unknown>>(join(OUT, "ra", nhan, `${m}.jsonl`));
    ra[m] = new Map();
    for (const r of rows) ra[m].set(r.item_id as number, r); // lượt sau đè lượt trước
  }
  const mays = [...ms, "bo_doc", "dtb_haiku"];
  const dong: Dong[] = [];
  for (const t of the) {
    for (const f of FIELDS) {
      const g = vang.find((x) => x.item_id === t.item_id && x.field === f);
      if (!g) continue;
      const mv: Record<string, string | null> = {};
      for (const m of ms) {
        const j = ra[m].get(t.item_id)?.json as Record<string, { v?: unknown }> | null | undefined;
        mv[m] = j ? chuan(f, j[f]?.v ?? (typeof j[f] !== "object" ? j[f] : null)) : null;
      }
      for (const k of ["bo_doc", "dtb_haiku"] as const) {
        const x = moc.find((r) => r.item_id === t.item_id && r.may === k && r.field === f);
        mv[k] = x ? chuan(f, x.value) : undefined as unknown as null;
      }
      dong.push({ item_id: t.item_id, split: t.split, loai: t.loai_bai, f, gv: chuan(f, g.value), mv });
    }
  }
  const dung = (d: Dong, m: string) => d.mv[m] != null && d.mv[m] === d.gv;
  const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : "–");
  const L: string[] = [];
  L.push(`# Đọc gộp S03 — ba model trên vàng (${nhan}, split ${split})`, "");
  L.push(`Prompt ${PROMPT_VERSION} (${PROMPT_SHA}). ${the.length} thẻ. Đúng = khớp nhãn vàng sau chuẩn hoá (cả hai cùng «không suy ra» tính đúng).`, "");
  // tổng theo model
  L.push("## Theo model", "", "| Model | Thẻ chạy | JSON hỏng | Lỗi gọi | USD/thẻ | Giây/thẻ (trung vị) | Token vào/thẻ | Token ra/thẻ | Đúng mọi ô |", "|---|---|---|---|---|---|---|---|---|");
  for (const m of ms) {
    const rs = the.map((t) => ra[m].get(t.item_id)).filter(Boolean) as Record<string, unknown>[];
    const n = rs.length;
    const hong = rs.filter((r) => r.ok && !r.json_ok).length, loi = rs.filter((r) => !r.ok).length;
    const sum = (k: string) => rs.reduce((s, r) => s + Number(r[k] ?? 0), 0);
    const giay = rs.map((r) => Number(r.giay)).sort((a, b) => a - b);
    const ds = dong.filter((d) => ra[m].has(d.item_id));
    const dd = ds.filter((d) => (d.gv === null ? d.mv[m] === null : dung(d, m))).length;
    L.push(`| ${m} | ${n} | ${hong} | ${loi} | ${n ? (sum("usd") / n).toFixed(5) : "–"} | ${giay.length ? giay[Math.floor(giay.length / 2)].toFixed(1) : "–"} | ${n ? Math.round(sum("vao") / n) : "–"} | ${n ? Math.round(sum("ra") / n) : "–"} | ${pct(dd, ds.length)} |`);
  }
  L.push("");
  // ô × model
  L.push("## Ô × model", "", "Mỗi ô: **đúng/có nhãn** (độ đúng trên thẻ người điền giá trị) · phủ (máy điền / có nhãn) · thừa (máy điền khi người để «không suy ra», trên số thẻ đó) · đúng-mọi-thẻ (gồm cả «không suy ra» khớp).", "");
  L.push(`| Ô | Có nhãn | ${mays.map((m) => `${m} đúng · phủ · thừa · đúng-mọi-thẻ`).join(" | ")} |`, `|---|---|${mays.map(() => "---").join("|")}|`);
  const tomTat: Record<string, Record<string, { dung: number; co: number; tatCa: number; n: number }>> = {};
  for (const f of FIELDS) {
    const ds = dong.filter((d) => d.f === f);
    const co = ds.filter((d) => d.gv !== null);
    const ko = ds.filter((d) => d.gv === null);
    tomTat[f] = {};
    const o = mays.map((m) => {
      const coM = m === "bo_doc" || m === "dtb_haiku" ? co.filter((d) => d.mv[m] !== undefined) : co.filter((d) => ra[m].has(d.item_id));
      const koM = m === "bo_doc" || m === "dtb_haiku" ? ko.filter((d) => d.mv[m] !== undefined) : ko.filter((d) => ra[m].has(d.item_id));
      if (!coM.length && !koM.length) return "–";
      const dg = coM.filter((d) => dung(d, m)).length;
      const phu = coM.filter((d) => d.mv[m] != null).length;
      const thua = koM.filter((d) => d.mv[m] != null).length;
      const tatCa = dg + koM.filter((d) => d.mv[m] == null).length;
      tomTat[f][m] = { dung: dg, co: coM.length, tatCa, n: coM.length + koM.length };
      return `**${dg}/${coM.length}** · ${pct(phu, coM.length)} · ${thua}/${koM.length} · ${pct(tatCa, coM.length + koM.length)}`;
    });
    L.push(`| ${f} | ${co.length} | ${o.join(" | ")} |`);
  }
  L.push("", "Mốc bo_doc/dtb_haiku chỉ có các ô hai đường đó đọc; ô khác để «–». bo_doc chỉ có thẻ đã thành tin (sale_offers).", "");
  // cặp model
  L.push("## Cặp model: khớp nhau và đúng trên phần khớp", "", "Tính trên mọi thẻ của ô (kể cả «không suy ra»). Khớp = hai model ra cùng giá trị (cùng null cũng tính). Đúng-khi-khớp = phần khớp mà trùng nhãn vàng.", "");
  const cap: [M3, M3][] = [["haiku", "glm"], ["haiku", "deepseek"], ["glm", "deepseek"]];
  L.push(`| Ô | ${cap.map(([a, b]) => `${a}+${b} khớp · đúng-khi-khớp`).join(" | ")} |`, `|---|${cap.map(() => "---").join("|")}|`);
  for (const f of FIELDS) {
    const ds = dong.filter((d) => d.f === f);
    const o = cap.map(([a, b]) => {
      const c2 = ds.filter((d) => ra[a].get(d.item_id)?.json_ok && ra[b].get(d.item_id)?.json_ok);
      const khop = c2.filter((d) => d.mv[a] === d.mv[b]);
      const dk = khop.filter((d) => d.mv[a] === d.gv).length;
      return `${pct(khop.length, c2.length)} (${khop.length}/${c2.length}) · ${pct(dk, khop.length)}`;
    });
    L.push(`| ${f} | ${o.join(" | ")} |`);
  }
  L.push("");
  // theo loại bài
  L.push("## Theo loại bài (đúng-mọi-thẻ gộp 17 ô)", "", `| Loại | Thẻ | ${ms.join(" | ")} |`, `|---|---|${ms.map(() => "---").join("|")}|`);
  for (const loai of ["co_chu", "chi_anh", "nhieu_can", "yeu_cau", "khong_phai_tin"]) {
    const ds = dong.filter((d) => d.loai.includes(loai));
    const nThe = new Set(ds.map((d) => d.item_id)).size;
    L.push(`| ${loai} | ${nThe} | ${ms.map((m) => { const x = ds.filter((d) => ra[m].has(d.item_id)); return pct(x.filter((d) => (d.gv === null ? d.mv[m] === null : dung(d, m))).length, x.length); }).join(" | ")} |`);
  }
  L.push("");
  // chi tiết sai
  const sai: string[] = [];
  for (const d of dong) for (const m of ms) if (ra[m].has(d.item_id) && d.mv[m] !== d.gv) sai.push(`| ${d.item_id} | ${d.split} | ${d.f} | ${d.gv ?? "∅"} | ${m} | ${d.mv[m] ?? "∅"} |`);
  await mkdir(join(OUT, "bang"), { recursive: true });
  await writeFile(join(OUT, "bang", `${nhan}-${split}.md`), L.join("\n") + "\n");
  await writeFile(join(OUT, "bang", `${nhan}-${split}-lech.md`), ["| Thẻ | Split | Ô | Vàng | Model | Máy |", "|---|---|---|---|---|---|", ...sai].join("\n") + "\n");
  await writeFile(join(OUT, "bang", `${nhan}-${split}.json`), JSON.stringify(tomTat, null, 1));
  console.log(L.join("\n"));
}


// ==== tổng kết: gộp nhiều lượt cùng prompt trên một split, đề xuất A/B mỗi ô ====
/** Ngưỡng đề xuất (Mạnh chưa chốt): ý định, loại ≥95%; giá, DT, PN, SĐT ≥90%; dự án, phân khu, toà ≥80%. Ô kế hoạch không
 * nêu: ≥90% (ghi rõ trong bảng). */
export const NGUONG: Record<Field, number> = {
  listing_intent: 0.95, kind: 0.95, property_type: 0.95, multi_unit: 0.9, project: 0.8, subzone: 0.8, building: 0.8,
  stack: 0.9, floor: 0.9, bedrooms: 0.9, bedrooms_plus: 0.9, bathrooms: 0.9, area_m2: 0.9, price_min_vnd: 0.9, price_max_vnd: 0.9,
  seller_name: 0.9, seller_phone: 0.9,
};
const NGUONG_KE_HOACH = new Set<Field>(["listing_intent", "kind", "property_type", "project", "subzone", "building", "bedrooms", "area_m2", "price_min_vnd", "price_max_vnd", "seller_phone"]);

async function tongKet(co: Record<string, string>) {
  const nhans = (co.nhan ?? "v3,v3b").split(",");
  const split = co.split ?? "test";
  const the = (await docJsonl<The>(join(OUT, "the.jsonl"))).filter((t) => split === "all" || t.split === split);
  const vang = await docJsonl<Vang>(join(OUT, "vang.jsonl"));
  const ms = Object.keys(MODELS) as M3[];
  const ra: Record<string, Record<M3, Map<number, Record<string, unknown>>>> = {};
  for (const n of nhans) {
    ra[n] = {} as Record<M3, Map<number, Record<string, unknown>>>;
    for (const m of ms) ra[n][m] = new Map((await docJsonl<Record<string, unknown>>(join(OUT, "ra", n, `${m}.jsonl`))).map((r) => [r.item_id as number, r]));
  }
  const gv = (id: number, f: Field) => { const g = vang.find((x) => x.item_id === id && x.field === f); return g ? chuan(f, g.value) : undefined; };
  const mv = (n: string, m: M3, id: number, f: Field) => {
    const j = ra[n][m].get(id)?.json as Record<string, { v?: unknown }> | null | undefined;
    return j ? chuan(f, j[f] && typeof j[f] === "object" ? j[f].v : j[f]) : null;
  };
  // Chi phí, giây đo thật trên các lượt.
  const usd: Record<M3, number> = { haiku: 0, glm: 0, deepseek: 0 }, giay: Record<M3, number[]> = { haiku: [], glm: [], deepseek: [] };
  const hong: Record<M3, number> = { haiku: 0, glm: 0, deepseek: 0 };
  let soLuot = 0;
  for (const n of nhans) for (const m of ms) for (const t of the) { const r = ra[n][m].get(t.item_id); if (!r) continue; usd[m] += Number(r.usd ?? 0); giay[m].push(Number(r.giay)); if (!r.json_ok) hong[m]++; }
  for (const n of nhans) soLuot += ms.every((m) => the.every((t) => ra[n][m].has(t.item_id))) ? 1 : 0;
  const usdThe = (m: M3) => usd[m] / (the.length * nhans.length);
  const thuTu = [...ms].sort((a, b) => usdThe(a) - usdThe(b));
  const L: string[] = [];
  L.push(`# Đề xuất model theo ô — đọc gộp S03 (${PROMPT_VERSION}, split ${split}, lượt ${nhans.join("+")})`, "");
  L.push(`${the.length} thẻ × ${nhans.length} lượt. Độ đúng = khớp nhãn vàng trên MỌI thẻ của ô (cả «không suy ra» khớp), trung bình các lượt; JSON hỏng tính là sai.`, "");
  L.push("| Model | USD/thẻ (đo) | Giây trung vị | JSON hỏng |", "|---|---|---|---|");
  for (const m of thuTu) { const g = giay[m].sort((a, b) => a - b); L.push(`| ${m} | ${usdThe(m).toFixed(5)} | ${g[Math.floor(g.length / 2)]?.toFixed(1)} | ${hong[m]}/${the.length * nhans.length} |`); }
  L.push("", `Thứ tự rẻ → đắt theo USD đo: ${thuTu.join(" < ")}.`, "");
  L.push("| Ô | Ngưỡng | " + thuTu.map((m) => `${m} đúng (ổn định 2 lượt)`).join(" | ") + " | A | B | Cặp A+B khớp · đúng-khi-khớp |", "|---|---|" + thuTu.map(() => "---").join("|") + "|---|---|---|");
  const deXuat: Record<string, unknown> = {};
  for (const f of FIELDS) {
    const kq: Record<M3, { dung: number; n: number; on: number; nOn: number }> = {} as never;
    for (const m of ms) {
      let dung = 0, n = 0, on = 0, nOn = 0;
      for (const t of the) {
        const g = gv(t.item_id, f);
        if (g === undefined) continue;
        const vs = nhans.map((x) => mv(x, m, t.item_id, f));
        for (const v of vs) { n++; if (v === g) dung++; }
        if (vs.length > 1) { nOn++; if (vs.every((v) => v === vs[0])) on++; }
      }
      kq[m] = { dung, n, on, nOn };
    }
    const dat = thuTu.filter((m) => kq[m].n && kq[m].dung / kq[m].n >= NGUONG[f]);
    const [a, b] = dat;
    let capTxt = "–";
    if (a && b) {
      let k = 0, kd = 0, tong = 0;
      for (const x of nhans) for (const t of the) {
        const g = gv(t.item_id, f);
        if (g === undefined) continue;
        tong++;
        const va = mv(x, a, t.item_id, f), vb = mv(x, b, t.item_id, f);
        if (va === vb) { k++; if (va === g) kd++; }
      }
      capTxt = `${Math.round((100 * k) / tong)}% · ${k ? Math.round((100 * kd) / k) : 0}%`;
    }
    deXuat[f] = { nguong: NGUONG[f], A: a ?? null, B: b ?? null, kq };
    const p = (m: M3) => `${Math.round((100 * kq[m].dung) / kq[m].n)}% (${kq[m].nOn ? Math.round((100 * kq[m].on) / kq[m].nOn) : "–"}%)`;
    L.push(`| ${f} | ≥${Math.round(NGUONG[f] * 100)}%${NGUONG_KE_HOACH.has(f) ? "" : "*"} | ${thuTu.map(p).join(" | ")} | ${a ?? "người duyệt"} | ${b ?? (a ? "người duyệt" : "–")} | ${capTxt} |`);
  }
  L.push("", "\\* ngưỡng kế hoạch không nêu cho ô này; tạm dùng 90%. «ổn định» = tỉ lệ thẻ mà hai lượt cùng model ra cùng giá trị.", "");
  // Thẻ mà cả ba model (lượt đầu) cùng ra một giá trị khác nhãn vàng: ứng viên soát lại vàng, không phải bằng chứng vàng sai.
  L.push("## Cả ba model cùng khác nhãn vàng (lượt " + nhans[0] + ") — ứng viên soát lại", "", "| Thẻ | Ô | Vàng | Ba model |", "|---|---|---|---|");
  for (const t of the) for (const f of FIELDS) {
    const g = gv(t.item_id, f);
    if (g === undefined) continue;
    const vs = ms.map((m) => mv(nhans[0], m, t.item_id, f));
    if (ra[nhans[0]].haiku.get(t.item_id)?.json_ok && vs.every((v) => v === vs[0]) && vs[0] !== g) L.push(`| ${t.item_id} | ${f} | ${g ?? "∅"} | ${vs[0] ?? "∅"} |`);
  }
  await writeFile(join(OUT, "bang", `de-xuat-${split}.md`), L.join("\n") + "\n");
  await writeFile(join(OUT, "bang", `de-xuat-${split}.json`), JSON.stringify({ prompt: PROMPT_VERSION, sha: PROMPT_SHA, split, nhans, so_the: the.length, usd_the: Object.fromEntries(ms.map((m) => [m, usdThe(m)])), de_xuat: deXuat }, null, 1));
  console.log(L.join("\n"));
  void soLuot;
}

const [lenh, ...rest] = process.argv.slice(2);
const co = thamSo(rest);
const viec: Record<string, () => Promise<unknown>> = { "chuan-bi": chuanBi, uoc: () => uoc(co), chay: () => chay(co), cham: () => cham(co), "tong-ket": () => tongKet(co) };
if (!viec[lenh]) {
  console.log("lệnh: chuan-bi | uoc | chay | cham | tong-ket");
  process.exitCode = 2;
} else {
  viec[lenh]().catch((e) => { console.error(e); process.exitCode = 1; });
}
