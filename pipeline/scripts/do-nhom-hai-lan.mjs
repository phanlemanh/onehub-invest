// do-nhom-hai-lan.mjs — phép đo hồ sơ _acceptance/nhom-hai-lan-s03-xu-goc trên bản sao thật. Mọi ghi nằm trong BEGIN…ROLLBACK của DB thử.
//   node scripts/do-nhom-hai-lan.mjs --cong   E4 số tin trước, sau khi chuẩn hoá khoá; E7 sau khi dọn sổ
//   node scripts/do-nhom-hai-lan.mjs --quet   E10 quét khoá, token kênh, tên đơn vị trong tệp nhánh và đầu ra các lệnh mới
// In số đếm; không in khoá nhóm, tên nhóm, tên nguồn thật.
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { demKhop, dayNhanh, quetTep, tepTheoDiff, tepThemMoi } from "../../_acceptance/nhom-dang-ky-hai-lan-s03/probes/_quet.mjs";
import { donNhomHaiLan } from "../don-nhom-hai-lan.mjs";
import { layMau } from "../label-sample.mjs";
import { khoaNhomThat } from "../lib/eval-labels.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { dongBoS03, TEN_CHUA_CO } from "../sync-don-vi.mjs";
import { docLoaiHinh, loaiHinhNhom, runTransformZalo } from "../transform-zalo.mjs";
import { dieuKienVisible } from "./do-s03-len-cong.mjs";

const GOC = join(import.meta.dirname, "../..");
const DB_URL = process.env.DATABASE_URL ?? "";
const DB_THU = ["oneinvest_nhl_xu", "oneinvest_gcn_nhan"];
const SNAP = "hanoi__zalo-agent__2099-01-06T000000";
const LAT = "s03-theo-nhom";
const NGUYEN_VAN = (k) => k;
const NGOAI_FIXTURE = "group_key NOT LIKE '%ndk-%' AND group_key NOT LIKE 'conv-gcn-%'";
const CHUAN = (cot) => `regexp_replace(${cot}, '^([^:]+:)?group:(.+)$', '\\2')`;
const HIEU_LUC = "status NOT IN ('retired', 'completed')";

const loi = [];
const kiem = (dieu, ok, sai) => {
  console.log(dieu ? `ok ${ok}` : sai);
  if (!dieu) loi.push(sai);
};
const ketThuc = (ten) => {
  console.log(loi.length ? `${ten} FAIL (${loi.length})` : `${ten} OK`);
  process.exit(loi.length ? 1 : 0);
};

function canDbThu() {
  if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) throw new Error("do-nhom-hai-lan: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>");
}
async function trongGiaoDich(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}
/** Transform chạy im: dòng in của nó có thể nhắc tên nhóm. */
async function imLog(fn) {
  const goc = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = goc; }
}

const COT_SO = ["kind", "property_type", "area_id", "price_vnd", "area_m2"];
/**
 * So hai lượt theo offer_id. `roi`, `them`: tin hiện trên cổng mất đi, thêm vào. `doi`: tin có ở cả hai lượt mà khác giá trị.
 * `doi_ngoai`: tin lệch mà không có bài nào thuộc nhóm có cặp trong sổ.
 * @param {{ offer_id: string, hien: boolean, post_ids: string[] }[]} truoc
 * @param {{ offer_id: string, hien: boolean, post_ids: string[] }[]} sau
 * @param {Set<string>} baiCap post_id của các nhóm có cặp
 */
export function soCong(truoc, sau, baiCap) {
  const a = new Map(truoc.map((r) => [r.offer_id, r]));
  const b = new Map(sau.map((r) => [r.offer_id, r]));
  const lech = new Set();
  const dem = { roi: 0, them: 0, doi: 0, doi_ngoai: 0 };
  for (const [k, r] of a) {
    const s = b.get(k);
    if (r.hien && !s?.hien) { dem.roi++; lech.add(r); }
    if (s && COT_SO.some((c) => r[c] !== s[c])) { dem.doi++; lech.add(r); }
  }
  for (const [k, s] of b) if (s.hien && !a.get(k)?.hien) { dem.them++; lech.add(s); }
  for (const r of lech) if (!r.post_ids.some((id) => baiCap.has(id))) dem.doi_ngoai++;
  return dem;
}

async function docTin(c) {
  const dk = dieuKienVisible().join(" AND ");
  const { rows } = await c.query(
    `SELECT o.offer_id, o.kind, o.property_type, o.area_id, o.price_vnd::text, o.area_m2::text, o.post_ids, (${dk}) AS hien
       FROM sale_offers o WHERE o.source = 'S03'`);
  return rows;
}
const tomTat = (rows) => {
  const hien = rows.filter((r) => r.hien);
  return `tin ${rows.length} hien ${hien.length} ban ${hien.filter((r) => r.kind === "sale").length} thue ${hien.filter((r) => r.kind === "rent_lt").length}`;
};
const bamLat = async (c) => (await c.query(
  `SELECT count(*)::int AS n, md5(coalesce(string_agg(to_jsonb(t)::text, '|' ORDER BY t.item_id), '')) AS h FROM eval_label_items t WHERE lat = $1`, [LAT])).rows[0];

/** Bài mồi ở đúng dạng tiền tố đọc từ sổ, nhóm mà khoá nguyên văn và khoá thật cho loại hình khác nhau: lượt mặc định phải khác lượt nguyên văn. */
async function napBaiMoi(c, khoaMoi) {
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, conversation_id)
     SELECT 'nhl_moi_1', $1, 'openclaw-hook', (SELECT group_name FROM stg_zalo_posts WHERE conversation_id = $2 LIMIT 1),
            'Bán 2PN 93m2 giá 6.3 tỷ', '2099-01-06T01:00:00Z', 'nhl_moi_nguoi', $2`, [SNAP, khoaMoi]);
}

async function doCong() {
  canDbThu();
  const doc = new pg.Client({ connectionString: DB_URL });
  await doc.connect();
  const { rows: so } = await doc.query(`SELECT unit_code, group_key FROM collection_units WHERE source_code = 'S03' AND ${NGOAI_FIXTURE}`);
  const theoKhoa = new Map();
  for (const r of so) {
    const k = khoaNhomThat(r.group_key);
    if (!theoKhoa.has(k)) theoKhoa.set(k, []);
    theoKhoa.get(k).push(r);
  }
  const cap = [...theoKhoa].filter(([, ds]) => ds.length > 1);
  if (cap.length === 0) {
    console.log("loi DB thu khong co cap");
    await doc.end();
    process.exit(1);
  }
  console.log(`so cap trong so: ${cap.length}`);
  const { posts } = await loadStgPosts(doc, "zalo");
  const baiCap = new Set(posts.filter((p) => p.conversation_id != null && theoKhoa.get(khoaNhomThat(p.conversation_id))?.length > 1).map((p) => p.post_id));
  // Đếm độc lập bằng SQL, cùng định nghĩa post thử với test-posts.mjs.
  const { rows: [{ n: soDoi }] } = await doc.query(
    `SELECT count(*)::int AS n FROM (
       SELECT DISTINCT ON (post_id) post_id, conversation_id, snapshot_id, agent_id, group_name FROM stg_zalo_posts
        WHERE agent_id IS NULL OR agent_id <> 'apify-facebook' ORDER BY post_id, captured_at DESC) p
      WHERE conversation_id ~ '^([^:]+:)?group:.'
        AND split_part(snapshot_id, '__', 2) !~* '(mock|test|e2e)' AND split_part(snapshot_id, '__', 2) <> 'example'
        AND coalesce(agent_id, '') !~* '^(e2e|test|mock)' AND coalesce(btrim(group_name), '') !~* '^test([^[:alpha:]]|$)'`);
  const { rows: [{ thieu, tong }] } = await doc.query(
    `WITH k AS (SELECT DISTINCT ${CHUAN("conversation_id")} AS khoa FROM stg_zalo_posts WHERE conversation_id ~ '^([^:]+:)?group:.')
     SELECT count(*)::int AS tong, count(*) FILTER (WHERE (SELECT count(*) FROM collection_units u WHERE u.source_code = 'S03' AND u.group_key = k.khoa) <> 1)::int AS thieu FROM k`);
  const nhomTho = loaiHinhNhom(posts.map((p) => ({ conversation_id: p.conversation_id, loai: docLoaiHinh(p.text) })));
  const nhomChuan = loaiHinhNhom(posts.map((p) => ({ conversation_id: p.conversation_id == null ? null : khoaNhomThat(p.conversation_id), loai: docLoaiHinh(p.text) })));
  const khoaMoi = so.map((r) => r.group_key).find((k) => k !== khoaNhomThat(k) && nhomChuan.get(khoaNhomThat(k)) && nhomChuan.get(khoaNhomThat(k)) !== nhomTho.get(k));
  await doc.end();

  // E4 — bộ so viết trước, hai ca đỏ trên ca viết tay.
  const mau = (id, o = {}) => ({ offer_id: id, hien: true, kind: "sale", property_type: "apartment", area_id: "a", price_vnd: "1", area_m2: "1", post_ids: [`p${id}`], ...o });
  kiem(soCong([mau("1")], [mau("1", { hien: false })], new Set(["p1"])).roi === 1, "do: loi tin roi cong", "loi bo so khong thay tin roi");
  kiem(soCong([mau("2")], [mau("2", { property_type: "house" })], new Set(["p1"])).doi_ngoai === 1, "do: loi tin doi ngoai nhom", "loi bo so khong thay tin doi ngoai nhom");

  const luot = async (khoaNhom, moi = false) => trongGiaoDich(async (c) => {
    if (moi) await napBaiMoi(c, khoaMoi);
    const r = await imLog(() => runTransformZalo(c, khoaNhom ? { khoaNhom } : {}));
    return { r, rows: await docTin(c) };
  });
  const van = await luot(NGUYEN_VAN);
  const mac = await luot(null);
  console.log(`cong truoc: ${tomTat(van.rows)}`);
  console.log(`cong sau: ${tomTat(mac.rows)}`);
  const lech = soCong(van.rows, mac.rows, baiCap);
  console.log(`cong lech: roi ${lech.roi} them ${lech.them} doi ${lech.doi}`);
  kiem(soDoi > 0 && mac.r.bai_doi_khoa === soDoi && van.r.bai_doi_khoa === 0, `AC-4 so bai doi khoa bang dem doc lap (${soDoi})`, `loi so bai doi khoa: ${mac.r.bai_doi_khoa}/${soDoi}`);
  kiem(tong > 0 && thieu === 0, "AC-4 moi bai ve mot khoa tran", `loi khoa khong ve mot dong tran: ${thieu}/${tong}`);
  kiem(lech.roi === 0, "AC-4 khong tin roi cong", `loi tin roi cong: ${lech.roi}`);
  kiem(lech.them === 0, "AC-4 khong tin them", `loi tin them: ${lech.them}`);
  kiem(lech.doi_ngoai === 0, "AC-4 tin doi deu thuoc nhom co cap", `loi tin doi ngoai nhom: ${lech.doi_ngoai}`);
  const hien = mac.rows.filter((r) => r.hien).length;
  kiem(dieuKienVisible().length >= 3 && hien > 0 && hien < mac.rows.length, "AC-4 dieu kien hien doc tu ma cong", `loi dieu kien hien: ${hien}/${mac.rows.length}`);
  if (!khoaMoi) kiem(false, "", "loi khong tim duoc cap de moi");
  else {
    const vanMoi = await luot(NGUYEN_VAN, true);
    const macMoi = await luot(null, true);
    const lechMoi = soCong(vanMoi.rows, macMoi.rows, new Set([...baiCap, "nhl_moi_1"]));
    kiem(lechMoi.doi > 0 && lechMoi.doi_ngoai === 0, "do: thuoc thay tin doi", `loi thuoc khong thay tin doi: ${JSON.stringify(lechMoi)}`);
  }

  // E7 — sau khi dọn sổ, trên cùng bản sao.
  await trongGiaoDich(async (c) => {
    const hieuLucNhieu = async () => (await c.query(
      `SELECT count(*)::int AS n FROM (SELECT ${CHUAN("group_key")} FROM collection_units WHERE source_code = 'S03' AND ${NGOAI_FIXTURE} AND ${HIEU_LUC} GROUP BY 1 HAVING count(*) > 1) t`)).rows[0].n;
    const truocDon = await hieuLucNhieu();
    kiem(truocDon === cap.length, `do: truoc don co cap hai dong (${truocDon})`, `loi doi chung truoc don: ${truocDon}/${cap.length}`);
    const lat = await bamLat(c);
    const dem = await donNhomHaiLan(c, { ghi: true, out() {} });
    const { rows: conLai } = await c.query(
      `SELECT count(*)::int AS n, count(*) FILTER (WHERE group_key <> ${CHUAN("group_key")})::int AS khong_tran FROM collection_units
        WHERE source_code = 'S03' AND ${HIEU_LUC} AND ${CHUAN("group_key")} = ANY ($1)`, [cap.map(([k]) => k)]);
    kiem(dem.bo_qua === 0 && await hieuLucNhieu() === 0 && conLai[0].n === cap.length && conLai[0].khong_tran === 0,
      "AC-7 moi nhom mot dong hieu luc", `loi dong hieu luc: ${JSON.stringify({ dem, ...conLai[0] })}`);
    await imLog(() => runTransformZalo(c));
    const sauDon = await docTin(c);
    const lechDon = soCong(mac.rows, sauDon, baiCap);
    kiem(tomTat(sauDon) === tomTat(mac.rows) && lechDon.roi === 0 && lechDon.them === 0 && lechDon.doi === 0, "AC-7 so tin khong doi", `loi so tin sau don: ${JSON.stringify(lechDon)}`);

    const maPhu = cap.flatMap(([k, ds]) => ds.filter((r) => r.group_key !== k).map((r) => r.unit_code));
    const trangThai = async () => (await c.query(
      "SELECT unit_code, status FROM collection_units WHERE source_code = 'S03' ORDER BY unit_code")).rows;
    await c.query("SAVEPOINT dong_bo");
    const truocDb = await trangThai();
    const demDb = await dongBoS03(c, []);
    const sauDb = await trangThai();
    const phuDoi = sauDb.filter((r, i) => maPhu.includes(r.unit_code) && r.status !== truocDb[i].status).length;
    const activeDoi = sauDb.filter((r, i) => truocDb[i].status === "active" && r.status === "paused").length;
    await c.query("ROLLBACK TO SAVEPOINT dong_bo");
    kiem(phuDoi === 0, "AC-7 dong bo khong cham dong da don", `loi dong bo cham dong da don: ${phuDoi}`);
    kiem(demDb.doi > 0 && activeDoi > 0, `do: dong bo that su chay (${activeDoi})`, `loi dong bo khong chay: ${JSON.stringify(demDb)}`);

    const mauThu = await layMau(c, { lat: "nhl-that", seed: "nhl", thu: true, trongGiaoDich: true, nhom: null, theoNhom: { moiNhomLon: 30, moiNhomNho: 5, soNhomLon: 10 } });
    const tang = mauThu.moiNhom.map((x) => x.unit_code);
    const maDai = cap.map(([k, ds]) => ds.find((r) => r.group_key === k).unit_code);
    kiem(tang.length > 0 && !tang.some((m) => maPhu.includes(m)) && maDai.every((m) => tang.includes(m)), "AC-7 mau mot tang", "loi mau co tang phu");

    const latSau = await bamLat(c);
    kiem(lat.n > 0 && latSau.h === lat.h, `AC-7 lat s03-theo-nhom khong doi (${lat.n})`, `loi lat doi: ${lat.n}, ${latSau.n}`);
    await c.query("SAVEPOINT lat");
    await c.query("UPDATE eval_label_items SET stratum = stratum || '-doi' WHERE item_id = (SELECT min(item_id) FROM eval_label_items WHERE lat = $1)", [LAT]);
    kiem((await bamLat(c)).h !== lat.h, "do: loi bam lat", "loi thuoc bam lat khong do");
    await c.query("ROLLBACK TO SAVEPOINT lat");
  });
  ketThuc("CONG NHOM HAI LAN");
}

async function doQuet() {
  canDbThu();
  const server = DB_URL.replace(/\/[^/]+$/, "");
  const so = [];
  for (const db of DB_THU) {
    const c = new pg.Client({ connectionString: `${server}/${db}?options=-c%20default_transaction_read_only%3Don` });
    await c.connect();
    so.push(...(await c.query(`SELECT group_key, name, original_name FROM collection_units WHERE source_code = 'S03' AND ${NGOAI_FIXTURE}`)).rows);
    await c.end();
  }
  const KHOA = [...new Set(so.flatMap((r) => [r.group_key, khoaNhomThat(r.group_key)]))];
  const TOKEN = [...new Set(so.filter((r) => r.group_key !== khoaNhomThat(r.group_key)).map((r) => r.group_key.split(":group:")[0]).filter(Boolean))];
  const TEN = [...new Set(so.flatMap((r) => [r.name, r.original_name]).filter((t) => t && t !== TEN_CHUA_CO))];
  console.log(`so khoa ${KHOA.length} · token ${TOKEN.length} · ten ${TEN.length}`);
  kiem(KHOA.length > 0 && TOKEN.length > 0, "AC-10 co khoa va token de quet", "loi so khong co khoa hoac token");

  const tep = tepTheoDiff(GOC, [dayNhanh(GOC)], { chuaCommit: true });
  const trongTep = quetTep(GOC, tep, KHOA);
  kiem(tep.length > 0 && trongTep === 0, `AC-10 tep doi 0 khop (${tep.length} tep)`, `loi khoa trong tep: ${trongTep}`);

  const LENH = [
    ["pipeline/don-nhom-hai-lan.mjs"],
    ["pipeline/don-nhom-hai-lan.mjs", "--hoan-lai"],
    ["pipeline/scripts/don-nhom-hai-lan.itest.mjs"],
    ["pipeline/scripts/nhom-hai-lan-transform.itest.mjs"],
    ["pipeline/scripts/do-nhom-hai-lan.mjs", "--cong"],
  ];
  let ra = "";
  let hong = 0;
  for (const l of LENH) {
    const r = spawnSync("node", l, { cwd: GOC, env: process.env, encoding: "utf8", maxBuffer: 1 << 28 });
    if (r.status !== 0) hong++;
    ra += r.stdout + r.stderr;
  }
  const byte = Buffer.byteLength(ra);
  kiem(hong === 0 && byte > 0 && demKhop(ra, KHOA) === 0, `AC-10 dau ra 0 khop (${LENH.length} lenh, ${byte} byte)`, `loi dau ra: hong ${hong}, khop ${demKhop(ra, KHOA)}`);

  const moi = tepThemMoi(GOC);
  const TUYET = [...TOKEN, ...TEN];
  const trongMoi = quetTep(GOC, moi, TUYET) + demKhop(ra, TUYET);
  kiem(moi.length > 0 && trongMoi === 0, `AC-10 token kenh va ten don vi 0 khop (${moi.length} tep moi)`, `loi token hoac ten don vi: ${trongMoi}`);

  // Đối chứng dương: mồi đọc từ sổ, chỉ ở kho git tạm ngoài kho, tệp chưa commit.
  const tam = mkdtempSync(join(tmpdir(), "nhl-moi-"));
  try {
    const g = (...a) => execFileSync("git", ["-C", tam, "-c", "user.name=thu", "-c", "user.email=thu@local.test", "-c", "core.hooksPath=/dev/null", ...a], { stdio: "ignore" });
    g("init", "-q");
    g("commit", "-q", "--allow-empty", "-m", "goc");
    writeFileSync(join(tam, "moi.txt"), `mồi ${KHOA[0]}\n`);
    kiem(quetTep(tam, tepTheoDiff(tam, ["HEAD..HEAD"], { chuaCommit: true }), KHOA) > 0, "do: loi khoa trong tep", "loi thuoc quet tep khong do");
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
  kiem(demKhop(`chuỗi mồi ${KHOA[0]}`, KHOA) > 0, "do: loi trong dau ra", "loi thuoc dau ra khong do");
  kiem(demKhop(`tên mồi ${TUYET[0]}`, TUYET) > 0, "do: loi ten don vi", "loi thuoc ten don vi khong do");
  ketThuc("QUET NHOM HAI LAN");
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const viec = process.argv.includes("--cong") ? doCong : process.argv.includes("--quet") ? doQuet : null;
  if (!viec) {
    console.error("cách dùng: node scripts/do-nhom-hai-lan.mjs --cong | --quet");
    process.exit(2);
  }
  await viec();
}
