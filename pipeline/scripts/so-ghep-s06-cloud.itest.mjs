// node --test scripts/so-ghep-s06-cloud.itest.mjs — cần Docker và DB local :5433 (ngoài `npm test`).
// so-ghep-s06-nhan-danh-ba E6: nhãn số chưa xác minh lên cloud bằng sync thật (ca so-ghep của check-cloud-sync, container tạm,
// từ DB local chỉ đọc); tệp catch-up năm mốc chạy thật trên lược đồ tạm. Mọi SĐT là số bịa.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { localDbUrl } from "./capture-ops-facts.mjs";

const CATCHUP = new URL("../../docs/ops/cloud-schema-catchup-2026-11-03-so-ghep.sql", import.meta.url);
const MOC = ["gộp", "kéo về", "áp cloud", "áp 070", "áp 068"];

/** Rút khối ĐO TRƯỚC, khối ÁP của tệp; thông điệp ghim khi sai khuôn. */
function docCatchup(text) {
  const iDo = text.indexOf("-- ĐO TRƯỚC");
  const iAp = text.indexOf("-- ÁP");
  assert.ok(iDo > 0 && iAp > iDo, "thiếu khối ĐO TRƯỚC, ÁP");
  const dau = text.slice(0, iDo).split("\n");
  let truoc = -1;
  for (const [i, m] of MOC.entries()) {
    const dong = dau.findIndex((l) => l.startsWith(`-- ${i + 1}. ${m}:`));
    assert.ok(dong >= 0, `THIEU MOC ${m}`);
    assert.ok(dong > truoc, `SAI THU TU ${m}`);
    truoc = dong;
  }
  const ap = text.slice(iAp).split("\n").filter((l) => !l.startsWith("--")).join("\n");
  for (const cau of ap.split(";").map((x) => x.trim()).filter(Boolean)) {
    assert.match(cau, /^ALTER TABLE public\.sale_offers\s+ADD COLUMN IF NOT EXISTS /i, "CAU CAM");
    assert.doesNotMatch(cau, /\b(DROP|DELETE|UPDATE|TRUNCATE|CREATE)\b/i, "CAU CAM");
  }
  return { doTruoc: text.slice(iDo, iAp), ap };
}

const docTep = () => readFile(CATCHUP, "utf8");
const veLuocDo = (sql, S) => sql.replaceAll("public.", `"${S}".`).replaceAll("'public'", `'${S}'`);

test("SG-AC-6 tệp đúng khuôn: năm mốc đúng thứ tự, khối ÁP chỉ thêm đúng một cột", async () => {
  const { ap } = docCatchup(await docTep());
  assert.ok(ap.includes("seller_phone_inferred boolean"), "khối ÁP thiếu cột nhãn");
  assert.equal(ap.split(";").filter((x) => x.trim()).length, 1);
});

test("SG-AC-6 đối chứng: đảo hai mốc đỏ, thêm DROP vào bản chép đỏ CAU CAM", async () => {
  const text = await docTep();
  const dong = text.split("\n");
  const i = dong.findIndex((l) => l.startsWith("-- 4. áp 070:"));
  const j = dong.findIndex((l) => l.startsWith("-- 5. áp 068:"));
  [dong[i], dong[j]] = [dong[j], dong[i]];
  assert.throws(() => docCatchup(dong.join("\n")), /SAI THU TU|THIEU MOC/);
  assert.throws(() => docCatchup(`${text}\nDROP TABLE public.sale_offers;\n`), /CAU CAM/);
});

test("SG-AC-6 chạy trên lược đồ thiếu cột: đo gọi tên cột, áp hai lần không lỗi, đo lại OK, số dòng không đổi", async () => {
  const { doTruoc, ap } = docCatchup(await docTep());
  const admin = new pg.Client({ connectionString: localDbUrl() });
  await admin.connect();
  const S = `sg_catchup_${process.pid}_${Date.now()}`;
  try {
    await admin.query(`CREATE SCHEMA "${S}"`);
    await admin.query(`CREATE TABLE "${S}".sale_offers (offer_id text PRIMARY KEY, price_vnd bigint)`);
    await admin.query(`INSERT INTO "${S}".sale_offers VALUES ('a', 1), ('b', 2)`);
    const cauDo = veLuocDo(doTruoc.split("\n").filter((l) => !l.startsWith("--")).join("\n"), S);
    const kiem = async () => (await admin.query(cauDo)).rows[0].kiem;
    assert.match(await kiem(), /thiếu cột seller_phone_inferred/, "đo trước không gọi tên cột");
    await admin.query(veLuocDo(ap, S));
    await admin.query(veLuocDo(ap, S));
    assert.equal(await kiem(), "OK");
    const { rows } = await admin.query(`SELECT count(*)::int AS n, count(seller_phone_inferred)::int AS co FROM "${S}".sale_offers`);
    assert.deepEqual(rows[0], { n: 2, co: 0 }, "áp làm đổi dòng");
  } finally {
    await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`);
    await admin.end();
  }
});

test("SG-AC-6 sync thật từ view tới cloud mô phỏng: đúng nhãn, thiếu cột vẫn chạy, field_provenance không tới", { timeout: 590_000 }, () => {
  const script = fileURLToPath(new URL("./check-cloud-sync.mjs", import.meta.url));
  let out;
  try {
    out = execFileSync(process.execPath, [script, "so-ghep"], { encoding: "utf8", stdio: "pipe", maxBuffer: 1 << 26 });
  } catch (e) {
    assert.fail(`check-cloud-sync so-ghep đỏ:\n${String(e.stdout ?? "").split("\n").filter((l) => /FAIL|CÓ LỖI/.test(l)).join("\n")}`);
  }
  assert.match(out, /check-cloud-sync so-ghep: OK/);
  for (const nhan of ["SG-thieu-cot", "SG-nhan-dung", "SG-doi-chung-bo-allow", "SG-fp-khong-toi", "SG-pii-chan"]) {
    assert.match(out, new RegExp(`^PASS ${nhan}\\b`, "m"), `thiếu phép đo ${nhan}`);
  }
});
