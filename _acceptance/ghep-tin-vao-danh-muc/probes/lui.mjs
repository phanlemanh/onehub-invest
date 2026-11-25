// lui.mjs — hồ sơ áp phần 4: đường lùi của 117 trên bản chép DB máy thu. Chạy dưới db/db-thu.sh.
// Áp 113 → 118 → 117, lượt gắn đầu, đo dấu ngoài hàng; chạy lui/lui-117.sql; kiểm 0 dòng sống của bốn rule_id, không còn view,
// bước gắn chỉ cảnh báo và không ghi, dấu ngoài hàng không đổi; áp lại 117 thì lượt gắn chèn lại đúng số cũ.
// --lui-thieu-rut: chạy bản lùi chỉ bỏ view (chiều đỏ) — lệnh phải thoát 1 và nêu số dòng còn sống.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const URL_DB = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(URL_DB)) { console.error("lui: chỉ chạy trên DB oneinvest_suite_*"); process.exit(2); }
const pg = createRequire(`${ROOT}/pipeline/package.json`)("pg");
const { buocGhepToa } = await import(pathToFileURL(`${ROOT}/pipeline/lib/ghep-tin-danh-muc-ghi.mjs`).href);
const RULE_IDS = ["ghep-toa-cot", "ghep-toa-cot-chuan", "ghep-toa-chu-model", "ghep-toa-model"];
const doc = (t) => readFileSync(path.join(ROOT, t), "utf8");
const do_ = (s) => { console.error(`ĐỎ: ${s}`); process.exit(1); };
const dat = (ten, dk, them = "") => { if (!dk) do_(`${ten} ${them}`); console.log(`đạt: ${ten}${them ? ` · ${them}` : ""}`); };

const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
const mot = async (sql, p = []) => (await c.query(sql, p)).rows[0];
const song = async () => (await mot(`SELECT count(*)::int AS n FROM field_assertions WHERE retracted_at IS NULL AND rule_id = ANY ($1::text[])`, [RULE_IDS])).n;
// Dấu ngoài hàng: phát biểu của mọi rule_id khác (kể cả đã rút), nơi gắn dự án, tin S03.
const dau = async () => (await mot(
  `SELECT (SELECT md5(coalesce(string_agg(id || '|' || coalesce(retracted_at::text, ''), ',' ORDER BY id), '')) FROM field_assertions
            WHERE coalesce(rule_id, '') <> ALL ($1::text[])) AS fa,
          (SELECT md5(coalesce(string_agg(offer_id || '|' || coalesce(project_node_id::text, '') || '|' || status, ',' ORDER BY offer_id), '')) FROM offer_project) AS du_an,
          (SELECT count(*)::int FROM sale_offers WHERE source = 'S03') AS tin`, [RULE_IDS]));

for (const m of ["113_thuoc_tinh_can_s16.sql", "118_v_s16_gia_cdt_loai_mo_ho.sql", "117_ghep_toa_tren_tin.sql"]) await c.query(doc(`db/migrations/${m}`));
const truoc = await dau();
await buocGhepToa(c, { log: (s) => do_(`lượt gắn đầu cảnh báo: ${s}`) });
const n1 = await song();
dat("lượt gắn đầu ghi dòng", n1 > 0, `${n1} dòng sống`);

const lui = process.argv.includes("--lui-thieu-rut") ? "DROP VIEW IF EXISTS offer_building;" : doc("_acceptance/ghep-tin-vao-danh-muc/lui/lui-117.sql");
await c.query(lui);
const con = await song();
if (con) do_(`sau lùi còn ${con} dòng sống của bốn rule_id`);
dat("sau lùi 0 dòng sống", true, `rút ${n1}`);
dat("view offer_building đã bỏ", !(await mot(`SELECT to_regclass('public.offer_building') IS NOT NULL AS co`)).co);
const canhBao = [];
await buocGhepToa(c, { log: (s) => canhBao.push(s) });
dat("bước gắn sau lùi chỉ cảnh báo", canhBao.length === 1 && /chưa áp migration 117/.test(canhBao[0]) && (await song()) === 0, canhBao.join(" | "));
const sau = await dau();
dat("dấu ngoài hàng không đổi", JSON.stringify(sau) === JSON.stringify(truoc), `${sau.tin} tin S03`);

await c.query(doc("db/migrations/117_ghep_toa_tren_tin.sql"));
await buocGhepToa(c, { log: (s) => do_(`lượt gắn sau áp lại cảnh báo: ${s}`) });
dat("áp lại 117 thì gắn lại đúng số", (await song()) === n1, `${await song()} dòng sống`);
await c.end();
