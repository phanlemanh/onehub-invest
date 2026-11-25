#!/usr/bin/env node
// noi-du-an-nguon.mjs — DA3 bang-noi-ma-du-an AC-3..AC-6: nối bản ghi dự án của nguồn danh mục (S07, S09, S10, S16) vào nút danh
// bạ có sẵn theo loại căn cứ (K3, T), qua thẻ luật người xem mẫu trước khi áp (khuôn DA32 noi-du-an-s06.mjs). Thiết kế §3.3.
//   node noi-du-an-nguon.mjs --nguon <S0x> --the <tệp>                      dựng thẻ (chỉ đọc), dòng cuối «băm: <hex>»
//   node noi-du-an-nguon.mjs --ap --nguon <S0x> --bam <hex> --nguoi <tên>    áp đúng thẻ đã xem (băm lệch → không ghi gì)
//   node noi-du-an-nguon.mjs --dao <rule_id> --nguoi <tên>                   đảo một luật: bí danh nghỉ, dòng về chua_noi/dao-luat
// Mọi dòng ghi mang rule_id của lượt (<nguồn>-K3, -T, -noi-san, -trang-thai); đảo đủ mọi luật của nguồn là lùi trọn, không xoá
// dòng. S08 do thẻ luật DA55 nối: lệnh chỉ dựng thẻ bóng đối chiếu, từ chối áp. Áp lên DB máy thu là lời của Mạnh ở Cổng Bằng chứng.
import { realpathSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { docBanGhi, docVung, NGUON_DANH_MUC } from "./lib/ban-ghi-nguon.mjs";
import { bamKetCuc, docNoiSan, docNut, LY_DO, xepNga } from "./lib/khop-du-an.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
export const SO_MAU = 20;
export const NGUON_DA55 = "S08";

/** Bốn tên luật của một nguồn. */
export const tenLuat = (nguon) => ({ K3: `${nguon}-K3`, T: `${nguon}-T`, K1: `${nguon}-K1`, K2: `${nguon}-K2`, giu: `${nguon}-noi-san`, trangThai: `${nguon}-trang-thai` });
const moiTenLuat = (nguon) => Object.values(tenLuat(nguon));

/** Luật của một kết cục: noi theo căn cứ, giu theo nối sẵn, chua_noi theo trạng thái. */
export function luatCua(nguon, kq) {
  const t = tenLuat(nguon);
  if (kq.nga === "noi") return t[kq.can_cu];
  if (kq.nga === "giu") return t.giu;
  return t.trangThai;
}

/** Bản ghi nối sẵn mà bóng không ra đúng nút ấy (khác nút, hoặc không khớp) — liệt trên thẻ, không ghi đè. */
const lechNoiSan = (kq) => kq.nga === "giu" && !(kq.bong.nga === "noi" && kq.bong.node_id === kq.node_id);

const khoaNga = (kq) => (kq.nga === "giu" ? "giu" : kq.nga === "noi" ? kq.can_cu : kq.ly_do);

/** Dựng thẻ (chỉ đọc). ds: mỗi bản ghi một dòng {ma, ten, tinh, kq, tenNut}. */
export async function dungThe(client, nguon) {
  if (!NGUON_DANH_MUC.includes(nguon)) throw new Error(`nguon-la: ${nguon}`);
  const ctx = await docVung(client);
  const banGhi = await docBanGhi(client, nguon, ctx);
  const nut = await docNut(client);
  const san = await docNoiSan(client, nguon, { maDa3: moiTenLuat(nguon) });
  const tenNut = new Map(nut.map((n) => [n.id, n.ten]));
  const ds = banGhi.map((b) => {
    const kq = xepNga(b, nut, san);
    return { ma: b.ma, ten: b.ten_goc ?? "", tinh: b.tinh, xa: b.xa, kq, tenNut: kq.node_id != null ? tenNut.get(kq.node_id) : null,
      tenBong: kq.bong?.node_id != null ? tenNut.get(kq.bong.node_id) : null };
  });
  const tong = {};
  for (const d of ds) tong[khoaNga(d.kq)] = (tong[khoaNga(d.kq)] ?? 0) + 1;
  const mau = {};
  for (const can of ["K1", "K2", "K3", "T"]) {
    const nhom = ds.filter((d) => d.kq.nga === "noi" && d.kq.can_cu === can).sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
    if (nhom.length) mau[can] = nhom.slice(0, SO_MAU);
  }
  const lech = ds.filter((d) => lechNoiSan(d.kq));
  const bam = bamKetCuc(ds.map((d) => ({ ma: d.ma, kq: d.kq })));
  return { nguon, ds, tong, mau, lech, bam, markdown: vietThe({ nguon, ds, tong, mau, lech, bam }) };
}

/** Thẻ markdown: không in mã dự án nguồn (chỉ tên, tỉnh, nút). */
export function vietThe({ nguon, ds, tong, mau, lech, bam }) {
  const dong = (d) => `| ${d.ten} | ${d.tinh ?? "—"} | ${d.xa ?? "—"} | ${d.tenNut ?? d.tenBong ?? "—"} |`;
  const out = [
    `# Thẻ luật nối dự án ${nguon} — DA3 bang-noi-ma-du-an`, "",
    nguon === NGUON_DA55 ? "S08 do thẻ luật DA55 nối — thẻ này chỉ chạy bóng để đối chiếu, không áp được." : "", "",
    `Tổng: ${ds.length} bản ghi.`, "", "| Ngả | Số |", "|---|---|",
    ...Object.entries(tong).sort().map(([k, v]) => `| ${k} | ${v} |`), "",
  ];
  for (const [can, nhom] of Object.entries(mau)) {
    out.push(`## Mẫu căn cứ ${can} (${nhom.length}/${tong[can]})`, "", "| Tên nguồn | Tỉnh | Xã | Nút danh bạ |", "|---|---|---|---|", ...nhom.map(dong), "");
  }
  out.push(`## Nối sẵn mà bóng ra khác (${lech.length})`, "");
  if (nguon === NGUON_DA55 && lech.length) out.push("Nối tay gắn dự án con vào dự án cha: khác do quy ước dự án con có cha (ROADMAP §3 mục 39).", "");
  out.push("| Tên nguồn | Nút nối sẵn | Bóng ra |", "|---|---|---|",
    ...lech.map((d) => `| ${d.ten} | ${d.tenNut ?? "—"} | ${d.kq.bong.nga === "noi" ? `${d.tenBong} (${d.kq.bong.can_cu})` : d.kq.bong.ly_do} |`), "",
    `băm: ${bam}`, "");
  return out.join("\n");
}

async function moGiaoDich(client, giaoDich) {
  if (giaoDich === "ngoai") await client.query("SAVEPOINT da3_gd"); else await client.query("BEGIN");
}
async function dongGiaoDich(client, giaoDich, ok) {
  if (giaoDich === "ngoai") await client.query(ok ? "RELEASE SAVEPOINT da3_gd" : "ROLLBACK TO SAVEPOINT da3_gd");
  else await client.query(ok ? "COMMIT" : "ROLLBACK");
}

async function docLink(client, nguon) {
  const { rows } = await client.query(
    "SELECT source_project_id AS ma, asset_node_id::int AS node_id, status, ly_do FROM project_links WHERE source = $1", [nguon]);
  return new Map(rows.map((r) => [r.ma, r]));
}

async function docBiDanh(client, nguon) {
  const { rows } = await client.query(`
    SELECT id, substring(value FROM 7) AS ma, object_key FROM registry_aliases
     WHERE source = $1 AND kind = 'ma_nguon' AND retired_at IS NULL AND value LIKE 'du\\_an/%' AND object_key LIKE 'node:%'`, [nguon]);
  return new Map(rows.map((r) => [r.ma, r]));
}

const coNut = (kq) => kq.nga === "noi" || kq.nga === "giu";

/** Áp thẻ đúng băm. Băm lệch → ném «bam-lech», không ghi gì. Trạng thái đã đúng → {khongDoi: true}. */
export async function apThe(client, { nguon, bam, nguoi, giaoDich = "rieng", _sauBiDanh = null }) {
  if (nguon === NGUON_DA55) throw new Error("S08 do thẻ luật DA55 nối — DA3 không áp S08");
  if (!NGUON_DANH_MUC.includes(nguon)) throw new Error(`nguon-la: ${nguon}`);
  if (!/^[0-9a-f]{64}$/.test(String(bam ?? ""))) throw new Error("bam-sai-khuon: cần --bam <64 hex>");
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await moGiaoDich(client, giaoDich);
  let ok = false;
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('noi-du-an-nguon'))");
    await client.query("LOCK TABLE project_links IN SHARE ROW EXCLUSIVE MODE");
    const the = await dungThe(client, nguon);
    if (the.bam !== bam) throw new Error(`bam-lech: thẻ hiện tại ${the.bam}, băm khai ${bam} — dựng thẻ mới rồi xem lại`);
    const link = await docLink(client, nguon);
    const biDanh = await docBiDanh(client, nguon);
    const dungRoi = (d) => {
      const l = link.get(d.ma), a = biDanh.get(d.ma);
      if (!coNut(d.kq)) return l?.status === "chua_noi" && l.ly_do === d.kq.ly_do && !a;
      return l?.status === "noi" && l.node_id === d.kq.node_id && a?.object_key === `node:${d.kq.node_id}`;
    };
    if (the.ds.every(dungRoi)) { ok = true; return { rules: [], khongDoi: true }; }
    const dem = new Map();
    for (const d of the.ds) dem.set(luatCua(nguon, d.kq), (dem.get(luatCua(nguon, d.kq)) ?? 0) + 1);
    const ruleId = new Map();
    for (const [can, so] of [...dem].sort()) {
      const { rows: [r] } = await client.query(
        "INSERT INTO project_link_rules (source, can_cu, mau_bam, so_ma, decided_by) VALUES ($1, $2, $3, $4, $5) RETURNING id::int",
        [nguon, can, bam, so, String(nguoi).trim()]);
      ruleId.set(can, r.id);
    }
    let soBiDanh = 0;
    for (const d of the.ds) {
      const can = luatCua(nguon, d.kq);
      const a = biDanh.get(d.ma);
      if (!coNut(d.kq)) {
        if (a) await client.query("UPDATE registry_aliases SET retired_at = now() WHERE id = $1", [a.id]);
        await client.query(
          `INSERT INTO project_links (source, source_project_id, asset_node_id, status, can_cu, ly_do, rule_id)
           VALUES ($1, $2, NULL, 'chua_noi', $3, $4, $5)
           ON CONFLICT (source, source_project_id) DO UPDATE SET asset_node_id = NULL, status = 'chua_noi', can_cu = EXCLUDED.can_cu,
             ly_do = EXCLUDED.ly_do, rule_id = EXCLUDED.rule_id, updated_at = now()`,
          [nguon, d.ma, can, d.kq.ly_do, ruleId.get(can)]);
        continue;
      }
      const key = `node:${d.kq.node_id}`;
      if (a && a.object_key !== key) await client.query("UPDATE registry_aliases SET retired_at = now() WHERE id = $1", [a.id]);
      if (!a || a.object_key !== key) {
        await client.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, $3)", [key, `du_an/${d.ma}`, nguon]);
        soBiDanh++;
        if (_sauBiDanh) await _sauBiDanh(soBiDanh);
      }
      await client.query(
        `INSERT INTO project_links (source, source_project_id, asset_node_id, status, can_cu, ly_do, rule_id)
         VALUES ($1, $2, $3, 'noi', $4, NULL, $5)
         ON CONFLICT (source, source_project_id) DO UPDATE SET asset_node_id = EXCLUDED.asset_node_id, status = 'noi', ly_do = NULL,
           can_cu = EXCLUDED.can_cu, rule_id = EXCLUDED.rule_id, updated_at = now()`,
        [nguon, d.ma, d.kq.node_id, can, ruleId.get(can)]);
    }
    ok = true;
    return { rules: [...ruleId].map(([can_cu, id]) => ({ can_cu, id })), khongDoi: false };
  } finally {
    await dongGiaoDich(client, giaoDich, ok);
  }
}

/** Đảo một luật: bí danh của các dòng nối của luật nghỉ, dòng về chua_noi/dao-luat (giữ nút), luật ghi người và giờ đảo. */
export async function daoLuat(client, { ruleId, nguoi, giaoDich = "rieng" }) {
  if (!String(nguoi ?? "").trim()) throw new Error("thieu-nguoi: cần --nguoi <tên>");
  await moGiaoDich(client, giaoDich);
  let ok = false;
  try {
    const { rows: [luat] } = await client.query("SELECT id, source, dao_at FROM project_link_rules WHERE id = $1 FOR UPDATE", [ruleId]);
    if (!luat) throw new Error(`luat-khong-co: ${ruleId}`);
    if (luat.dao_at) throw new Error(`da-dao: luật ${ruleId} đã đảo`);
    const { rowCount: soBiDanh } = await client.query(`
      UPDATE registry_aliases a SET retired_at = now()
        FROM project_links pl
       WHERE pl.source = $1 AND pl.rule_id = $2 AND pl.status = 'noi'
         AND a.source = $1 AND a.kind = 'ma_nguon' AND a.retired_at IS NULL AND a.value = 'du_an/' || pl.source_project_id
         AND a.object_key = 'node:' || pl.asset_node_id`, [luat.source, ruleId]);
    await client.query(`UPDATE project_links SET status = 'chua_noi', ly_do = $3, updated_at = now()
                         WHERE source = $1 AND rule_id = $2 AND status = 'noi'`, [luat.source, ruleId, LY_DO.daoLuat]);
    await client.query("UPDATE project_link_rules SET dao_by = $2, dao_at = now() WHERE id = $1", [ruleId, String(nguoi).trim()]);
    ok = true;
    return { soBiDanh };
  } finally {
    await dongGiaoDich(client, giaoDich, ok);
  }
}

// ---- CLI ----
function thamSo(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--ap") a.ap = true;
    else if (["--the", "--bam", "--nguoi", "--dao", "--nguon"].includes(k)) a[k.slice(2)] = argv[++i];
  }
  return a;
}

async function main(argv) {
  const a = thamSo(argv);
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    if (a.the && a.nguon) {
      const the = await dungThe(client, a.nguon);
      writeFileSync(a.the, the.markdown);
      console.log(`thẻ ${a.nguon}: ${the.ds.length} bản ghi, ${JSON.stringify(the.tong)}, băm ${the.bam} → ${a.the}`);
    } else if (a.ap) {
      const kq = await apThe(client, { nguon: a.nguon, bam: a.bam, nguoi: a.nguoi });
      console.log(kq.khongDoi ? "đã áp, không đổi" : `đã áp ${a.nguon}: ${kq.rules.map((r) => `${r.can_cu}#${r.id}`).join(", ")}`);
    } else if (a.dao) {
      const kq = await daoLuat(client, { ruleId: Number(a.dao), nguoi: a.nguoi });
      console.log(`đã đảo luật ${a.dao}: ${kq.soBiDanh} bí danh nghỉ`);
    } else {
      console.error("dùng: --nguon <S0x> --the <tệp> | --ap --nguon <S0x> --bam <hex> --nguoi <tên> | --dao <rule_id> --nguoi <tên>");
      process.exitCode = 2;
    }
  } finally {
    await client.end();
  }
}

// So bằng realpath: launchd gọi qua symlink ~/dev/one-invest (scripts/entrypoint-symlink.test.mjs AC-3).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exitCode = 1; });
}
