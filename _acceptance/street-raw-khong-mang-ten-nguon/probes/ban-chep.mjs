// ban-chep.mjs — phép đo PL39 trên bản chép DB máy thu (chạy qua ban-chep.sh → db/db-thu.sh --chay). KHÔNG in giá trị ô nào.
//   1. Cấy: tin A có sẵn nhận đường và toà mang tên nguồn; tin B có sẵn mất đường ở nguồn và nhận một phát biểu legacy mang tên
//      nguồn (đường legacy thắng khi phát biểu của transform rút).
//   2. Chạy bản đột biến của transform (luật PL39 tắt) → bộ soát của sync-cloud phải dừng ở sale_offers (ca phá, AC-2).
//   3. Cấy tin mới N (đường, toà, quận, phường mang tên nguồn), chạy transform thật, rồi bước chép đường sang căn (duong-can) →
//      bộ soát qua trọn ba bảng; mọi ô chữ của tin có sẵn giống hệt sau lượt đột biến trừ đúng các ô mang tên nguồn, và các ô ấy
//      không còn trúng bộ dò (AC-1); dòng log đếm bằng đếm độc lập; chi phí riêng của luật so thời gian lượt (AC-3).
import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const P = join(ROOT, "pipeline");
const pg = createRequire(join(P, "package.json"))("pg");
const imp = (f) => import(pathToFileURL(join(P, f)));
const { docSourceNameEntries } = await imp("lib/source-name-entries.mjs");
const { findSourceNames } = await imp("lib/mask-source-names.mjs");
const { tokensFromEntries } = await imp("lib/tier-a-guard.mjs");
const { mintOfferId } = await imp("lib/offer-key.mjs");
const { docDuong } = await imp("lib/dac-trung-s06.mjs");
const { dienDuongCan } = await imp("lib/duong-can.mjs");
const sc = await imp("sync-cloud.mjs");

const URL_DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(new URL(URL_DB).pathname)) throw new Error("chỉ chạy trên DB của riêng lượt oneinvest_suite_*");
// Tệp đột biến sót của lượt đã chết (pid không còn sống) thì dọn trước.
for (const f of readdirSync(P)) {
  const m = /^\.pl39-dot-bien-(\d+)\.mjs$/.exec(f);
  if (m) { try { process.kill(Number(m[1]), 0); } catch { rmSync(join(P, f), { force: true }); } }
}
const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
const loi = [];
const bao = (ok, msg) => { console.log(`${ok ? "✔" : "✖"} ${msg}`); if (!ok) loi.push(msg); };
const COT = ["street_raw", "block_raw", "phuong_raw", "district_raw"];
const trung = (v, e) => typeof v === "string" && findSourceNames(v, e).length > 0;

// Đột biến: thân mangTenNguon luôn false (bỏ ghi, rút, trần đều tắt). Tệp cạnh bản thật để import tương đối giữ nguyên.
const goc = readFileSync(join(P, "transform-chotot.mjs"), "utf8");
const LUAT = 'return typeof v === "string" && v !== "" && entries.length > 0 && findSourceNames(v, entries).length > 0;';
if (!goc.includes(LUAT)) throw new Error("không thấy thân luật PL39 trong transform-chotot.mjs — đột biến không dựng được");
const TEP_DB = join(P, `.pl39-dot-bien-${process.pid}.mjs`);
writeFileSync(TEP_DB, goc.replace(LUAT, "return false;"));

/** Bộ soát của sync-cloud trên ba bảng lên cloud, đọc như lượt sync (selectList + localReadSql, cột seller che). Trả cột trúng hoặc null. */
async function soat(tokens) {
  const data = new Map();
  for (const t of Object.keys(sc.CLOUD_ALLOW)) {
    const { rows: cr } = await c.query(
      `SELECT column_name c, udt_name u FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`, [t]);
    const geo = cr.filter((r) => r.u === "geometry" || r.u === "geography").map((r) => r.c);
    const sel = sc.selectList(t, cr.map((r) => r.c), geo, tokens);
    data.set(sc.RENAME(t), (await c.query(sc.localReadSql(t, sel.sql))).rows.map((r) => r.j));
  }
  try { sc.assertNoSourceNames(data, tokens); return null; } catch (e) { return /ở ([a-z_]+\.[a-z_?]+)/.exec(e.message)?.[1] ?? e.message; }
}
const chup = async () => new Map((await c.query(`SELECT offer_id, ${COT.join(", ")} FROM sale_offers WHERE source = 'S06'`)).rows
  .map((r) => [r.offer_id, COT.map((k) => r[k])]));
async function chay(tep) {
  const { runTransformChotot } = await import(pathToFileURL(tep) + `?l=${Date.now()}`);
  const dong = [], log = console.log;
  console.log = (...a) => dong.push(a.join(" "));
  const t0 = performance.now();
  try { await runTransformChotot(c); } finally { console.log = log; }
  return { ms: performance.now() - t0, dong };
}
const SQL_TIN = `SELECT s.list_id FROM stg_chotot_ads s JOIN sale_offers o ON o.source = 'S06' AND o.originating_system_key = s.list_id::text
  WHERE s.price > 0 AND s.size_m2 > 0 AND s.ad_type IN ('s', 'u') AND o.street_raw IS NOT NULL ORDER BY s.list_id LIMIT 1`;

try {
  const e = await docSourceNameEntries(c);
  bao(e.length > 0, `sổ nguồn của bản chép có ${e.length} mục`);
  const tokens = tokensFromEntries(e);
  const tk = e.map((x) => x.realName.trim()).filter((v) => v.length >= 4).sort((a, b) => b.length - a.length)[0];
  const cay = { duong: `Đường ${tk} 12`, toa: `${tk} Tower`, quan: `Quận ${tk}`, phuong: `Phường ${tk}` };
  bao(Object.values(cay).every((v) => trung(v, e)), "bốn chuỗi cấy trúng bộ dò");

  // Ô thật của sự cố: cột street_raw của tin trên bản chép có trúng không (không lọc theo luật đọc; không in giá trị).
  const { rows: [that] } = await c.query(`SELECT street_raw FROM sale_offers WHERE offer_id = 'offer_ba52ee3409d223e3'`);
  const coThat = trung(that?.street_raw, e);
  console.log(`ô thật offer_ba52ee3409d223e3: ${coThat ? "cột đường trúng bộ dò trên bản chép" : that ? "cột đường không trúng (đã gỡ trước khi chép)" : "tin không có trong bản chép (bản mẫu cũ hơn tin)"}`);

  // 1. Cấy A (đường, toà ở nguồn) và B (nguồn bỏ trống đường + phát biểu legacy mang tên nguồn).
  const [a] = (await c.query(SQL_TIN)).rows;
  // B: tin có đường chỉ từ đúng một phát biểu sống (của transform) — rút nó rồi phát biểu legacy cấy là đường duy nhất còn lại.
  const { rows: [b] } = await c.query(`SELECT s.list_id FROM stg_chotot_ads s JOIN sale_offers o ON o.source = 'S06'
      AND o.originating_system_key = s.list_id::text AND o.street_raw IS NOT NULL
     WHERE s.price > 0 AND s.size_m2 > 0 AND s.ad_type IN ('s', 'u') AND s.list_id <> $1
       AND (SELECT count(*) FROM field_assertions fa WHERE fa.subject_key = 'S06:' || s.list_id AND fa.field = 'street_raw'
             AND fa.retracted_at IS NULL) = 1
     ORDER BY s.list_id LIMIT 1`, [a.list_id]);
  await c.query(`UPDATE stg_chotot_ads SET payload = payload || jsonb_build_object('street_name', $2::text, 'block', $3::text) WHERE list_id = $1`,
    [a.list_id, cay.duong, cay.toa]);
  await c.query(`UPDATE stg_chotot_ads SET payload = payload - 'street_name' WHERE list_id = $1`, [b.list_id]);
  const idA = mintOfferId("S06", String(a.list_id)), idB = mintOfferId("S06", String(b.list_id));
  // Phát biểu legacy chỉ đỡ đúng tin sinh ra nó (061: evidence.offer_id), mang rule_id 'offer:<offer_id>' như phat-bieu-cat-chuyen.
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
     VALUES ($1, 'street_raw', $2, 'observed', 'legacy', 'pl39-cay', 'offer:' || $3, jsonb_build_object('offer_id', $3::text), now())`,
    [`S06:${b.list_id}`, cay.duong, idB]);

  // 2. Đột biến (luật tắt) → bộ soát phải dừng.
  const dot = await chay(TEP_DB);
  const soatDot = await soat(tokens);
  bao(soatDot?.startsWith("sale_offers."), `ca phá: bỏ luật thì bộ soát sync-cloud dừng ở ${soatDot ?? "(không dừng)"}`);
  const A = await chup();
  bao(A.get(idA)?.slice(0, 2).every((v) => trung(v, e)), "ca phá: tin A mang đường và toà trúng bộ dò sau lượt đột biến");
  bao(trung(A.get(idB)?.[0], e), "ca phá: tin B lấy đường từ phát biểu legacy trúng bộ dò sau lượt đột biến");

  // 3. Tin mới N (cột quận, phường chỉ ghi lúc tạo dòng): nhân bản một tin gắn phường bằng ward_name_v3; tên cũ chuyển sang
  //    ward_name để phường vẫn khớp, ward_name_v3 nhận tên cấy (phường của tin lấy từ ward_name_v3).
  const { rows: [g] } = await c.query(`SELECT s.list_id FROM stg_chotot_ads s JOIN sale_offers o ON o.source = 'S06'
      AND o.originating_system_key = s.list_id::text AND o.area_id IS NOT NULL AND o.phuong_raw = s.ward_name_v3
     WHERE s.price > 0 AND s.size_m2 > 0 AND s.ad_type IN ('s', 'u') ORDER BY s.list_id LIMIT 1`);
  const { rows: [m] } = await c.query(`SELECT max(list_id) + 1 AS id FROM stg_chotot_ads`);
  await c.query(`INSERT INTO stg_chotot_ads SELECT (jsonb_populate_record(NULL::stg_chotot_ads, to_jsonb(s) || jsonb_build_object(
      'list_id', $2::bigint, 'area_name', $3::text, 'ward_name', s.ward_name_v3, 'ward_name_v3', $6::text,
      'payload', s.payload || jsonb_build_object('street_name', $4::text, 'block', $5::text)))).*
      FROM stg_chotot_ads s WHERE s.list_id = $1`, [g.list_id, m.id, cay.quan, cay.duong, cay.toa, cay.phuong]);
  const idN = mintOfferId("S06", String(m.id));

  // Ca tái diễn (GS 25/11, đúng sự cố offer_ba52ee3409d223e3 sau lượt rút tay): tin C có phát biểu đường mang tên nguồn ĐÃ RÚT lý do
  // mang-ten-nguon, không còn phát biểu đường sống nào, và stg vẫn gửi giá trị ấy → lượt CÓ luật không được sinh lại phát biểu sống.
  const { rows: [cc] } = await c.query(`SELECT s.list_id FROM stg_chotot_ads s JOIN sale_offers o ON o.source = 'S06'
      AND o.originating_system_key = s.list_id::text AND o.street_raw IS NOT NULL
     WHERE s.price > 0 AND s.size_m2 > 0 AND s.ad_type IN ('s', 'u') AND s.list_id NOT IN ($1, $2) ORDER BY s.list_id DESC LIMIT 1`,
    [a.list_id, b.list_id]);
  const idC = mintOfferId("S06", String(cc.list_id)), skC = `S06:${cc.list_id}`;
  await c.query(`UPDATE stg_chotot_ads SET payload = payload || jsonb_build_object('street_name', $2::text) WHERE list_id = $1`, [cc.list_id, cay.duong]);
  await c.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'pl39-cay-tai-dien'
     WHERE retracted_at IS NULL AND subject_key = $1 AND field = 'street_raw'`, [skC]);
  // Bảng chỉ thêm (field_assertions_guard): chèn sống rồi rút, như lượt rút tay 09:13Z.
  await c.query(`WITH moi AS (INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, evidence, observed_at)
       VALUES ($1, 'street_raw', $2, 'fact', 'source_field', 'transform-chotot@045', 'payload.street_name', '{}'::jsonb, now()) RETURNING id)
     SELECT id FROM moi`, [skC, cay.duong]).then(({ rows: [r] }) =>
    c.query(`UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'mang-ten-nguon' WHERE id = $1`, [r.id]));

  // Đếm độc lập: giá trị của stg mà luật phải bỏ ghi, và chủ thể có phát biểu sống đường/toà trúng (luật phải rút).
  const { rows: ads } = await c.query(`SELECT payload->'street_name' AS d, payload->'block' AS b, area_name, ward_name_v3, ward_name FROM stg_chotot_ads
     WHERE price > 0 AND size_m2 > 0 AND ad_type IN ('s', 'u')`);
  const t0 = performance.now();
  const ky = {
    street_raw: ads.filter((r) => trung(docDuong(r.d), e)).length,
    block_raw: ads.filter((r) => trung(String(r.b ?? "").trim().normalize("NFC").replace(/\s+/g, " "), e)).length,
    // Phường của tin lấy từ ward_name_v3 rồi ward_name của nguồn (hai đường khớp tên); hai đường còn lại lấy tên khu của danh bạ.
    phuong_raw: ads.filter((r) => trung(r.ward_name_v3 ?? r.ward_name, e)).length,
    district_raw: ads.filter((r) => trung(r.area_name, e)).length,
  };
  const { rows: song } = await c.query(`SELECT subject_key, value FROM field_assertions WHERE retracted_at IS NULL
     AND field IN ('street_raw', 'block_raw') AND subject_key LIKE 'S06:%'`);
  const kyRut = new Set(song.filter((r) => trung(r.value, e)).map((r) => r.subject_key)).size;
  const chiPhiLuat = performance.now() - t0;

  const that2 = await chay(join(P, "transform-chotot.mjs"));
  const dongDem = that2.dong.find((d) => d.startsWith("ô chữ mang tên nguồn:")) ?? "";
  console.log(`log lượt thật: ${dongDem}`);
  // So BẰNG từng số của dòng log với đếm độc lập (không so chuỗi con).
  const soLog = Object.fromEntries([...dongDem.matchAll(/(street_raw|block_raw|phuong_raw|district_raw) (\d+)/g)].map((m) => [m[1], Number(m[2])]));
  const rutLog = Number(/rút (\d+) chủ thể/.exec(dongDem)?.[1] ?? NaN);
  for (const [k, n] of Object.entries(ky)) bao(soLog[k] === n, `log bỏ ghi ${k} = ${soLog[k]}, đếm độc lập trên stg = ${n}`);
  bao(ky.phuong_raw >= 1 && ky.street_raw >= 2 && ky.block_raw >= 1 && ky.district_raw >= 1, "đếm độc lập gồm các ô cấy (đường A, N; toà; phường N; quận N)");
  bao(rutLog === kyRut, `log rút ${rutLog} chủ thể, đếm độc lập phát biểu sống trúng trước lượt thật = ${kyRut}`);
  const nCan = await dienDuongCan(c);
  console.log(`bước chép đường sang căn sau lượt thật: điền ${nCan} căn`);
  const soatThat = await soat(tokens);
  bao(soatThat === null, `bộ soát sync-cloud qua trọn sale_offers, sellers, properties sau transform thật và duong-can (${soatThat ?? "không trúng"})`);

  const B = await chup();
  const doi = [];
  for (const [id, v] of A) { const w = B.get(id); if (!w) continue; COT.forEach((k, i) => { if (v[i] !== w[i]) doi.push(`${id}.${k}`); }); }
  // Kỳ vọng: đúng các ô trúng bộ dò sau lượt bỏ luật (tin cấy A, B và mọi ô thật nguồn còn gửi), không ô nào khác.
  const kyDoi = [];
  for (const [id, v] of A) COT.forEach((k, i) => { if (trung(v[i], e)) kyDoi.push(`${id}.${k}`); });
  if (A.get(idC)?.[0] != null && !kyDoi.includes(`${idC}.street_raw`)) kyDoi.push(`${idC}.street_raw`); // C: nguồn nay gửi tên nguồn → cột rời giá trị cũ
  kyDoi.sort();
  for (const k of [`${idA}.street_raw`, `${idA}.block_raw`, `${idB}.street_raw`]) bao(kyDoi.includes(k), `ô cấy ${k} trúng sau lượt bỏ luật`);
  console.log(`ô thật offer_ba52ee3409d223e3 trúng sau lượt bỏ luật: ${kyDoi.includes("offer_ba52ee3409d223e3.street_raw") ? "có (nguồn vẫn gửi giá trị ấy)" : "không"}`);
  console.log(`ô chữ đổi giữa lượt đột biến và lượt thật: ${doi.length} (${A.size} tin S06 × ${COT.length} cột)`);
  bao(JSON.stringify(doi.sort()) === JSON.stringify(kyDoi), `chỉ đúng các ô mang tên nguồn đổi: ${doi.join(", ") || "(không)"}`);
  const sau = doi.map((k) => B.get(k.split(".")[0])[COT.indexOf(k.split(".")[1])]);
  bao(sau.every((v) => !trung(v, e)), `các ô đổi không còn trúng bộ dò: ${sau.filter((v) => v === null).length} về NULL, ${sau.filter((v) => v !== null).length} về phát biểu sạch còn lại`);
  bao(!trung(B.get(idB)?.[0], e), `tin B (đường chỉ từ phát biểu legacy trúng) không còn trúng: ${B.get(idB)?.[0] === null ? "về NULL" : "về phát biểu sạch còn lại"}`);
  const { rows: [songC] } = await c.query(`SELECT count(*) FILTER (WHERE retracted_at IS NULL)::int AS song,
      count(*) FILTER (WHERE retracted_at IS NULL AND value = $2)::int AS song_trung FROM field_assertions WHERE subject_key = $1 AND field = 'street_raw'`,
    [skC, cay.duong]);
  bao(songC.song_trung === 0 && !trung(B.get(idC)?.[0], e), `ca tái diễn: lượt có luật không sinh lại phát biểu sống mang tên nguồn cho tin C (sống ${songC.song}, trúng ${songC.song_trung}; cột ${B.get(idC)?.[0] === null ? "NULL" : "không trúng"})`);
  const vN = B.get(idN);
  bao(!!vN && vN.every((v) => v === null), "tin mới N: đường, toà, phường, quận về NULL");
  const { rows: [r] } = await c.query(`SELECT count(*)::int n FROM field_assertions WHERE retract_reason = 'mang-ten-nguon' AND subject_key = ANY($1)`,
    [[`S06:${a.list_id}`, `S06:${b.list_id}`]]);
  bao(r.n >= 3, `phát biểu trúng của A (đường, toà) và B (legacy) rút với lý do mang-ten-nguon (${r.n})`);
  const tile = chiPhiLuat / that2.ms;
  console.log(`thời gian: lượt đột biến ${(dot.ms / 1000).toFixed(1)} s · lượt thật ${(that2.ms / 1000).toFixed(1)} s (tỉ lệ ${(that2.ms / dot.ms).toFixed(3)}, một mẫu, chỉ tham khảo) · chi phí riêng của luật ${(chiPhiLuat / 1000).toFixed(2)} s = ${(tile * 100).toFixed(2)}% lượt thật`);
  const tran = Number(process.env.PL39_TRAN_CHI_PHI ?? "0.05");
  bao(tile <= tran, `chi phí riêng của luật không quá ${(tran * 100).toFixed(0)}% thời gian lượt transform`);

  // 4. Trần (AC-5): cấy thêm 51 tin mới có quận mang tên nguồn → lượt dừng TRƯỚC mọi lần ghi.
  const { rows: [m2] } = await c.query(`SELECT max(list_id) AS id FROM stg_chotot_ads`);
  await c.query(`INSERT INTO stg_chotot_ads SELECT (jsonb_populate_record(NULL::stg_chotot_ads, to_jsonb(s) || jsonb_build_object(
      'list_id', $2::bigint + k, 'area_name', $3::text))).* FROM stg_chotot_ads s, generate_series(1, 51) k WHERE s.list_id = $1`,
    [g.list_id, m2.id, cay.quan]);
  const dau = async () => (await c.query(`SELECT (SELECT count(*) FROM sale_offer_records)::int AS tin, (SELECT max(id) FROM field_assertions)::text AS pb,
      (SELECT count(*) FROM field_assertions WHERE retracted_at IS NOT NULL)::int AS rut`)).rows[0];
  const truocTran = await dau();
  let loiTran = "";
  try { await chay(join(P, "transform-chotot.mjs")); } catch (er) { loiTran = er.message; }
  bao(/vượt trần 50 — dừng, không rút, không ghi/.test(loiTran), `vượt trần thì lượt dừng: ${loiTran.slice(0, 60) || "(không dừng)"}`);
  bao(JSON.stringify(await dau()) === JSON.stringify(truocTran), "vượt trần: không thêm tin, không thêm hay rút phát biểu nào");
} finally {
  rmSync(TEP_DB, { force: true });
  await c.end();
}
console.log(loi.length ? `KẾT QUẢ: đỏ ${loi.length} ca` : "KẾT QUẢ: xanh");
process.exit(loi.length ? 1 : 0);
