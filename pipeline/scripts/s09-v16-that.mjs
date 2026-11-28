#!/usr/bin/env node
// s09-v16-that.mjs — DA56 nap-s09-quy-can-va-can-cao-tang E5 (AC-5), E6 (AC-6): trên bản chép DB máy thu áp 115, 125, 130 (hai lần),
// nạp ba bản thu gói 1 và dựng danh bạ như lượt thật của DA42, rồi nạp mọi bản thu DATA-CONTRACT v16 hợp lệ trong thư mục chờ. Bộ đếm
// độc lập (KHÔNG import pipeline/lib/s09*) đọc thẳng bản thu, so với stg và manifest; so ô cố định của hợp đồng; quét stg tìm URL
// và tên máy chủ thật của nguồn. Chỉ in số — không tên nguồn, không tên dự án. Lệch một ô → thoát 1 nêu ô.
//   node pipeline/scripts/s09-v16-that.mjs --tran-phut 40
//   S09_V16=<thư mục chứa vn__s09-danh-ba__*> (mặc định thư mục chờ của làn thu; sau khi ZK chép: collector/snapshots/vn)
//   Chiều đỏ: --xoa-mot-can   bớt một căn của một trang quỹ căn trong stg bản chép → ô stg lệch bộ đếm, thoát 1 nêu ô
//   --dem   lệnh đếm CHỈ ĐỌC (hợp đồng §Đường đo; lệnh kiểm sau của hồ sơ áp): chạy thẳng trên DATABASE_URL, giao dịch read-only — in
//           ô cố định của view, chia nối nút và quét URL; không áp, không nạp, không dựng.
//   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/scripts/s09-v16-that.mjs --dem
// Bản chép: script tự chạy lại mình qua `db/db-thu.sh oneinvest_suite_s09v16 --chay` (createdb -T bản mẫu), xoá khi lệnh dừng.
// AC-6 «DB thử thứ hai nạp ngược»: làm trên cùng bản chép sau khi xoá sạch dòng v16 và dòng airbnb_snapshots của chúng — trạng thái
// trước nạp giống DB thử mới về mọi dòng mà ba view đọc (sổ quyết định S3).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import pg from "pg";
import { GOC, MAY_CHU, apTep } from "./db-thu-dbv.mjs";
import { napDanhBaThuMuc } from "../import-s09-danh-ba.mjs";
import { dung, KHU_MAC_DINH } from "../danh-ba-vat-the.mjs";

const arg = (t, m = null) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : m; };
const co = (t) => process.argv.includes(t);
const TRAN_PHUT = Number(arg("--tran-phut", "40"));
const TRONG = process.env.S09_THAT_TRONG === "1";
const DEM = co("--dem");
const SNAP_GOI_1 = process.env.S09_SNAP ?? "/Users/manhphan/dev/onehub-invest/collector/snapshots/vn";
const SNAP_V16 = process.env.S09_V16 ?? "/Users/manhphan/dev/onehub-zk/research-local/s09-snapshot-cho/vn";
// Ba bản thu gói 1 hợp lệ — cùng danh sách lượt thật của DA42 (danh-ba-s09-toa-that.mjs).
const BAN_GOI_1 = ["2026-11-19T004959637", "2026-11-20T015947402", "2026-11-20T052953464"].map((s) => `vn__s09-danh-ba__${s}`);
const BAN_HONG_QC = "vn__s09-danh-ba__2026-11-24T024022939";
// Ô cố định viết trước (hợp đồng AC-5, đo 25/11 trên bản 2026-11-24T031140550 và DB thử đã dựng DA42).
const DICH = { can: 1294, du_an: 40, co_gia: 1268, noi: 24, con_the: 6, ngoai: 10 };

const loi = [];
const o = (ten, thuc, ok, ghi = "") => { console.log(`${ok ? "  " : "✗ "}${ten}: ${thuc}${ghi ? ` (${ghi})` : ""}`); if (!ok) loi.push(ten); };

if (!TRONG && !DEM) {
  const r = spawnSync("bash", [join(GOC, "db/db-thu.sh"), "oneinvest_suite_s09v16", "--chay", process.execPath, ...process.argv.slice(1)],
    { cwd: GOC, stdio: "inherit", env: { ...process.env, S09_THAT_TRONG: "1" }, timeout: TRAN_PHUT * 60_000, killSignal: "SIGTERM" });
  if (r.error?.code === "ETIMEDOUT" || r.signal === "SIGTERM") { console.error(`s09-v16-that: vượt trần ${TRAN_PHUT} phút`); process.exit(4); }
  process.exit(r.status ?? 1);
}

const TEN = new URL(process.env.DATABASE_URL ?? "postgres://x/").pathname.slice(1);
if (DEM) {
  if (!/^oneinvest(_[a-z0-9_]+)?$/.test(TEN)) { console.error(`từ chối: --dem cần DATABASE_URL tới DB oneinvest* trên máy này (đang «${TEN}»)`); process.exit(2); }
} else if (!/^oneinvest_suite_s09v16_[0-9]+$/.test(TEN)) { console.error(`từ chối: DB «${TEN}» không phải DB của lượt db-thu --chay`); process.exit(2); }
const URL_THU = `${MAY_CHU}/${TEN}`;
const c = new pg.Client({ connectionString: URL_THU });
await c.connect();
const q = async (sql, a = []) => (await c.query(sql, a)).rows;
const mot = async (sql, a = []) => Object.values((await q(sql, a))[0] ?? {})[0];
if (DEM) await c.query("SET default_transaction_read_only = on");

// ---- Bản thu v16 trong thư mục: bỏ thư mục chấm (.partial), thiếu manifest hay không phải schemaVersion 16 ----
const cacBan = existsSync(SNAP_V16) ? readdirSync(SNAP_V16).filter((d) => d.startsWith("vn__s09-danh-ba__") && existsSync(join(SNAP_V16, d, "manifest.json")))
  .filter((d) => JSON.parse(readFileSync(join(SNAP_V16, d, "manifest.json"), "utf8")).schemaVersion === 16).sort() : [];
const docBan = (b) => {
  const m = JSON.parse(readFileSync(join(SNAP_V16, b, "manifest.json"), "utf8"));
  const items = m.files.filter((f) => /^items-\d+\.json\.gz$/.test(f.name)).sort((x, y) => x.name.localeCompare(y.name, "en", { numeric: true }))
    .flatMap((f) => {
      const buf = readFileSync(join(SNAP_V16, b, f.name));
      if (createHash("sha256").update(buf).digest("hex") !== f.sha256) throw new Error(`bộ đếm: sai băm ${b}/${f.name}`);
      const d = JSON.parse(gunzipSync(buf).toString("utf8"));
      return Array.isArray(d) ? d : d.items;
    });
  return { m, items };
};
// Tên máy chủ thật của nguồn: S09 không có dòng trong source_registry local (đo 25/11) — rút từ chính URL ảnh của bản thu, đọc tại máy.
const mayChuThat = new Set();
async function bangView() {
  const h = (rows) => createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 16);
  return {
    quy_can: h(await q("SELECT * FROM v_s09_db_quy_can ORDER BY du_an_id, can_id")),
    can_cao_tang: h(await q("SELECT * FROM v_s09_db_can_cao_tang ORDER BY can_id")),
  };
}

try {
  if (!DEM) {
    console.log(`s09-v16-that: ${cacBan.length} bản thu v16 trong thư mục`);
    for (const f of ["115_stg_s09_danh_ba.sql", "125_v_s09_db_du_an_ma_tinh.sql", "130_v_s09_db_quy_can.sql"]) {
      apTep(TEN, join(GOC, "db/migrations", f)); apTep(TEN, join(GOC, "db/migrations", f));
    }
    o("ap_130_hai_lan", "không lỗi", true);
    for (const b of BAN_GOI_1) await napDanhBaThuMuc(join(SNAP_GOI_1, b), URL_THU);
    await dung(c, { khuSlugs: [...KHU_MAC_DINH], log: () => {} });
    for (const b of cacBan) await napDanhBaThuMuc(join(SNAP_V16, b), URL_THU);
    if (co("--xoa-mot-can")) {
      await c.query(`UPDATE stg_s09_danh_ba SET payload = jsonb_set(payload, '{data}', (payload -> 'data') - 0)
                      WHERE (snapshot_id, dong) = (SELECT snapshot_id, dong FROM stg_s09_danh_ba WHERE kind = 'quy-can'
                                                    AND jsonb_array_length(payload -> 'data') > 1 ORDER BY snapshot_id, dong LIMIT 1)`);
    }

    // ---- E5 bảng ba cột theo bản thu × kind × cấp: stg (SQL thẳng trên bảng) · đếm thẳng bản thu · manifest ----
    console.log("E5 · bảng ba cột (stg · đếm thẳng · manifest):");
    for (const b of cacBan) {
      const { m, items } = docBan(b);
      for (const it of items) for (const cc of it?.payload?.data ?? []) for (const g of cc?.galleries ?? []) for (const u of g?.urls ?? []) {
        const host = /^https?:\/\/([^/]+)/.exec(u)?.[1]?.toLowerCase();
        if (host) { mayChuThat.add(host); const p = host.split("."); if (p.length > 2) mayChuThat.add(p.slice(-2).join(".")); }
      }
      const hopLe = items.filter((i) => i && typeof i === "object" && String(i.kind ?? "").trim() && String(i.sourceId ?? "").trim());
      const ten = b.slice(-21);
      o(`${ten} item`, `${await mot("SELECT count(*)::int FROM stg_s09_danh_ba WHERE snapshot_id = $1", [b])} · ${hopLe.length} · ${m.counts?.items}`,
        (await mot("SELECT count(*)::int FROM stg_s09_danh_ba WHERE snapshot_id = $1", [b])) === hopLe.length && hopLe.length === m.counts?.items);
      for (const kind of ["quy-can", "can-cao-tang"]) {
        const cua = hopLe.filter((i) => i.kind === kind);
        if (!cua.length) continue;
        const dem = {
          du_an: new Set(cua.map((i) => i.meta?.duAnId)).size,
          cap: cua.length, // trang (quỹ căn) hay tầng (căn cao tầng) — mỗi item một
          can: cua.reduce((n, i) => n + (Array.isArray(i.payload?.data) ? i.payload.data.length : 0), 0),
        };
        const [s] = await q(`SELECT count(DISTINCT meta ->> 'duAnId')::int AS du_an, count(*)::int AS cap,
                                    COALESCE(sum(CASE WHEN jsonb_typeof(payload -> 'data') = 'array' THEN jsonb_array_length(payload -> 'data') END), 0)::int AS can
                               FROM stg_s09_danh_ba WHERE snapshot_id = $1 AND kind = $2`, [b, kind]);
        const capTen = kind === "quy-can" ? "trang" : "tầng";
        for (const k of ["du_an", "cap", "can"]) o(`${ten} ${kind} ${k === "cap" ? capTen : k}`, `${s[k]} · ${dem[k]}`, s[k] === dem[k]);
        if (kind === "can-cao-tang") {
          const khai = cua.reduce((n, i) => n + Number(i.meta?.soCan ?? 0), 0);
          o(`${ten} can-cao-tang căn khai meta.soCan`, `${dem.can} · ${khai}`, true, "chỉ in");
        }
      }
    }
  }

  // ---- Ô cố định của view (cả --dem) ----
  console.log("E5 · ô cố định:");
  const [v] = await q(`SELECT count(*)::int AS can, count(DISTINCT du_an_id)::int AS du_an,
                              count(*) FILTER (WHERE gia_ban_min IS NOT NULL OR gia_ban_max IS NOT NULL)::int AS co_gia FROM v_s09_db_quy_can`);
  o("quỹ căn: căn", v.can, v.can === DICH.can, `đích ${DICH.can}`);
  o("quỹ căn: dự án", v.du_an, v.du_an === DICH.du_an, `đích ${DICH.du_an}`);
  o("quỹ căn: căn có giá", v.co_gia, v.co_gia === DICH.co_gia, `đích ${DICH.co_gia}`);
  if (!DEM && cacBan.includes(BAN_HONG_QC)) {
    const duAnHong = new Set(docBan(BAN_HONG_QC).items.filter((i) => i?.kind === "quy-can").map((i) => i.meta?.duAnId)).size;
    const [d] = await q(`SELECT count(*) FILTER (WHERE du IS NULL)::int AS rong, count(*) FILTER (WHERE du = false)::int AS khong_du
                           FROM v_s09_db_quy_can_doi_soat WHERE snapshot_id = $1`, [BAN_HONG_QC]);
    o("đối soát bản hỏng: du rỗng", d.rong, d.rong === 0);
    o("đối soát bản hỏng: du = false", `${d.khong_du} · ${duAnHong}`, d.khong_du === duAnHong, "view · bộ đếm");
  }
  const [chia] = await q(`
    WITH d AS (SELECT DISTINCT du_an_id FROM v_s09_db_quy_can),
         l AS (SELECT source_project_id AS du_an_id, bool_or(status = 'noi') AS noi FROM project_links WHERE source = 'S09' GROUP BY 1)
    SELECT count(*) FILTER (WHERE l.noi)::int AS noi, count(*) FILTER (WHERE l.noi IS FALSE)::int AS con_the,
           count(*) FILTER (WHERE l.du_an_id IS NULL)::int AS ngoai
      FROM d LEFT JOIN l USING (du_an_id)`);
  o("chia dự án quỹ căn: nối nút · còn thẻ · ngoài danh mục", `${chia.noi} · ${chia.con_the} · ${chia.ngoai}`,
    chia.noi === DICH.noi && chia.con_the === DICH.con_the && chia.ngoai === DICH.ngoai, `đích ${DICH.noi} · ${DICH.con_the} · ${DICH.ngoai}`);
  o("chia cộng bằng số dự án", chia.noi + chia.con_the + chia.ngoai, chia.noi + chia.con_the + chia.ngoai === v.du_an);
  const http = await mot(`SELECT count(*)::int FROM stg_s09_danh_ba WHERE kind IN ('quy-can', 'can-cao-tang') AND payload::text ~* 'https?:'`);
  o("stg hai kind có http", http, http === 0);
  if (!DEM) {
    let trung = 0;
    for (const h of mayChuThat) trung += await mot(`SELECT count(*)::int FROM stg_s09_danh_ba WHERE kind IN ('quy-can', 'can-cao-tang') AND payload::text ILIKE $1`, [`%${h}%`]);
    o("stg hai kind có tên máy chủ thật", `${trung} (soát ${mayChuThat.size} tên)`, trung === 0 && mayChuThat.size > 0);

    // ---- E6 (AC-6): nạp lại, rồi xoá sạch dòng v16 và nạp ngược thứ tự — băm tập dòng hai view giống nhau ----
    const b1 = await bangView();
    for (const b of cacBan) await napDanhBaThuMuc(join(SNAP_V16, b), URL_THU);
    const b2 = await bangView();
    await c.query("DELETE FROM airbnb_snapshots WHERE snapshot_id = ANY($1)", [cacBan]);
    for (const b of [...cacBan].reverse()) await napDanhBaThuMuc(join(SNAP_V16, b), URL_THU);
    const b3 = await bangView();
    for (const view of ["quy_can", "can_cao_tang"]) {
      o(`E6 băm ${view}: một · nạp lại · ngược`, `${b1[view]} · ${b2[view]} · ${b3[view]}`, b1[view] === b2[view] && b2[view] === b3[view]);
    }
  }
} finally {
  await c.end();
}
console.log(loi.length ? `s09-v16-that: LỆCH ${loi.length} ô — ${loi.join("; ")}` : "s09-v16-that: khớp mọi ô");
process.exit(loi.length ? 1 : 0);
