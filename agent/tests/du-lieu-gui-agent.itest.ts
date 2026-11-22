// du-lieu-gui-agent.itest.ts — MH1 model-may-sang-haiku AC-4: enrich và judge chỉ gửi ra Gateway đúng các trường đã kê ở design doc.
// DB thử của riêng lượt (db/db-thu.sh oneinvest_suite_<…> --chay): hai tin S03 cấy tên người bán, SĐT người bán, tên nhóm vào CỘT
// ngoài chữ bài; enrich đi qua CLI enrich-run thật (OFFER_SELECT), judge qua chamMotLuot của judge-run với queryPair thật. Gateway giả
// ghi thân yêu cầu. Đối chứng dương: chữ bài cấy xuất hiện nguyên văn. Chiều đỏ: hàm kiểm chạy trên thân có thêm dòng người bán.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import pg from "pg";
import { insertOffer } from "./helpers/db.js";
import { moAnthropic, type MayAnthropic } from "./helpers/gateway-gia.js";
import { apNguong } from "../src/agents/judge-entity.js";

const DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB)) throw new Error(`từ chối: DB thử phải là oneinvest_suite_<…> (DATABASE_URL=${DB || "<trống>"})`);
const AGENT = join(import.meta.dirname, "..");
const TIEN_TO = `mh1g${Date.now().toString(36)}`;
const NGUOI_BAN = "Trần Văn Cấy";
const SDT = "0912345678";
const NHOM = "Nhóm Cấy Tên Riêng MH1";
let gw: MayAnthropic;
let db: pg.Client;

before(async () => {
  // Bảng của kho: Haiku đi thẳng Anthropic trước (MH1, Mạnh 22/11) — máy giả của đường đó ghi thân yêu cầu.
  gw = await moAnthropic({ text: '{"property_type":"apartment","confidence":0.8}', vao: 100, ra: 20 });
  process.env.ANTHROPIC_BASE_URL = gw.url;
  process.env.ANTHROPIC_API_KEY = "khoa-gia";
  process.env.AI_GATEWAY_BASE_URL = "http://127.0.0.1:9/gw-khong-dung";
  process.env.AI_GATEWAY_API_KEY = "khoa-gia";
  db = new pg.Client({ connectionString: DB, application_name: "du-lieu-gui-agent-itest" });
  await db.connect();
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('mh1g', 'test', 'S03', '{}') ON CONFLICT (snapshot_id) DO NOTHING`);
});
after(async () => {
  await db?.end();
  await gw?.dong();
});

/** Dấu cấy SAU ký tự thứ 500 của chữ bài tin dài: bước cắt 500 ký tự mất thì dấu này lọt vào thân yêu cầu. */
const QUA_500 = "DAUQUA500MH1";
/** Hai tin S03: chữ bài không chứa người bán; tên, SĐT người bán ở cột tin, tên nhóm ở cột bài. `dai`: chữ bài tin a dài
 *  ~700 ký tự, dấu QUA_500 nằm sau ký tự thứ 500 (đối chứng dương của «chữ bài ≤ 500 ký tự»). */
let soLan = 0;
async function gieoHaiTin({ dai = false } = {}): Promise<{ ids: string[]; chu: string[] }> {
  const lan = ++soLan;
  const ids = [`${TIEN_TO}_${lan}a`, `${TIEN_TO}_${lan}b`];
  const chu = ids.map((id) => `Bán căn hộ 2pn 70m2 giá 3,2 tỷ phố Ba Đình, sẵn sổ — mã ${id}`);
  if (dai) chu[0] = `${chu[0]} ${"nhà đẹp gần hồ, nội thất đủ, ".repeat(18)}${QUA_500} hết bài`;
  for (const [i, id] of ids.entries()) {
    await db.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 'mh1g', $2, $3)`, [`p_${id}`, chu[i], NHOM]);
    await insertOffer(db, { offer_id: id, post_ids: [`p_${id}`], property_type: "unknown" });
    await db.query(`UPDATE sale_offer_records SET seller_name = $2, seller_phone = $3, price_vnd = 3200000000, area_m2 = 70 WHERE offer_id = $1`, [id, NGUOI_BAN, SDT]);
  }
  await db.query(`INSERT INTO property_candidates (offer_a, offer_b, score, status) VALUES ($1, $2, 0.7, 'needs_llm')`, ids);
  return { ids, chu };
}

/** Nhãn dòng của thân judge viết trước theo design doc (buildJudgeInput): mọi dòng không rỗng phải bắt đầu bằng một nhãn. */
const NHAN_JUDGE = ["So sánh 2 tin đăng:", "TIN A (", "TIN B (", "- Giá:", "- Diện tích:", "- Giá/m²:", "- Phường:", "- Loại:", "- Nội dung:", "- Tiêu đề:", "KẾT LUẬN CỦA MÁY:", "LÝ DO:"];
/** Nhãn dòng của thân enrich (buildEnrichInput): chữ bài sau «TIN ĐĂNG:», rồi khối bối cảnh suy từ tên nhóm. */
const NHAN_ENRICH = ["TIN ĐĂNG:", "BỐI CẢNH (từ tên nhóm Zalo):", "- Nhóm Zalo thuộc dự án:", "- Nhóm CÓ THỂ thuộc", "- Khu vực:", "- Loại hình từ nhóm:", "- Mã tòa phát hiện:"];

/** Hàm kiểm dùng chung (ca thật và chiều đỏ): prompt chỉ có dòng thuộc nhãn đã kê hoặc đúng nguyên văn một dòng trong
 *  `chinhXac` (lý do của luật cho cặp này — không nhãn bắt-mọi); người bán, SĐT, tên nhóm không lộ; chữ bài có mặt. */
function kiemThan(prompt: string, nhan: string[], chuBai: string[], ten: string, chinhXac: string[] = []) {
  for (const lo of [NGUOI_BAN, SDT, NHOM]) if (prompt.includes(lo)) assert.fail(`MH1 AC-4 ${ten} lộ trường «${lo}»`);
  const dong = prompt.split("\n").map((d) => d.trim()).filter(Boolean);
  const laChuBai = (d: string) => chuBai.some((c) => d === c || c.startsWith(d) || d.includes(c.slice(0, 40)));
  for (const d of dong) {
    if (laChuBai(d) || chinhXac.includes(d)) continue;
    if (!nhan.some((n) => d.startsWith(n))) assert.fail(`MH1 AC-4 ${ten} có dòng ngoài danh sách: «${d.slice(0, 80)}»`);
  }
  assert.ok(chuBai.some((c) => prompt.includes(c.slice(0, 60))), `MH1 AC-4 ${ten} thiếu chữ bài (đối chứng dương)`);
}

/** Phần prompt của người dùng (không tính system prompt cố định của agent): `messages` của Messages API (đường thẳng), `prompt`
 * của Gateway. */
const promptNguoiDung = (y: MayAnthropic["yeuCau"][number]) => {
  const p = ((y.than.messages ?? y.than.prompt) as { role: string; content: unknown }[] | undefined) ?? [];
  return p
    .filter((m) => m.role === "user")
    .flatMap((m) => (typeof m.content === "string" ? [m.content] : Array.isArray(m.content) ? m.content : []))
    .map((c: unknown) => (typeof c === "string" ? c : (c as { type?: string; text?: string }).type === "text" ? String((c as { text: string }).text) : ""))
    .join("\n");
};

test("MH1 AC-4 enrich-run thật (OFFER_SELECT) chỉ gửi chữ bài ≤ 500 ký tự và khối bối cảnh", async () => {
  const { ids, chu } = await gieoHaiTin({ dai: true });
  assert.ok(chu[0].length > 600 && chu[0].indexOf(QUA_500) > 500, "MH1 AC-4 tin dài phải có dấu sau ký tự 500");
  gw.datLai();
  const kq = await new Promise<{ ma: number | null; out: string }>((resolve, reject) => {
    const p = spawn(process.execPath, ["--import", "tsx", "scripts/enrich-run.ts", "--offers", ids.join(",")], {
      cwd: AGENT, env: { ...process.env, DATABASE_URL: DB, ANTHROPIC_BASE_URL: gw.url, ANTHROPIC_API_KEY: "khoa-gia", AI_GATEWAY_BASE_URL: "http://127.0.0.1:9/gw-khong-dung", AI_GATEWAY_API_KEY: "khoa-gia" },
    });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    p.on("error", reject);
    p.on("close", (ma) => resolve({ ma, out }));
  });
  assert.equal(gw.yeuCau.length, 2, `MH1 AC-4 enrich phải gọi 2 lời: ${kq.out.slice(-300)}`);
  for (const y of gw.yeuCau) {
    const p = promptNguoiDung(y);
    assert.ok(p.length <= 500 + 600, "MH1 AC-4 enrich gửi quá dài");
    kiemThan(p, NHAN_ENRICH, chu, "enrich");
  }
  // Chữ bài ≤ 500 ký tự: thân của tin dài có đúng 500 ký tự đầu (đối chứng dương) và không có dấu nằm sau ký tự 500.
  const dai = gw.yeuCau.map(promptNguoiDung).find((p) => p.includes(ids[0]));
  assert.ok(dai, "MH1 AC-4 không thấy lời gọi của tin dài");
  assert.ok(dai!.includes(chu[0].slice(0, 500)), "MH1 AC-4 thân tin dài thiếu 500 ký tự đầu của chữ bài");
  assert.ok(!dai!.includes(QUA_500), "MH1 AC-4 enrich gửi chữ bài quá 500 ký tự");
});

test("MH1 AC-4 judge (chamMotLuot + queryPair thật) chỉ gửi các dòng đã kê; chiều đỏ: thêm dòng người bán thì đỏ gọi tên trường", async () => {
  const { ids, chu } = await gieoHaiTin();
  // DB thử chép từ máy thu có sẵn hàng trăm cặp chờ: gác chúng (chỉ trong DB thử của lượt, xoá khi lệnh dừng) để chỉ chấm cặp cấy.
  await db.query(`UPDATE property_candidates SET status = 'pending' WHERE status = 'needs_llm' AND NOT (offer_a = ANY($1) AND offer_b = ANY($1))`, [ids]);
  await db.query(`UPDATE review_queue SET status = 'deferred', decided_by = 'mh1-gac' WHERE item_type = 'entity_match' AND status IN ('pending', 'deferred')`);
  gw.datLai();
  process.env.DATABASE_URL = DB;
  const { chamMotLuot } = await import("../scripts/judge-run.js");
  const { queryPair } = await import("../src/tools/native.js");
  const dem = await chamMotLuot(db, { queryPair: (a: string, b: string) => queryPair(a, b, db), recordCall: async () => {} });
  assert.equal(gw.yeuCau.length, 1, `MH1 AC-4 judge phải gọi đúng 1 lời cho cặp cấy (dem ${JSON.stringify(dem)})`);
  const y = gw.yeuCau.find((x) => chu.some((c) => x.thanChu.includes(c.slice(-20))))!;
  assert.ok(y, "MH1 AC-4 không tìm thấy lời gọi judge của cặp cấy");
  const p = promptNguoiDung(y);
  // Dòng «- <lý do>» chỉ qua khi đúng nguyên văn một lý do luật tính cho chính cặp này (buildJudgeInput in `- ${l.cau}`).
  const pair = await queryPair(ids[0], ids[1], db);
  assert.ok(pair, "MH1 AC-4 không đọc được cặp cấy");
  const lyDo = apNguong(pair!).ly_do.map((l) => `- ${l.cau}`);
  assert.ok(lyDo.length > 0 && lyDo.every((d) => p.includes(d)), "MH1 AC-4 thân judge thiếu dòng lý do của luật (đối chứng dương)");
  kiemThan(p, NHAN_JUDGE, chu.map((c) => c.slice(0, 200)), "judge", lyDo);
  // Chiều đỏ trên cùng thân: thêm một dòng người bán như một bản buildJudgeInput hỏng → hàm kiểm đỏ gọi tên trường.
  assert.throws(() => kiemThan(`${p}\n- Người bán: ${NGUOI_BAN}`, NHAN_JUDGE, chu, "judge", lyDo), /MH1 AC-4 judge lộ trường «Trần Văn Cấy»/);
  // Chiều đỏ thứ hai: dòng «- …» mang giá trị KHÔNG cấy (trường lộ mới) → đỏ vì ngoài danh sách nhãn, không nhờ ba chuỗi cấy.
  assert.throws(() => kiemThan(`${p}\n- Ghi chú người đăng: gọi giờ hành chính`, NHAN_JUDGE, chu, "judge", lyDo), /MH1 AC-4 judge có dòng ngoài danh sách: «- Ghi chú người đăng/);
});
