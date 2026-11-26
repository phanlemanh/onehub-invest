// Thử lệnh sao lưu mục 3 hồ sơ áp HT26 — CHỈ ĐỌC trên cloud thật (GS cho phép riêng bước này, 25/11).
// Mỗi lời gọi: chờ job cloud-sync rảnh (cho-ranh.mjs: nhật ký + tiến trình sync đang sống, trần 40′, quá trần thì dừng có lý do). Tuần tự,
// một lời một lúc. Chạm trần thời gian câu → chia bảng theo dải băm khoá chính, mỗi dải một dấu băm (không kéo dòng về máy). In: bảng,
// số dòng, băm.
// Chạy (README mục 3): TRƯỚC khi gộp từ worktree của nhánh HT26 (tệp này chưa có trên main); SAU khi gộp từ checkout chính. Hai chỗ nạp
// cùng danh sách FILL (kiem-ho-so.mjs soát FILL của nhánh = FILL của origin/main). Nhật ký job luôn ở checkout chính.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { choRanh as choRanhLoi } from "./cho-ranh.mjs";
const { FILL, RENAME, mgmtExec } = await import(new URL("../../../pipeline/sync-cloud.mjs", import.meta.url).href);
const LOG = process.env.CLOUD_SYNC_LOG ?? homedir() + "/dev/onehub-invest/pipeline/logs/cloud-sync.log";
const tk = process.env.SUPABASE_MGMT_TOKEN ?? readFileSync(homedir() + "/.oneinvest/cloud.env", "utf8").match(/SUPABASE_MGMT_TOKEN=(\S+)/)[1];
const raw = mgmtExec(tk, { retries: 0 });
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));
let goi = 0;
/** Có tiến trình sync-cloud (không phải lượt khô, không phải chính lệnh này) đang sống? pgrep lỗi lạ thì ném — không coi là rảnh. */
function coTienTrinh() {
  try {
    const out = execFileSync("pgrep", ["-fl", "sync-cloud\\.mjs"], { encoding: "utf8" });
    return out.split("\n").some((l) => l.trim() && !l.includes("--kho") && !l.startsWith(`${process.pid} `));
  } catch (e) {
    if (e.status === 1) return false;
    throw new Error(`sao-luu: không soát được tiến trình sync: ${e.message}`);
  }
}
const choRanh = () => choRanhLoi({ docLog: () => readFileSync(LOG, "utf8"), coTienTrinh, ngu });
async function ex(sql) {
  if (!/^\s*SELECT\b/i.test(sql) || /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke)\b/i.test(sql.replace(/'[^']*'/g, ""))) throw new Error("câu không chỉ đọc");
  await choRanh();
  goi++;
  return raw(`BEGIN READ ONLY; SET LOCAL statement_timeout = '110s'; ${sql}; COMMIT;`);
}
const q = (s) => `"${s.replace(/"/g, '""')}"`;
const t0 = Date.now();
console.log("giờ", new Date().toISOString());
const pkRows = await ex(`SELECT c.relname AS t, a.attname AS c FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE i.indisprimary AND c.relnamespace = 'public'::regnamespace ORDER BY c.relname, array_position(i.indkey::int2[], a.attnum)`);
const pks = {};
for (const r of pkRows) (pks[r.t] ??= []).push(r.c);
const chia = [];
for (const t of FILL.map(RENAME)) {
  const t1 = Date.now();
  try {
    const [r] = await ex(`SELECT count(*)::bigint AS n, md5(coalesce(string_agg(md5(x::text), '' ORDER BY md5(x::text)), '')) AS h FROM public.${q(t)} x`);
    console.log(t, r?.n, r?.h, `${((Date.now() - t1) / 1000).toFixed(1)}s`);
  } catch (e) {
    if (!/timeout|canceling statement|mgmt 50[234]|mgmt 52[0-9]/i.test(e.message)) throw e;
    const pk = pks[t];
    if (!pk) throw new Error(`${t}: chạm trần và không có khoá chính`);
    const N = 8;
    const key = `abs(hashtext(row(${pk.map((c) => `x.${q(c)}`).join(", ")})::text)) % ${N}`;
    chia.push(`${t} (${N} dải)`);
    for (let i = 0; i < N; i++) {
      const [r] = await ex(`SELECT count(*)::bigint AS n, md5(coalesce(string_agg(md5(x::text), '' ORDER BY md5(x::text)), '')) AS h FROM public.${q(t)} x WHERE ${key} = ${i}`);
      console.log(`${t}#${i}/${N}`, r?.n, r?.h);
    }
    console.log(t, "chia dải", `${((Date.now() - t1) / 1000).toFixed(1)}s`);
  }
}
const [s] = await ex("SELECT max(swapped_at)::text AS t FROM sync_stage.swaps");
console.log("lần tráo cuối", s?.t);
console.log(`TÓM: ${goi} lời gọi, ${((Date.now() - t0) / 1000).toFixed(1)}s, chia: ${chia.join(", ") || "không"}`);
