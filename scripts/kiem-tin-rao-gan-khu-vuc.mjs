#!/usr/bin/env node
// Đường đo gán khu vực tin rao (S03, S05, S06) trên DB local: ba transform không gán tin vào khu vực không hợp lệ (khu
// vực lạc, khu vực không phải phường OSM), sửa được tin đang gán sai, và không gỡ nhãn tin đang có phường hợp lệ.
//   --thu   MỘT transaction rồi ROLLBACK, trạng thái hỏng TỰ DỰNG bằng mồi (hàng do-khu-vuc-tu-dung-moi):
//           chụp gốc → lượt nền ba transform → chụp nền → sáu tin mồi (hai mỗi nguồn) gắn vào sáu khu vực mồi mang đúng
//           tên phường nền của tin → chụp trước → lượt đo → chụp sau; băm các bảng transform ghi trước/sau ngoài
//           transaction. Thiết kế: docs/superpowers/specs/2026-10-26-do-khu-vuc-tu-dung-moi-design.md §2.
//   --pha khong-sua | mo-loc   chiều đỏ cho test: bỏ lượt đo | sáu khu vực mồi mang meta phường hợp lệ trong lượt đo.
//   (mặc định) chỉ đọc: in số tin đang trỏ khu vực không hợp lệ theo nguồn.
// Từ chối DB không phải localhost. Chạy: node scripts/kiem-tin-rao-gan-khu-vuc.mjs [--thu [--pha <chiều>]]
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { phuongHopLe } from "../pipeline/lib/osm.mjs";
import { runTransformChotot } from "../pipeline/transform-chotot.mjs";
import { runTransformFb } from "../pipeline/transform-fb.mjs";
import { runTransformZalo } from "../pipeline/transform-zalo.mjs";

// Root repo không có node_modules — mượn pg từ app/ (AGENTS.md bẫy 6).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const NGUON = ["S03", "S05", "S06"];
const PHA = ["khong-sua", "mo-loc"];

// Bảng ba transform và reconcile_stale_offers (migration 044) ghi — rút từ câu INSERT/UPDATE/DELETE của
// pipeline/transform-*.mjs, pipeline/lib/write-offers.mjs và hàm SQL; areas vì phép đo chèn khu vực mồi.
export const BANG_GHI = ["sale_offer_records", "property_offers", "property_candidates", "review_queue", "enrichment_proposals", "areas"];
const AUDIT = "ops_audit";

/** offer_id → { source, area_id, hop_le, post_ids } cho ba nguồn tin rao; hop_le = area_id là phường hợp lệ (null khi không có phường). */
async function chup(c) {
  const { rows } = await c.query(
    `SELECT o.offer_id, o.source, o.area_id, o.post_ids,
            CASE WHEN o.area_id IS NULL THEN NULL
                 ELSE EXISTS (SELECT 1 FROM areas a WHERE a.id = o.area_id AND a.region_type = 'submarket' AND ${phuongHopLe("a.")})
            END AS hop_le
     FROM sale_offers o WHERE o.source = ANY($1)`,
    [NGUON],
  );
  return new Map(rows.map((r) => [r.offer_id, r]));
}

/** Tin trỏ khu vực không phải phường hợp lệ — tin gắn thẳng vào thị trường (area_id là market) không tính. */
const khongHopLe = async (c, snap) => {
  const { rows } = await c.query(`SELECT id FROM areas WHERE region_type = 'submarket'`);
  const sub = new Set(rows.map((r) => r.id));
  return [...snap.values()].filter((o) => o.area_id && sub.has(o.area_id) && !o.hop_le);
};

/** Tin có phường hợp lệ trước lượt mà sau lượt còn tồn tại nhưng đổi area_id (NULL hoặc khu vực khác); `bo` = offer_id bỏ qua. */
export const lech = (truoc, sau, bo = new Set()) =>
  [...truoc.values()]
    .filter((o) => o.hop_le && !bo.has(o.offer_id) && sau.has(o.offer_id) && sau.get(o.offer_id).area_id !== o.area_id)
    .map((o) => o.offer_id);

/** Băm có thứ tự từng bảng ghi + số dòng ops_audit của transform — đọc NGOÀI transaction. */
async function bam(c) {
  const out = {};
  for (const t of BANG_GHI) {
    const { rows: [r] } = await c.query(
      `SELECT count(*)::int n, md5(coalesce(string_agg(t::text, E'\\n' ORDER BY t::text), '')) h FROM ${t} t`,
    );
    out[t] = r;
  }
  const { rows: [a] } = await c.query(`SELECT count(*)::int n FROM ${AUDIT} WHERE actor LIKE 'transform:%' OR action LIKE 'transform:%'`);
  out[AUDIT] = { n: a.n, h: String(a.n) };
  return out;
}

/** Tên bảng có băm hay số dòng sau khác gốc. */
export const soBam = (goc, sau) => Object.keys(goc).filter((t) => goc[t].h !== sau[t]?.h || goc[t].n !== sau[t]?.n);

const baTransform = async (c) => {
  await runTransformZalo(c);
  await runTransformFb(c);
  await runTransformChotot(c);
};

async function main() {
  const THU = process.argv.includes("--thu");
  const iPha = process.argv.indexOf("--pha");
  const pha = iPha > 0 ? process.argv[iPha + 1] : null;
  if (pha && !PHA.includes(pha)) {
    console.error(`kiem-tin-rao-gan: --pha nhận ${PHA.join(" | ")}, không nhận «${pha}»`);
    process.exit(2);
  }
  const u = new URL(DB_URL);
  if (!["localhost", "127.0.0.1", "::1"].includes(u.hostname)) {
    console.error(`kiem-tin-rao-gan: từ chối DB không phải localhost (${u.hostname})`);
    process.exit(2);
  }

  const fails = [];
  const check = (ok, msg) => {
    console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
    if (!ok) fails.push(msg);
  };

  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    if (!THU) {
      const bad = await khongHopLe(c, await chup(c));
      for (const s of NGUON) console.log(`${s}: ${bad.filter((o) => o.source === s).length} tin trỏ khu vực không hợp lệ`);
      check(bad.length === 0, `${bad.length} tin trỏ khu vực không hợp lệ (chỉ đọc)`);
    } else {
      if (pha) console.log(`chiều đỏ: --pha ${pha}`);
      const goc = await bam(c);
      const moiKhuVuc = [];
      await c.query("BEGIN");
      try {
        await c.query("SELECT pg_advisory_xact_lock(33033)");
        const chupGoc = await chup(c);

        // ---- Lượt nền: lời hứa đã ký của E8 (tin-rao-gan-khu-vuc-dung) trên DB thật ----
        await baTransform(c);
        const nen = await chup(c);
        console.log("\nlượt nền:");
        const lNen = lech(chupGoc, nen);
        check(lNen.length === 0, `lượt nền: ${lNen.length} tin có phường hợp lệ ở DB thật bị gỡ hay đổi khu vực (nối theo offer_id)${lNen.length ? `: ${lNen.slice(0, 10).join(", ")}` : ""}`);
        for (const s of NGUON) {
          const nghi = [...chupGoc.values()].filter((o) => o.source === s && !nen.has(o.offer_id)).length;
          console.log(`${s}: ${nghi} tin bị cho nghỉ`);
        }

        // ---- Mồi: hai tin có phường hợp lệ ở Hà Nội mỗi nguồn, mỗi tin một khu vực mồi đúng tên phường nền ----
        const { rows: ung } = await c.query(
          `SELECT o.offer_id, o.source, o.area_id, a.name FROM sale_offers o JOIN areas a ON a.id = o.area_id
           WHERE o.source = ANY($1) AND a.parent_id = 'vn-hanoi' AND ${phuongHopLe("a.")}
           ORDER BY o.source, o.offer_id`,
          [NGUON],
        );
        const moi = [];
        for (const s of NGUON) {
          const hai = ung.filter((r) => r.source === s).slice(0, 2);
          if (hai.length < 2) throw new Error(`nguồn ${s}: chỉ ${hai.length} tin có phường hợp lệ ở Hà Nội sau lượt nền — không đủ hai tin mồi`);
          hai.forEach((r, i) => moi.push({ ...r, lac: i === 0 }));
        }
        for (const m of moi) {
          // Lạc mồi xếp id TRƯỚC mọi phường thật, không-OSM mồi xếp SAU — bộ đọc quên lọc lấy bản đầu hay bản cuối khi trùng
          // tên thì mỗi nguồn vẫn có một tin rơi được vào mồi (chiều đỏ --pha mo-loc).
          const id = m.lac ? `vn-hanoi-0-moi-lac-${m.offer_id}` : `vn-hanoi-zz-moi-khong-osm-${m.offer_id}`;
          const meta = m.lac ? { source: "osm-phuong", lac: true } : { source: "moi-khong-osm" };
          await c.query(
            `INSERT INTO areas (id, parent_id, region_type, name, country_code, geom, meta)
             SELECT $1, 'vn-hanoi', 'submarket', a.name, 'vn', a.geom, $2::jsonb FROM areas a WHERE a.id = $3`,
            [id, JSON.stringify(meta), m.area_id],
          );
          await c.query(`UPDATE sale_offer_records SET area_id = $1 WHERE offer_id = $2`, [id, m.offer_id]);
          m.moiArea = id;
          m.meta = meta;
          moiKhuVuc.push(id);
          console.log(`mồi ${m.source} ${m.offer_id} → ${id} «${m.name}» (${m.lac ? "lạc" : "không-OSM"})`);
        }
        const boMoi = new Set(moi.map((m) => m.offer_id));
        const vungMoi = new Set(moiKhuVuc);

        const truoc = await chup(c);
        const sai = await khongHopLe(c, truoc);
        const saiId = new Set(sai.map((o) => o.offer_id));
        const thieu = moi.filter((m) => !saiId.has(m.offer_id)).map((m) => m.offer_id);
        console.log("");
        check(thieu.length === 0, `trạng thái trước có ${moi.length - thieu.length} tin mồi trỏ khu vực không hợp lệ (+ ${sai.filter((o) => !boMoi.has(o.offer_id)).length} tin thật)${thieu.length ? ` — thiếu: ${thieu.join(", ")}` : ""}`);

        // ---- Lượt đo ----
        if (pha === "mo-loc") {
          await c.query(`UPDATE areas SET meta = '{"source":"osm-phuong"}'::jsonb WHERE id = ANY($1)`, [moiKhuVuc]);
          try {
            await baTransform(c);
          } finally {
            for (const m of moi) await c.query(`UPDATE areas SET meta = $1::jsonb WHERE id = $2`, [JSON.stringify(m.meta), m.moiArea]);
          }
        } else if (pha !== "khong-sua") {
          await baTransform(c);
        }

        const sau = await chup(c);
        console.log("\nsau:");
        const saiSau = await khongHopLe(c, sau);
        const vaoMoi = [...sau.values()].filter((o) => vungMoi.has(o.area_id));
        // Tin mồi đứng đầu danh sách in — danh sách cắt ở 10 mã mà vẫn gọi được tên mồi đã rơi
        const hong = [...new Set([...saiSau, ...vaoMoi].map((o) => o.offer_id))].sort((a, b) => boMoi.has(b) - boMoi.has(a));
        check(hong.length === 0,
          `${hong.length ? `${saiSau.length} + ${vaoMoi.length}` : 0} tin trỏ khu vực không hợp lệ hay khu vực mồi${hong.length ? `: ${hong.slice(0, 10).join(", ")}${hong.length > 10 ? ` (+${hong.length - 10})` : ""}` : ""}`);
        for (const s of NGUON) {
          const ms = moi.filter((m) => m.source === s);
          const ve = ms.filter((m) => sau.get(m.offer_id)?.area_id === m.area_id).length;
          check(ve === ms.length, `${s}: ${ms.length} tin mồi → ${ve} về phường cũ`);
        }
        const l = lech(truoc, sau, boMoi);
        check(l.length === 0, `${l.length} tin có phường hợp lệ trước lượt bị gỡ hay đổi khu vực (nối theo offer_id, bỏ ${moi.length} tin mồi)${l.length ? `: ${l.slice(0, 10).join(", ")}` : ""}`);
        // Đối chứng dương của thước lệch: một tin có phường hợp lệ bị gỡ nhãn → thước phải gọi đúng offer_id
        const mau = [...truoc.values()].find((o) => o.hop_le && !boMoi.has(o.offer_id) && sau.has(o.offer_id));
        const sauGo = new Map(sau);
        sauGo.set(mau.offer_id, { ...sau.get(mau.offer_id), area_id: null });
        check(lech(truoc, sauGo, boMoi).includes(mau.offer_id), `tin mồi bị gỡ nhãn → thước báo đỏ (${mau.offer_id})`);
      } catch (e) {
        check(false, `phép đo dừng giữa chừng: ${e.message}`);
      } finally {
        await c.query("ROLLBACK");
      }
      const sauBam = await bam(c);
      const lechBang = soBam(goc, sauBam);
      const { rows: [mc] } = await c.query(`SELECT count(*)::int n FROM areas WHERE id = ANY($1)`, [moiKhuVuc]);
      check(lechBang.length === 0 && mc.n === 0,
        `ROLLBACK — ${lechBang.length ? `băm lệch gốc: ${lechBang.join(", ")}` : `${BANG_GHI.length} bảng băm bằng gốc`} · ops_audit +${sauBam[AUDIT].n - goc[AUDIT].n} dòng transform · ${mc.n} khu vực mồi`);
    }
  } finally {
    await c.end();
  }
  console.log(fails.length === 0 ? "\nkiem-tin-rao-gan: PASS" : `\nkiem-tin-rao-gan: FAIL (${fails.length})`);
  process.exit(fails.length === 0 ? 0 : 1);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
