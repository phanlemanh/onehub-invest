// do-ten-nguon-cloud.mjs — đo số ô mang tên nguồn thật (tầng A, ADR-0007) theo bảng.cột của tập FILL mà sync-cloud đẩy lên: trên
// cloud và ở máy thu (HT26 `sync-cloud-che-ten-nguon-moi-cot`, bản đóng gói phép đo S1 25/11). CHỈ ĐỌC ở cả hai phía.
//   node scripts/do-ten-nguon-cloud.mjs                 cloud + máy thu; mã 1 khi cloud còn ô trúng (lệnh kiểm sau áp, E7)
//   node scripts/do-ten-nguon-cloud.mjs --chi-may-thu   chỉ máy thu (payload trước che của sync), KHÔNG gọi cloud
// Cách đo (luật GS 25/11): cloud chỉ nhận SELECT khoá chính + cột chữ trong giao dịch chỉ đọc, phân trang keyset — KHÔNG gửi mẫu tên
// nguồn nào (không lọc ở cloud); đếm tại máy bằng findSourceNames (lõi chung) và một phép đếm thô ĐỘC LẬP (khớp thẳng chuỗi gốc của
// source_registry, không phân biệt hoa thường). Không ghi tệp nào; chỉ in số. Câu nào sắp gửi mà còn token (sau khi bỏ định danh lược
// đồ của catalog) thì dừng trước khi gửi.
import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FILL, RENAME, localReadSql, localTypes, mgmtExec, selectList } from "../pipeline/sync-cloud.mjs";
import { findSourceNames } from "../pipeline/lib/mask-source-names.mjs";
import { docSourceNameEntries } from "../pipeline/lib/source-name-entries.mjs";
import { tokensFromEntries } from "../pipeline/lib/tier-a-guard.mjs";

const LOCAL_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const q = (id) => `"${String(id).replace(/"/g, '""')}"`;
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** Kiểu cột có thể mang chữ (udt_name): chữ, json, mảng của chúng. */
export const KIEU_CHU = new Set(["text", "varchar", "bpchar", "citext", "name", "json", "jsonb", "_text", "_varchar", "_bpchar", "_citext", "_json", "_jsonb"]);

/** Ô trúng theo lõi chung: mọi chuỗi và mọi khoá lồng của giá trị đã giải. */
export function oTrung(v, entries) {
  if (v == null) return false;
  if (typeof v === "string") return findSourceNames(v, entries).length > 0;
  if (Array.isArray(v)) return v.some((x) => oTrung(x, entries));
  if (typeof v === "object") return Object.entries(v).some(([k, x]) => findSourceNames(k, entries).length > 0 || oTrung(x, entries));
  return false;
}

// ───── Phép đếm thô ĐỘC LẬP (không dùng lõi gập/biến thể): chuỗi gốc của sổ, chữ thường NFC, khớp thẳng ─────
const thoang = (s) => String(s).normalize("NFC").toLowerCase();
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Token thô từ từ điển (realName = chuỗi gốc của sổ: real_name, từng source_ids — gồm tên miền). Token dưới 4 ký tự phải đứng riêng
 *  (không phải chữ/số hai bên) — khớp thẳng không ranh thì «3 ký tự» trúng giữa mọi từ thường. */
export function tokenTho(entries) {
  return [...new Set(entries.map((e) => thoang(e.realName).trim()).filter(Boolean))].map((t) =>
    t.length >= 4 ? { t } : { t, re: new RegExp(`(^|[^\\p{L}\\p{N}])${escRe(t)}($|[^\\p{L}\\p{N}])`, "u") },
  );
}

/** Mọi chữ của giá trị (chuỗi, khoá lồng, số). */
function chuCua(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (typeof v === "number") out.push(String(v));
  else if (Array.isArray(v)) for (const x of v) chuCua(x, out);
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { out.push(k); chuCua(x, out); }
  return out;
}

/** Ô trúng theo phép đếm thô: một chuỗi của ô chứa thẳng một token (không phân biệt hoa thường). */
export function oTrungTho(v, tho) {
  if (v == null) return false;
  for (const s of chuCua(v)) {
    const x = thoang(s);
    for (const { t, re } of tho) if (re ? re.test(x) : x.includes(t)) return true;
  }
  return false;
}

/** Đếm thô trên payload của sync (tên cloud → dòng JSON): mỗi ô giá trị (bỏ khoá cấp dòng = tên cột). Trả { "bảng.cột": số ô }. */
export function demThoDuLieu(data, entries) {
  const tho = tokenTho(entries);
  const dem = {};
  for (const [ct, rows] of data) {
    for (const j of rows) {
      for (const [c, v] of Object.entries(JSON.parse(j))) if (oTrungTho(v, tho)) dem[`${ct}.${c}`] = (dem[`${ct}.${c}`] ?? 0) + 1;
    }
  }
  return dem;
}

// ───── Phía cloud ─────

/** Bọc một câu đọc trong giao dịch chỉ đọc (Management API mở một kết nối mỗi lời gọi). */
export const bocChiDoc = (sql) => `BEGIN READ ONLY; ${sql}; COMMIT;`;

/** Câu catalog cloud: cột (kèm kiểu) và khoá chính của các bảng FILL (tên cloud). Không chứa token: tên cloud đã trung tính. */
export function cauCatalog(tables) {
  const arr = `ARRAY[${tables.map(lit).join(",")}]`;
  return {
    cot: `SELECT table_name AS t, column_name AS c, udt_name AS u FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY(${arr}) ORDER BY table_name, ordinal_position`,
    khoa: `SELECT c.relname AS t, a.attname AS c FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indisprimary AND c.relnamespace = 'public'::regnamespace AND c.relname = ANY(${arr})
      ORDER BY c.relname, array_position(i.indkey::int2[], a.attnum)`,
  };
}

/** Câu một trang: SELECT khoá + cột chữ, sau khoá trang trước (keyset) hay OFFSET khi giá trị khoá mang tên nguồn (không gửi). */
export function cauTrang(ct, pk, cols, { sau = null, offset = 0, limit }) {
  const sel = [...new Set([...pk, ...cols])].map(q).join(", ");
  const where = sau ? ` WHERE (${pk.map(q).join(", ")}) > (${sau.map((v) => lit(v)).join(", ")})` : "";
  return `SELECT ${sel} FROM public.${q(ct)}${where} ORDER BY ${pk.map(q).join(", ")} LIMIT ${limit}${offset ? ` OFFSET ${offset}` : ""}`;
}

/**
 * Soát một câu sắp gửi: bỏ mọi định danh lược đồ có trong catalog (`dinhDanh`, ở dạng có nháy kép) rồi tìm tên nguồn trong phần còn
 * lại. Trả số chỗ trúng (không trả chuỗi). Định danh như cột `airdna_id` mang tên nguồn trong TÊN — đã công khai, ngoài phạm vi (AC-8).
 */
export function soatCau(sql, entries, dinhDanh = []) {
  let s = sql;
  for (const d of [...dinhDanh].sort((a, b) => b.length - a.length)) s = s.split(q(d)).join('""');
  return findSourceNames(s, entries).length;
}

const TU_GHI = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|merge|call|do)\b/i;

/**
 * exec cloud có rào: chỉ một câu SELECT bọc giao dịch chỉ đọc; câu mang token (sau khi bỏ định danh) hay có từ ghi → ném TRƯỚC khi gửi.
 * `ghi(sql)` (thử) nhận đúng câu đã bọc.
 */
export function execChiDoc(exec, entries, dinhDanh) {
  return async (sql) => {
    const bo = sql.replace(/'(?:[^']|'')*'/g, "''");
    if (!/^\s*select\b/i.test(sql) || TU_GHI.test(bo) || sql.includes(";")) throw new Error("do-ten-nguon-cloud: câu không phải một SELECT — không gửi");
    if (soatCau(sql, entries, dinhDanh.danh)) throw new Error(`do-ten-nguon-cloud: câu thứ ${dinhDanh.dem + 1} mang tên nguồn — không gửi`);
    dinhDanh.dem++;
    return exec(bocChiDoc(sql));
  };
}

/**
 * Đo cloud. `exec(sqlĐãBọc)` → dòng. Trả { kq: { "bảng.cột": { cloud, thoCloud } }, cotCloud: Map(bảng → [cột]), dinhDanh: [tên] }.
 * `cauTrangImpl` chỉ cho lối thử (đột biến «lọc ở cloud bằng mẫu tên nguồn»).
 */
export async function doCloud({ exec, entries, fill = FILL, cauTrangImpl = cauTrang, log = () => {} }) {
  const tables = fill.map(RENAME);
  const dd = { danh: [...tables], dem: 0 };
  const ex = execChiDoc(exec, entries, dd);
  const cc = cauCatalog(tables);
  const cols = await ex(cc.cot);
  const pkRows = await ex(cc.khoa);
  const cotCloud = new Map();
  for (const r of cols) (cotCloud.get(r.t) ?? cotCloud.set(r.t, []).get(r.t)).push({ c: r.c, u: r.u });
  dd.danh.push(...new Set(cols.map((r) => r.c)));
  const pks = {};
  for (const r of pkRows) (pks[r.t] ??= []).push(r.c);
  const tho = tokenTho(entries);
  const kq = {};
  for (const ct of tables) {
    const target = (cotCloud.get(ct) ?? []).filter((x) => KIEU_CHU.has(x.u)).map((x) => x.c);
    const pk = pks[ct] ?? [];
    if (!target.length) continue;
    if (!pk.length) throw new Error(`do-ten-nguon-cloud: ${ct} không có khoá chính — không phân trang được`);
    for (const c of target) kq[`${ct}.${c}`] = { cloud: 0, thoCloud: 0 };
    let sau = null;
    let offset = 0;
    let limit = 200;
    let keyset = true;
    for (;;) {
      const rows = await ex(cauTrangImpl(ct, pk, target, { sau: keyset ? sau : null, offset: keyset ? 0 : offset, limit }));
      for (const r of rows) {
        for (const c of target) {
          if (oTrung(r[c], entries)) kq[`${ct}.${c}`].cloud++;
          if (oTrungTho(r[c], tho)) kq[`${ct}.${c}`].thoCloud++;
        }
      }
      if (rows.length < limit) break;
      offset += rows.length;
      const cuoi = rows[rows.length - 1];
      sau = pk.map((c) => cuoi[c]);
      // Khoá mang tên nguồn thì không đưa vào câu — chuyển OFFSET cho phần còn lại của bảng.
      if (keyset && sau.some((v) => typeof v === "string" && findSourceNames(v, entries).length)) keyset = false;
      const per = JSON.stringify(rows).length / rows.length;
      limit = Math.max(50, Math.min(20000, Math.floor(1_400_000 / per)));
    }
    log(`  cloud ${ct}: xong`);
  }
  return { kq, cotCloud, dinhDanh: dd.danh, soCau: dd.dem };
}

// ───── Phía máy thu ─────

/**
 * Đo máy thu trên ĐÚNG payload sync đọc (selectList + localReadSql, trước bước che), trong một snapshot chỉ đọc, đọc theo con trỏ.
 * `cotCloud` (Map bảng cloud → [{c}]) có thì chỉ đếm cột cloud nhận; vắng (--chi-may-thu) thì mọi cột đã duyệt. Trả
 * { "bảng.cột": { mayThu, thoMayThu } }.
 */
export async function doMayThu({ local, entries, fill = FILL, cotCloud = null, log = () => {} }) {
  const tokens = tokensFromEntries(entries);
  const tho = tokenTho(entries);
  const kq = {};
  await local.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  try {
    const { rows: lc } = await local.query(
      `SELECT table_name AS t, column_name AS c, udt_name AS u FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1) ORDER BY table_name, ordinal_position`,
      [fill],
    );
    for (const t of fill) {
      const ct = RENAME(t);
      const cols = lc.filter((r) => r.t === t);
      const geo = cols.filter((r) => r.u === "geometry" || r.u === "geography").map((r) => r.c);
      const sel = selectList(t, cols.map((r) => r.c));
      const nhan = cotCloud ? new Set((cotCloud.get(ct) ?? []).map((x) => x.c)) : null;
      const send = sel.cols.filter((c) => !nhan || nhan.has(c));
      const chu = send.filter((c) => KIEU_CHU.has(cols.find((r) => r.c === c)?.u));
      if (!chu.length) continue;
      for (const c of chu) kq[`${ct}.${c}`] = { mayThu: 0, thoMayThu: 0 };
      await local.query(`DECLARE cu_do NO SCROLL CURSOR FOR ${localReadSql(t, selectList(t, send, geo, tokens).sql)}`);
      for (;;) {
        const { rows } = await local.query("FETCH 5000 FROM cu_do");
        if (!rows.length) break;
        for (const { j } of rows) {
          const r = JSON.parse(j);
          for (const c of chu) {
            if (oTrung(r[c], entries)) kq[`${ct}.${c}`].mayThu++;
            if (oTrungTho(r[c], tho)) kq[`${ct}.${c}`].thoMayThu++;
          }
        }
      }
      await local.query("CLOSE cu_do");
      log(`  máy thu ${ct}: xong`);
    }
  } finally {
    await local.query("ROLLBACK").catch(() => {});
  }
  return kq;
}

/** In bảng kết quả (chỉ số). Trả tổng { cloud, thoCloud, mayThu, thoMayThu }. */
export function inKetQua(kq, out = console.log, { chiMayThu = false } = {}) {
  const tong = { cloud: 0, thoCloud: 0, mayThu: 0, thoMayThu: 0 };
  out(chiMayThu ? "bảng.cột · ô máy thu · thô máy thu" : "bảng.cột · ô cloud · ô máy thu · thô cloud · thô máy thu");
  for (const k of Object.keys(kq).sort()) {
    const r = kq[k];
    for (const x of Object.keys(tong)) tong[x] += r[x] ?? 0;
    if (!(r.cloud || r.thoCloud || r.mayThu || r.thoMayThu)) continue;
    out(chiMayThu ? `${k} · ${r.mayThu ?? 0} · ${r.thoMayThu ?? 0}` : `${k} · ${r.cloud ?? "-"} · ${r.mayThu ?? "-"} · ${r.thoCloud ?? "-"} · ${r.thoMayThu ?? "-"}`);
  }
  out(chiMayThu ? `tổng · ${tong.mayThu} · ${tong.thoMayThu}` : `tổng · ${tong.cloud} · ${tong.mayThu} · ${tong.thoCloud} · ${tong.thoMayThu}`);
  return tong;
}

async function main() {
  const chiMayThu = process.argv.includes("--chi-may-thu");
  const { createRequire } = await import("node:module");
  const pg = createRequire(new URL("../app/package.json", import.meta.url))("pg");
  const local = new pg.Client({ connectionString: LOCAL_URL, types: localTypes, options: "-c default_transaction_read_only=on" });
  await local.connect();
  try {
    const entries = await docSourceNameEntries(local);
    if (!entries.length) {
      console.error("do-ten-nguon-cloud: source_registry không cho tên nguồn nào — không đo được (đóng chặt)");
      return 2;
    }
    const t0 = Date.now();
    if (chiMayThu) {
      const kq = await doMayThu({ local, entries });
      inKetQua(kq, console.log, { chiMayThu: true });
      console.log(`do-ten-nguon-cloud --chi-may-thu: 0 lời gọi cloud; ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      return 0;
    }
    const env = await readFile(path.join(homedir(), ".oneinvest/cloud.env"), "utf8");
    const token = process.env.SUPABASE_MGMT_TOKEN ?? env.match(/SUPABASE_MGMT_TOKEN=(\S+)/)?.[1];
    if (!token) throw new Error("thiếu SUPABASE_MGMT_TOKEN");
    const c = await doCloud({ exec: mgmtExec(token), entries });
    const m = await doMayThu({ local, entries, cotCloud: c.cotCloud });
    const kq = {};
    for (const k of new Set([...Object.keys(c.kq), ...Object.keys(m)])) kq[k] = { ...(c.kq[k] ?? {}), ...(m[k] ?? {}) };
    const tong = inKetQua(kq);
    console.log(`định danh lược đồ miễn soát trong câu gửi: ${c.dinhDanh.filter((d) => findSourceNames(d, entries).length).join(", ") || "không"}`);
    console.log(`do-ten-nguon-cloud: ${c.soCau} câu SELECT chỉ đọc lên cloud; ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    return tong.cloud === 0 && tong.thoCloud === 0 ? 0 : 1;
  } finally {
    await local.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => { process.exitCode = code; }, (e) => { console.error(`do-ten-nguon-cloud lỗi: ${e.message}`); process.exitCode = 1; });
}
