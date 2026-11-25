// collect-s06-duoi.test.mjs — hàm «thu đuôi» S06 (claudedp-2411-6): mốc → tin mới → mốc mới, dừng khi gặp tin đã có.
// Chạy lẻ (không DB, không mạng): cd pipeline && node --test scripts/collect-s06-duoi.test.mjs
// Bốn ca «DB thật» chỉ chạy khi db-thu.sh cấp DATABASE_URL oneinvest_suite_* (bộ test npm test).
//
// CA ĐỎ theo lời giao — bỏ điều kiện «dừng khi gặp tin đã có» trong thuDuoi (vòng for không break) thì đỏ:
//   «trang 1 toàn tin đã có → dừng sau đúng 1 trang» (lấy tới trần 3 trang, nhả tin của trang sau ra tin mới)
//   «trang 1 còn tin mới → lấy trang 2; trang 2 toàn tin đã có → dừng ở trang 2» (lấy nốt trang 3, nhả tin 9)
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  thuDuoi, LUAT_DUNG, LY_DO_DUNG, MA_THOAT, taoItemS06, taoLayTrangS06, ghiSnapshot,
  chayDoi, tinhBaoCao, tinhTiLeBatDuoc, cuaSoDo, baoCao, taoTraStg, quetDuStg, quetDuDaNapXong, moDbChiDoc,
} from "../collect-s06-duoi.mjs";
import { readSnapshot } from "../import-chotot.mjs";

const DB = process.env.DATABASE_URL ?? "";
const tenDb = (() => { try { return decodeURIComponent(new URL(DB.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
if (DB && !/^oneinvest_suite_[a-z0-9_]+$/.test(tenDb)) {
  console.error(`collect-s06-duoi: từ chối DB '${tenDb || "?"}' — ca DB chỉ chạy trên DB thử oneinvest_suite_*`);
  process.exit(2);
}
const CO_DB = /^oneinvest_suite_[a-z0-9_]+$/.test(tenDb);

const T0 = Date.parse("2026-11-24T02:00:00.000Z"); // 09:00 giờ VN 24/11 — mốc giờ giả cho mọi ca
const giay = (s) => T0 + s * 1000;
const ISO = (s) => new Date(giay(s)).toISOString();
// payload nguyên văn theo khuôn nguồn: list_id, list_time (mili-giây), orig_list_time (giờ đăng gốc; đẩy lại thì list_time đổi)
const ad = (list_id, s, extra = {}) => ({ list_id, list_time: giay(s), orig_list_time: giay(s), subject: "tin", ...extra });
const ids = (items) => items.map((i) => i.payload.list_id);
const gocTam = () => mkdtempSync(join(tmpdir(), "s06-duoi-"));

/** Dựng đầu vào thuDuoi theo trang: ghi lại trang đã lấy và id đã hỏi stg. */
function dungMay(trang, { daCo = [], trongStg = [], luatDung, toiDaTrang } = {}) {
  const daLay = [], hoiStg = [];
  return {
    daLay, hoiStg,
    opts: {
      moc: { daCo },
      toiDaTrang, luatDung,
      layTrang: async (so) => { daLay.push(so); return trang[so] ?? []; },
      trongStg: async (idsHoi) => { hoiStg.push(idsHoi); return trongStg.filter((x) => idsHoi.includes(x)); },
      taoItem: taoItemS06({ city: "vn-hcmc", cg: 1000, st: "u", region_v2: 13000, bayGio: () => new Date(giay(300)) }),
    },
  };
}
const tomTatTrang = (r) => r.trang.map((t) => [t.so, t.soTin, t.soDaCo, t.soMoi]);

// ─── thuDuoi: luật dừng ─────────────────────────────────────────────────────────────────────────────────────

test("trang 1 toàn tin đã có → dừng sau đúng 1 trang, 0 tin mới (CA ĐỎ của lời giao)", async () => {
  const m = dungMay({ 1: [ad(101, -600), ad(102, -700)], 2: [ad(201, -800)], 3: [ad(301, -900)] }, { daCo: [101, 102] });
  const r = await thuDuoi(m.opts);
  assert.deepEqual(m.daLay, [1], "không lấy trang 2, 3 khi trang 1 không còn tin mới");
  assert.deepEqual(ids(r.tinMoi), []);
  assert.equal(r.lyDoDung, LY_DO_DUNG.TRANG_TOAN_DA_CO);
});

test("trang 1 còn tin mới → lấy trang 2; trang 2 toàn tin đã có → dừng ở trang 2 (CA ĐỎ của lời giao)", async () => {
  const m = dungMay({
    1: [ad(1, 60), ad(2, 50), ad(101, -600)],
    2: [ad(102, -700), ad(103, -800)],
    3: [ad(9, 40)],
  }, { daCo: [101, 102, 103] });
  const r = await thuDuoi(m.opts);
  assert.deepEqual(m.daLay, [1, 2], "lấy trang 2 rồi dừng, không lấy trang 3");
  assert.deepEqual(ids(r.tinMoi), [1, 2], "chỉ hai tin của trang 1 — tin 9 ở trang 3 không được lấy");
  assert.equal(r.lyDoDung, LY_DO_DUNG.TRANG_TOAN_DA_CO);
  assert.deepEqual(tomTatTrang(r), [[1, 3, 1, 2], [2, 2, 2, 0]]);
  assert.deepEqual([...r.trang[1].daCo], [102, 103]);
});

test("luật gap-da-co: trang 1 vừa tin mới vừa tin đã có → dừng ngay sau trang 1 nhưng vẫn giữ đủ tin mới của trang", async () => {
  const m = dungMay({ 1: [ad(1, 60), ad(101, -600), ad(2, 50)], 2: [ad(9, 40)] }, { daCo: [101], luatDung: LUAT_DUNG.GAP_DA_CO });
  const r = await thuDuoi(m.opts);
  assert.deepEqual(m.daLay, [1]);
  assert.deepEqual(ids(r.tinMoi), [1, 2], "tin mới nằm sau tin đã có trong cùng trang vẫn được lấy");
  assert.equal(r.lyDoDung, LY_DO_DUNG.GAP_DA_CO);
});

test("ba trang đều còn tin mới → dừng vì tới trần 3 trang, không lấy trang 4", async () => {
  const m = dungMay({ 1: [ad(1, 60)], 2: [ad(2, 50)], 3: [ad(3, 40)], 4: [ad(4, 30)] });
  const r = await thuDuoi(m.opts);
  assert.deepEqual(m.daLay, [1, 2, 3]);
  assert.deepEqual(ids(r.tinMoi), [1, 2, 3]);
  assert.equal(r.lyDoDung, LY_DO_DUNG.TOI_DA_TRANG);
});

test("trang rỗng → dừng vì hết trang", async () => {
  const m = dungMay({ 1: [ad(1, 60)], 2: [] });
  const r = await thuDuoi(m.opts);
  assert.deepEqual(m.daLay, [1, 2]);
  assert.equal(r.lyDoDung, LY_DO_DUNG.HET_TRANG);
});

test("chạy lại bằng mốc mới trên cùng danh sách → 0 tin mới, dừng sau 1 trang, không hỏi stg (id đuôi đã thấy)", async () => {
  const danhSach = { 1: [ad(1, 60), ad(2, 50), ad(101, -600)], 2: [ad(102, -700)] };
  const lan1 = dungMay(danhSach, { daCo: [101, 102] });
  await thuDuoi(lan1.opts);
  assert.deepEqual(lan1.hoiStg, [[1, 2]], "lần đầu chỉ hỏi stg về id chưa biết");
  const lan2 = dungMay(danhSach, { daCo: [1, 2, 101, 102] });
  const r2 = await thuDuoi(lan2.opts);
  assert.deepEqual(ids(r2.tinMoi), []);
  assert.deepEqual(lan2.hoiStg, [], "id đuôi đã thấy thì không hỏi stg");
  assert.deepEqual(lan2.daLay, [1]);
});

test("id có trong stg là tin đã có: không ra tin mới, và làm trang đó thành trang đã có", async () => {
  const m = dungMay({ 1: [ad(1, 60), ad(2, 50)], 2: [ad(9, 40)] }, { trongStg: [1, 2] });
  const r = await thuDuoi(m.opts);
  assert.deepEqual(m.hoiStg, [[1, 2]]);
  assert.deepEqual(ids(r.tinMoi), []);
  assert.deepEqual(m.daLay, [1]);
});

test("mốc mới gộp đủ mọi id đã thấy (cũ + mới của mọi trang), không đổi mốc cũ", async () => {
  const m = dungMay({ 1: [ad(1, 60), ad(101, -600)], 2: [ad(2, 50)], 3: [ad(3, 40)], 4: [] }, { daCo: [101] });
  const r = await thuDuoi(m.opts);
  assert.deepEqual([...r.mocMoi.daCo].sort((a, b) => a - b), [1, 2, 3, 101]);
  assert.deepEqual([...m.opts.moc.daCo], [101]);
});

test("tin không có list_id bị bỏ qua; id trùng trong một trang chỉ ra một lần", async () => {
  const m = dungMay({ 1: [ad(1, 60), { subject: "hong id" }, ad(1, 60), ad(101, -600)], 2: [] }, { daCo: [101] });
  const r = await thuDuoi(m.opts);
  assert.deepEqual(ids(r.tinMoi), [1]);
  // trang 1: hai id hợp lệ (1 và 101), một đã có; trang 2 rỗng là trang dừng «hết trang»
  assert.deepEqual(tomTatTrang(r), [[1, 2, 1, 1], [2, 0, 0, 0]]);
});

test("bị chặn ở trang 2 sau khi trang 1 đã có tin mới → trả nửa phần tin mới kèm lỗi dungLuot, mốc mới giữ đủ", async () => {
  const m = dungMay({}, { daCo: [101] });
  m.opts.layTrang = async (so) => {
    if (so === 2) throw Object.assign(new Error("page 2: HTTP 429"), { dungLuot: true });
    return so === 1 ? [ad(1, 60), ad(101, -600)] : [];
  };
  const r = await thuDuoi(m.opts);
  assert.deepEqual(ids(r.tinMoi), [1]);
  assert.equal(r.loi.dungLuot, true);
  assert.equal(r.lyDoDung, null);
  assert.deepEqual([...r.mocMoi.daCo].sort((a, b) => a - b), [1, 101]);
});

test("tin mới mang đúng khuôn item của bộ thu hằng ngày S06 (nguồn, sourceId, meta vùng — mục — trang)", async () => {
  const payload = ad(1, 60);
  const m = dungMay({ 1: [payload], 2: [] }, {});
  const it = (await thuDuoi(m.opts)).tinMoi[0];
  assert.equal(it.source, "chotot-ads");
  assert.equal(it.sourceId, "ct-1");
  assert.equal(it.kind, "ad");
  assert.equal(it.fetchedAt, ISO(300));
  assert.equal(it.payload, payload, "payload nguyên văn, không đổi");
  assert.deepEqual(it.meta, { city: "vn-hcmc", region_v2: 13000, cg: 1000, st: "u", page: 1 });
  const vungTinh = dungMay({ 1: [ad(5, 60)], 2: [] }, {});
  vungTinh.opts.taoItem = taoItemS06({ city: "vn-binh-duong", cg: 1010, st: "s", region: 2 });
  assert.deepEqual((await thuDuoi(vungTinh.opts)).tinMoi[0].meta, { city: "vn-binh-duong", region: 2, cg: 1010, st: "s", page: 1 });
});

// ─── Bộ lấy trang S06: lời gọi nguồn ────────────────────────────────────────────────────────────────────────

// Giả y hệt response của fetch: json() ném SyntaxError khi thân là HTML
const phanHoi = (status, body) => ({
  ok: status >= 200 && status < 300, status,
  json: async () => { if (typeof body === "string") throw new SyntaxError("Unexpected token <"); return body; },
});
/** Nguồn giả: mỗi lời trả lần lượt theo mảng (phần tử cuối lặp lại); ghi URL, đếm lời, ghi mọi lần nghỉ. */
function layGia(cacPhanHoi, vung = { region_v2: 13000 }) {
  const url = []; let soLan = 0; const nghi = []; const loiGoi = [];
  const lay = taoLayTrangS06({
    api: "http://gia.invalid/v1/public/ad-listing", vung, feed: { cg: 1000, st: "u" },
    fetchImpl: async (u) => {
      url.push(String(u));
      const p = cacPhanHoi[Math.min(soLan, cacPhanHoi.length - 1)];
      soLan++;
      if (p instanceof Error) throw p;
      return p;
    },
    sleep: async (ms) => nghi.push(ms), khiLoiGoi: (x) => loiGoi.push(x),
  });
  return { lay, url, get soLan() { return soLan; }, nghi, loiGoi };
}
// Chỉ lấy thời gian lùi khi thử lại (1,5 s và 3 s); nghỉ trước lời gọi là 2–4 s
const luiThuLai = (g) => g.nghi.filter((ms) => ms === 1500 || ms === 3000);

test("429 và 403 → ném dungLuot ngay sau đúng 1 lời, không thử lại", async () => {
  for (const status of [429, 403]) {
    const g = layGia([phanHoi(status, "<html>")]);
    await assert.rejects(g.lay(1), (e) => e.dungLuot === true, `HTTP ${status} phải đánh dấu dungLuot`);
    assert.equal(g.soLan, 1, `HTTP ${status}: đúng một lời`);
    assert.deepEqual(luiThuLai(g), [], `HTTP ${status}: không thử lại`);
  }
});

test("trả trang HTML kèm 200 (trang thử thách) → coi là bị chặn, ném dungLuot sau đúng 1 lời", async () => {
  const g = layGia([phanHoi(200, "<html>xac minh</html>")]);
  await assert.rejects(g.lay(1), (e) => e.dungLuot === true);
  assert.equal(g.soLan, 1);
});

test("lỗi mạng → thử lại tới đủ 3 lần rồi ném lỗi thường (không phải bị chặn)", async () => {
  const g = layGia([new TypeError("fetch failed")]);
  await assert.rejects(g.lay(1), (e) => e.dungLuot === undefined && /3 lần/.test(e.message));
  assert.equal(g.soLan, 3);
  assert.deepEqual(luiThuLai(g), [1500, 3000], "lùi 1,5 s rồi 3 s giữa các lần thử");
});

test("5xx → thử lại 3 lần rồi ném lỗi thường; lỗi 5xx không coi là bị chặn", async () => {
  const g = layGia([phanHoi(502, "<html>bad gateway</html>")]);
  await assert.rejects(g.lay(1), (e) => e.dungLuot === undefined);
  assert.equal(g.soLan, 3);
});

test("lỗi mạng một lần rồi nguồn trả lại bình thường → lấy được trang, đã thử 2 lời", async () => {
  const g = layGia([new TypeError("fetch failed"), phanHoi(200, { ads: [ad(7, 60)], total: 1 })]);
  assert.deepEqual(await g.lay(1), [ad(7, 60)]);
  assert.equal(g.soLan, 2);
});

test("URL mang đúng vùng, mục, số trang, cỡ trang — y hệt cách bộ thu hằng ngày nhìn danh sách", async () => {
  const cu = layGia([phanHoi(200, { ads: [] })]);
  const tinh = layGia([phanHoi(200, { ads: [] })], { region: 2 });
  await cu.lay(2);
  await tinh.lay(1);
  assert.equal(new URL(cu.url[0]).pathname, "/v1/public/ad-listing");
  assert.deepEqual(Object.fromEntries(new URL(cu.url[0]).searchParams), {
    region_v2: "13000", cg: "1000", st: "u", o: "100", page: "2", limit: "50", key_param_included: "true",
  });
  const q2 = new URL(tinh.url[0]).searchParams;
  assert.equal(q2.get("region"), "2");
  assert.equal(q2.has("region_v2"), false, "vùng tỉnh chỉ mang region, không mang region_v2");
});

test("được cấm lời gọi (trần lời gọi) → không gọi nguồn, ném lỗi vuotTran", async () => {
  const layChan = taoLayTrangS06({
    api: "http://gia.invalid/v1/public/ad-listing", vung: { region_v2: 13000 }, feed: { cg: 1000, st: "u" },
    fetchImpl: async () => { throw new Error("không được gọi nguồn"); }, sleep: async () => {},
    truocLoiGoi: () => false,
  });
  await assert.rejects(layChan(1), (e) => e.vuotTran === true);
});

test("mỗi lần gọi nguồn được báo một lần qua khiLoiGoi (kể cả lần thử lại), kèm trang, lượt thử, mã HTTP, mili-giây", async () => {
  const g = layGia([new TypeError("fetch failed"), phanHoi(200, { ads: [ad(7, 60)] })]);
  await g.lay(3);
  assert.deepEqual(g.loiGoi.map((x) => [x.trang, x.lan, x.http]), [[3, 1, null], [3, 2, 200]]);
  assert.ok(g.loiGoi.every((x) => typeof x.ms === "number" && x.ms >= 0));
});

test("nghỉ trước mỗi lời gọi từ 2 giây — chậm hơn nhịp 0,6–1,8 giây của lượt quét đủ", async () => {
  let tongNghi = 0, soNghi = 0;
  const lay = taoLayTrangS06({
    api: "http://gia.invalid/v1/public/ad-listing", vung: { region_v2: 13000 }, feed: { cg: 1000, st: "u" },
    fetchImpl: async () => phanHoi(200, { ads: [ad(7, 60)] }), sleep: async (ms) => { tongNghi += ms; soNghi++; },
    ngauNhien: () => 0,
  });
  await lay(1);
  assert.equal(soNghi, 1, "một lời = một lần nghỉ, đứng trước lời gọi");
  assert.equal(tongNghi, 2000, "số ngẫu nhiên 0 → nghỉ đúng 2 giây");
});

test("số ngẫu nhiên gần 1 → nghỉ không quá 4 giây", async () => {
  let tongNghi = 0;
  const lay = taoLayTrangS06({
    api: "http://gia.invalid/v1/public/ad-listing", vung: { region_v2: 13000 }, feed: { cg: 1000, st: "u" },
    fetchImpl: async () => phanHoi(200, { ads: [] }), sleep: async (ms) => { tongNghi += ms; }, ngauNhien: () => 0.999999,
  });
  await lay(1);
  assert.equal(tongNghi, 3999);
});

// ─── Snapshot: khuôn DATA-CONTRACT ───────────────────────────────────────────────────────────────────────────

test("snapshot đuôi ghi đúng khuôn DATA-CONTRACT và bộ nạp S06 đọc lại được nguyên vẹn", async () => {
  const goc = gocTam();
  try {
    const payload = ad(1, 60);
    const items = [taoItemS06({ city: "vn-hcmc", cg: 1000, st: "u", region_v2: 13000, bayGio: () => new Date(giay(300)) })(payload, 1)];
    const m = await ghiSnapshot({ goc, city: "hcmc", items, coverage: { discovered: 50, failed: 0, notes: ["thu-duoi 1000/u"] }, bayGio: () => new Date(giay(305)) });
    assert.match(m.snapshotId, /^hcmc__chotot-ads__\d{4}-\d{2}-\d{2}T\d{6}$/);
    const thuMuc = join(goc, "snapshots", "hcmc", m.snapshotId);
    assert.deepEqual(readdirSync(thuMuc).sort(), ["items-0001.json.gz", "manifest.json"]);
    assert.equal(m.schemaVersion, 1);
    assert.equal(m.source, "chotot-ads");
    assert.equal(m.finishedAt, ISO(305));
    assert.deepEqual(m.counts, { items: 1, failed: 0 });
    assert.deepEqual(m.coverage.methods, { gatewayApi: 1 });
    assert.equal(m.files.length, 1);
    // Bộ nạp thật: kiểm sha256 từng tệp rồi đọc — snapshot đuôi phải đi qua được
    const docLai = await readSnapshot(thuMuc);
    assert.deepEqual(docLai.items, items);
    assert.equal(docLai.manifest.snapshotId, m.snapshotId);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("hai snapshot cùng thành phố trong cùng một giây → thêm hậu tố -1, bản trước không bị ghi đè (raw bất biến)", async () => {
  const goc = gocTam();
  const bayGio = () => new Date(giay(305));
  try {
    const tao = taoItemS06({ city: "vn-hcmc", cg: 1000, st: "u", region_v2: 13000, bayGio });
    const m1 = await ghiSnapshot({ goc, city: "hcmc", items: [tao(ad(1, 60), 1)], coverage: {}, bayGio });
    const m2 = await ghiSnapshot({ goc, city: "hcmc", items: [tao(ad(2, 59), 1)], coverage: {}, bayGio });
    assert.notEqual(m1.snapshotId, m2.snapshotId);
    assert.equal(m2.snapshotId, `${m1.snapshotId}-1`);
    assert.deepEqual(ids((await readSnapshot(join(goc, "snapshots", "hcmc", m1.snapshotId))).items), [1], "bản thứ nhất còn nguyên");
    assert.deepEqual(ids((await readSnapshot(join(goc, "snapshots", "hcmc", m2.snapshotId))).items), [2]);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

// ─── chayDoi: vòng lặp của phép đo ──────────────────────────────────────────────────────────────────────────

/** DB giả theo hợp đồng pg ({ rows }) cho đúng những câu hàm dùng: cổng vòng đời và tra stg. */
function dbGia({ chay = true, stg = [] } = {}) {
  const cau = [];
  const db = {
    cau,
    query: async (sql, params = []) => {
      cau.push(sql.trim().split(/\s+/).slice(0, 4).join(" "));
      if (/FROM source_registry/.test(sql)) return { rows: [{ code: "S06", status: chay ? "active" : "paused" }] };
      if (/FROM source_groups/.test(sql)) return { rows: [{ status: "active" }] };
      if (/FROM stg_chotot_ads/.test(sql)) return { rows: params[0].filter((x) => stg.includes(x)).map((list_id) => ({ list_id })) };
      throw new Error(`db giả không biết câu: ${sql}`);
    },
    dong: async () => { cau.push("ROLLBACK"); },
  };
  return { db, cau, mo: async () => { cau.push("BEGIN READ ONLY"); return db; } };
}
const VUNG = { group_key: "hcmc", region_v2: 13000, cityCode: "vn-hcmc" };
const FEED = { cg: 1000, st: "u" };
/** Đồng hồ giả: bắt đầu ở T0, mỗi lần ngủ tiến đúng số mili-giây. */
function dongHo() {
  let t = T0;
  return { bayGio: () => t, sleep: async (ms) => { t += ms; }, get now() { return t; } };
}
const docNhatKy = (goc) => readFileSync(join(goc, "nhat-ky.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
const docMoc = (goc) => JSON.parse(readFileSync(join(goc, "moc.json"), "utf8")).daCo;
const docTrangThai = (goc) => JSON.parse(readFileSync(join(goc, "trang-thai.json"), "utf8"));
// Hợp đồng của bộ lấy trang trong chayDoi: hỏi phép TRƯỚC mỗi lời gọi nguồn; không được phép thì không gọi và ném vuotTran
const xinPhep = (truocLoiGoi) => { if (!truocLoiGoi()) throw Object.assign(new Error("vượt trần lời gọi"), { vuotTran: true }); };
const mayTrang = (trang) => ({ truocLoiGoi }) => async (so) => { xinPhep(truocLoiGoi); return trang[so] ?? []; };

test("một lượt: qua cổng rồi mới tra stg và gọi nguồn, ghi snapshot khi có tin mới, lưu mốc, nhật ký một dòng phien", async () => {
  const goc = gocTam();
  const d = dbGia({ stg: [101, 102] });
  const thuTu = d.cau; // cùng một mảng: mọi câu DB và mọi lời gọi nguồn được đẩy vào theo đúng thứ tự xảy ra
  const baoQua = [];
  try {
    const r = await chayDoi({
      vung: VUNG, feed: FEED, goc, motLan: true, moDb: d.mo,
      bao: (dong) => baoQua.push(dong),
      // bộ lấy trang THẬT, chỉ HTTP là giả — để kiểm cả việc báo số lần thử và mã HTTP vào nhật ký
      taoLayTrang: (x) => taoLayTrangS06({
        api: "http://gia.invalid/v1/public/ad-listing", vung: { region_v2: 13000 }, feed: FEED, ...x, sleep: async () => {},
        fetchImpl: async (u) => {
          const trang = Number(new URL(u).searchParams.get("page"));
          thuTu.push(`nguon trang ${trang}`);
          return phanHoi(200, { ads: trang === 1 ? [ad(1, 60), ad(101, -600)] : [ad(102, -700)] });
        },
      }),
      ...dongHo(),
    });
    assert.equal(r.ma, MA_THOAT.XONG);
    assert.equal(r.soPhien, 1);
    assert.equal(r.soLoiGoi, 2);
    assert.deepEqual(thuTu.slice(0, 3), ["BEGIN READ ONLY", "SELECT code, status FROM", "SELECT status FROM source_groups"], "cổng vòng đời hỏi trước mọi lời gọi nguồn");
    assert.equal(thuTu.at(-1), "ROLLBACK", "phiên chỉ đọc được đóng gọn sau lượt");
    assert.ok(thuTu.indexOf("SELECT list_id FROM stg_chotot_ads") < thuTu.indexOf("nguon trang 2"), "trang sau chỉ lấy khi trang trước còn tin mới");
    const snap = readdirSync(join(goc, "snapshots", "hcmc"));
    assert.equal(snap.length, 1, "một lượt có tin mới → đúng một snapshot");
    assert.match(snap[0], /^hcmc__chotot-ads__\d{4}-\d{2}-\d{2}T\d{6}$/);
    assert.deepEqual(ids((await readSnapshot(join(goc, "snapshots", "hcmc", snap[0]))).items), [1], "snapshot chỉ chứa tin mới");
    assert.deepEqual(docMoc(goc), [1], "mốc lưu id đuôi đã thấy");
    const dong = docNhatKy(goc);
    assert.equal(dong.length, 1);
    assert.equal(dong[0].k, "phien");
    assert.equal(dong[0].phien, 1);
    assert.equal(dong[0].lyDoDung, LY_DO_DUNG.TRANG_TOAN_DA_CO);
    assert.equal(dong[0].soLoiGoi, 2);
    assert.deepEqual(dong[0].tinMoi, [1]);
    assert.deepEqual(dong[0].trang.map((t) => [t.so, t.soLan, t.http, t.soDaCo, t.soMoi]), [[1, 1, 200, 1, 1], [2, 1, 200, 1, 0]]);
    assert.deepEqual(dong[0].trang[0].tin, [[1, giay(60), giay(60), 0], [101, giay(-600), giay(-600), 1]], "nhật ký giữ từng mục: id, list_time, orig_list_time, đã có hay chưa");
    assert.equal(dong[0].trang[0].luc, ISO(0), "ghi cả giờ lấy trang để tính độ trễ");
    assert.equal(dong[0].snapshot, snap[0]);
    assert.deepEqual([docTrangThai(goc).trangThai, docTrangThai(goc).soPhien, docTrangThai(goc).soLoiGoi], ["xong", 1, 2], "tệp trạng thái để theo dõi từ xa");
    assert.deepEqual(baoQua, ["phien 1 · tin moi 1 · loi goi 2 · dung: trang-toan-da-co"], "một dòng tóm tắt mỗi lượt, chỉ mã và số");
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("lượt không có tin mới → không ghi snapshot, vẫn ghi nhật ký", async () => {
  const goc = gocTam();
  try {
    await chayDoi({ vung: VUNG, feed: FEED, goc, motLan: true, moDb: dbGia({ stg: [101] }).mo, taoLayTrang: mayTrang({ 1: [ad(101, -600)] }), ...dongHo() });
    assert.equal(existsSync(join(goc, "snapshots")), false, "không sinh thư mục snapshot khi không có tin mới");
    const d = docNhatKy(goc)[0];
    assert.deepEqual(d.tinMoi, []);
    assert.equal(d.snapshot, null);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("dry: không ghi snapshot nhưng vẫn ghi mốc và nhật ký (xem thử mà không sinh raw)", async () => {
  const goc = gocTam();
  try {
    await chayDoi({ vung: VUNG, feed: FEED, goc, motLan: true, dry: true, moDb: dbGia().mo, taoLayTrang: mayTrang({ 1: [ad(1, 60)] }), ...dongHo() });
    assert.equal(existsSync(join(goc, "snapshots")), false);
    assert.deepEqual(docMoc(goc), [1]);
    assert.deepEqual(docNhatKy(goc)[0].tinMoi, [1]);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("cổng vòng đời đóng (nguồn tạm dừng) → 0 lời gọi nguồn, thoát mã 4", async () => {
  const goc = gocTam();
  let denCuaNguon = 0;
  try {
    const r = await chayDoi({
      vung: VUNG, feed: FEED, goc, moDb: dbGia({ chay: false }).mo,
      taoLayTrang: () => async () => { denCuaNguon++; return []; }, ...dongHo(),
    });
    assert.equal(r.ma, MA_THOAT.CONG_DONG);
    assert.equal(denCuaNguon, 0, "không gọi nguồn khi cổng đóng");
    assert.equal(r.soPhien, 0);
    assert.equal(docTrangThai(goc).trangThai, "cong-dong");
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("DB không mở được → bỏ qua lượt đó, 0 lời gọi nguồn, lượt sau vẫn chạy (fail-closed)", async () => {
  const goc = gocTam();
  let moLan = 0, denCuaNguon = 0;
  const d = dbGia();
  try {
    const r = await chayDoi({
      vung: VUNG, feed: FEED, goc, nhapPhut: 5, thoiGianPhut: 15,
      moDb: async () => { if (++moLan === 1) throw new Error("ECONNREFUSED"); return d.mo(); },
      taoLayTrang: () => async () => { denCuaNguon++; return []; }, ...dongHo(),
    });
    assert.equal(r.ma, MA_THOAT.XONG);
    assert.equal(denCuaNguon, 2, "hai lượt sau lượt hỏng vẫn gọi nguồn");
    const dong = docNhatKy(goc);
    assert.equal(dong.length, 3);
    assert.deepEqual(dong.map((x) => x.dbLoi ?? 0), [1, 0, 0]);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("lỗi mạng ở lượt 1 → bỏ lượt đó, lượt 2 vẫn chạy, thoát 0", async () => {
  const goc = gocTam();
  let phien = 0;
  try {
    const r = await chayDoi({
      vung: VUNG, feed: FEED, goc, nhapPhut: 5, thoiGianPhut: 10, moDb: dbGia().mo,
      taoLayTrang: ({ truocLoiGoi }) => async () => { xinPhep(truocLoiGoi); if (++phien === 1) throw new TypeError("fetch failed"); return [ad(2, 50)]; },
      ...dongHo(),
    });
    assert.equal(r.ma, MA_THOAT.XONG);
    const dong = docNhatKy(goc);
    assert.equal(dong.length, 2);
    assert.match(dong[0].loiNguon, /fetch failed/);
    assert.deepEqual(dong[0].tinMoi, []);
    assert.deepEqual(dong[1].tinMoi, [2]);
    assert.equal(r.soLuotLoi, 1, "một lượt hỏng vì lỗi nguồn thường");
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("bị chặn (429) giữa phép đo → giữ snapshot phần đã lấy của lượt đó, dừng cả phép đo, thoát mã 3", async () => {
  const goc = gocTam();
  let phien = 0;
  try {
    const r = await chayDoi({
      vung: VUNG, feed: FEED, goc, nhapPhut: 5, thoiGianPhut: 60, moDb: dbGia().mo,
      taoLayTrang: ({ truocLoiGoi }) => async (so) => {
        xinPhep(truocLoiGoi);
        if (so === 1) phien++;
        if (phien === 2 && so === 2) throw Object.assign(new Error("page 2: HTTP 429"), { dungLuot: true });
        return so === 1 ? [ad(phien, 60)] : [];
      }, ...dongHo(),
    });
    assert.equal(r.ma, MA_THOAT.BI_CHAN);
    assert.equal(r.biChan, 1);
    assert.equal(phien, 2, "lượt thứ hai bị chặn thì không có lượt thứ ba");
    const snap = readdirSync(join(goc, "snapshots", "hcmc"));
    assert.equal(snap.length, 2, "lượt bị chặn vẫn ghi snapshot cho tin mới đã lấy ở trang 1");
    const dong = docNhatKy(goc);
    const p2 = dong.find((x) => x.k === "phien" && x.phien === 2);
    assert.equal(p2.chan, 1);
    assert.deepEqual(p2.tinMoi, [2]);
    assert.ok(snap.includes(p2.snapshot));
    assert.ok(dong.some((x) => x.k === "chan"), "một dòng chan riêng để thấy ngay khi đọc nhật ký");
    assert.equal(docTrangThai(goc).trangThai, "bi-chan");
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("vượt trần lời gọi → dừng, thoát mã 5, không gọi nguồn vượt trần", async () => {
  const goc = gocTam();
  let denCuaNguon = 0;
  try {
    const r = await chayDoi({
      vung: VUNG, feed: FEED, goc, toiDaLoi: 1, moDb: dbGia().mo,
      taoLayTrang: ({ truocLoiGoi }) => async () => { xinPhep(truocLoiGoi); denCuaNguon++; return [ad(1, 60), ad(2, 50), ad(3, 40)]; },
      ...dongHo(),
    });
    assert.equal(r.ma, MA_THOAT.VUOT_TRAN_LOI);
    assert.equal(denCuaNguon, 1, "trần 1 lời: trang 2 bị cấm nên nguồn chỉ thấy một lời");
    assert.equal(r.soLoiGoi, 1);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("nhịp: lượt kế bắt đầu đúng mỗi 5 phút kể từ mốc bắt đầu, hết thời gian đo thì dừng", async () => {
  const goc = gocTam();
  const dh = dongHo();
  const batDau = [];
  try {
    const r = await chayDoi({
      vung: VUNG, feed: FEED, goc, nhapPhut: 5, thoiGianPhut: 24, moDb: dbGia().mo,
      taoLayTrang: ({ truocLoiGoi }) => async (so) => { xinPhep(truocLoiGoi); if (so === 1) batDau.push(dh.now); return []; },
      ...dh,
    });
    assert.equal(r.ma, MA_THOAT.XONG);
    assert.deepEqual(batDau.map((t) => (t - T0) / 60000), [0, 5, 10, 15, 20], "năm lượt trong 24 phút, đúng nhịp 5 phút");
    assert.equal(r.soPhien, 5);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("không ngủ sau lượt cuối: hết thời gian đo là dừng ngay, đúng số lượt của cửa sổ", async () => {
  const goc = gocTam();
  const dh = dongHo();
  const batDau = [];
  try {
    const r = await chayDoi({
      vung: VUNG, feed: FEED, goc, nhapPhut: 1, thoiGianPhut: 2, moDb: dbGia().mo,
      taoLayTrang: ({ truocLoiGoi }) => async (so) => { xinPhep(truocLoiGoi); if (so === 1) batDau.push(dh.now); return []; },
      ...dh,
    });
    assert.deepEqual(batDau.map((t) => (t - T0) / 60000), [0, 1], "hai lượt: ở phút 0 và phút 1 — mốc 2 phút là hết cửa sổ");
    assert.equal(dh.now, T0 + 60_000, "lượt cuối xong là dừng ngay, không ngủ nốt một nhịp");
    assert.equal(r.soPhien, 2);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("chạy tiếp phép đo cũ: nạp lại mốc đã lưu, tin đã thấy ở lần chạy trước không ra lần nữa, đánh số lượt tiếp tục", async () => {
  const goc = gocTam();
  const danhSach = { 1: [ad(1, 60), ad(2, 50)] };
  try {
    await chayDoi({ vung: VUNG, feed: FEED, goc, motLan: true, moDb: dbGia().mo, taoLayTrang: mayTrang(danhSach), ...dongHo() });
    await chayDoi({ vung: VUNG, feed: FEED, goc, motLan: true, moDb: dbGia().mo, taoLayTrang: mayTrang(danhSach), ...dongHo() });
    const dong = docNhatKy(goc);
    assert.equal(dong.length, 2, "nhật ký nối tiếp, không ghi đè");
    assert.deepEqual(dong[1].tinMoi, [], "lần chạy sau không nhắc lại tin đã thấy");
    assert.equal(dong[1].phien, 2, "đánh số lượt tiếp tục, không đếm lại từ 1");
    assert.deepEqual(docMoc(goc), [1, 2]);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

// ─── Báo cáo: bốn số của phép đo ─────────────────────────────────────────────────────────────────────────────

// Nhật ký viết tay, KHÔNG qua mã đang kiểm. Lượt 1: ba trang (trang 2 thử lại một lần) → 4 lời; lượt 2: hai trang → 2 lời;
// lượt 3: bị chặn ngay lời đầu → 1 lời. Mục = [id, list_time, orig_list_time, đã có (1) hay mới (0)].
const NHAT_KY = [
  { k: "phien", phien: 1, batDau: ISO(300), ketThuc: ISO(310), soLoiGoi: 4, soLoi: 1, chan: 0, dbLoi: 0, lyDoDung: "trang-toan-da-co", snapshot: "hcmc__chotot-ads__2026-11-24T020500", tinMoi: [1, 2, 4],
    trang: [
      { so: 1, luc: ISO(301), soLan: 1, soTin: 3, soDaCo: 1, soMoi: 2, tin: [[1, giay(60), giay(60), 0], [2, giay(59), giay(59), 0], [101, giay(-600), giay(-9000), 1]] },
      { so: 2, luc: ISO(303), soLan: 2, soTin: 2, soDaCo: 1, soMoi: 1, tin: [[102, giay(-700), giay(-700), 1], [4, giay(58), giay(58), 0]] },
      { so: 3, luc: ISO(305), soLan: 1, soTin: 1, soDaCo: 1, soMoi: 0, tin: [[103, giay(-800), giay(-800), 1]] },
    ] },
  { k: "phien", phien: 2, batDau: ISO(600), ketThuc: ISO(604), soLoiGoi: 2, soLoi: 0, chan: 0, dbLoi: 0, lyDoDung: "trang-toan-da-co", snapshot: "hcmc__chotot-ads__2026-11-24T021000", tinMoi: [3, 9, 10, 11, 12],
    trang: [
      { so: 1, luc: ISO(601), soLan: 1, soTin: 5, soDaCo: 1, soMoi: 4, tin: [[3, giay(400), giay(400), 0], [9, giay(500), giay(-80000), 0], [10, giay(-30), giay(-30), 0], [11, giay(-20), null, 0], [102, giay(-700), giay(-700), 1]] },
      { so: 2, luc: ISO(603), soLan: 1, soTin: 2, soDaCo: 1, soMoi: 1, tin: [[103, giay(-800), giay(-800), 1], [12, giay(590), null, 0]] },
    ] },
  { k: "phien", phien: 3, batDau: ISO(900), ketThuc: ISO(900), soLoiGoi: 1, soLoi: 0, chan: 1, dbLoi: 0, lyDoDung: null, snapshot: null, tinMoi: [],
    trang: [{ so: 1, luc: ISO(900), soLan: 1, soTin: 0, soDaCo: 0, soMoi: 0, http: 429, tin: [] }] },
  { k: "chan", phien: 3, luc: ISO(900) },
];

test("báo cáo tính đúng lời gọi/phút, p50/p90 độ trễ đăng → thu, số lần bị chặn và lời của từng luật dừng", () => {
  const b = tinhBaoCao(NHAT_KY, { t0: T0, t1: T0 + 24 * 3600 * 1000 });
  assert.equal(b.soPhien, 3);
  assert.equal(b.soPhienThanhCong, 2);
  assert.equal(b.soLoiGoi, 7, "4 + 2 + 1 lời");
  assert.equal(b.soLoi, 1, "một lần thử lại hỏng");
  assert.equal(b.biChan, 1);
  assert.equal(b.soPhut, 10, "05:00 → 15:00");
  assert.equal(b.loiGoiMoiPhut, 0.7);
  // độ trễ (giây): tin 1: 301−60=241 · tin 2: 301−59=242 · tin 4: 303−58=245 · tin 3: 601−400=201
  // tin 9 đăng trước t0 (cũ đẩy lại) nên không tính; bốn số trên xếp [201, 241, 242, 245]
  // độ trễ của tin 12: 603 − 590 = 13 giây → năm số [13, 201, 241, 242, 245]: p50 = 241, p90 = 245
  assert.deepEqual(b.doTre, { soLuong: 5, p50: 241, p90: 245 });
  assert.equal(b.tinMoiDang, 5, "năm tin mới đăng trong cửa sổ đo — kể cả tin 12 chưa có giờ đăng gốc");
  // ba mục máy chưa có nhưng không phải tin mới đăng của cửa sổ: 9 = cũ đẩy lại (list_time − orig 80.500 giây),
  // 10 = đăng 30 giây trước t0, 11 = đăng 20 giây trước t0 và chưa bị đẩy lại (không có orig_list_time)
  assert.equal(b.truocCuaSo, 3, "mục máy chưa có nhưng đăng trước cửa sổ đo (kể cả cũ đẩy lại)");
  assert.deepEqual([b.dayLaiCu, b.tronLuaDau], [1, 2]);
  // tuổi mục mới nhất ở đầu trang 1: lượt 1 lấy lúc 301 s, mục mới nhất 60 s → 241 giây; lượt 2: 601 − 500 = 101 giây
  // hai số [101, 241]: hạng gần nhất của p50 là số thứ nhất
  assert.deepEqual(b.dinhMoiNhat, { soLuong: 2, min: 101, p50: 101 });
  assert.deepEqual(b.luat["trang-toan-da-co"], { soTrang: 5, boSot: 0 });
  // luật gap-da-co dừng sau trang 1 ở cả hai lượt → 2 lời; tin 4 (lượt 1, trang 2) và tin 12 (lượt 2, trang 2) nằm sau điểm dừng
  assert.deepEqual(b.luat["gap-da-co"], { soTrang: 2, boSot: 2 });
});

test("báo cáo bỏ qua độ trễ âm (giờ nguồn lệch) và không tính tin đăng trước cửa sổ đo là tin mới", () => {
  const dong = [{ k: "phien", phien: 1, batDau: ISO(300), ketThuc: ISO(301), soLoiGoi: 1, soLoi: 0, chan: 0, dbLoi: 0, tinMoi: [1, 2],
    trang: [{ so: 1, luc: ISO(300), soLan: 1, soTin: 2, soDaCo: 0, soMoi: 2, tin: [[1, giay(400), giay(400), 0], [2, giay(-60), giay(-60), 0]] }] }];
  const b = tinhBaoCao(dong, { t0: T0, t1: T0 + 3600 * 1000 });
  assert.deepEqual(b.doTre, { soLuong: 0, p50: null, p90: null });
  assert.equal(b.doTreAm, 1, "tin 1 có list_time sau giờ lấy (lệch giờ nguồn): bỏ khỏi độ trễ, có đếm");
  assert.equal(b.tinMoiDang, 1, "chỉ tin 1 là tin mới đăng trong cửa sổ");
  assert.equal(b.truocCuaSo, 1, "tin 2 đăng trước t0: không là tin mới của cửa sổ, có đếm");
});

test("báo cáo: lượt hỏng DB và lượt lỗi mạng không là bị chặn, không là lượt chạy được, nhưng vẫn tính lời gọi", () => {
  const dong = [
    { k: "phien", phien: 1, batDau: ISO(0), ketThuc: ISO(0), soLoiGoi: 0, soLoi: 0, chan: 0, dbLoi: 1, lyDoDung: null, tinMoi: [], trang: [] },
    { k: "phien", phien: 2, batDau: ISO(300), ketThuc: ISO(300), soLoiGoi: 3, soLoi: 3, chan: 0, dbLoi: 0, loiNguon: "fetch failed", lyDoDung: null, tinMoi: [], trang: [] },
  ];
  const b = tinhBaoCao(dong, { t0: T0, t1: T0 + 3600 * 1000 });
  assert.equal(b.soPhien, 2);
  assert.equal(b.soPhienThanhCong, 0, "cả hai lượt đều hỏng nên không lượt nào chạy được");
  assert.equal(b.soLuotLoi, 1, "một lượt hỏng vì lỗi nguồn thường");
  assert.equal(b.soLoi, 3);
  assert.equal(b.biChan, 0);
  assert.equal(b.loiGoiMoiPhut, 0.6, "3 lời trong 5 phút (0 → 5:00)");
});

test("tệp trạng thái có ngay từ đầu phép đo (dang-chay) để theo dõi giữa chừng, rồi chuyển xong khi hết", async () => {
  const goc = gocTam();
  let thay;
  try {
    await chayDoi({
      vung: VUNG, feed: FEED, goc, motLan: true, moDb: dbGia().mo,
      taoLayTrang: ({ truocLoiGoi }) => async () => { xinPhep(truocLoiGoi); thay = docTrangThai(goc); return []; }, ...dongHo(),
    });
    assert.equal(thay.trangThai, "dang-chay", "khi lượt đầu đang chạy đã có tệp trạng thái");
    assert.equal(thay.soPhien, 0);
    assert.equal(thay.hetHan, new Date(T0 + 1440 * 60_000).toISOString(), "ghi luôn giờ dự kiến kết thúc");
    assert.equal(docTrangThai(goc).trangThai, "xong");
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test("cửa sổ của báo cáo: dừng ở giờ kết thúc thật nếu sớm hơn dự kiến, không vượt hiện tại", () => {
  const dong = [NHAT_KY[0], NHAT_KY[1], NHAT_KY[2]]; // lượt cuối ghi ketThuc ở giây 900
  const du = { batDau: ISO(0), hetHan: ISO(3600) };
  assert.deepEqual(cuaSoDo(du, dong, () => T0 + 7200_000), { t0: T0, t1: T0 + 900_001 }, "từ giờ bắt đầu tới ngay sau lượt cuối (chặn sớm)");
  assert.deepEqual(cuaSoDo(du, dong, () => T0 + 600_000), { t0: T0, t1: T0 + 600_000 }, "đang chạy giữa chừng thì dừng ở hiện tại");
  // chưa có tệp trạng thái (phiên cũ chỉ ghi lúc kết thúc): vẫn tính được từ nhật ký
  assert.deepEqual(cuaSoDo({ batDau: ISO(0), hetHan: null }, dong, () => T0 + 7200_000), { t0: T0, t1: T0 + 900_001 });
  assert.throws(() => cuaSoDo({ batDau: ISO(0), hetHan: null }, [{ k: "chan" }], () => T0), /chưa có lượt nào/);
});

test("cửa sổ của báo cáo: không truyền đồng hồ thì lấy giờ hiện tại của máy", () => {
  const bayGio = Date.now();
  const dong = [{ k: "phien", phien: 1, batDau: new Date(bayGio - 60_000).toISOString(), ketThuc: new Date(bayGio - 10_000).toISOString(), trang: [] }];
  const tt = { batDau: new Date(bayGio - 60_000).toISOString(), hetHan: new Date(bayGio + 3600_000).toISOString() };
  // lượt cuối kết thúc 10 giây trước giờ lấy mốc → cửa sổ dừng ngay sau lượt đó, chưa tới hiện tại
  assert.deepEqual(cuaSoDo(tt, dong), { t0: bayGio - 60_000, t1: bayGio - 10_000 + 1 });
});

test("báo cáo cả phép đo: chưa có tệp trạng thái thì vẫn ra bốn số, không mở DB, bỏ phần so với lượt quét đủ", async () => {
  let mo = 0;
  const kq = await baoCao({ tt: null, dong: NHAT_KY, bayGio: () => T0 + 7200_000, moDb: async () => { mo++; throw new Error("không được mở DB"); } });
  assert.equal(kq.trangThai, "dang-chay");
  assert.equal(kq.soLoiGoi, 7);
  // không có tệp trạng thái: cửa sổ lấy từ nhật ký — bắt đầu ở lượt đầu (phút 5), tới ngay sau lượt cuối (15:00)
  assert.deepEqual(kq.cuaSo, { t0: ISO(300), t1: new Date(T0 + 900_001).toISOString() });
  assert.equal(kq.batDuoc, undefined, "không biết vùng × mục thì không so");
  assert.equal(mo, 0);
});

/** DB giả cho báo cáo: trả theo đúng câu — số dòng stg của snapshot mới nhất (max, manifest, count) rồi tập id lượt quét đủ. */
function dbBaoCao({ luc = new Date(T0 + 86400_000), items = 4, daNap = items, cau = [], ids = ["1", "2", "3", "5"] } = {}) {
  return {
    cau,
    query: async (sql, params) => {
      cau.push([sql.trim().split(/\s+/).slice(0, 3).join(" "), params]);
      if (/max\(captured_at\)/.test(sql)) return { rows: luc ? [{ luc }] : [] };
      if (/FROM airbnb_snapshots/.test(sql)) return { rows: items === null ? [] : [{ snapshot_id: "hcmc__chotot-ads__2026-11-24T072926", manifest: { counts: { items } } }] };
      // cụ thể: chỉ câu đếm ĐÚNG theo snapshot mới nhất mới trả số dòng đã nạp; câu đếm cua khác trả toàn bộ dòng của vùng
      if (/count\(\*\)::int AS n/.test(sql)) return { rows: [{ n: /WHERE snapshot_id = \$1/.test(sql) ? daNap : 100_000 }] };
      return { rows: ids.map((list_id) => ({ list_id })) };
    },
    dong: async () => { cau.push(["dong"]); },
  };
}

test("báo cáo cả phép đo: có vùng × mục thì kiểm lượt quét đủ đã nạp xong, so, rồi đóng DB", async () => {
  const db = dbBaoCao();
  const kq = await baoCao({
    tt: { trangThai: "xong", cityCode: "vn-hcmc", adType: "u", batDau: ISO(0), hetHan: ISO(3600) },
    dong: NHAT_KY, bayGio: () => T0 + 7200_000,
    moDb: async () => db,
  });
  assert.deepEqual(kq.batDuoc, { quetDu: 4, daCoMa: 0, tinMoi: 4, duoi: 5, batDuoc: 3, tiLe: 0.75, thieu: [5], chiDuoi: [4, 12], thieuDaCoMa: [] });
  assert.equal(kq.quetDuCapNhatLuc, new Date(T0 + 86400_000).toISOString(), "ghi giờ lượt quét đủ mới nhất đã nạp");
  assert.deepEqual(kq.quetDuNapXong, { xong: true, luc: new Date(T0 + 86400_000).toISOString(), snapshotId: "hcmc__chotot-ads__2026-11-24T072926", items: 4, daNap: 4 });
  assert.deepEqual(db.cau.map((x) => x[0]), ["SELECT max(captured_at) AS", "SELECT snapshot_id, manifest", "SELECT count(*)::int AS", "SELECT list_id FROM", "dong"], "kiểm nạp xong trước, mới lấy tập so, rồi đóng");
  assert.deepEqual(db.cau.at(-2)[1], ["vn-hcmc", "u", T0, T0 + 900_001], "so đúng vùng × mục và đúng cửa sổ");
});

// CA ĐỎ của lỗi 24/11: ZT tính tỉ lệ lúc lượt nạp 30.623 dòng còn chạy dỏ (tính được 194/200 = 97% và «221 tin quét đủ
// không có») trong khi lượt quét đủ có đủ 420 tin — tỉ lệ thật 413/420 = 98,3%. Bỏ bước kiểm nạp xong → ca này ĐỎ.
test("báo cáo cả phép đo: lượt quét đủ CHƯA nạp xong thì KHÔNG đưa tỉ lệ — null kèm số dòng, bốn số vẫn có", async () => {
  const db = dbBaoCao({ items: 420, daNap: 200, ids: ["1", "2", "3"] });
  const kq = await baoCao({
    tt: { trangThai: "xong", cityCode: "vn-hcmc", adType: "u", batDau: ISO(0), hetHan: ISO(3600) },
    dong: NHAT_KY, bayGio: () => T0 + 7200_000,
    moDb: async () => db,
  });
  assert.equal(kq.batDuoc, null, "chưa nạp xong thì chưa có tập so đầy đủ — không đưa tỉ lệ");
  assert.match(kq.batDuocLoi, /chưa nạp xong \(200\/420 dòng\)/, "nêu rõ thiếu bao nhiêu dòng");
  assert.deepEqual([kq.quetDuNapXong.xong, kq.quetDuNapXong.items, kq.quetDuNapXong.daNap], [false, 420, 200]);
  assert.equal(kq.soLoiGoi, 7, "bốn số không phụ thuộc việc so");
  assert.ok(!db.cau.some((x) => x[0] === "SELECT list_id FROM"), "không chạy câu lấy tập so khi biết trước là chưa xong");
});

test("báo cáo cả phép đo: lượt quét đủ nạp xong trừ vài dòng bị bỏ (399/400) vẫn coi là xong và so bình thường", async () => {
  const kq = await baoCao({
    tt: { trangThai: "xong", cityCode: "vn-hcmc", adType: "u", batDau: ISO(0), hetHan: ISO(3600) },
    dong: NHAT_KY, bayGio: () => T0 + 7200_000,
    moDb: async () => dbBaoCao({ items: 400, daNap: 399 }),
  });
  assert.equal(kq.quetDuNapXong.xong, true, "importer bỏ tin thiếu region_v2 dưới 1% — không chặn việc so");
  assert.equal(kq.batDuoc.quetDu, 4);
});

test("quetDuDaNapXong: vùng chưa có tin, hoặc không tìm thấy manifest của lượt mới nhất → chưa xong, nêu lý do", async () => {
  const khongTin = await quetDuDaNapXong({ query: async () => ({ rows: [] }) }, { cityCode: "vn-chua-co" });
  assert.deepEqual(khongTin, { xong: false, lyDo: "stg-chua-co-tin-cua-vung", luc: null, snapshotId: null, items: null, daNap: null });
  const khongManifest = await quetDuDaNapXong({ query: async (sql) => ({ rows: /FROM airbnb_snapshots/.test(sql) ? [] : [{ luc: new Date(T0) }] }) }, { cityCode: "vn-hcmc" });
  assert.deepEqual(khongManifest, { xong: false, lyDo: "khong-thay-manifest-cua-luot-moi-nhat", luc: new Date(T0).toISOString(), snapshotId: null, items: null, daNap: null });
});

test("báo cáo cả phép đo: DB lỗi thì phần so với lượt quét đủ là null kèm lý do, bốn số vẫn có", async () => {
  const kq = await baoCao({
    tt: { trangThai: "xong", cityCode: "vn-hcmc", adType: "u", batDau: ISO(0), hetHan: ISO(3600) },
    dong: NHAT_KY, bayGio: () => T0 + 7200_000,
    moDb: async () => { throw Object.assign(new Error("ECONNREFUSED"), { code: "ECONNREFUSED" }); },
  });
  assert.equal(kq.batDuoc, null);
  assert.match(kq.batDuocLoi, /ECONNREFUSED/);
  assert.equal(kq.soLoiGoi, 7);
});

test("tỉ lệ bắt được: so tin đuôi thấy với tập lượt quét đủ cùng ngày", () => {
  const quetDu = new Set([1, 2, 3, 5]); // lượt quét đủ có tin 1, 2, 3, 5 đăng trong cửa sổ (không có tin 4 — đã gỡ trước lượt quét)
  const t = tinhTiLeBatDuoc(NHAT_KY, { t0: T0, t1: T0 + 3600 * 1000, quetDu });
  assert.deepEqual(t, { quetDu: 4, daCoMa: 0, tinMoi: 4, duoi: 5, batDuoc: 3, tiLe: 0.75, thieu: [5], chiDuoi: [4, 12], thieuDaCoMa: [] },
    "tin 12 (chưa có giờ đăng gốc) vẫn là tin mới đăng; tin 9 (cũ đẩy lại), 10, 11 (đăng trước t0) không tính");
});

// CA ĐỎ của lỗi 24/11: lượt quét đủ đưa vào tập cả tin CŨ được làm mới hôm nay (mã máy đã biết, list_time đổi,
// không có orig_list_time) — 151/654 mã. Nếu để chúng đứng vào mẫu số thì tỉ lệ rơi từ 100% xuống 77% dù đuôi
// không bỏ sót tin mới nào. Mẫu số phải chỉ gồm TIN MỚI (mã máy chưa biết).
test("tỉ lệ bắt được: tin cũ được làm mới (mã máy đã biết) KHÔNG đứng vào mẫu số — mẫu số chỉ gồm tin mới", () => {
  // 101 là mã cũ: ở NHAT_KY đuôi thấy nó với cờ 1; lượt quét đủ đưa vào tập vì list_time của nó nằm trong cửa sổ
  const t = tinhTiLeBatDuoc(NHAT_KY, { t0: T0, t1: T0 + 3600 * 1000, quetDu: new Set([1, 2, 3, 5, 101]) });
  assert.deepEqual(t, { quetDu: 5, daCoMa: 1, tinMoi: 4, duoi: 5, batDuoc: 3, tiLe: 0.75, thieu: [5], chiDuoi: [4, 12], thieuDaCoMa: [101] });
});

test("tỉ lệ bắt được: mã lượt quét đủ có mà đuôi chưa từng thấy vẫn là tin mới bị bỏ sót — kể cả khi là mã cũ", () => {
  // 7 và 8 không có trong NHAT_KY (các mã «đã có» của nhật ký là 101, 102, 103): đuôi không thấy lần nào
  const t = tinhTiLeBatDuoc(NHAT_KY, { t0: T0, t1: T0 + 3600 * 1000, quetDu: new Set([1, 2, 3]) });
  assert.deepEqual([t.quetDu, t.daCoMa, t.tinMoi, t.batDuoc, t.tiLe, t.thieu], [3, 0, 3, 3, 1, []], "đủ cả ba tin mới → 100%");
  const t2 = tinhTiLeBatDuoc(NHAT_KY, { t0: T0, t1: T0 + 3600 * 1000, quetDu: new Set([1, 2, 3, 7]) });
  assert.deepEqual([t2.tinMoi, t2.batDuoc, t2.tiLe, t2.thieu, t2.thieuDaCoMa], [4, 3, 0.75, [7], []], "7 là tin mới bị bỏ sót");
  const t3 = tinhTiLeBatDuoc(NHAT_KY, { t0: T0, t1: T0 + 3600 * 1000, quetDu: new Set([1, 2, 3, 7, 8, 101]) });
  assert.deepEqual([t3.tinMoi, t3.batDuoc, t3.tiLe, t3.thieu, t3.thieuDaCoMa], [5, 3, 0.6, [7, 8], [101]], "101 (mã đã có) không đứng vào mẫu số");
});

test("tỉ lệ bắt được: mọi mã lượt quét đủ có đều là mã máy đã biết → không có tin mới để so, tỉ lệ null", () => {
  assert.deepEqual(tinhTiLeBatDuoc(NHAT_KY, { t0: T0, t1: T0 + 3600 * 1000, quetDu: new Set([101, 103]) }),
    { quetDu: 2, daCoMa: 2, tinMoi: 0, duoi: 5, batDuoc: 0, tiLe: null, thieu: [], chiDuoi: [1, 2, 3, 4, 12], thieuDaCoMa: [101, 103] });
});

test("tỉ lệ bắt được khi lượt quét đủ rỗng → tỉ lệ null, không chia cho không", () => {
  assert.deepEqual(tinhTiLeBatDuoc(NHAT_KY, { t0: T0, t1: T0 + 3600 * 1000, quetDu: new Set() }),
    { quetDu: 0, daCoMa: 0, tinMoi: 0, duoi: 5, batDuoc: 0, tiLe: null, thieu: [], chiDuoi: [1, 2, 3, 4, 12], thieuDaCoMa: [] });
});

// ─── DB thật: phép đo chỉ đọc ────────────────────────────────────────────────────────────────────────────────

test("DB thật: phiên mở ra là CHỈ ĐỌC — mọi câu ghi (kể cả vào stg) đều bị Postgres từ chối (phép đo không nạp DB)", { skip: !CO_DB }, async () => {
  // Mỗi câu một phiên riêng: câu bị từ chối làm giao dịch vào trạng thái hủy, câu kế sẽ đổ lỗi khác (25P02) chứ không phải vì chỉ đọc
  for (const cau of [
    "CREATE TABLE zz_duoi_chi_doc (x int)",
    "INSERT INTO stg_chotot_ads (list_id) VALUES (-987654321)",
    "UPDATE stg_chotot_ads SET captured_at = now() WHERE false",
    "DELETE FROM stg_chotot_ads WHERE false",
  ]) {
    const c = await moDbChiDoc(DB);
    try {
      assert.equal((await c.query("SHOW transaction_read_only")).rows[0].transaction_read_only, "on", cau);
      await assert.rejects(c.query(cau), /read-only/i, `${cau} phải bị từ chối vì phiên chỉ đọc`);
    } finally {
      await c.dong();
    }
  }
});

test("DB thật: tra stg theo list_id — id có trong bảng trả về dạng số, id lạ không, hỏi rỗng thì không chạy câu nào", { skip: !CO_DB }, async () => {
  const c = await moDbChiDoc(DB);
  try {
    const mot = Number((await c.query("SELECT list_id FROM stg_chotot_ads ORDER BY list_id LIMIT 1")).rows[0].list_id);
    const tra = taoTraStg(c);
    assert.deepEqual([...(await tra([mot, -987654321]))], [mot]);
    assert.deepEqual([...(await tra([]))], []);
  } finally { await c.dong(); }
});

test("DB thật: lượt quét đủ cùng ngày = id trong stg của đúng vùng × mục, đăng trong cửa sổ, theo giờ đăng gốc", { skip: !CO_DB }, async () => {
  const c = await moDbChiDoc(DB);
  try {
    const cu = (await c.query("SELECT city_code, ad_type FROM stg_chotot_ads WHERE city_code IS NOT NULL AND ad_type IS NOT NULL GROUP BY 1, 2 ORDER BY count(*) DESC LIMIT 1")).rows[0];
    const bayGio = Date.now();
    const tuan = await quetDuStg(c, { cityCode: cu.city_code, adType: cu.ad_type, t0: bayGio - 7 * 86400000, t1: bayGio + 86400000 });
    assert.ok(tuan.size > 100, `cặp đông nhất phải có nhiều tin trong 7 ngày (thấy ${tuan.size})`);
    assert.ok([...tuan].every((x) => Number.isSafeInteger(x)), "list_id trả dạng số");
    assert.equal((await quetDuStg(c, { cityCode: cu.city_code, adType: cu.ad_type, t0: Date.parse("2020-01-01T00:00:00Z"), t1: Date.parse("2020-01-02T00:00:00Z") })).size, 0, "cửa sổ năm 2020 không có tin");
  } finally { await c.dong(); }
});

test("DB thật: kiểm lượt quét đủ đã nạp xong — trả số dòng stg và số item manifest của lượt mới nhất, xong khi đạt 99%", { skip: !CO_DB }, async () => {
  const c = await moDbChiDoc(DB);
  try {
    const vung = (await c.query("SELECT city_code FROM stg_chotot_ads WHERE city_code IS NOT NULL GROUP BY 1 ORDER BY count(*) DESC LIMIT 1")).rows[0].city_code;
    const kq = await quetDuDaNapXong(c, { cityCode: vung });
    assert.equal(typeof kq.xong, "boolean");
    assert.ok(Number.isInteger(kq.items) && kq.items > 0, `manifest khai số item (thấy ${kq.items})`);
    assert.ok(Number.isInteger(kq.daNap) && kq.daNap >= 0, `số dòng stg của snapshot (thấy ${kq.daNap})`);
    assert.equal(kq.xong, kq.daNap >= kq.items * 0.99, "xong khi và chỉ khi số dòng đã nạp đạt 99% số item");
    assert.ok(kq.daNap <= kq.items, "dòng của MỘT snapshot không thể nhiều hơn số item manifest khai — đếm sai phạm vi là lỗi");
    assert.match(kq.snapshotId, /__chotot-ads__/);
    assert.deepEqual(await quetDuDaNapXong(c, { cityCode: "vn-khong-ton-tai" }), { xong: false, lyDo: "stg-chua-co-tin-cua-vung", luc: null, snapshotId: null, items: null, daNap: null });
  } finally { await c.dong(); }
});

test("DB thật: tập lượt quét đủ lấy giờ đăng = orig_list_time nếu có, nếu không thì list_time — ba tình huống chọn độc lập", { skip: !CO_DB }, async () => {
  const c = await moDbChiDoc(DB);
  try {
    // cửa sổ nằm hoàn toàn trong quá khổ (8 ngày trước → 1 ngày trước) để tình huống (b) «bị đẩy lại SAU cửa sổ» có thể có
    const bayGio = Date.now();
    const win = { cityCode: "vn-hcmc", adType: "u", t0: bayGio - 8 * 86400000, t1: bayGio - 86400000 };
    const q = await quetDuStg(c, win);
    const mot = async (dieuKien, thongBao) => {
      const r = (await c.query(
        `SELECT list_id FROM stg_chotot_ads WHERE city_code = $1 AND ad_type = $2 AND ${dieuKien} ORDER BY list_id DESC LIMIT 1`,
        [win.cityCode, win.adType, win.t0, win.t1],
      )).rows[0]?.list_id;
      assert.ok(r, `thiếu dữ liệu để kiểm: ${thongBao}`);
      return Number(r);
    };
    // (a) tin chưa từng bị đẩy lại: không có orig_list_time, list_time trong cửa sổ → PHẢI có trong tập
    const a = await mot(`NULLIF((payload->>'orig_list_time')::bigint, 0) IS NULL AND (payload->>'list_time')::bigint >= $3 AND (payload->>'list_time')::bigint < $4`, "tin mới chưa bị đẩy lại");
    assert.ok(q.has(a), `tin ${a} chưa bị đẩy lại (không có orig_list_time) phải nằm trong tập lượt quét đủ`);
    // (b) tin bị đẩy lại SAU cửa sổ: orig trong cửa sổ, list_time ngoài cửa sổ → PHẢI có (lấy orig)
    const b = await mot(`COALESCE(NULLIF((payload->>'orig_list_time')::bigint, 0), 0) >= $3 AND COALESCE(NULLIF((payload->>'orig_list_time')::bigint, 0), 0) < $4 AND (payload->>'list_time')::bigint >= $4`, "tin bị đẩy lại sau cửa sổ");
    assert.ok(q.has(b), `tin ${b} đăng trong cửa sổ rồi bị đẩy lại sau đó vẫn phải nằm trong tập`);
    // (c) tin cũ được đẩy lại TRONG cửa sổ: orig trước cửa sổ, list_time trong cửa sổ → KHÔNG được coi là tin mới của cửa sổ
    const d = await mot(`COALESCE(NULLIF((payload->>'orig_list_time')::bigint, 0), 0) > 0 AND COALESCE(NULLIF((payload->>'orig_list_time')::bigint, 0), 0) < $3 AND (payload->>'list_time')::bigint >= $3 AND (payload->>'list_time')::bigint < $4`, "tin cũ được đẩy lại trong cửa sổ");
    assert.ok(!q.has(d), `tin ${d} đăng từ trước cửa sổ, chỉ bị đẩy lại trong cửa sổ — không nằm trong tập`);
  } finally { await c.dong(); }
});
