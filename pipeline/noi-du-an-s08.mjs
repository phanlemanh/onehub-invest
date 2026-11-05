#!/usr/bin/env node
// noi-du-an-s08.mjs — DN1: nối dự án S08 vào khu đô thị từ tệp bảng nối ở máy thu. Ghi bảng local, không sync cloud (luật 5).
// Dự án không có trong tệp thành chua_noi. In số và mã lỗi, không in tên hay mã dự án S08.
// Dùng: node pipeline/noi-du-an-s08.mjs --tep <tệp> [--thu]   (--thu chỉ kiểm, không ghi). Thoát: 0 được · 1 tệp hay DB lỗi · 2 sai cách gọi.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

/** Bỏ dấu, thường hoá: tên S08 viết hoa, có dấu và hậu tố, tín hiệu viết thường không dấu. */
export function boDau(s) {
  return (s ?? "").normalize("NFD").replace(/\p{M}/gu, "").replace(/[đĐ]/g, "d").toLowerCase();
}

const chuDuAn = (d) => boDau([d.ten, d.ma, d.phan_khu].join(" | "));

/**
 * Kiểm bảng nối trên danh sách dự án và nút. Có lỗi thì không dựng dòng nào.
 * @param {{ bang: { noi?: object[], tu_khoa_lat?: object, loai?: object[] },
 *           duAn: { project_id: string, ten: string, ma: string, phan_khu: string }[],
 *           nut: Map<string, string> }} vao  nut: slug → node_type
 * @returns {{ loi: string[], dong: { project_id: string, slug: string|null, status: string, ly_do: string|null }[] }}
 */
export function kiemBangNoi({ bang, duAn, nut }) {
  const noi = bang.noi ?? [];
  const tuKhoa = bang.tu_khoa_lat ?? {};
  const lyDoLoai = new Map((bang.loai ?? []).map((l) => [l.project_id, l.ly_do]));
  const loai = new Set(lyDoLoai.keys());
  const theoId = new Map(duAn.map((d) => [d.project_id, d]));
  const loi = new Set();
  if (noi.length === 0) loi.add("bang-rong");
  const daGap = new Set();
  for (const d of noi) {
    if (!nut.has(d.slug)) loi.add("slug-khong-co");
    else if (nut.get(d.slug) !== "project") loi.add("nut-khong-phai-project");
    if (daGap.has(d.project_id)) loi.add("du-an-hai-dong");
    daGap.add(d.project_id);
    if (loai.has(d.project_id)) loi.add("du-an-hai-dong");
    const da = theoId.get(d.project_id);
    if (!da) { loi.add("project-id-la"); continue; }
    const hieu = boDau(d.tin_hieu);
    if (!hieu || !chuDuAn(da).includes(hieu) || !(tuKhoa[d.slug] ?? []).map(boDau).includes(hieu)) loi.add("tin-hieu-khong-khop");
  }
  for (const [id, lyDo] of lyDoLoai) {
    if (!theoId.has(id)) loi.add("project-id-la");
    if (!lyDo?.trim()) loi.add("loai-thieu-ly-do");
  }
  const moiTuKhoa = Object.values(tuKhoa).flat().map(boDau);
  for (const d of duAn) {
    if (daGap.has(d.project_id) || loai.has(d.project_id)) continue;
    const chu = chuDuAn(d);
    if (moiTuKhoa.some((k) => chu.includes(k))) loi.add("ung-vien-bi-sot");
  }
  if (loi.size) return { loi: [...loi].sort(), dong: [] };
  const slugCua = new Map(noi.map((d) => [d.project_id, d.slug]));
  const dong = duAn.map((d) => {
    if (slugCua.has(d.project_id)) return { project_id: d.project_id, slug: slugCua.get(d.project_id), status: "noi", ly_do: null };
    return { project_id: d.project_id, slug: null, status: "chua_noi", ly_do: lyDoLoai.get(d.project_id) ?? "ngoai-lat" };
  });
  return { loi: [], dong };
}

const khoGit = (thuMuc) => {
  const r = spawnSync("git", ["-C", thuMuc, "rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
};

/** Tệp bảng nối phải nằm trong chính kho này (mọi worktree chung một kho) và bị git bỏ qua. `check-ignore` thoát 0 bỏ qua · 1 không. */
export function kiemTep(tep) {
  const kho = khoGit(path.dirname(tep));
  if (!kho || kho !== khoGit(path.dirname(fileURLToPath(import.meta.url)))) return "tep-ngoai-kho";
  const r = spawnSync("git", ["-C", path.dirname(tep), "check-ignore", "-q", tep]);
  if (r.status === 0) return null;
  return r.status === 1 ? "tep-khong-bi-bo-qua" : "tep-ngoai-kho";
}

async function main() {
  const i = process.argv.indexOf("--tep");
  const tep = i > 0 ? process.argv[i + 1] : null;
  const thu = process.argv.includes("--thu");
  if (!tep) { console.error("thieu --tep"); process.exit(2); }
  const baoLoi = (ma) => { console.log(`loi: ${ma}`); process.exit(1); };
  const tuyetDoi = path.resolve(tep);
  if (!fs.existsSync(tuyetDoi)) baoLoi("tep-khong-co");
  const loiTep = kiemTep(tuyetDoi);
  if (loiTep) baoLoi(loiTep);
  let bang;
  try { bang = JSON.parse(fs.readFileSync(tuyetDoi, "utf8")); } catch { baoLoi("tep-khong-doc-duoc"); }

  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    const { rows: duAn } = await c.query(
      `SELECT project_id::text AS project_id, max(payload->>'project_name') AS ten, max(payload->>'project_code') AS ma,
              string_agg(DISTINCT subdivision_name, ' / ') AS phan_khu
       FROM stg_s08_inventory GROUP BY 1`);
    const { rows: nutRows } = await c.query(`SELECT id, slug, node_type FROM asset_nodes`);
    const nut = new Map(nutRows.map((n) => [n.slug, n.node_type]));
    const idNut = new Map(nutRows.map((n) => [n.slug, n.id]));
    const { loi, dong } = kiemBangNoi({ bang, duAn, nut });
    if (loi.length) { for (const m of loi) console.log(`loi: ${m}`); process.exitCode = 1; return; }
    const theoKhu = {};
    for (const d of dong) if (d.slug) theoKhu[d.slug] = (theoKhu[d.slug] ?? 0) + 1;
    const chuaNoi = dong.filter((d) => d.status === "chua_noi").length;
    console.log(`noi ${dong.length - chuaNoi} · chua_noi ${chuaNoi} · theo khu ${JSON.stringify(theoKhu)}`);
    if (thu) { console.log("thu: khong ghi"); return; }
    await c.query("BEGIN");
    await c.query(
      `INSERT INTO s08_project_links (project_id, asset_node_id, status, ly_do)
       SELECT * FROM unnest($1::text[], $2::bigint[], $3::text[], $4::text[])
       ON CONFLICT (project_id) DO UPDATE SET asset_node_id = EXCLUDED.asset_node_id, status = EXCLUDED.status, ly_do = EXCLUDED.ly_do, updated_at = now()
       WHERE (s08_project_links.asset_node_id, s08_project_links.status, s08_project_links.ly_do)
             IS DISTINCT FROM (EXCLUDED.asset_node_id, EXCLUDED.status, EXCLUDED.ly_do)`,
      [dong.map((d) => d.project_id), dong.map((d) => (d.slug ? idNut.get(d.slug) : null)), dong.map((d) => d.status), dong.map((d) => d.ly_do)]);
    await c.query("COMMIT");
    console.log("da ghi");
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    // Không in e.detail: Postgres chép cả dòng vào đó.
    console.log(`loi: db ${e.code ?? "?"} ${e.constraint ?? ""}`.trim());
    process.exitCode = 1;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.log(`loi: ${e.code ?? e.name}`); process.exit(1); });
