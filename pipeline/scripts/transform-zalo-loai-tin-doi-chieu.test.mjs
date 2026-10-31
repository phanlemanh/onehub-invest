// transform-zalo-loai-tin-doi-chieu.test.mjs — hồ sơ _acceptance/s03-nhan-loai-tin-rong (RM1), lớp đối chiếu: AC-7, AC-9
// trên DB máy thu và AC-10 (lát nhãn phân tầng). Mọi ca DB chạy trong BEGIN … ROLLBACK, chỉ in số — không in chữ bài thật.
// Bài mồi (Yêu cầu, ma trận phân tầng) là câu viết tay theo dạng tin thật, không chép bài thật.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import pg from "pg";

import { chonMauPhanTang, layMau, LAT_PHAN_TANG } from "../label-sample.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { parsePost, runTransformZalo, tangLoai } from "../transform-zalo.mjs";

const PIPE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MIG_044 = readFileSync(path.join(PIPE, "../db/migrations/044_nap_lai_khong_xoa.sql"), "utf8");
const SNAP = "hanoi__zalo-agent__2099-03-03T000000";
const TANGS = LAT_PHAN_TANG["s03-loai-tin"];

/** Bản chép tạm của một tệp pipeline/ (import tương đối trỏ về pipeline/), đổi từng cặp [cũ, mới]. */
async function banDot(tep, thay) {
  let src = readFileSync(path.join(PIPE, tep), "utf8");
  for (const [a, b] of thay) {
    assert.ok(src.includes(a), `chỗ đột biến không còn trong ${tep}: ${a}`);
    src = src.replace(a, b);
  }
  src = src.replace(/from "\.\/([^"]+)"/g, (_m, rel) => `from ${JSON.stringify(pathToFileURL(path.join(PIPE, rel)).href)}`);
  const dir = mkdtempSync(path.join(PIPE, "scripts", ".slt-dc-dot-"));
  const f = path.join(dir, tep);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---- AC-10 thuần: 60 bài viết tay, 20/20/20 ba tầng ----
const LO_60 = Array.from({ length: 60 }, (_, i) => ({
  post_id: `slt_dc_${String(i).padStart(2, "0")}`,
  text: `Căn mẫu số ${i} — ${["2PN", "3PN", "Studio"][i % 3]} ${50 + i}m2 tầng ${i % 30}`,
}));
const TANG_60 = new Map(LO_60.map((p, i) => [p.post_id, TANGS[Math.floor(i / 20)]]));

/** Số bài chọn theo tầng thật. */
const demTang = (chon, tang, idCua = (r) => r.ref_id) => {
  const d = Object.fromEntries(TANGS.map((t) => [t, 0]));
  for (const r of chon) d[tang.get(idCua(r))]++;
  return d;
};

/** Năm seed: mẫu không phân tầng có thể trúng 4/4/4 ở một seed do may (≈ 8%), không trúng cả năm. */
const SEEDS_10 = ["slt-ac-10", "a", "b", "c", "d"];
function kiemPhanTang(mod, ten) {
  for (const seed of SEEDS_10) {
    const { chon } = mod.chonMauPhanTang(LO_60, TANG_60, { n: 12, seed, tangs: TANGS });
    const d = demTang(chon, TANG_60);
    assert.deepEqual(d, { "chu-bai": 4, "moi-nhan": 4, "van-bo": 4 }, `${ten}: mẫu không phân tầng (seed ${seed}) — ${JSON.stringify(d)}`);
  }
}

describe("SLT-AC-10 lát nhãn phân tầng (thuần)", () => {
  test("SLT-AC-10 60 bài 20/20/20, n=12 → 4/4/4 ở năm seed; cùng seed cùng kết quả, seed khác khác", () => {
    kiemPhanTang({ chonMauPhanTang }, "SLT-AC-10");
    const a = chonMauPhanTang(LO_60, TANG_60, { n: 12, seed: "slt-ac-10", tangs: TANGS }).chon.map((r) => r.ref_id);
    const b = chonMauPhanTang([...LO_60].reverse(), TANG_60, { n: 12, seed: "slt-ac-10", tangs: TANGS }).chon.map((r) => r.ref_id);
    const c = chonMauPhanTang(LO_60, TANG_60, { n: 12, seed: "seed-khac", tangs: TANGS }).chon.map((r) => r.ref_id);
    assert.deepEqual(a, b, "SLT-AC-10: cùng seed, đổi thứ tự đầu vào mà mẫu đổi");
    assert.notDeepEqual(a, c, "SLT-AC-10: seed khác mà mẫu y hệt");
  });
  test("chiều đỏ SLT-AC-10: bản đột biến bỏ phân tầng (một kho chung) → đỏ ghim «SLT-AC-10 mẫu không phân tầng»", async () => {
    const mod = await banDot("label-sample.mjs", [
      ["    theoTang.get(tang.get(p.post_id))?.push(p);", "    theoTang.get(tangs[0]).push(p);"],
      ["    const can = Math.floor(n / tangs.length) + (i < n % tangs.length ? 1 : 0);", "    const can = i === 0 ? n : 0;"],
    ]);
    assert.throws(() => kiemPhanTang(mod, "SLT-AC-10"), /SLT-AC-10: mẫu không phân tầng/);
  });
});

// ---- AC-9 thuần: sàn giá bán của bài suy loại ----
const SAN_GIA = [
  { text: "Căn 2PN 70m2 giá 5.000.000", mucDich: "sale" },
  { text: "Căn 2PN 70m2 giá 7.000.000 LH", mucDich: "sale" },
  { text: "Căn 2PN 70m2 0,25 tỷ sổ hồng", mucDich: "ca-hai" },
];
function kiemSanGia(mod) {
  const lech = SAN_GIA.map((o) => ({ ...o, r: mod.suyLoai(mod.parsePost(o.text), o.text, o.mucDich) }))
    .filter((o) => o.r.kind !== null).map((o) => `«${o.text}» → ${o.r.kind}/${o.r.nguon}`);
  if (lech.length) assert.fail(`SLT-AC-9 bán dưới 300 triệu: ${lech.join(" · ")}`);
}
describe("SLT-AC-9 sàn giá bán (thuần)", () => {
  test("SLT-AC-9 bài suy ra bán mà giá < 300 triệu giữ rỗng (nhóm bán, tín hiệu chữ)", async () => {
    kiemSanGia(await import("../transform-zalo.mjs"));
  });
  test("chiều đỏ SLT-AC-9: bản đột biến bỏ sàn giá → ô «5.000.000» đỏ ghim «SLT-AC-9 bán dưới 300 triệu»", async () => {
    const mod = await banDot("transform-zalo.mjs", [
      ["    if (pr.priceVnd != null && pr.priceVnd < GIA_BAN_SAN) return { kind: null, nguon: \"bo\" };\n", ""],
      ["    if (mucDich === KIND.sale && pr.priceVnd != null && pr.priceVnd < GIA_BAN_SAN) return { kind: null, nguon: \"bo\" };\n", ""],
    ]);
    assert.throws(() => kiemSanGia(mod), /SLT-AC-9 bán dưới 300 triệu: .*5\.000\.000/);
  });
});

// ---- DB máy thu: BEGIN … ROLLBACK ----
async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)"); // cùng khoá với các test transform S03/S05
    if (!(await c.query(`SELECT to_regclass('sale_offer_records') IS NOT NULL AS ok`)).rows[0].ok) await c.query(MIG_044);
    await napPhatBieu(c);
    await c.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}')
       ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Tập Yêu cầu mẫu viết tay: có giá, PN, có cả tín hiệu bán — vẫn không được thành tin rao. */
const YEU_CAU_MAU = [
  "Khách sale xem liền căn 2PN 70m2 tầm 3,2 tỷ, ai có gửi em",
  "Kháh xem liền 2PN 68m2 TC 2.7tỷ sổ hồng",
  "Khách em đang ở Vin xem liền 2PN 6,5tr",
  "Khách e tìm 1pn 45m2 5,5tr",
  "cần mua 2PN 72m2 3 tỷ thu về",
  "cần thuê studio 30m2 6tr",
  "anh chị có căn gửi em 2PN 65m2 10tr",
  "tìm căn 3PN 95m2 dưới 5 tỷ",
];

async function chenYeuCau(c) {
  const ids = [];
  for (const [i, text] of YEU_CAU_MAU.entries()) {
    const post_id = `t_slt_dc_yc_${process.pid}_${i}`;
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
       VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi Yêu cầu SLT', 'slt-dc-nhom-yc', $3, '2026-10-30T08:00:00Z')`,
      [post_id, SNAP, text]);
    ids.push(post_id);
  }
  return ids;
}

/** Chạy transform im lặng (log transform chỉ là số, nhưng dài) — trả kết quả. */
async function chayIm(c, opts) {
  const log = console.log;
  console.log = () => {};
  try { return await runTransformZalo(c, opts); } finally { console.log = log; }
}

const demS03 = async (c) => (await c.query(
  `SELECT count(*) FILTER (WHERE kind = 'sale')::int AS ban,
          count(*) FILTER (WHERE kind = 'rent_lt' AND price_vnd >= 1e9)::int AS thue_tu_1_ty,
          count(*) FILTER (WHERE kind = 'sale' AND price_vnd < 3e8)::int AS ban_duoi_300tr
     FROM sale_offers WHERE source = 'S03'`)).rows[0];

/** Số tin S03 mà mọi bài đều thuộc tập `chi` — `bang` là view sống hay bảng bản ghi (gồm tin đã rút). */
const demChiGom = async (c, bang, chi) => (await c.query(
  `SELECT count(*)::int AS n FROM ${bang} WHERE source = 'S03' AND post_ids <@ $1::text[]`, [[...chi]])).rows[0].n;

/** Số nhóm gộp có ≥ 2 bài khác số phòng ngủ hoặc khác diện tích (đọc lại bằng parsePost). */
function demNhomLech(nhom, chuCua) {
  let lech = 0;
  for (const ids of nhom) {
    const pn = new Set(), dt = new Set();
    for (const id of ids) {
      const t = chuCua.get(id);
      if (t === undefined) continue;
      const pr = parsePost(t);
      pn.add(pr.bedrooms ?? null);
      dt.add(pr.areaM2 ?? null);
    }
    if (pn.size > 1 || dt.size > 1) lech++;
  }
  return lech;
}

describe("SLT-DC đối chiếu trên DB máy thu (ROLLBACK)", () => {
  test("SLT-DC-7, SLT-DC-9: tắt rồi bật suy loại, rồi tắt lại — cùng một transaction", { timeout: 1_200_000 }, async (t) => {
    await withTx(async (c) => {
      const ycIds = await chenYeuCau(c);
      const { posts } = await loadStgPosts(c, "zalo");
      const tang = tangLoai(posts);
      const moiNhan = new Set([...tang].filter(([, v]) => v === "moi-nhan").map(([k]) => k));

      await chayIm(c, { suyLoaiTin: false });
      const tat = await demS03(c);
      const kq = await chayIm(c, { suyLoaiTin: true });
      const bat = await demS03(c);
      console.log(`SLT-DC-9 tắt ${JSON.stringify(tat)} · bật ${JSON.stringify(bat)} · nguồn ${JSON.stringify(kq.nguonLoai)}`);

      await t.test("SLT-DC-9 tin bán S03 tăng ≥ 30%, thuê ≥ 1 tỷ và bán < 300 triệu không tăng", () => {
        assert.ok(bat.ban >= Math.ceil(tat.ban * 1.3), `SLT-DC-9 tin bán tăng chưa đủ 30%: ${tat.ban} → ${bat.ban}`);
        assert.ok(bat.thue_tu_1_ty <= tat.thue_tu_1_ty, `SLT-DC-9 tin thuê ≥ 1 tỷ tăng: ${tat.thue_tu_1_ty} → ${bat.thue_tu_1_ty}`);
        assert.ok(bat.ban_duoi_300tr <= tat.ban_duoi_300tr, `SLT-DC-9 tin bán < 300 triệu tăng: ${tat.ban_duoi_300tr} → ${bat.ban_duoi_300tr}`);
      });

      await t.test("SLT-DC-9 tập Yêu cầu mẫu không bài nào thành tin", async () => {
        const { rows } = await c.query(
          `SELECT count(*)::int AS n FROM sale_offer_records WHERE post_ids && $1::text[]`, [ycIds]);
        assert.equal(rows[0].n, 0, `SLT-DC-9 Yêu cầu lọt thành tin: ${rows[0].n} tin`);
        for (const id of ycIds) assert.equal(tang.get(id), "van-bo", `SLT-DC-9 tầng của Yêu cầu mẫu ${id} = ${tang.get(id)}`);
      });

      await t.test("SLT-DC-7 nhóm gộp không lẫn bài khác PN hay khác DT", async () => {
        const chuCua = new Map(posts.map((p) => [p.post_id, p.text]));
        const { rows } = await c.query(
          `SELECT post_ids FROM sale_offers WHERE source = 'S03' AND cardinality(post_ids) >= 2`);
        const lech = demNhomLech(rows.map((r) => r.post_ids), chuCua);
        console.log(`SLT-DC-7 nhóm ≥ 2 bài ${rows.length} · lệch ${lech}`);
        assert.equal(lech, 0, `SLT-DC-7 có ${lech} nhóm gộp lẫn bài khác PN/DT`);
        // Đối chứng dương: nối hai bài khác PN vào cùng nhóm thì bộ đếm phải thấy.
        const a = posts.find((p) => parsePost(p.text).bedrooms === 2);
        const b = posts.find((p) => parsePost(p.text).bedrooms === 3);
        assert.ok(a && b, "SLT-DC-7 đối chứng: lô không có bài 2PN và 3PN");
        assert.ok(demNhomLech([[a.post_id, b.post_id]], chuCua) >= 1, "SLT-DC-7 đối chứng dương: bộ đếm không thấy nhóm lẫn PN");
      });

      await chayIm(c, { suyLoaiTin: false });
      await t.test("SLT-DC-9 chạy lại với suy loại tắt: tin chỉ gồm bài suy loại đều bị rút", async () => {
        const song = await demChiGom(c, "sale_offers", moiNhan);
        const banGhi = await demChiGom(c, "sale_offer_records", moiNhan);
        console.log(`SLT-DC-9 tin chỉ gồm bài suy loại: còn sống ${song} · bản ghi (gồm đã rút) ${banGhi}`);
        assert.equal(song, 0, `SLT-DC-9 còn ${song} tin sống chỉ gồm bài suy loại`);
        // Đối chứng dương (bỏ đối soát = đọc cả tin đã rút): phải thấy các tin lượt bật đã tạo.
        assert.ok(banGhi >= 1, "SLT-DC-9 đối chứng dương: không tin suy loại nào được tạo ở lượt bật");
      });
    });
  });

  test("SLT-DC-10 lát s03-loai-tin: lần một thêm n, lần hai cùng seed thêm 0, --thu thêm 0", { timeout: 600_000 }, async () => {
    await withTx(async (c) => {
      const co = { lat: "s03-loai-tin", n: 30, seed: "slt-dc-10", nhom: null, trongGiaoDich: true };
      const { rows } = await c.query(`SELECT count(*)::int AS n FROM eval_label_items WHERE lat = $1`, [co.lat]);
      assert.equal(rows[0].n, 0, "SLT-DC-10 lát s03-loai-tin đã có dòng trên DB — đo lần một không sạch");
      const mot = await layMau(c, { ...co, thu: false });
      const hai = await layMau(c, { ...co, thu: false });
      const thu = await layMau(c, { ...co, thu: true });
      console.log(`SLT-DC-10 lần một ${mot.them} · lần hai ${hai.them} · --thu ${thu.them} · tầng ${JSON.stringify(mot.moiTang)}`);
      assert.equal(mot.them, co.n, `SLT-DC-10 lần một thêm ${mot.them}, cần ${co.n}`);
      assert.equal(hai.them, 0, `SLT-DC-10 lần hai cùng seed thêm ${hai.them}`);
      assert.equal(thu.them, 0, `SLT-DC-10 --thu thêm ${thu.them}`);
      for (const t of TANGS) assert.equal(mot.moiTang[t].chon, co.n / 3, `SLT-DC-10 tầng ${t} chọn ${mot.moiTang[t].chon}`);
    });
  });
});
