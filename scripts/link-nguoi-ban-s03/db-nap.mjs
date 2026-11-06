// db-nap.mjs — E6 phần BỘ NẠP (làn ZCode, 0611-38). Chạy bộ nạp THẬT
// (pipeline/import-airbnb.mjs) trên DB THỬ với đầy đủ vế AC-6:
//   1. DB CHƯA có 080 → nạp snapshot hồ sơ v7: in CHUA-AP-080, thoát 0,
//      snapshot TIN S03 cùng lượt vẫn nạp đủ, snapshot hồ sơ KHÔNG bị đánh dấu;
//   2. áp 080 (nap-080.mjs của làn Claude) rồi nạp lại → đủ dòng;
//   3. nạp lại lần nữa → +0 dòng (ON CONFLICT);
//   4. view moi_nhat giữ dòng mới nhất mỗi mã.
// DB từ env LINK_DB (chặn tên oneinvest_*), mặc định oneinvest_link_db.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pg = require("/Users/manhphan/dev/onehub-invest/pipeline/node_modules/pg/lib/index.js");
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const DB_URL = process.env.LINK_DB ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_link_db";

async function chay(argv) {
  const ten = new URL(DB_URL.replace("postgres://", "http://")).pathname.split("/").pop();
  if (!/^oneinvest_[a-z0-9_]+$/.test(ten ?? "")) {
    console.error(`db-nap: LINK_DB phải là DB thử oneinvest_* — từ chối "${ten}"`);
    return 2;
  }
  const { MIG_080, daCo080 } = await import(join(REPO, "pipeline/lib/nap-080.mjs"));
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  const q = async (sql, args) => (await c.query(sql, args)).rows;
  const nap = (dir) => spawnSync(process.execPath, [join(REPO, "pipeline/import-airbnb.mjs"), dir], {
    encoding: "utf8", timeout: 90_000, env: { ...process.env, DATABASE_URL: DB_URL },
  });
  const dem = async () => Number((await q(`SELECT count(*) n FROM stg_s03_ho_so`))[0].n);
  const demTin = async () => Number((await q(`SELECT count(*) n FROM stg_zalo_posts WHERE text LIKE $1`, [`tin a${ts}%`]))[0].n);
  let loi = 0;
  const kiem = (tenKiem, ok, chiTiet = "") => {
    console.log(`${ok ? "ok  " : "FAIL"} E6-nap ${tenKiem}${chiTiet ? " — " + chiTiet : ""}`);
    if (!ok) loi++;
  };

  // dựng snapshot hồ sơ v7 + snapshot TIN S03 "cùng lượt" bằng SnapshotWriter thật
  const { SnapshotWriter } = await import(join(REPO, "collector/dist/core/storage.js"));
  const sinh = async (source, kind, items, sv) => {
    const r = mkdtempSync(join(tmpdir(), "dbnap-"));
    const w = new SnapshotWriter(r, "hanoi", source, { schemaVersion: sv });
    await w.write(items);
    await w.finalize({ failed: 0 });
    return join(r, "hanoi", w.snapshotId);
  };
  const ts = Date.now();
  const hoSo = (id, un) => ({
    source: "s03-ho-so", sourceId: `${id}__t${ts}`, kind: "ho-so", fetchedAt: new Date().toISOString(),
    payload: { ma_tai_khoan: id, username: un, loai: un ? "co-username" : "khong-username" },
    meta: { city: "hanoi", loai_ket_qua: un ? "co-username" : "khong-username", ts: new Date().toISOString() },
  });
  const tin = (id) => ({
    source: "zalo-agent", sourceId: `dbnap-${id}`, kind: "post", fetchedAt: new Date().toISOString(),
    payload: { text: `tin ${id}`, group: "G", agent_id: "t" },
    meta: { city: "hanoi", agent: "t", group: "G", ts: new Date().toISOString() },
  });
  const dHoSo = await sinh("s03-ho-so", "ho-so", [hoSo(`70${ts}`, `u70${ts}`), hoSo(`71${ts}`, "")], 7);
  const dTin = await sinh("zalo-agent", "post", [tin(`a${ts}`)], 4);

  // (1) DB chưa 080 (đảm bảo sạch): CHUA-AP-080, thoát 0, tin vẫn nạp, hồ sơ không đánh dấu
  await c.query(`DROP VIEW IF EXISTS stg_s03_ho_so_moi_nhat; DROP TABLE IF EXISTS stg_s03_ho_so CASCADE;`);
  const r1 = nap(dHoSo);
  kiem("DB chưa 080: CHUA-AP-080 + thoát 0", r1.status === 0 && (r1.stdout + r1.stderr).includes("CHUA-AP-080"), `rc=${r1.status}`);
  const rTin = nap(dTin);
  kiem("snapshot TIN S03 cùng lượt vẫn nạp đủ", rTin.status === 0 && (await demTin()) === 1);

  // (2) áp 080 (nap-080 của làn Claude) → nạp lại hồ sơ → đủ dòng
  await c.query(MIG_080);
  kiem("áp 080 xong (daCo080)", await daCo080(c));
  const r2 = nap(dHoSo);
  kiem("nạp snapshot hồ sơ v7 sau 080: đủ 2 dòng", r2.status === 0 && (await dem()) === 2, `rc=${r2.status}`);

  // (3) nạp lại → +0
  nap(dHoSo);
  kiem("nạp lại: +0 dòng", (await dem()) === 2);

  // (4) view giữ dòng mới nhất mỗi mã (bản mới hơn cùng mã)
  // bản "mới hơn" cùng mã — fetchedAt muộn 5s + sourceId khác để view chọn nó
  const lucMoi = new Date(Date.now() + 5000).toISOString();
  const hoSoMoi = (id, un) => ({ ...hoSo(id, un), fetchedAt: lucMoi, sourceId: `${id}__moi${ts}` });
  const dMoi = await sinh("s03-ho-so", "ho-so", [hoSoMoi(`70${ts}`, `umoi${ts}`)], 7);
  nap(dMoi);
  const un = (await q(`SELECT username FROM stg_s03_ho_so_moi_nhat WHERE ma_tai_khoan = $1`, [`70${ts}`]))[0]?.username;
  kiem("view moi_nhat giữ dòng mới nhất mỗi mã", un === `umoi${ts}`, `username=${un}`);

  for (const d of [dHoSo, dTin, dMoi]) rmSync(d, { recursive: true, force: true });
  await c.query(`DROP VIEW IF EXISTS stg_s03_ho_so_moi_nhat; DROP TABLE IF EXISTS stg_s03_ho_so CASCADE;`);
  await c.end();
  return loi === 0 ? 0 : 1;
}

export { chay };
